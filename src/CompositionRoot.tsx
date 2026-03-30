import React, { useMemo } from "react";
import { WhisperCaptionGeneratorAdapter } from "@/features/captions/adapters/WhisperCaptionGeneratorAdapter";
import { ElectronProjectStorageAdapter } from "@/features/project/adapters/ElectronProjectStorageAdapter";
import { LocalStorageEditorPreferencesAdapter } from "@/features/project/adapters/LocalStorageEditorPreferencesAdapter";
// Adapters
import { CompositeScreenCaptureAdapter } from "@/features/recording/adapters/CompositeScreenCaptureAdapter";
import { ElectronCountdownAdapter } from "@/features/recording/adapters/ElectronCountdownAdapter";
import { ElectronPermissionsAdapter } from "@/features/recording/adapters/ElectronPermissionsAdapter";
import { ElectronRecordingStorageAdapter } from "@/features/recording/adapters/ElectronRecordingStorageAdapter";
import { type Dependencies } from "@/shared/lib/DIContext";
import { DIProvider } from "@/shared/lib/DIProvider";

export const CompositionRoot: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const deps: Dependencies = useMemo(
		() => ({
			screenCapture: new CompositeScreenCaptureAdapter(),
			recordingStorage: new ElectronRecordingStorageAdapter(),
			permissions: new ElectronPermissionsAdapter(),
			countdown: new ElectronCountdownAdapter(),
			projectStorage: new ElectronProjectStorageAdapter(),
			editorPreferences: new LocalStorageEditorPreferencesAdapter(),
			captionGenerator: new WhisperCaptionGeneratorAdapter(),
		}),
		[],
	);

	return <DIProvider dependencies={deps}>{children}</DIProvider>;
};
