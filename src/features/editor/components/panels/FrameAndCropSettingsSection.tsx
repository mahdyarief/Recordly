import { CropSettings } from "./FrameAndCrop/CropSettings";
import { FrameSettings } from "./FrameAndCrop/FrameSettings";

interface FrameAndCropSettingsSectionProps {
	shadowIntensity: number;
	initialShadowIntensity: number;
	onShadowChange: ((intensity: number) => void) | undefined;
	borderRadius: number;
	initialBorderRadius: number;
	onBorderRadiusChange: ((radius: number) => void) | undefined;
	padding: number;
	initialPadding: number;
	onPaddingChange: ((padding: number) => void) | undefined;
	removeBackgroundEnabled: boolean;
	handleRemoveBackgroundToggle: (checked: boolean) => void;
	resetFrameSection: () => void;
	// Crop
	isCropped: boolean;
	resetCropSection: () => void;
	cropTop: number;
	cropBottom: number;
	cropLeft: number;
	cropRight: number;
	setCropInset: (side: "top" | "bottom" | "left" | "right", pct: number) => void;
}

/**
 * Section for frame (shadow, radius, padding) and crop settings.
 */
export function FrameAndCropSettingsSection(props: FrameAndCropSettingsSectionProps) {
	return (
		<>
			<FrameSettings
				shadowIntensity={props.shadowIntensity}
				initialShadowIntensity={props.initialShadowIntensity}
				onShadowChange={props.onShadowChange}
				borderRadius={props.borderRadius}
				initialBorderRadius={props.initialBorderRadius}
				onBorderRadiusChange={props.onBorderRadiusChange}
				padding={props.padding}
				initialPadding={props.initialPadding}
				onPaddingChange={props.onPaddingChange}
				removeBackgroundEnabled={props.removeBackgroundEnabled}
				handleRemoveBackgroundToggle={props.handleRemoveBackgroundToggle}
				resetFrameSection={props.resetFrameSection}
			/>

			<CropSettings
				isCropped={props.isCropped}
				resetCropSection={props.resetCropSection}
				cropTop={props.cropTop}
				cropBottom={props.cropBottom}
				cropLeft={props.cropLeft}
				cropRight={props.cropRight}
				setCropInset={props.setCropInset}
			/>
		</>
	);
}
