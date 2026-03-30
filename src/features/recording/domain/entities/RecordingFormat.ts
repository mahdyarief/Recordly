export const PREFERRED_MIME_TYPES = [
	"video/webm;codecs=av1",
	"video/webm;codecs=h264",
	"video/webm;codecs=vp9",
	"video/webm;codecs=vp8",
	"video/webm",
] as const;

export function selectMimeType(availableCheck: (type: string) => boolean): string {
	return PREFERRED_MIME_TYPES.find((type) => availableCheck(type)) ?? "video/webm";
}

export function isMimeTypeSupported(type: string): boolean {
	if (typeof MediaRecorder === "undefined") return false;
	return MediaRecorder.isTypeSupported(type);
}
