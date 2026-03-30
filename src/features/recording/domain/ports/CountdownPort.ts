export interface CountdownPort {
	getCountdownDelay(): Promise<number>;
	setCountdownDelay(delay: number): Promise<void>;
	startCountdown(seconds: number): Promise<{ success: boolean; cancelled?: boolean }>;
	cancelCountdown(): Promise<void>;
	getActiveCountdown(): Promise<{ success: boolean; seconds: number | null }>;
	onCountdownTick(callback: (seconds: number) => void): () => void;
}
