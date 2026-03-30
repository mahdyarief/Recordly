import {
	Application,
	BlurFilter,
	Container,
	Graphics,
	Sprite,
	Texture,
	VideoSource,
} from "pixi.js";
import { MotionBlurFilter } from "pixi-filters";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { buildActiveCaptionLayout } from "@/features/captions/domain/entities/captionLayout";
import { getCaptionScaledFontSize } from "@/features/captions/domain/entities/captionStyle";
import {
	getWebcamOverlayPosition,
	getWebcamOverlaySizePx,
} from "@/features/editor/lib/webcamOverlay";
import { getDefaultCaptionFontFamily } from "@/features/editor/types";
import { getSquircleSvgPath } from "@/shared/lib/squircle";
import {
	DEFAULT_WEBCAM_CORNER_RADIUS,
	DEFAULT_WEBCAM_REACT_TO_ZOOM,
	DEFAULT_WEBCAM_SHADOW,
	DEFAULT_WEBCAM_SIZE,
	type VideoPlaybackProps,
	ZOOM_DEPTH_SCALES,
	type ZoomDepth,
} from "../../types";
import { DEFAULT_FOCUS } from "../constants";
import { preloadCursorAssets } from "../cursorRenderer";
import { layoutVideoContent as layoutVideoContentUtil } from "../layoutUtils";
import { findDominantRegion } from "../zoomRegionUtils";
import { applyZoomTransform, computeZoomTransform, createMotionBlurState } from "../zoomTransform";

