import { createContext } from "react";
// Caption Ports
import { type CaptionGeneratorPort } from "@/features/captions/domain/ports/CaptionGeneratorPort";
import { type EditorPreferencesPort } from "@/features/project/domain/ports/EditorPreferencesPort";
// Project Ports
import { type ProjectStoragePort } from "@/features/project/domain/ports/ProjectStoragePort";
import { type CountdownPort } from "@/features/recording/domain/ports/CountdownPort";
import { type PermissionsPort } from "@/features/recording/domain/ports/PermissionsPort";
import { type RecordingStoragePort } from "@/features/recording/domain/ports/RecordingStoragePort";
// Recording Ports
import { type ScreenCapturePort } from "@/features/recording/domain/ports/ScreenCapturePort";

export interface Dependencies {
	screenCapture: ScreenCapturePort;
	recordingStorage: RecordingStoragePort;
	permissions: PermissionsPort;
	countdown: CountdownPort;
	projectStorage: ProjectStoragePort;
	editorPreferences: EditorPreferencesPort;
	captionGenerator: CaptionGeneratorPort;
}

export const DIContext = createContext<Dependencies | null>(null);
