import { MotionBlurFilter } from "@pixi/filter-motion-blur";
import {
	Application,
	BlurFilter,
	Container,
	Graphics,
	Sprite,
	Texture,
	TextureSource,
} from "pixi.js";
import {
	DEFAULT_CURSOR_CONFIG,
	PixiCursorOverlay,
	preloadCursorAssets,
} from "@/features/editor/components/VideoEditor/videoPlayback/cursorRenderer";
import {
	applyZoomTransform,
	createMotionBlurState,
	type MotionBlurState,
} from "@/features/editor/components/VideoEditor/videoPlayback/zoomTransform";
import {
	getWebcamOverlayPosition,
	getWebcamOverlaySizePx,
} from "@/features/editor/lib/webcamOverlay";
import { getAssetPath, getRenderableAssetUrl } from "@/shared/lib/assetPath";
import { clampMediaTimeToDuration } from "@/shared/lib/mediaTiming";
import { drawSquircleOnCanvas, drawSquircleOnGraphics } from "@/shared/lib/squircle";
import {
	type AnimationState,
	calculateAnimationState,
	calculateLayout,
	createAnimationState,
	type FrameRenderConfig,
	type LayoutResult,
} from "../domain/entities/FrameLayout";
import { renderAnnotations } from "./AnnotationRendererAdapter";
import { renderCaptions } from "./CaptionRendererAdapter";
import { ForwardFrameSource } from "./ForwardFrameSourceAdapter";
import { resolveMediaElementSource } from "./LocalMediaSourceAdapter";

function configureHighQuality2DContext(
	context: CanvasRenderingContext2D | null,
): CanvasRenderingContext2D | null {
	if (!context) {
		return null;
	}

	context.imageSmoothingEnabled = true;
	context.imageSmoothingQuality = "high";

	return context;
}

export class FrameRenderer {
	private app: Application | null = null;
	private cameraContainer: Container | null = null;
	private videoContainer: Container | null = null;
	private cursorContainer: Container | null = null;
	private videoSprite: Sprite | null = null;
	private videoTextureSource: TextureSource<any> | null = null;
	private backgroundSprite: Sprite | null = null;
	private maskGraphics: Graphics | null = null;
	private blurFilter: BlurFilter | null = null;
	private motionBlurFilter: MotionBlurFilter | null = null;
	private shadowCanvas: HTMLCanvasElement | null = null;
	private shadowCtx: CanvasRenderingContext2D | null = null;
	private compositeCanvas: HTMLCanvasElement | null = null;
	private compositeCtx: CanvasRenderingContext2D | null = null;
	private backgroundVideoElement: HTMLVideoElement | null = null;
	private cleanupBackgroundSource: (() => void) | null = null;
	private config: FrameRenderConfig;
	private animationState: AnimationState;
	private motionBlurState: MotionBlurState;
	private layoutCache: LayoutResult | null = null;
	private currentVideoTime = 0;
	private lastMotionVector = { x: 0, y: 0 };
	private cursorOverlay: PixiCursorOverlay | null = null;
	private webcamForwardFrameSource: ForwardFrameSource | null = null;
	private webcamDecodedFrame: VideoFrame | null = null;
	private webcamVideoElement: HTMLVideoElement | null = null;
	private webcamSeekPromise: Promise<void> | null = null;
	private webcamFrameCacheCanvas: HTMLCanvasElement | null = null;
	private webcamFrameCacheCtx: CanvasRenderingContext2D | null = null;
	private webcamBubbleCanvas: HTMLCanvasElement | null = null;
	private webcamBubbleCtx: CanvasRenderingContext2D | null = null;
	private lastSyncedWebcamTime: number | null = null;
	private cleanupWebcamSource: (() => void) | null = null;

	constructor(config: FrameRenderConfig) {
		this.config = config;
		this.animationState = createAnimationState();
		this.motionBlurState = createMotionBlurState();
	}

