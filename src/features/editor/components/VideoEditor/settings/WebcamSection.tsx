import { WebcamSettingsPanel } from "../../panels/WebcamSettingsPanel";
import {
	type SettingsPanelProps,
	type WebcamOverlaySettings,
	type WebcamPositionPreset,
} from "../types";

export function WebcamSection({ props }: { props: SettingsPanelProps }) {
	const { webcam, onWebcamChange, onUploadWebcam, onClearWebcam, resetWebcamSection } = props;

	const updateWebcam = (updates: Partial<WebcamOverlaySettings>) => {
		if (webcam && onWebcamChange) {
			onWebcamChange({ ...webcam, ...updates });
		}
	};

	const applyWebcamPositionPreset = (preset: WebcamPositionPreset) => {
		if (webcam && onWebcamChange) {
			onWebcamChange({ ...webcam, positionPreset: preset });
		}
	};

	return (
		<WebcamSettingsPanel
			webcam={webcam}
			updateWebcam={updateWebcam}
			applyWebcamPositionPreset={applyWebcamPositionPreset}
			onUploadWebcam={onUploadWebcam}
			onClearWebcam={onClearWebcam}
			resetWebcamSection={
				resetWebcamSection ||
				(() => {
					/* no-op */
				})
			}
		/>
	);
}
