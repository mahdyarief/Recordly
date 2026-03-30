import {
	AppWindow,
	Eye,
	EyeOff,
	FolderOpen,
	Languages,
	Mic,
	MicOff,
	Monitor,
	Timer,
	Video,
	VideoIcon,
	VideoOff,
	Volume2,
	VolumeX,
} from "lucide-react";
import React from "react";
import type { ProjectLibraryEntry } from "@/features/project/components/ProjectBrowserDialog";
import ProjectBrowserDialog from "@/features/project/components/ProjectBrowserDialog";
import { useAudioLevelMeter } from "@/hooks/useAudioLevelMeter";
import type { MicrophoneDevice } from "@/hooks/useMicrophoneDevices";
import type { VideoDevice } from "@/hooks/useVideoDevices";
import type { AppLocale } from "@/i18n/config";
import { SUPPORTED_LOCALES } from "@/i18n/config";
import { useI18n } from "@/shared/adapters/I18nProvider";
import { AudioLevelMeter } from "@/shared/components/ui/audio-level-meter";
import type { ActiveDropdown, DesktopSource } from "../../types";
import styles from "../LaunchWindow.module.css";
import { DropdownItem } from "./Primitives";

interface HudDropdownsProps {
	activeDropdown: ActiveDropdown;
	sources: DesktopSource[];
	sourcesLoading: boolean;
	selectedSource: string;
	handleSourceSelect: (source: DesktopSource) => void;
	systemAudioEnabled: boolean;
	setSystemAudioEnabled: (v: boolean) => void;
	microphoneEnabled: boolean;
	setMicrophoneEnabled: (v: boolean) => void;
	devices: MicrophoneDevice[];
	microphoneDeviceId?: string;
	selectedDeviceId?: string;
	setSelectedDeviceId: (v: string) => void;
	setMicrophoneDeviceId: (v?: string) => void;
	webcamEnabled: boolean;
	setWebcamEnabled: (v: boolean) => void;
	showWebcamControls: boolean;
	webcamPreviewRef: React.RefObject<HTMLVideoElement | null>;
	videoDevices: VideoDevice[];
	webcamDeviceId?: string;
	selectedVideoDeviceId?: string;
	setSelectedVideoDeviceId: (v: string) => void;
	setWebcamDeviceId: (v: string) => void;
	countdownDelay: number;
	setCountdownDelay: (v: number) => void;
	setActiveDropdown: (v: ActiveDropdown) => void;
	supportsHudCaptureProtection: boolean;
	hideHudFromCapture: boolean;
	toggleHudCaptureProtection: () => void;
	chooseRecordingsDirectory: () => void;
	openVideoFile: () => void;
	openProjectBrowser: () => void;
	projectBrowserOpen: boolean;
	setProjectBrowserOpen: (v: boolean) => void;
	projectLibraryEntries: ProjectLibraryEntry[];
	openProjectFromLibrary: (projectPath: string) => void;
	appVersion?: string | null;
}

const COUNTDOWN_OPTIONS = [0, 3, 5, 10];
const LOCALE_LABELS: Record<string, string> = {
	en: "EN",
	es: "ES",
	"zh-CN": "中文",
};

const SourcesDropdown = ({ sources, sourcesLoading, selectedSource, handleSourceSelect }: any) => {
	const { t } = useI18n();
	if (sourcesLoading) {
		return (
			<div className="flex items-center justify-center py-6">
				<div className="animate-spin h-4 w-4 border-b-2 border-[#6b6b78]" />
			</div>
		);
	}
	const screens = sources.filter((s: any) => s.sourceType === "screen");
	const windows = sources.filter((s: any) => s.sourceType === "window");
	return (
		<>
			{screens.length > 0 && <div className={styles.ddLabel}>{t("launch.recording.screens")}</div>}
			{screens.map((s: any) => (
				<DropdownItem
					key={s.id}
					icon={<Monitor size={16} />}
					selected={selectedSource === s.name}
					onClick={() => handleSourceSelect(s)}
				>
					{s.name}
				</DropdownItem>
			))}
			{windows.length > 0 && <div className={styles.ddLabel}>{t("launch.recording.windows")}</div>}
			{windows.map((s: any) => (
				<DropdownItem
					key={s.id}
					icon={<AppWindow size={16} />}
					selected={selectedSource === s.name}
					onClick={() => handleSourceSelect(s)}
				>
					{s.appName && s.appName !== s.name ? `${s.appName} — ${s.name}` : s.name}
				</DropdownItem>
			))}
		</>
	);
};

