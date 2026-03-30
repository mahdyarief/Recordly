import { useCallback, useEffect, useRef, useState } from "react";
import { useMicrophoneDevices } from "@/hooks/useMicrophoneDevices";
import { useVideoDevices } from "@/hooks/useVideoDevices";
import { useI18n } from "@/shared/adapters/I18nProvider";
import { useRecorder as useScreenRecorder } from "../hooks/useRecorder";
import type { ActiveDropdown, DesktopSource, UpdateStatus } from "../types";

export function useLaunchWindow() {
	const { locale, setLocale } = useI18n();

	const recorder = useScreenRecorder();
	const { recording, paused, microphoneEnabled, microphoneDeviceId, webcamEnabled } = recorder;

	const [elapsed, setElapsed] = useState(0);
	const [selectedSource, setSelectedSource] = useState("Screen");
	const [hasSelectedSource, setHasSelectedSource] = useState(false);
	const [activeDropdown, setActiveDropdown] = useState<ActiveDropdown>("none");
	const [projectBrowserOpen, setProjectBrowserOpen] = useState(false);
	const [sources, setSources] = useState<DesktopSource[]>([]);
	const [sourcesLoading, setSourcesLoading] = useState(false);
	const [hideHudFromCapture, setHideHudFromCapture] = useState(true);
	const [platform, setPlatform] = useState<string | null>(null);
	const [appVersion, setAppVersion] = useState<string | null>(null);
	const [updateStatus, setUpdateStatus] = useState<UpdateStatus>({
		status: "idle",
		currentVersion: "",
		availableVersion: null,
	});
	const [updateActionPending, setUpdateActionPending] = useState(false);
	const [projectLibraryEntries, setProjectLibraryEntries] = useState<any[]>([]);

	const micDropdownOpen = activeDropdown === "mic";
	const webcamDropdownOpen = activeDropdown === "webcam";

	const { devices, selectedDeviceId, setSelectedDeviceId } = useMicrophoneDevices(
		microphoneEnabled || micDropdownOpen,
		microphoneDeviceId,
	);

	const {
		devices: videoDevices,
		selectedDeviceId: selectedVideoDeviceId,
		setSelectedDeviceId: setSelectedVideoDeviceId,
	} = useVideoDevices(webcamEnabled || webcamDropdownOpen);

	const webcamPreviewRef = useRef<HTMLVideoElement>(null);

	// Fetch initial data
	useEffect(() => {
		const load = async () => {
			const [p, v, hudProt, src, entries] = await Promise.all([
				window.electronAPI.getPlatform(),
				window.electronAPI.getAppVersion(),
				window.electronAPI.getHudOverlayCaptureProtection(),
				window.electronAPI.getSelectedSource(),
				window.electronAPI.listProjectFiles(),
			]);
			setPlatform(p);
			setAppVersion(v);
			if (hudProt.success) setHideHudFromCapture(hudProt.enabled);
			if (src?.name) {
				setSelectedSource(src.name);
				setHasSelectedSource(true);
			}
			setProjectLibraryEntries(entries.success ? entries.entries : []);
		};
		void load();
	}, []);

	// Tooling for HUD state
	useEffect(() => {
		const expanded = activeDropdown !== "none" || projectBrowserOpen;
		window.electronAPI.setHudOverlayExpanded(expanded);
	}, [activeDropdown, projectBrowserOpen]);

	// Timer logic
	useEffect(() => {
		let timer: NodeJS.Timeout | null = null;
		let recordingStart: number | null = null;
		let pausedTotal = 0;
		let pausedAtRef: number | null = null;

		if (recording) {
			recordingStart = Date.now();
			if (paused) {
				pausedAtRef = Date.now();
			} else {
				if (pausedAtRef) {
					pausedTotal += Date.now() - pausedAtRef;
					pausedAtRef = null;
				}
				timer = setInterval(() => {
					if (recordingStart) {
						setElapsed(Math.floor((Date.now() - recordingStart - pausedTotal) / 1000));
					}
				}, 1000);
			}
		} else {
			setElapsed(0);
		}
		return () => {
			if (timer) clearInterval(timer);
		};
	}, [recording, paused]);

	// Update status polling
	useEffect(() => {
		const poll = setInterval(async () => {
			const status = await window.electronAPI.getUpdateStatusSummary();
			setUpdateStatus(status);
		}, 3000);
		return () => clearInterval(poll);
	}, []);

	// Source fetching
	const fetchSources = useCallback(async () => {
		setSourcesLoading(true);
		try {
			const rawSources = await window.electronAPI.getSources({
				types: ["screen", "window"],
				thumbnailSize: { width: 160, height: 90 },
				fetchWindowIcons: true,
			});
			setSources(
				rawSources.map((s: any) => ({
					...s,
					sourceType: s.sourceType || (s.id.startsWith("window:") ? "window" : "screen"),
				})) as DesktopSource[],
			);
		} finally {
			setSourcesLoading(false);
		}
	}, []);

	const toggleDropdown = (which: ActiveDropdown) => {
		setProjectBrowserOpen(false);
		setActiveDropdown((prev) => (prev === which ? "none" : which));
		if (activeDropdown !== which && which === "sources") fetchSources();
	};

	const handleSourceSelect = async (source: DesktopSource) => {
		await window.electronAPI.selectSource(source);
		setSelectedSource(source.name);
		setHasSelectedSource(true);
		setActiveDropdown("none");
	};

	const handleUpdateButtonClick = async () => {
		if (updateActionPending || updateStatus.status === "downloading") return;
		setUpdateActionPending(true);
		try {
			if (updateStatus.status === "available") await window.electronAPI.downloadAvailableUpdate();
			else if (updateStatus.status === "ready") await window.electronAPI.installDownloadedUpdate();
			else await window.electronAPI.checkForAppUpdates();
		} finally {
			setUpdateActionPending(false);
		}
	};

	const chooseRecordingsDirectory = async () => {
		const result = await window.electronAPI.chooseRecordingsDirectory();
		if (result.success && result.path) return;
	};

	const openVideoFile = async () => {
		try {
			const result = await window.electronAPI.openVideoFilePicker();
			if (result.success && result.path) {
				await window.electronAPI.setCurrentVideoPath(result.path);
				await window.electronAPI.switchToEditor();
			}
		} catch (error) {
			console.error("[useLaunchWindow] Failed to open video file:", error);
		}
	};

	const openProjectBrowser = () => {
		setProjectBrowserOpen(!projectBrowserOpen);
		setActiveDropdown("none");
	};

	const toggleHudCaptureProtection = async () => {
		const result = await window.electronAPI.setHudOverlayCaptureProtection(!hideHudFromCapture);
		if (result.success) setHideHudFromCapture(result.enabled);
	};

	return {
		...recorder,
		elapsed,
		selectedSource,
		hasSelectedSource,
		activeDropdown,
		setActiveDropdown,
		toggleDropdown,
		projectBrowserOpen,
		setProjectBrowserOpen,
		sources,
		sourcesLoading,
		hideHudFromCapture,
		setHideHudFromCapture,
		toggleHudCaptureProtection,
		platform,
		appVersion,
		updateStatus,
		updateActionPending,
		handleSourceSelect,
		handleUpdateButtonClick,
		devices,
		selectedDeviceId,
		setSelectedDeviceId,
		videoDevices,
		selectedVideoDeviceId,
		setSelectedVideoDeviceId,
		locale,
		setLocale,
		webcamPreviewRef,
		chooseRecordingsDirectory,
		openVideoFile,
		openProjectBrowser,
		projectLibraryEntries,
		openProjectFromLibrary: async (path: string) => {
			await window.electronAPI.openProjectFileAtPath(path);
			await window.electronAPI.switchToEditor();
		},
		supportsHudCaptureProtection: platform !== "linux",
		showWebcamControls: webcamEnabled && !recording,
	};
}
