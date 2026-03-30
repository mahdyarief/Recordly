import { FrameAndCropSettingsSection } from "../../panels/FrameAndCropSettingsSection";
import { ZoomSettingsPanel } from "../../panels/ZoomSettingsPanel";
import { type SettingsPanelProps, type ZoomDepth } from "../types";

export function SceneSection({ props }: { props: SettingsPanelProps }) {
	const {
		zoomEnabled = true,
		selectedZoomDepth,
		onZoomDepthChange,
		zoomMotionBlur = 0,
		onZoomMotionBlurChange,
		resetZoomSection,
		selectedZoomId,
		handleDeleteClick,
		shadowIntensity = 0,
		initialEditorPreferences = { shadowIntensity: 0, borderRadius: 0, padding: 0 },
		onShadowChange,
		borderRadius = 0,
		onBorderRadiusChange,
		padding = 0,
		onPaddingChange,
		removeBackgroundEnabled = false,
		handleRemoveBackgroundToggle,
		resetFrameSection,
		isCropped = false,
		resetCropSection,
		crop,
		setCropInset,
	} = props;

	const cropTop = Math.round((crop?.y || 0) * 100);
	const cropLeft = Math.round((crop?.x || 0) * 100);
	const cropBottom = Math.round((1 - (crop?.y || 0) - (crop?.height || 1)) * 100);
	const cropRight = Math.round((1 - (crop?.x || 0) - (crop?.width || 1)) * 100);

	return (
		<div className="space-y-4">
			<ZoomSettingsPanel
				zoomEnabled={zoomEnabled}
				selectedZoomDepth={selectedZoomDepth as ZoomDepth | null | undefined}
				onZoomDepthChange={
					onZoomDepthChange ||
					(() => {
						/* no-op */
					})
				}
				zoomMotionBlur={zoomMotionBlur}
				onZoomMotionBlurChange={
					onZoomMotionBlurChange ||
					(() => {
						/* no-op */
					})
				}
				resetZoomSection={
					resetZoomSection ||
					(() => {
						/* no-op */
					})
				}
				onDeleteClick={() => selectedZoomId && handleDeleteClick?.(selectedZoomId)}
			/>
			<FrameAndCropSettingsSection
				shadowIntensity={shadowIntensity}
				initialShadowIntensity={initialEditorPreferences.shadowIntensity}
				onShadowChange={
					onShadowChange ||
					(() => {
						/* no-op */
					})
				}
				borderRadius={borderRadius}
				initialBorderRadius={initialEditorPreferences.borderRadius}
				onBorderRadiusChange={
					onBorderRadiusChange ||
					(() => {
						/* no-op */
					})
				}
				padding={padding}
				initialPadding={initialEditorPreferences.padding}
				onPaddingChange={
					onPaddingChange ||
					(() => {
						/* no-op */
					})
				}
				removeBackgroundEnabled={removeBackgroundEnabled}
				handleRemoveBackgroundToggle={
					handleRemoveBackgroundToggle ||
					(() => {
						/* no-op */
					})
				}
				resetFrameSection={
					resetFrameSection ||
					(() => {
						/* no-op */
					})
				}
				isCropped={isCropped}
				resetCropSection={
					resetCropSection ||
					(() => {
						/* no-op */
					})
				}
				cropTop={cropTop}
				cropBottom={cropBottom}
				cropLeft={cropLeft}
				cropRight={cropRight}
				setCropInset={
					setCropInset ||
					(() => {
						/* no-op */
					})
				}
			/>
		</div>
	);
}