const MicDeviceRow = ({ device, selected, onSelect }: any) => {
	const { level } = useAudioLevelMeter({ enabled: true, deviceId: device.deviceId });
	return (
		<button
			type="button"
			className={`${styles.ddItem} ${selected ? styles.ddItemSelected : ""}`}
			onClick={onSelect}
		>
			<span className="shrink-0">{selected ? <Mic size={16} /> : <MicOff size={16} />}</span>
			<span className="truncate flex-1">{device.label}</span>
			<AudioLevelMeter level={level} className="w-16 shrink-0" />
		</button>
	);
};

const MicDropdown = (props: any) => {
	const { t } = useI18n();
	return (
		<>
			<div className={styles.ddLabel}>{t("launch.recording.microphone")}</div>
			<DropdownItem
				icon={props.systemAudioEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
				selected={props.systemAudioEnabled}
				onClick={() => props.setSystemAudioEnabled(!props.systemAudioEnabled)}
			>
				{props.systemAudioEnabled
					? t("launch.recording.disableSystemAudio")
					: t("launch.recording.enableSystemAudio")}
			</DropdownItem>
			{props.microphoneEnabled && (
				<DropdownItem
					icon={<MicOff size={16} />}
					onClick={() => {
						props.setMicrophoneEnabled(false);
						props.setActiveDropdown("none");
					}}
				>
					{t("launch.recording.turnOffMicrophone")}
				</DropdownItem>
			)}
			{props.devices.map((device: any) => (
				<MicDeviceRow
					key={device.deviceId}
					device={device}
					selected={
						props.microphoneEnabled &&
						(props.microphoneDeviceId === device.deviceId ||
							props.selectedDeviceId === device.deviceId)
					}
					onSelect={() => {
						props.setMicrophoneEnabled(true);
						props.setSelectedDeviceId(device.deviceId);
						props.setMicrophoneDeviceId(
							device.deviceId === "default" ? undefined : device.deviceId,
						);
					}}
				/>
			))}
		</>
	);
};

const WebcamDropdown = (props: any) => {
	const { t } = useI18n();
	return (
		<>
			<div className={styles.ddLabel}>{t("launch.recording.webcam")}</div>
			{props.webcamEnabled && (
				<DropdownItem
					icon={<VideoOff size={16} />}
					onClick={() => {
						props.setWebcamEnabled(false);
						props.setActiveDropdown("none");
					}}
				>
					{t("launch.recording.turnOffWebcam")}
				</DropdownItem>
			)}
			{props.showWebcamControls && (
				<div className="flex justify-center px-3 py-2">
					<div className="h-24 w-24 overflow-hidden rounded-2xl bg-white/5 ring-1 ring-white/10">
						<video
							ref={props.webcamPreviewRef as any}
							className="h-full w-full object-cover"
							muted
							playsInline
							style={{ transform: "scaleX(-1)" }}
						/>
					</div>
				</div>
			)}
			{props.videoDevices.map((device: any) => (
				<DropdownItem
					key={device.deviceId}
					icon={
						props.webcamEnabled &&
						(props.webcamDeviceId === device.deviceId ||
							props.selectedVideoDeviceId === device.deviceId) ? (
							<Video size={16} />
						) : (
							<VideoOff size={16} />
						)
					}
					selected={
						props.webcamEnabled &&
						(props.webcamDeviceId === device.deviceId ||
							props.selectedVideoDeviceId === device.deviceId)
					}
					onClick={() => {
						props.setWebcamEnabled(true);
						props.setSelectedVideoDeviceId(device.deviceId);
						props.setWebcamDeviceId(device.deviceId);
					}}
				>
					{device.label}
				</DropdownItem>
			))}
		</>
	);
};

const CountdownDropdown = (props: any) => {
	const { t } = useI18n();
	return (
		<>
			<div className={styles.ddLabel}>{t("launch.recording.countdownDelay")}</div>
			{COUNTDOWN_OPTIONS.map((delay) => (
				<DropdownItem
					key={delay}
					icon={<Timer size={16} />}
					selected={props.countdownDelay === delay}
					onClick={() => {
						props.setCountdownDelay(delay);
						props.setActiveDropdown("none");
					}}
				>
					{delay === 0 ? t("launch.recording.noDelay") : `${delay}s`}
				</DropdownItem>
			))}
		</>
	);
};

const MoreDropdown = (props: any) => {
	const { t, locale, setLocale } = useI18n();
	return (
		<>
			{props.supportsHudCaptureProtection && (
				<DropdownItem
					icon={props.hideHudFromCapture ? <EyeOff size={16} /> : <Eye size={16} />}
					selected={props.hideHudFromCapture}
					onClick={() => {
						void props.toggleHudCaptureProtection();
					}}
				>
					{props.hideHudFromCapture
						? t("launch.recording.hideHudFromVideo")
						: t("launch.recording.showHudInVideo")}
				</DropdownItem>
			)}
			<DropdownItem icon={<FolderOpen size={16} />} onClick={props.chooseRecordingsDirectory}>
				{t("launch.recording.recordingsFolder")}
			</DropdownItem>
			<DropdownItem icon={<VideoIcon size={16} />} onClick={props.openVideoFile}>
				{t("launch.recording.openVideoFile")}
			</DropdownItem>
			<DropdownItem icon={<FolderOpen size={16} />} onClick={() => void props.openProjectBrowser()}>
				{t("launch.recording.openProject")}
			</DropdownItem>
			<div className={styles.ddLabel} style={{ marginTop: 4 }}>
				{t("launch.recording.language")}
			</div>
			{SUPPORTED_LOCALES.map((code) => (
				<DropdownItem
					key={code}
					icon={<Languages size={16} />}
					selected={locale === code}
					onClick={() => {
						setLocale(code as AppLocale);
						props.setActiveDropdown("none");
					}}
				>
					{LOCALE_LABELS[code] ?? code}
				</DropdownItem>
			))}
			{props.appVersion && (
				<div className="mt-2 py-1 px-3 text-[11px] text-[#6b6b78] text-center select-text">
					v{props.appVersion}
				</div>
			)}
		</>
	);
};

export const HudDropdowns: React.FC<HudDropdownsProps> = (props) => {
	const { activeDropdown } = props;

	if (activeDropdown === "none" && !props.projectBrowserOpen) return null;

	return (
		<div className={styles.menuArea}>
			{props.projectBrowserOpen && (
				<div className={styles.electronNoDrag}>
					<ProjectBrowserDialog
						open={props.projectBrowserOpen}
						onOpenChange={props.setProjectBrowserOpen}
						entries={props.projectLibraryEntries}
						renderMode="inline"
						onOpenProject={props.openProjectFromLibrary}
					/>
				</div>
			)}
			{activeDropdown !== "none" && (
				<div className={`${styles.menuCard} ${styles.electronNoDrag}`}>
					{activeDropdown === "sources" && <SourcesDropdown {...props} />}
					{activeDropdown === "mic" && <MicDropdown {...props} />}
					{activeDropdown === "webcam" && <WebcamDropdown {...props} />}
					{activeDropdown === "countdown" && <CountdownDropdown {...props} />}
					{activeDropdown === "more" && <MoreDropdown {...props} />}
				</div>
			)}
		</div>
	);
};
