import { useRecorder } from "@/features/recording/hooks/useRecorder";

/**
 * @deprecated Use useRecorder from '@/features/recording/hooks/useRecorder' instead.
 * This is a shim for the legacy restructuring phase.
 */
export function useScreenRecorder() {
	return useRecorder();
}