	async initialize(): Promise<void> {
		let cursorOverlayEnabled = true;
		try {
			await preloadCursorAssets();
		} catch (error) {
			cursorOverlayEnabled = false;
			console.warn(
				"[FrameRenderer] Native cursor assets are unavailable; continuing export without cursor overlay.",
				error,
			);
		}

		// Create canvas for rendering
		const canvas = document.createElement("canvas");
		canvas.width = this.config.width;
		canvas.height = this.config.height;

		// Try to set colorSpace if supported (may not be available on all platforms)
		try {
			if (canvas && "colorSpace" in canvas) {
				canvas.colorSpace = "srgb";
			}
		} catch (error) {
			// Silently ignore colorSpace errors on platforms that don't support it
			console.warn("[FrameRenderer] colorSpace not supported on this platform:", error);
		}

		// Initialize PixiJS with optimized settings for export performance
		this.app = new Application();
		await this.app.init({
			canvas,
			width: this.config.width,
			height: this.config.height,
			backgroundAlpha: 0,
			antialias: true,
			resolution: 1,
			autoDensity: true,
		});

		// Setup containers
		this.cameraContainer = new Container();
		this.videoContainer = new Container();
		this.cursorContainer = new Container();
		this.app.stage.addChild(this.cameraContainer);
		this.cameraContainer.addChild(this.videoContainer);
		this.cameraContainer.addChild(this.cursorContainer);

		if (cursorOverlayEnabled) {
			this.cursorOverlay = new PixiCursorOverlay({
				dotRadius: DEFAULT_CURSOR_CONFIG.dotRadius * (this.config.cursorSize ?? 1.4),
				style: this.config.cursorStyle ?? "tahoe",
				smoothingFactor: this.config.cursorSmoothing ?? DEFAULT_CURSOR_CONFIG.smoothingFactor,
				motionBlur: this.config.cursorMotionBlur ?? 0,
				clickBounce: this.config.cursorClickBounce ?? DEFAULT_CURSOR_CONFIG.clickBounce,
				clickBounceDuration:
					this.config.cursorClickBounceDuration ?? DEFAULT_CURSOR_CONFIG.clickBounceDuration,
				sway: this.config.cursorSway ?? DEFAULT_CURSOR_CONFIG.sway,
			});
		}

		// Setup background (render separately, not in PixiJS)
		await this.setupBackground();
		await this.setupWebcamSource();

		// Setup blur filter for video container
		this.blurFilter = new BlurFilter();
		this.blurFilter.quality = 5;
		this.blurFilter.resolution = this.app.renderer.resolution;
		this.blurFilter.blur = 0;
		this.motionBlurFilter = new MotionBlurFilter([0, 0], 5, 0);
		this.videoContainer.filters = [this.blurFilter as any, this.motionBlurFilter as any];

		// Setup composite canvas for final output with shadows
		this.compositeCanvas = document.createElement("canvas");
		this.compositeCanvas.width = this.config.width;
		this.compositeCanvas.height = this.config.height;
		this.compositeCtx = configureHighQuality2DContext(
			this.compositeCanvas.getContext("2d", {
				willReadFrequently: false,
			}),
		);

		if (!this.compositeCtx) {
			throw new Error("Failed to get 2D context for composite canvas");
		}

		// Setup shadow canvas if needed
		if (this.config.showShadow) {
			this.shadowCanvas = document.createElement("canvas");
			this.shadowCanvas.width = this.config.width;
			this.shadowCanvas.height = this.config.height;
			this.shadowCtx = configureHighQuality2DContext(
				this.shadowCanvas.getContext("2d", {
					willReadFrequently: false,
				}),
			);

			if (!this.shadowCtx) {
				throw new Error("Failed to get 2D context for shadow canvas");
			}
		}

		// Setup mask
		this.maskGraphics = new Graphics();
		this.videoContainer.addChild(this.maskGraphics);
		this.videoContainer.mask = this.maskGraphics;
		if (this.cursorOverlay) {
			this.cursorContainer.addChild(this.cursorOverlay.container);
		}
	}

