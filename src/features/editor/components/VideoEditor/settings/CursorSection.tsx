import { CursorSettingsPanel } from "../../panels/CursorSettingsPanel";
import {
	DEFAULT_CURSOR_CLICK_BOUNCE,
	DEFAULT_CURSOR_CLICK_BOUNCE_DURATION,
	DEFAULT_CURSOR_MOTION_BLUR,
	DEFAULT_CURSOR_SIZE,
	DEFAULT_CURSOR_SMOOTHING,
	DEFAULT_CURSOR_STYLE,
	DEFAULT_CURSOR_SWAY,
	type SettingsPanelProps,
} from "../types";

export function CursorSection({ props }: { props: SettingsPanelProps }) {
	const {
		showCursor = true,
		onShowCursorChange,
		loopCursor = false,
		onLoopCursorChange,
		cursorStyle = DEFAULT_CURSOR_STYLE,
		onCursorStyleChange,
		cursorSize = DEFAULT_CURSOR_SIZE,
		onCursorSizeChange,
		cursorSmoothing = DEFAULT_CURSOR_SMOOTHING,
		onCursorSmoothingChange,
		cursorMotionBlur = DEFAULT_CURSOR_MOTION_BLUR,
		onCursorMotionBlurChange,
		cursorClickBounce = DEFAULT_CURSOR_CLICK_BOUNCE,
		onCursorClickBounceChange,
		cursorClickBounceDuration = DEFAULT_CURSOR_CLICK_BOUNCE_DURATION,
		onCursorClickBounceDurationChange,
		cursorSway = DEFAULT_CURSOR_SWAY,
		onCursorSwayChange,
		resetCursorSection,
		cursorPreviewUrls = {},
	} = props;

	return (
		<CursorSettingsPanel
			showCursor={showCursor}
			onShowCursorChange={
				onShowCursorChange ||
				(() => {
					/* no-op */
				})
			}
			loopCursor={loopCursor}
			onLoopCursorChange={
				onLoopCursorChange ||
				(() => {
					/* no-op */
				})
			}
			cursorStyle={cursorStyle}
			onCursorStyleChange={
				onCursorStyleChange ||
				(() => {
					/* no-op */
				})
			}
			cursorSize={cursorSize}
			onCursorSizeChange={
				onCursorSizeChange ||
				(() => {
					/* no-op */
				})
			}
			cursorSmoothing={cursorSmoothing}
			onCursorSmoothingChange={
				onCursorSmoothingChange ||
				(() => {
					/* no-op */
				})
			}
			cursorMotionBlur={cursorMotionBlur}
			onCursorMotionBlurChange={
				onCursorMotionBlurChange ||
				(() => {
					/* no-op */
				})
			}
			cursorClickBounce={cursorClickBounce}
			onCursorClickBounceChange={
				onCursorClickBounceChange ||
				(() => {
					/* no-op */
				})
			}
			cursorClickBounceDuration={cursorClickBounceDuration}
			onCursorClickBounceDurationChange={
				onCursorClickBounceDurationChange ||
				(() => {
					/* no-op */
				})
			}
			cursorSway={cursorSway}
			onCursorSwayChange={
				onCursorSwayChange ||
				(() => {
					/* no-op */
				})
			}
			resetCursorSection={
				resetCursorSection ||
				(() => {
					/* no-op */
				})
			}
			cursorPreviewUrls={cursorPreviewUrls}
		/>
	);
}
