import { fixWebmDuration } from "@fix-webm-duration/fix";
import { isMimeTypeSupported, selectMimeType } from "../domain/entities/RecordingFormat";
import type { RecordingStoragePort } from "../domain/ports/RecordingStoragePort";

export class BrowserRecordingService {
	constructor(private storagePort: RecordingStoragePort) {}

	async muxWebm(chunks: Blob[], durationMs: number, fileName: string): Promise<string | null> {
		if (chunks.length === 0) return null;

		const mimeType = selectMimeType((type) => isMimeTypeSupported(type));
		const blob = new Blob(chunks, { type: mimeType });

		try {
			const fixedBlob = await fixWebmDuration(blob, durationMs);
			const arrayBuffer = await fixedBlob.arrayBuffer();
			const result = await this.storagePort.storeVideo(arrayBuffer, fileName);
			return result.success ? result.path : null;
		} catch (error) {
			console.error("[BrowserRecordingService] Muxing error:", error);
			return null;
		}
	}
}
