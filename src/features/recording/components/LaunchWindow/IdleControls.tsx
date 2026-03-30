import {
	ChevronUp,
	Mic,
	MicOff,
	Minus,
	Monitor,
	MoreVertical,
	Timer,
	Video,
	VideoOff,
	X,
} from "lucide-react";
import React from "react";
import { useI18n } from "@/shared/adapters/I18nProvider";
import { ContentClamp } from "@/shared/components/ui/content-clamp";
import styles from "../LaunchWindow.module.css";
import { IconButton, Separator } from "./Primitives";

interface IdleControlsProps {
	selectedSource: string;
	hasSelectedSource: boolean;
	microphoneEnabled: boolean;
	webcamEnabled: boolean;
	countdownDelay: number;
	countdownActive: boolean;
	activeDropdown: string;
	toggleDropdown: (which: any) => void;
	toggleRecording: () => void;
}

export const IdleControls: React.FC<IdleControlsProps> = ({
	selectedSource,
	hasSelectedSource,
	microphoneEnabled,
	webcamEnabled,
	countdownDelay,
	countdownActive,
	activeDropdown,
	toggleDropdown,
	toggleRecording,
}) => {
	const { t } = useI18n();

	const toggleMicrophone = () => toggleDropdown("mic");
	const toggleWebcam = () => toggleDropdown("webcam");

	return (
		<>
			<button
				type="button"
				className={`${styles.screenSel} ${styles.electronNoDrag}`}
				onClick={() => toggleDropdown("sources")}
				title={selectedSource}
			>
				<Monitor size={16} />
				<ContentClamp className={styles.sourceLabel} truncateLength={36}>
					{selectedSource}
				</ContentClamp>
				<ChevronUp
					size={10}
					className={`text-[#6b6b78] ml-0.5 transition-transform duration-200 ${activeDropdown === "sources" ? "" : "rotate-180"}`}
				/>
			</button>

			<Separator />

			<IconButton
				onClick={toggleMicrophone}
				title={
					microphoneEnabled
						? t("launch.recording.disableMicrophone")
						: t("launch.recording.enableMicrophone")
				}
				className={microphoneEnabled ? styles.ibActive : ""}
			>
				{microphoneEnabled ? <Mic size={18} /> : <MicOff size={18} />}
			</IconButton>

			<IconButton
				onClick={toggleWebcam}
				title={
					webcamEnabled ? t("launch.recording.disableWebcam") : t("launch.recording.enableWebcam")
				}
				className={webcamEnabled ? styles.ibActive : ""}
			>
				{webcamEnabled ? <Video size={18} /> : <VideoOff size={18} />}
			</IconButton>

			<IconButton
				onClick={() => toggleDropdown("countdown")}
				title={t("launch.recording.countdownDelay")}
				className={countdownDelay > 0 ? styles.ibActive : ""}
			>
				<Timer size={18} />
			</IconButton>

			<Separator />

			<button
				type="button"
				className={`${styles.recBtn} ${styles.electronNoDrag}`}
				onClick={hasSelectedSource ? toggleRecording : () => toggleDropdown("sources")}
				disabled={countdownActive}
				title={t("launch.recording.record")}
			>
				<div className={styles.recDot} />
			</button>

			<Separator />

			<IconButton onClick={() => toggleDropdown("more")} title={t("launch.recording.more")}>
				<MoreVertical size={18} />
			</IconButton>

			<IconButton
				onClick={() => window.electronAPI?.hudOverlayHide?.()}
				title={t("launch.recording.hideHud")}
			>
				<Minus size={16} />
			</IconButton>

			<IconButton
				onClick={() => window.electronAPI?.hudOverlayClose?.()}
				title={t("launch.recording.closeApp")}
			>
				<X size={16} />
			</IconButton>
		</>
	);
};
