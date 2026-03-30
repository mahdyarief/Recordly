import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef } from "react";
import { RxDragHandleDots2 } from "react-icons/rx";
import { TRANSITIONS } from "@/shared/lib/motion";
import { useLaunchWindow } from "../hooks/useLaunchWindow";
import { HudDropdowns } from "./LaunchWindow/HudDropdowns";
import { IdleControls } from "./LaunchWindow/IdleControls";
import { RecordingControls } from "./LaunchWindow/RecordingControls";
import { UpdateBadge } from "./LaunchWindow/UpdateBadge";
import styles from "./LaunchWindow.module.css";

export function LaunchWindow() {
	const props = useLaunchWindow();
	const {
		recording,
		activeDropdown,
		projectBrowserOpen,
		updateStatus,
		updateActionPending,
		handleUpdateButtonClick,
	} = props;

	const dropdownRef = useRef<HTMLDivElement>(null);
	const hudContentRef = useRef<HTMLDivElement>(null);
	const hudBarRef = useRef<HTMLDivElement>(null);

	// Report size for Electron
	useEffect(() => {
		if (!hudContentRef.current || !hudBarRef.current) return;
		const report = () => {
			const w = Math.ceil(hudBarRef.current!.offsetWidth + 24);
			const h = Math.ceil(hudContentRef.current!.offsetHeight + 24);
			window.electronAPI.setHudOverlayCompactWidth(w);
			window.electronAPI.setHudOverlayMeasuredHeight(
				h,
				activeDropdown !== "none" || projectBrowserOpen,
			);
		};
		const ro = new ResizeObserver(report);
		ro.observe(hudContentRef.current);
		ro.observe(hudBarRef.current);
		return () => ro.disconnect();
	}, [activeDropdown, projectBrowserOpen]);

	const handleDragOver = (e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
	};

	const handleDrop = async (e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();

		const file = e.dataTransfer.files[0];
		if (!file) return;

		const ext = file.name.split(".").pop()?.toLowerCase();
		if (ext === "mp4" || ext === "webm" || ext === "mov" || ext === "avi" || ext === "mkv") {
			try {
				const result = await window.electronAPI.setCurrentVideoPath((file as any).path);
				if (result.success) {
					await window.electronAPI.switchToEditor();
				}
			} catch (err) {
				console.error("Failed to open dropped video in HUD:", err);
			}
		} else if (ext === "recordly" || ext === "json") {
			try {
				await window.electronAPI.openProjectFileAtPath((file as any).path);
				await window.electronAPI.switchToEditor();
			} catch (err) {
				console.error("Failed to open dropped project in HUD:", err);
			}
		}
	};

	const hudStateTransition = TRANSITIONS.smooth;

	return (
		<div
			className="w-full flex items-end justify-center bg-transparent overflow-visible pb-5 h-screen pointer-events-none"
			ref={dropdownRef}
		>
			<div
				ref={hudContentRef}
				className="flex flex-col items-center overflow-visible pointer-events-none"
			>
				<HudDropdowns {...props} />

				<div className="flex flex-col items-center pointer-events-auto">
					<motion.div
						ref={hudBarRef}
						layout
						transition={hudStateTransition}
						onDragOver={handleDragOver}
						onDrop={handleDrop}
						className={`${styles.bar} ${styles.electronDrag} mb-2`}
					>
						<div className={`flex items-center px-0.5 ${styles.electronDrag}`}>
							<RxDragHandleDots2 size={14} className="text-[#6b6b78]" />
						</div>

						<UpdateBadge
							updateStatus={updateStatus}
							updateActionPending={updateActionPending}
							onClick={handleUpdateButtonClick}
						/>

						<div className={styles.barStateViewport}>
							<AnimatePresence initial={false} mode="wait">
								<motion.div
									key={recording ? "recording" : "idle"}
									layout
									className={styles.barState}
									initial={{ opacity: 0, y: 10, scale: 0.985, filter: "blur(8px)" }}
									animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
									exit={{ opacity: 0, y: -10, scale: 0.985, filter: "blur(6px)" }}
									transition={hudStateTransition}
								>
									{recording ? <RecordingControls {...props} /> : <IdleControls {...props} />}
								</motion.div>
							</AnimatePresence>
						</div>
					</motion.div>
				</div>
			</div>
		</div>
	);
}