export function useVideoPlaybackLogic(props: VideoPlaybackProps) {
	const {
		onDurationChange,
		currentTime,
		onError,
		zoomRegions = [],
		isPlaying = false,
		zoomMotionBlur = 0,
		connectZooms = true,
		webcam,
		webcamVideoPath,
		autoCaptions = [],
		autoCaptionSettings,
	} = props;

	const videoRef = useRef<HTMLVideoElement | null>(null);
	const containerRef = useRef<HTMLDivElement | null>(null);
	const appRef = useRef<Application | null>(null);
	const videoSpriteRef = useRef<Sprite | null>(null);
	const videoContainerRef = useRef<Container | null>(null);
	const cameraContainerRef = useRef<Container | null>(null);
	const cursorCanvasRef = useRef<HTMLCanvasElement | null>(null);
	const overlayRef = useRef<HTMLDivElement | null>(null);
	const focusIndicatorRef = useRef<HTMLDivElement | null>(null);
	const webcamBubbleRef = useRef<HTMLDivElement | null>(null);
	const webcamBubbleInnerRef = useRef<HTMLDivElement | null>(null);
	const webcamVideoRef = useRef<HTMLVideoElement | null>(null);

	const [pixiReady, setPixiReady] = useState(false);
	const [videoReady, setVideoReady] = useState(false);

	const currentTimeRef = useRef(0);
	const animationStateRef = useRef({
		scale: 1,
		appliedScale: 1,
		focusX: 0.5,
		focusY: 0.5,
		progress: 0,
		x: 0,
		y: 0,
	});
	const stageSizeRef = useRef({ width: 0, height: 0 });
	const baseMaskRef = useRef({ x: 0, y: 0, width: 0, height: 0 });
	const isPlayingRef = useRef(isPlaying);
	const blurFilterRef = useRef<BlurFilter | null>(null);
	const motionBlurFilterRef = useRef<MotionBlurFilter | null>(null);
	const motionBlurStateRef = useRef(createMotionBlurState());

	const applyWebcamBubbleLayout = useCallback(
		(zoomScale: number) => {
			const bubble = webcamBubbleRef.current;
			const bubbleInner = webcamBubbleInnerRef.current;
			const overlay = overlayRef.current;
			if (!bubble || !bubbleInner || !overlay || !webcam?.enabled || !webcamVideoPath) {
				if (bubble) bubble.style.display = "none";
				return;
			}
			const margin = webcam.margin ?? 24;
			const scaledSize = getWebcamOverlaySizePx({
				containerWidth: overlay.clientWidth,
				containerHeight: overlay.clientHeight,
				sizePercent: webcam.size ?? DEFAULT_WEBCAM_SIZE,
				margin,
				zoomScale,
				reactToZoom: webcam.reactToZoom ?? DEFAULT_WEBCAM_REACT_TO_ZOOM,
			});
			const { x, y } = getWebcamOverlayPosition({
				containerWidth: overlay.clientWidth,
				containerHeight: overlay.clientHeight,
				size: scaledSize,
				margin,
				positionPreset: webcam.positionPreset || webcam.corner,
				positionX: webcam.positionX ?? 1,
				positionY: webcam.positionY ?? 1,
				legacyCorner: webcam.corner,
			});
			bubble.style.display = "block";
			bubble.style.left = `${x}px`;
			bubble.style.top = `${y}px`;
			bubble.style.width = `${scaledSize}px`;
			bubble.style.height = `${scaledSize}px`;
			const path = getSquircleSvgPath({
				x: 0,
				y: 0,
				width: scaledSize,
				height: scaledSize,
				radius: webcam.cornerRadius ?? DEFAULT_WEBCAM_CORNER_RADIUS,
			});
			bubble.style.filter = `drop-shadow(0 ${Math.round(scaledSize * 0.06)}px ${Math.round(scaledSize * 0.22)}px rgba(0,0,0,${webcam.shadow ?? DEFAULT_WEBCAM_SHADOW}))`;
			bubbleInner.style.clipPath = `path('${path}')`;
		},
		[webcam, webcamVideoPath],
	);

	const layoutVideoContent = useCallback(() => {
		const container = containerRef.current;
		const app = appRef.current;
		const videoSprite = videoSpriteRef.current;
		const videoElement = videoRef.current;
		if (!container || !app || !videoSprite || !videoElement) return;
		const result = layoutVideoContentUtil({
			container,
			app,
			videoSprite,
			maskGraphics: new Graphics(),
			videoElement,
			cropRegion: props.cropRegion,
			lockedVideoDimensions: null,
			borderRadius: props.borderRadius,
			padding: props.padding,
		});
		if (result) {
			stageSizeRef.current = result.stageSize;
			baseMaskRef.current = result.maskRect;
			applyWebcamBubbleLayout(animationStateRef.current.appliedScale || 1);
		}
	}, [
		props.cropRegion,
		props.borderRadius,
		props.padding,
		applyWebcamBubbleLayout,
		props.aspectRatio,
	]);

	useEffect(() => {
		isPlayingRef.current = isPlaying;
		if (isPlaying && pixiReady && videoReady) videoRef.current?.play().catch(console.error);
		else videoRef.current?.pause();
	}, [isPlaying, pixiReady, videoReady]);

	useEffect(() => {
		const container = containerRef.current;
		if (!container) return;
		let mounted = true;
		(async () => {
			try {
				await preloadCursorAssets();
			} catch (e) {
				console.warn("Cursor assets unavailable", e);
			}
			const app = new Application();
			await app.init({
				width: container.clientWidth,
				height: container.clientHeight,
				backgroundAlpha: 0,
				antialias: true,
				resolution: window.devicePixelRatio || 1,
			});
			if (!mounted) {
				app.destroy(true);
				return;
			}
			appRef.current = app;
			container.appendChild(app.canvas);
			const camera = new Container();
			cameraContainerRef.current = camera;
			app.stage.addChild(camera);
			const videoC = new Container();
			videoContainerRef.current = videoC;
			camera.addChild(videoC);
			setPixiReady(true);
		})().catch(onError);
		return () => {
			mounted = false;
			setPixiReady(false);
			appRef.current?.destroy(true);
		};
	}, [onError]);

	useEffect(() => {
		if (!pixiReady || !videoRef.current) return;
		const video = videoRef.current;
		const source = VideoSource.from(video);
		const texture = Texture.from(source);
		const sprite = new Sprite(texture);
		videoSpriteRef.current = sprite;
		const mask = new Graphics();
		videoContainerRef.current?.addChild(sprite, mask);
		videoContainerRef.current!.mask = mask;
		const bFilter = new BlurFilter();
		bFilter.blur = 0;
		const mFilter = new MotionBlurFilter([0, 0], 5, 0);
		videoContainerRef.current!.filters = [bFilter, mFilter];
		blurFilterRef.current = bFilter;
		motionBlurFilterRef.current = mFilter;
		layoutVideoContent();
		setVideoReady(true);
		return () => {
			sprite.destroy();
			texture.destroy();
		};
	}, [pixiReady, layoutVideoContent]);

	useEffect(() => {
		if (!pixiReady || !videoReady || !appRef.current) return;
		const app = appRef.current;
		const ticker = () => {
			currentTimeRef.current = videoRef.current?.currentTime || 0;
			const { region, strength, blendedScale } = findDominantRegion(
				zoomRegions,
				currentTimeRef.current,
				{ connectZooms },
			);
			let targetScale = 1;
			let targetFocus = DEFAULT_FOCUS;
			const targetProgress = strength;
			if (region && strength > 0) {
				targetScale = blendedScale ?? ZOOM_DEPTH_SCALES[((region as any).depth as ZoomDepth) || 1];
				targetFocus = (region as any).focus;
			}
			const state = animationStateRef.current;
			const prevScale = state.appliedScale;
			state.scale = targetScale;
			state.focusX = targetFocus.cx;
			state.focusY = targetFocus.cy;
			state.progress = targetProgress;
			const projected = computeZoomTransform({
				stageSize: stageSizeRef.current,
				baseMask: baseMaskRef.current,
				zoomScale: state.scale,
				zoomProgress: state.progress,
				focusX: state.focusX,
				focusY: state.focusY,
			});
			const applied = applyZoomTransform({
				cameraContainer: cameraContainerRef.current!,
				blurFilter: blurFilterRef.current,
				stageSize: stageSizeRef.current,
				baseMask: baseMaskRef.current,
				zoomScale: state.scale,
				zoomProgress: state.progress,
				focusX: state.focusX,
				focusY: state.focusY,
				motionIntensity: Math.abs(projected.scale - prevScale),
				motionVector: { x: projected.x - state.x, y: projected.y - state.y },
				isPlaying: isPlayingRef.current,
				motionBlurAmount: zoomMotionBlur,
				motionBlurFilter: motionBlurFilterRef.current,
				motionBlurState: motionBlurStateRef.current,
				frameTimeMs: performance.now(),
			});
			state.x = applied.x;
			state.y = applied.y;
			state.appliedScale = applied.scale;
			applyWebcamBubbleLayout(state.appliedScale);
		};
		app.ticker.add(ticker);
		return () => {
			app.ticker.remove(ticker);
		};
	}, [pixiReady, videoReady, zoomRegions, connectZooms, zoomMotionBlur, applyWebcamBubbleLayout]);

	const activeCaptionLayout = useMemo(() => {
		if (!autoCaptionSettings?.enabled || autoCaptions.length === 0) return null;
		const stageWidth = overlayRef.current?.clientWidth || 960;
		const fontSize = getCaptionScaledFontSize(
			autoCaptionSettings.fontSize,
			stageWidth,
			autoCaptionSettings.maxWidth,
		);
		const canvas = document.createElement("canvas");
		const ctx = canvas.getContext("2d")!;
		ctx.font = `700 ${fontSize}px ${getDefaultCaptionFontFamily()}`;
		return buildActiveCaptionLayout({
			cues: autoCaptions,
			timeMs: Math.round(currentTime * 1000),
			settings: autoCaptionSettings,
			maxWidthPx: stageWidth * (autoCaptionSettings.maxWidth / 100),
			measureText: (t: string) => ctx.measureText(t).width,
		});
	}, [autoCaptionSettings, autoCaptions, currentTime]);

	return {
		videoRef,
		containerRef,
		appRef,
		videoSpriteRef,
		videoContainerRef,
		cameraContainerRef,
		cursorCanvasRef,
		overlayRef,
		focusIndicatorRef,
		webcamBubbleRef,
		webcamBubbleRefInner: webcamBubbleInnerRef,
		webcamVideoRef,
		pixiReady,
		videoReady,
		activeCaptionLayout,
		handleLoadedMetadata: (e: any) => onDurationChange?.(e.currentTarget.duration),
		seek: (time: number) => {
			if (videoRef.current) videoRef.current.currentTime = time;
		},
	};
}
