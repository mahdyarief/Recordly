import type { CountdownPort } from "../domain/ports/CountdownPort";

export class ElectronCountdownAdapter implements CountdownPort {
	async getCountdownDelay(): Promise<number> {
		const result = await window.electronAPI.getCountdownDelay();
		return result.success ? result.delay : 3;
	}

	async setCountdownDelay(delay: number): Promise<void> {
		await window.electronAPI.setCountdownDelay(delay);
	}

	async startCountdown(seconds: number): Promise<{ success: boolean; cancelled?: boolean }> {
		const result = await window.electronAPI.startCountdown(seconds);
		return {
			success: result.success,
			cancelled: result.cancelled,
		};
	}

	async cancelCountdown(): Promise<void> {
		await window.electronAPI.cancelCountdown();
	}

	async getActiveCountdown(): Promise<{ success: boolean; seconds: number | null }> {
		const result = await window.electronAPI.getActiveCountdown();
		return {
			success: result.success,
			seconds: typeof result.seconds === "number" ? result.seconds : null,
		};
	}

	onCountdownTick(callback: (seconds: number) => void): () => void {
		return window.electronAPI.onCountdownTick(callback);
	}
}