	private async setupBackground(): Promise<void> {
		const wallpaper = await this.resolveWallpaperForExport(this.config.wallpaper);

		const bgCanvas = document.createElement("canvas");
		bgCanvas.width = this.config.width;
		bgCanvas.height = this.config.height;
		const bgCtx = configureHighQuality2DContext(bgCanvas.getContext("2d"));

		if (!bgCtx) {
			throw new Error("Failed to get 2D context for background canvas");
		}

		try {
			if (
				wallpaper.startsWith("file://") ||
				wallpaper.startsWith("data:") ||
				wallpaper.startsWith("/") ||
				wallpaper.startsWith("http")
			) {
				const img = new Image();
				const imageUrl = await this.resolveWallpaperImageUrl(wallpaper);
				if (
					imageUrl.startsWith("http") &&
					window.location.origin &&
					!imageUrl.startsWith(window.location.origin)
				) {
					img.crossOrigin = "anonymous";
				}

				await new Promise<void>((resolve, reject) => {
					img.onload = () => resolve();
					img.onerror = (err) => {
						console.error("[FrameRenderer] Failed to load background image:", imageUrl, err);
						reject(new Error(`Failed to load background image: ${imageUrl}`));
					};
					img.src = imageUrl;
				});

				const imgAspect = img.width / img.height;
				const canvasAspect = this.config.width / this.config.height;

				let drawWidth, drawHeight, drawX, drawY;

				if (imgAspect > canvasAspect) {
					drawHeight = this.config.height;
					drawWidth = drawHeight * imgAspect;
					drawX = (this.config.width - drawWidth) / 2;
					drawY = 0;
				} else {
					drawWidth = this.config.width;
					drawHeight = drawWidth / imgAspect;
					drawX = 0;
					drawY = (this.config.height - drawHeight) / 2;
				}

				bgCtx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
			} else if (wallpaper.startsWith("#")) {
				bgCtx.fillStyle = wallpaper;
				bgCtx.fillRect(0, 0, this.config.width, this.config.height);
			} else if (
				wallpaper.startsWith("linear-gradient") ||
				wallpaper.startsWith("radial-gradient")
			) {
				const gradientMatch = wallpaper.match(/(linear|radial)-gradient\((.+)\)/);
				if (gradientMatch) {
					const [, type, params] = gradientMatch;
					const parts = params.split(",").map((s) => s.trim());

					let gradient: CanvasGradient;

					if (type === "linear") {
						gradient = bgCtx.createLinearGradient(0, 0, 0, this.config.height);
						parts.forEach((part, index) => {
							if (part.startsWith("to ") || part.includes("deg")) return;

							const colorMatch = part.match(/^(#[0-9a-fA-F]{3,8}|rgba?\([^)]+\)|[a-z]+)/);
							if (colorMatch) {
								const color = colorMatch[1];
								const position = index / (parts.length - 1);
								gradient.addColorStop(position, color);
							}
						});
					} else {
						const cx = this.config.width / 2;
						const cy = this.config.height / 2;
						const radius = Math.max(this.config.width, this.config.height) / 2;
						gradient = bgCtx.createRadialGradient(cx, cy, 0, cx, cy, radius);

						parts.forEach((part, index) => {
							const colorMatch = part.match(/^(#[0-9a-fA-F]{3,8}|rgba?\([^)]+\)|[a-z]+)/);
							if (colorMatch) {
								const color = colorMatch[1];
								const position = index / (parts.length - 1);
								gradient.addColorStop(position, color);
							}
						});
					}

					bgCtx.fillStyle = gradient;
					bgCtx.fillRect(0, 0, this.config.width, this.config.height);
				} else {
					bgCtx.fillStyle = "#000000";
					bgCtx.fillRect(0, 0, this.config.width, this.config.height);
				}
			} else {
				bgCtx.fillStyle = wallpaper;
				bgCtx.fillRect(0, 0, this.config.width, this.config.height);
			}
		} catch (error) {
			console.error("[FrameRenderer] Error setting up background, using fallback:", error);
			bgCtx.fillStyle = "#000000";
			bgCtx.fillRect(0, 0, this.config.width, this.config.height);
		}

		this.backgroundSprite = bgCanvas as any;
	}

	private async resolveWallpaperImageUrl(wallpaper: string): Promise<string> {
		if (
			wallpaper.startsWith("file://") ||
			wallpaper.startsWith("data:") ||
			wallpaper.startsWith("http")
		) {
			return wallpaper;
		}

		const resolved = await getAssetPath(wallpaper.replace(/^\/+/, ""));
		if (resolved.startsWith("/") && window.location.protocol.startsWith("http")) {
			return `${window.location.origin}${resolved}`;
		}

		return resolved;
	}

	private async resolveWallpaperForExport(wallpaper: string): Promise<string> {
		if (!wallpaper) {
			return wallpaper;
		}

		if (
			wallpaper.startsWith("#") ||
			wallpaper.startsWith("linear-gradient") ||
			wallpaper.startsWith("radial-gradient")
		) {
			return wallpaper;
		}

		const looksLikeAbsoluteFilePath =
			wallpaper.startsWith("/") &&
			!wallpaper.startsWith("//") &&
			!wallpaper.startsWith("/wallpapers/") &&
			!wallpaper.startsWith("/app-icons/");

		const wallpaperAsset = looksLikeAbsoluteFilePath ? `file://${encodeURI(wallpaper)}` : wallpaper;

		return getRenderableAssetUrl(wallpaperAsset);
	}

	private async setupWebcamSource(): Promise<void> {
		const webcamUrl = this.config.webcamUrl;
		if (!this.config.webcam?.enabled || !webcamUrl) {
			this.webcamForwardFrameSource?.cancel();
			void this.webcamForwardFrameSource?.destroy();
			this.webcamForwardFrameSource = null;
			this.closeWebcamDecodedFrame();
			this.cleanupWebcamSource?.();
			this.cleanupWebcamSource = null;
			this.webcamVideoElement = null;
			this.webcamFrameCacheCanvas = null;
			this.webcamFrameCacheCtx = null;
			this.lastSyncedWebcamTime = null;
			return;
		}

		this.webcamForwardFrameSource?.cancel();
		void this.webcamForwardFrameSource?.destroy();
		this.webcamForwardFrameSource = null;
		this.closeWebcamDecodedFrame();
		this.cleanupWebcamSource?.();
		this.cleanupWebcamSource = null;

		try {
			const frameSource = new ForwardFrameSource();
			await frameSource.initialize(webcamUrl);
			this.webcamForwardFrameSource = frameSource;
			this.webcamVideoElement = null;
			this.webcamSeekPromise = null;
			this.webcamFrameCacheCanvas = null;
			this.webcamFrameCacheCtx = null;
			this.lastSyncedWebcamTime = null;
			return;
		} catch (error) {
			console.warn(
				"[FrameRenderer] Decoder-backed webcam source unavailable during export; falling back to media element sync:",
				error,
			);
		}

		const webcamSource = await resolveMediaElementSource(webcamUrl);
		this.cleanupWebcamSource = webcamSource.revoke;

		const video = document.createElement("video");
		video.src = webcamSource.src;
		video.muted = true;
		video.preload = "auto";
		video.playsInline = true;
		video.load();

		await new Promise<void>((resolve, reject) => {
			const onReady = () => {
				if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
					return;
				}
				cleanup();
				resolve();
			};
			const onError = () => {
				cleanup();
				reject(new Error("Failed to load webcam source for export"));
			};
			const cleanup = () => {
				video.removeEventListener("loadeddata", onReady);
				video.removeEventListener("canplay", onReady);
				video.removeEventListener("canplaythrough", onReady);
				video.removeEventListener("error", onError);
			};
			if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
				resolve();
				return;
			}
			video.addEventListener("loadeddata", onReady, { once: true });
			video.addEventListener("canplay", onReady, { once: true });
			video.addEventListener("canplaythrough", onReady, { once: true });
			video.addEventListener("error", onError, { once: true });
		}).catch((error) => {
			console.warn("[FrameRenderer] Webcam overlay unavailable during export:", error);
			this.webcamVideoElement = null;
		});

		if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
			this.webcamVideoElement = video;
			return;
		}

		this.webcamVideoElement = null;
		this.webcamFrameCacheCanvas = null;
		this.webcamFrameCacheCtx = null;
		this.lastSyncedWebcamTime = null;
	}

	private async syncWebcamFrame(targetTime: number): Promise<void> {
		if (this.webcamForwardFrameSource) {
			const clampedTime = clampMediaTimeToDuration(targetTime, null);
			const decodedFrame = await this.webcamForwardFrameSource.getFrameAtTime(clampedTime);
			this.closeWebcamDecodedFrame();
			this.webcamDecodedFrame = decodedFrame;
			if (decodedFrame) {
				this.lastSyncedWebcamTime = clampedTime;
			}
			return;
		}

		const webcamVideo = this.webcamVideoElement;
		if (!webcamVideo) {
			return;
		}

		const clampedTime = clampMediaTimeToDuration(
			targetTime,
			Number.isFinite(webcamVideo.duration) ? webcamVideo.duration : null,
		);

		if (Math.abs(webcamVideo.currentTime - clampedTime) <= 0.008) {
			this.lastSyncedWebcamTime = clampedTime;
			return;
		}

		if (this.webcamSeekPromise) {
			await this.webcamSeekPromise;
		}

		this.webcamSeekPromise = new Promise<void>((resolve) => {
			let settled = false;
			let fallbackTimeout: number | null = null;
			let animationFrameRequestId: number | null = null;
			let videoFrameRequestId: number | null = null;
			const waitForPresentedFrame = () => {
				const requestVideoFrameCallback = (
					webcamVideo as HTMLVideoElement & {
						requestVideoFrameCallback?: (
							callback: (now: DOMHighResTimeStamp, metadata: VideoFrameCallbackMetadata) => void,
						) => number;
						cancelVideoFrameCallback?: (handle: number) => void;
					}
				).requestVideoFrameCallback;

				const scheduleAnimationFrameFinish = () => {
					animationFrameRequestId = requestAnimationFrame(() => {
						animationFrameRequestId = null;
						finish();
					});
				};

				scheduleAnimationFrameFinish();

				if (typeof requestVideoFrameCallback === "function") {
					videoFrameRequestId = requestVideoFrameCallback.call(webcamVideo, () => {
						videoFrameRequestId = null;
						finish();
					});
					return;
				}
			};
			const finish = () => {
				if (settled) {
					return;
				}
				settled = true;
				if (Math.abs(webcamVideo.currentTime - clampedTime) <= 0.02) {
					this.lastSyncedWebcamTime = clampedTime;
				}
				cleanup();
				resolve();
			};
			const handleMediaReady = () => {
				if (
					!webcamVideo.seeking &&
					Math.abs(webcamVideo.currentTime - clampedTime) <= 0.01 &&
					webcamVideo.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA
				) {
					waitForPresentedFrame();
				}
			};
			const cleanup = () => {
				webcamVideo.removeEventListener("seeked", waitForPresentedFrame);
				webcamVideo.removeEventListener("loadeddata", handleMediaReady);
				webcamVideo.removeEventListener("canplay", handleMediaReady);
				webcamVideo.removeEventListener("error", finish);
				if (animationFrameRequestId !== null) {
					cancelAnimationFrame(animationFrameRequestId);
					animationFrameRequestId = null;
				}
				if (
					videoFrameRequestId !== null &&
					typeof (
						webcamVideo as HTMLVideoElement & {
							cancelVideoFrameCallback?: (handle: number) => void;
						}
					).cancelVideoFrameCallback === "function"
				) {
					(
						webcamVideo as HTMLVideoElement & {
							cancelVideoFrameCallback: (handle: number) => void;
						}
					).cancelVideoFrameCallback(videoFrameRequestId);
					videoFrameRequestId = null;
				}
				if (fallbackTimeout !== null) {
					window.clearTimeout(fallbackTimeout);
				}
			};

			webcamVideo.addEventListener("seeked", waitForPresentedFrame, {
				once: true,
			});
			webcamVideo.addEventListener("loadeddata", handleMediaReady, {
				once: true,
			});
			webcamVideo.addEventListener("canplay", handleMediaReady, {
				once: true,
			});
			webcamVideo.addEventListener("error", finish, {
				once: true,
			});
			fallbackTimeout = window.setTimeout(() => {
				finish();
			}, 50);

			try {
				webcamVideo.currentTime = clampedTime;
			} catch {
				finish();
				return;
			}

			if (
				!webcamVideo.seeking &&
				Math.abs(webcamVideo.currentTime - clampedTime) <= 0.001 &&
				webcamVideo.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA
			) {
				waitForPresentedFrame();
			}
		});

		try {
			await this.webcamSeekPromise;
		} finally {
			this.webcamSeekPromise = null;
		}
	}

	async renderFrame(videoFrame: VideoFrame, timestamp: number): Promise<void> {
		if (!this.app || !this.videoContainer || !this.cameraContainer) {
			throw new Error("Renderer not initialized");
		}

		this.currentVideoTime = timestamp / 1000000;

		if (this.webcamForwardFrameSource || this.webcamVideoElement) {
			const targetTime = Math.max(0, this.currentVideoTime);
			await this.syncWebcamFrame(targetTime);
		}

		if (!this.videoSprite) {
			const texture = Texture.from(videoFrame as any);
			this.videoSprite = new Sprite(texture);
			this.videoTextureSource = texture.source as TextureSource<any>;
			this.videoContainer.addChild(this.videoSprite);
			if (this.cursorOverlay && this.cursorContainer) {
				this.cursorContainer.addChild(this.cursorOverlay.container);
			}
			if (this.maskGraphics) {
				this.videoContainer.addChild(this.maskGraphics);
			}
		} else {
			this.videoTextureSource ??= this.videoSprite.texture.source as TextureSource<any>;
			this.videoTextureSource.resource = videoFrame as any;
			this.videoTextureSource.update();
		}

		this.updateLayout();

		const timeMs = this.currentVideoTime * 1000;

		if (this.cursorOverlay && this.layoutCache) {
			this.cursorOverlay.update(
				this.config.cursorTelemetry ?? [],
				timeMs,
				this.layoutCache.maskRect,
				this.config.showCursor ?? true,
				false,
			);
		}

		const TICKS_PER_FRAME = 1;

		let maxMotionIntensity = 0;
		for (let i = 0; i < TICKS_PER_FRAME; i++) {
			if (this.layoutCache) {
				const update = calculateAnimationState(
					this.config,
					this.animationState,
					this.layoutCache,
					timeMs,
				);
				this.animationState = update.state;
				this.lastMotionVector = update.motionVector;
				maxMotionIntensity = Math.max(maxMotionIntensity, update.motionIntensity);
			}
		}

		if (this.layoutCache) {
			applyZoomTransform({
				cameraContainer: this.cameraContainer,
				blurFilter: this.blurFilter,
				motionBlurFilter: this.motionBlurFilter as any,
				stageSize: this.layoutCache.stageSize,
				baseMask: this.layoutCache.maskRect,
				zoomScale: this.animationState.scale,
				zoomProgress: this.animationState.progress,
				focusX: this.animationState.focusX,
				focusY: this.animationState.focusY,
				motionIntensity: maxMotionIntensity,
				motionVector: this.lastMotionVector,
				isPlaying: true,
				motionBlurAmount: this.config.zoomMotionBlur ?? 0,
				transformOverride: {
					scale: this.animationState.appliedScale,
					x: this.animationState.x,
					y: this.animationState.y,
				},
				motionBlurState: this.motionBlurState,
				frameTimeMs: timeMs,
			});
		}

		this.app.renderer.render(this.app.stage);

		this.compositeWithShadows();

		if (
			this.config.annotationRegions &&
			this.config.annotationRegions.length > 0 &&
			this.compositeCtx
		) {
			const previewWidth = this.config.previewWidth || 1920;
			const previewHeight = this.config.previewHeight || 1080;
			const scaleX = this.config.width / previewWidth;
			const scaleY = this.config.height / previewHeight;
			const scaleFactor = (scaleX + scaleY) / 2;

			await renderAnnotations(
				this.compositeCtx,
				this.config.annotationRegions,
				this.config.width,
				this.config.height,
				timeMs,
				scaleFactor,
			);
		}

		if (
			this.config.autoCaptions &&
			this.config.autoCaptions.length > 0 &&
			this.config.autoCaptionSettings &&
			this.compositeCtx
		) {
			renderCaptions(
				this.compositeCtx,
				this.config.autoCaptions,
				this.config.autoCaptionSettings,
				this.config.width,
				this.config.height,
				timeMs,
			);
		}
	}

	private updateLayout(): void {
		if (!this.app || !this.videoSprite || !this.maskGraphics || !this.videoContainer) return;

		this.layoutCache = calculateLayout(this.config);

		this.videoSprite.scale.set(this.layoutCache.baseScale);
		this.videoSprite.position.set(this.layoutCache.baseOffset.x, this.layoutCache.baseOffset.y);
		this.videoContainer.position.set(0, 0);

		this.maskGraphics.clear();
		drawSquircleOnGraphics(this.maskGraphics, {
			x: this.layoutCache.maskRect.x,
			y: this.layoutCache.maskRect.y,
			width: this.layoutCache.maskRect.width,
			height: this.layoutCache.maskRect.height,
			radius: this.layoutCache.scaledBorderRadius,
		});
		this.maskGraphics.fill({ color: 0xffffff });
	}

	private compositeWithShadows(): void {
		if (!this.compositeCanvas || !this.compositeCtx || !this.app) return;

		const videoCanvas = this.app.canvas as HTMLCanvasElement;
		const ctx = this.compositeCtx;
		const w = this.compositeCanvas.width;
		const h = this.compositeCanvas.height;

		ctx.clearRect(0, 0, w, h);
		ctx.imageSmoothingEnabled = true;
		ctx.imageSmoothingQuality = "high";

		if (this.backgroundSprite) {
			const bgCanvas = this.backgroundSprite as any as HTMLCanvasElement;

			if (this.config.backgroundBlur > 0) {
				ctx.save();
				ctx.filter = `blur(${this.config.backgroundBlur * 3}px)`;
				ctx.drawImage(bgCanvas, 0, 0, w, h);
				ctx.restore();
			} else {
				ctx.drawImage(bgCanvas, 0, 0, w, h);
			}
		}

		if (
			this.config.showShadow &&
			this.config.shadowIntensity > 0 &&
			this.shadowCanvas &&
			this.shadowCtx
		) {
			const shadowCtx = this.shadowCtx;
			shadowCtx.clearRect(0, 0, w, h);
			shadowCtx.save();

			const intensity = this.config.shadowIntensity;
			const baseBlur1 = 48 * intensity;
			const baseBlur2 = 16 * intensity;
			const baseBlur3 = 8 * intensity;
			const baseAlpha1 = 0.7 * intensity;
			const baseAlpha2 = 0.5 * intensity;
			const baseAlpha3 = 0.3 * intensity;
			const baseOffset = 12 * intensity;

			shadowCtx.filter = `drop-shadow(0 ${baseOffset}px ${baseBlur1}px rgba(0,0,0,${baseAlpha1})) drop-shadow(0 ${baseOffset / 3}px ${baseBlur2}px rgba(0,0,0,${baseAlpha2})) drop-shadow(0 ${baseOffset / 6}px ${baseBlur3}px rgba(0,0,0,${baseAlpha3}))`;
			shadowCtx.drawImage(videoCanvas, 0, 0, w, h);
			shadowCtx.restore();
			ctx.drawImage(this.shadowCanvas, 0, 0, w, h);
		} else {
			ctx.drawImage(videoCanvas, 0, 0, w, h);
		}

		this.drawWebcamOverlay(ctx, w, h);
	}

	private drawWebcamOverlay(ctx: CanvasRenderingContext2D, width: number, height: number): void {
		const webcam = this.config.webcam;
		const webcamDecodedFrame = this.webcamDecodedFrame;
		const webcamVideo = this.webcamVideoElement;
		if (!webcam?.enabled || (!webcamDecodedFrame && !webcamVideo)) {
			return;
		}

		const hasCachedWebcamFrame = Boolean(
			this.webcamFrameCacheCanvas &&
				this.webcamFrameCacheCanvas.width > 0 &&
				this.webcamFrameCacheCanvas.height > 0,
		);
		const hasLiveWebcamFrame = webcamDecodedFrame
			? webcamDecodedFrame.displayWidth > 0 && webcamDecodedFrame.displayHeight > 0
			: Boolean(
					webcamVideo &&
						webcamVideo.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
						webcamVideo.videoWidth > 0 &&
						webcamVideo.videoHeight > 0,
				);
		if (!hasLiveWebcamFrame && !hasCachedWebcamFrame) {
			return;
		}

		const margin = webcam.margin ?? 24;
		const size = getWebcamOverlaySizePx({
			containerWidth: width,
			containerHeight: height,
			sizePercent: webcam.size ?? 50,
			margin,
			zoomScale: this.animationState.appliedScale || 1,
			reactToZoom: webcam.reactToZoom ?? true,
		});
		const { x, y } = getWebcamOverlayPosition({
			containerWidth: width,
			containerHeight: height,
			size,
			margin,
			positionPreset: webcam.positionPreset ?? webcam.corner,
			positionX: webcam.positionX ?? 1,
			positionY: webcam.positionY ?? 1,
			legacyCorner: webcam.corner,
		});
		const radius = Math.max(0, webcam.cornerRadius ?? 18);

		const bubbleCanvas = this.webcamBubbleCanvas ?? document.createElement("canvas");
		const bubbleSize = Math.max(1, Math.ceil(size));
		if (bubbleCanvas.width !== bubbleSize || bubbleCanvas.height !== bubbleSize) {
			bubbleCanvas.width = bubbleSize;
			bubbleCanvas.height = bubbleSize;
		}
		this.webcamBubbleCanvas = bubbleCanvas;
		const bubbleCtx =
			this.webcamBubbleCtx ?? configureHighQuality2DContext(bubbleCanvas.getContext("2d"));
		if (!bubbleCtx) {
			return;
		}
		this.webcamBubbleCtx = bubbleCtx;
		bubbleCtx.clearRect(0, 0, bubbleCanvas.width, bubbleCanvas.height);

		const canRefreshCache =
			hasLiveWebcamFrame &&
			this.lastSyncedWebcamTime !== null &&
			Math.abs(this.lastSyncedWebcamTime - this.currentVideoTime) <= 0.02 &&
			(webcamDecodedFrame
				? true
				: Boolean(
						webcamVideo &&
							!webcamVideo.seeking &&
							Math.abs(webcamVideo.currentTime - this.currentVideoTime) <= 0.02 &&
							webcamVideo.videoWidth > 0 &&
							webcamVideo.videoHeight > 0,
					));

		if (canRefreshCache) {
			const liveFrameWidth = webcamDecodedFrame?.displayWidth ?? webcamVideo?.videoWidth ?? 0;
			const liveFrameHeight = webcamDecodedFrame?.displayHeight ?? webcamVideo?.videoHeight ?? 0;
			if (
				!this.webcamFrameCacheCanvas ||
				this.webcamFrameCacheCanvas.width !== liveFrameWidth ||
				this.webcamFrameCacheCanvas.height !== liveFrameHeight
			) {
				this.webcamFrameCacheCanvas = document.createElement("canvas");
				this.webcamFrameCacheCanvas.width = liveFrameWidth;
				this.webcamFrameCacheCanvas.height = liveFrameHeight;
				this.webcamFrameCacheCtx = configureHighQuality2DContext(
					this.webcamFrameCacheCanvas.getContext("2d"),
				);
			}

			this.webcamFrameCacheCtx?.clearRect(
				0,
				0,
				this.webcamFrameCacheCanvas!.width,
				this.webcamFrameCacheCanvas!.height,
			);
			this.webcamFrameCacheCtx?.drawImage(
				webcamDecodedFrame ?? webcamVideo!,
				0,
				0,
				this.webcamFrameCacheCanvas!.width,
				this.webcamFrameCacheCanvas!.height,
			);
		}

		const webcamFrameSource =
			this.webcamFrameCacheCanvas ??
			(hasLiveWebcamFrame ? (webcamDecodedFrame ?? webcamVideo) : null);
		if (!webcamFrameSource) {
			return;
		}

		const sourceWidth =
			("displayWidth" in webcamFrameSource
				? webcamFrameSource.displayWidth
				: "videoWidth" in webcamFrameSource
					? webcamFrameSource.videoWidth
					: webcamFrameSource.width) || size;
		const sourceHeight =
			("displayHeight" in webcamFrameSource
				? webcamFrameSource.displayHeight
				: "videoHeight" in webcamFrameSource
					? webcamFrameSource.videoHeight
					: webcamFrameSource.height) || size;
		const coverScale = Math.max(size / sourceWidth, size / sourceHeight);
		const drawWidth = sourceWidth * coverScale;
		const drawHeight = sourceHeight * coverScale;
		const drawX = (size - drawWidth) / 2;
		const drawY = (size - drawHeight) / 2;

		bubbleCtx.save();
		drawSquircleOnCanvas(bubbleCtx, { x: 0, y: 0, width: size, height: size, radius });
		bubbleCtx.clip();
		if (webcam.mirror) {
			bubbleCtx.save();
			bubbleCtx.translate(size, 0);
			bubbleCtx.scale(-1, 1);
			bubbleCtx.drawImage(webcamFrameSource, drawX, drawY, drawWidth, drawHeight);
			bubbleCtx.restore();
		} else {
			bubbleCtx.drawImage(webcamFrameSource, drawX, drawY, drawWidth, drawHeight);
		}
		bubbleCtx.restore();

		if ((webcam.shadow ?? 0) > 0) {
			const shadow = Math.max(0, Math.min(1, webcam.shadow));
			ctx.save();
			ctx.filter = `drop-shadow(0 ${Math.round(size * 0.06)}px ${Math.round(size * 0.22)}px rgba(0,0,0,${shadow}))`;
			ctx.drawImage(bubbleCanvas, x, y, size, size);
			ctx.restore();
			return;
		}

		ctx.drawImage(bubbleCanvas, x, y, size, size);
	}

	private closeWebcamDecodedFrame(): void {
		if (!this.webcamDecodedFrame) {
			return;
		}

		this.webcamDecodedFrame.close();
		this.webcamDecodedFrame = null;
	}

	getCanvas(): HTMLCanvasElement {
		if (!this.compositeCanvas) {
			throw new Error("Renderer not initialized");
		}
		return this.compositeCanvas;
	}

	destroy(): void {
		if (this.videoSprite) {
			const videoTexture = this.videoSprite.texture;
			this.videoSprite.destroy({ texture: false, textureSource: false });
			videoTexture?.destroy(true);
			this.videoSprite = null;
			this.videoTextureSource = null;
		}
		this.backgroundSprite = null;
		if (this.app) {
			this.app.destroy(true, {
				children: true,
				texture: false,
				textureSource: false,
			});
			this.app = null;
		}
		this.cameraContainer = null;
		this.videoContainer = null;
		this.maskGraphics = null;
		this.blurFilter = null;
		this.motionBlurFilter = null;
		if (this.cursorOverlay) {
			this.cursorOverlay.destroy();
			this.cursorOverlay = null;
		}
		this.shadowCanvas = null;
		this.shadowCtx = null;
		this.compositeCanvas = null;
		this.compositeCtx = null;
		if (this.backgroundVideoElement) {
			this.backgroundVideoElement.pause();
			this.backgroundVideoElement.src = "";
			this.backgroundVideoElement.load();
			this.backgroundVideoElement = null;
		}
		this.cleanupBackgroundSource?.();
		this.cleanupBackgroundSource = null;
		if (this.webcamVideoElement) {
			this.webcamVideoElement.pause();
			this.webcamVideoElement.src = "";
			this.webcamVideoElement.load();
			this.webcamVideoElement = null;
		}
		this.webcamForwardFrameSource?.cancel();
		void this.webcamForwardFrameSource?.destroy();
		this.webcamForwardFrameSource = null;
		this.closeWebcamDecodedFrame();
		this.cleanupWebcamSource?.();
		this.cleanupWebcamSource = null;
		this.webcamFrameCacheCanvas = null;
		this.webcamFrameCacheCtx = null;
		this.webcamBubbleCanvas = null;
		this.webcamBubbleCtx = null;
		this.lastSyncedWebcamTime = null;
	}
}
