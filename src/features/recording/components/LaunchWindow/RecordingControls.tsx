import { Mic, MicOff, Minus, Pause, Play, Square, X } from "lucide-react";
import React from "react";
import { useI18n } from "@/shared/adapters/I18nProvider";
import styles from "../LaunchWindow.module.css";
import { IconButton, Separator } from "./Primitives";

interface RecordingControlsProps {
	paused: boolean;
	elapsed: number;
	microphoneEnabled: boolean;
	toggleRecording: () => void;
	pauseRecording: () => void;
	resumeRecording: () => void;
	cancelRecording: () => void;
}

const formatTime = (seconds: number) => {
	const m = Math.floor(seconds / 60)
		.toString()
		.padStart(2, "0");
	const s = (seconds % 60).toString().padStart(2, "0");
	return `${m}:${s}`;
};

export const RecordingControls: React.FC<RecordingControlsProps> = ({
	paused,
	elapsed,
	microphoneEnabled,
	toggleRecording,
	pauseRecording,
	resumeRecording,
	cancelRecording,
}) => {
	const { t } = useI18n();

	return (
		<>
			<div className="flex items-center gap-[5px]">
				<div
					className={`w-[7px] h-[7px] rounded-full ${paused ? "bg-[#fbbf24]" : `bg-[#f43f5e] ${styles.recDotBlink}`}`}
				/>
				<span
					className={`text-[10px] font-bold tracking-[0.06em] ${paused ? "text-[#fbbf24]" : "text-[#f43f5e]"}`}
				>
					{paused ? t("launch.recording.paused") : t("launch.recording.rec")}
				</span>
			</div>

			<span
				className={`font-mono text-xs font-semibold min-w-[52px] text-center tracking-[0.02em] ${paused ? "text-[#fbbf24]" : "text-[#eeeef2]"}`}
			>
				{formatTime(elapsed)}
			</span>

			<Separator />

			<IconButton
				title={
					microphoneEnabled
						? t("launch.recording.disableMicrophone")
						: t("launch.recording.enableMicrophone")
				}
				className={microphoneEnabled ? styles.ibActive : ""}
			>
				{microphoneEnabled ? <Mic size={18} /> : <MicOff size={18} />}
			</IconButton>

			<Separator />

			<IconButton
				onClick={paused ? resumeRecording : pauseRecording}
				title={paused ? t("launch.recording.resume") : t("launch.recording.pause")}
				className={paused ? styles.ibGreen : ""}
			>
				{paused ? <Play size={18} fill="currentColor" strokeWidth={0} /> : <Pause size={18} />}
			</IconButton>

			<IconButton
				onClick={toggleRecording}
				title={t("launch.recording.stop")}
				className={styles.ibRed}
			>
				<Square size={16} fill="currentColor" strokeWidth={0} />
			</IconButton>

			<IconButton
				onClick={() => window.electronAPI?.hudOverlayHide?.()}
				title={t("launch.recording.hideHud")}
			>
				<Minus size={16} />
			</IconButton>

			<IconButton onClick={cancelRecording} title={t("launch.recording.cancel")}>
				<X size={18} />
			</IconButton>
		</>
	);
};
