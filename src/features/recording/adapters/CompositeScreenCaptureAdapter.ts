import type {
	CaptureResult,
	CaptureSource,
	NativeCaptureOptions,
	ScreenCapturePort,
} from "../domain/ports/ScreenCapturePort";
import { BrowserScreenCaptureAdapter } from "./BrowserScreenCaptureAdapter";
import { ElectronNativeScreenCaptureAdapter } from "./ElectronNativeScreenCaptureAdapter";

/**
 * An adapter that tries native capture first and falls back to browser-based
 * capture if native is unavailable or fails.
 */
export class CompositeScreenCaptureAdapter implements ScreenCapturePort {
	private nativeAdapter: ElectronNativeScreenCaptureAdapter;
	private browserAdapter: BrowserScreenCaptureAdapter;
	private activeAdapter: ScreenCapturePort | null = null;

	constructor() {
		this.nativeAdapter = new ElectronNativeScreenCaptureAdapter();
		this.browserAdapter = new BrowserScreenCaptureAdapter();
	}

	async getSources(): Promise<CaptureSource[]> {
		return await this.nativeAdapter.getSources();
	}

	async startNativeCapture(
		source: CaptureSource,
		options: NativeCaptureOptions,
	): Promise<CaptureResult> {
		const nativeStatus = await this.nativeAdapter.isNativeCaptureAvailable();
		if (nativeStatus.available) {
			const result = await this.nativeAdapter.startNativeCapture(source, options);
			if (result.success) {
				this.activeAdapter = this.nativeAdapter;
				return result;
			}
		}

		// Fallback to browser capture if implemented in adapter
		// (Wait! BrowserScreenCaptureAdapter doesn't have startNativeCapture that works)
		// We'll need to extend the port or handle browser capture specifically.
		this.activeAdapter = this.browserAdapter;
		return { success: false, message: "Native capture unavailable, browser fallback required." };
	}

	async stopNativeCapture(): Promise<CaptureResult> {
		if (this.activeAdapter) {
			return await this.activeAdapter.stopNativeCapture();
		}
		return { success: false };
	}

	async isNativeCaptureAvailable(): Promise<{ available: boolean }> {
		return await this.nativeAdapter.isNativeCaptureAvailable();
	}

	async recoverNativeCapture(): Promise<CaptureResult> {
		return await this.nativeAdapter.recoverNativeCapture();
	}

	async pauseNativeCapture?(): Promise<CaptureResult> {
		if (this.activeAdapter?.pauseNativeCapture) {
			return await this.activeAdapter.pauseNativeCapture();
		}
		return { success: false };
	}

	async resumeNativeCapture?(): Promise<CaptureResult> {
		if (this.activeAdapter?.resumeNativeCapture) {
			return await this.activeAdapter.resumeNativeCapture();
		}
		return { success: false };
	}

	async getSelectedSource(): Promise<CaptureSource | null> {
		return await this.nativeAdapter.getSelectedSource();
	}

	async hideOsCursor(): Promise<void> {
		await this.nativeAdapter.hideOsCursor();
	}

	onRecordingInterrupted(
		callback: (state: { reason: string; message: string }) => void,
	): () => void {
		const unsub1 = this.nativeAdapter.onRecordingInterrupted(callback);
		// If browser adapter supports it, wire it up too
		return () => {
			unsub1();
		};
	}

	onStopRecordingFromTray(callback: () => void): () => void {
		return this.nativeAdapter.onStopRecordingFromTray(callback);
	}
}
