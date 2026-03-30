import { CaptionCue } from "../entities/CaptionCue";

export interface CaptionGenerationOptions {
	videoPath: string;
	whisperExecutablePath?: string;
	whisperModelPath: string;
	language?: string;
	durationMs?: number;
	startTimeMs?: number;
}

export interface CaptionGeneratorPort {
	generate(options: CaptionGenerationOptions): Promise<{
		success: boolean;
		cues?: CaptionCue[];
		message?: string;
		error?: unknown;
	}>;
	onProgress(callback: (progress: number) => void): () => void;
}
