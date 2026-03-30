import { Download, FolderOpen, Redo2, Save, Undo2 } from "lucide-react";
import React from "react";
import { FeedbackDialog, KeyboardShortcutsDialog } from "@/features/editor/components/TutorialHelp";
import { useEditorContext } from "@/features/editor/context/EditorContext";
import {
	type ExportFormat,
	type ExportQuality,
	type GifFrameRate,
	type GifSizePreset,
} from "@/features/exporter";
import { ExportSettingsMenu } from "@/features/exporter/components/ExportSettingsMenu";
import { useI18n } from "@/shared/adapters/I18nProvider";
import { Button } from "@/shared/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { APP_HEADER_ACTION_BUTTON_CLASS } from "./HeaderStyles";
import { LanguageSwitcher } from "./LanguageSwitcher";

export interface EditorHeaderProps {
	canUndo: boolean;
	canRedo: boolean;
	handleUndo: () => void;
	handleRedo: () => void;
	handleOpenProjectBrowser: () => void;
	handleSaveProject: () => void;
	handleOpenExportDropdown: () => void;
	handleCancelExport: () => void;
	handleRetrySaveExport: () => void;
	handleExportDropdownClose: () => void;
	handleStartExportFromDropdown: () => void;
	revealExportedFile: () => void;
	openRecordingsFolder: () => void;
	projectBrowserTriggerRef: React.RefObject<HTMLButtonElement>;
	mp4OutputDimensions: Record<ExportQuality, { width: number; height: number }>;
	gifOutputDimensions: { width: number; height: number };
}

export function EditorHeader({
	canUndo,
	canRedo,
	handleUndo,
	handleRedo,
	handleOpenProjectBrowser,
	handleSaveProject,
	handleOpenExportDropdown,
	handleCancelExport,
	handleExportDropdownClose,
	handleStartExportFromDropdown,
	revealExportedFile,
	openRecordingsFolder,
	projectBrowserTriggerRef,
	mp4OutputDimensions,
	gifOutputDimensions,
}: EditorHeaderProps) {
	const { t } = useI18n();
	const {
		projectDisplayName,
		hasUnsavedChanges,
		isExporting,
		exportProgress,
		exportError,
		showExportDropdown,
		setShowExportDropdown,
		exportedFilePath,
		state,
		updateState,
	} = useEditorContext();

	const { exportFormat, exportQuality, gifFrameRate, gifLoop, gifSizePreset } = state;

	const setExportFormat = (exportFormat: ExportFormat) => updateState({ exportFormat });
	const setExportQuality = (exportQuality: ExportQuality) => updateState({ exportQuality });
	const setGifFrameRate = (gifFrameRate: GifFrameRate) => updateState({ gifFrameRate });
	const setGifLoop = (gifLoop: boolean) => updateState({ gifLoop });
	const setGifSizePreset = (gifSizePreset: GifSizePreset) => updateState({ gifSizePreset });

	const isExportSaving = exportProgress?.phase === "saving";
	const isExportFinalizing = exportProgress?.phase === "finalizing";
	const exportPercentLabel = exportProgress
		? isExportSaving
			? t("editor.exportStatus.saving", "Saving to disk...")
			: isExportFinalizing
				? t("editor.exportStatus.finalizing", "Finalizing...")
				: `${Math.round(exportProgress.percentage)}%`
		: "0%";

	return (
		<header
			className="relative h-11 flex-shrink-0 bg-[#151518]/88 backdrop-blur-md border-b border-white/10 flex items-center justify-center px-8 z-50"
			style={{ WebkitAppRegion: "drag" } as React.CSSProperties}
		>
			<div className="flex items-baseline gap-0">
				<span className="text-sm font-semibold tracking-tight text-white/90">
					{projectDisplayName}
				</span>
				<span className="text-xs font-medium tracking-tight text-slate-500">.recordly</span>
			</div>

			<div
				className="absolute left-[88px] flex items-center gap-2"
				style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
			>
				<LanguageSwitcher />
				<Button
					type="button"
					variant="ghost"
					size="sm"
					onClick={() => void openRecordingsFolder()}
					className={`${APP_HEADER_ACTION_BUTTON_CLASS} px-2.5`}
					title={t("common.app.manageRecordings", "Open recordings folder")}
					aria-label={t("common.app.manageRecordings", "Open recordings folder")}
				>
					<FolderOpen className="h-4 w-4" />
				</Button>
				<KeyboardShortcutsDialog />
				<FeedbackDialog />
				<div className="ml-1 h-5 w-px bg-white/10" />
			</div>

			<div
				className="absolute right-5 flex items-center gap-2 pr-3"
				style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
			>
				<Button
					type="button"
					variant="ghost"
					onClick={handleUndo}
					disabled={!canUndo}
					className="inline-flex h-8 w-8 items-center justify-center rounded-[5px] border border-white/10 bg-white/5 p-0 text-slate-200 transition-colors hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
					title={t("common.actions.undo", "Undo")}
					aria-label={t("common.actions.undo", "Undo")}
				>
					<Undo2 className="h-4 w-4" />
				</Button>
				<Button
					type="button"
					variant="ghost"
					onClick={handleRedo}
					disabled={!canRedo}
					className="inline-flex h-8 w-8 items-center justify-center rounded-[5px] border border-white/10 bg-white/5 p-0 text-slate-200 transition-colors hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
					title={t("common.actions.redo", "Redo")}
					aria-label={t("common.actions.redo", "Redo")}
				>
					<Redo2 className="h-4 w-4" />
				</Button>

				<div className="mx-1 h-5 w-px bg-white/10" />

				<Button
					ref={projectBrowserTriggerRef}
					type="button"
					onClick={handleOpenProjectBrowser}
					className="inline-flex h-8 min-w-[96px] items-center justify-center gap-1.5 rounded-[5px] bg-white px-4 text-black shadow-[0_14px_32px_rgba(0,0,0,0.18)] transition-colors hover:bg-white/92"
				>
					<FolderOpen className="h-4 w-4" />
					<span className="text-sm font-semibold tracking-tight">
						{t("editor.project.projects", "Projects")}
					</span>
				</Button>

				<Button
					type="button"
					onClick={handleSaveProject}
					className="inline-flex h-8 min-w-[96px] items-center justify-center gap-1.5 rounded-[5px] bg-white px-4 text-black transition-colors hover:bg-white/92"
				>
					<span className={`${hasUnsavedChanges ? "flex" : "hidden"} size-2 relative`}>
						<span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#2563EB] opacity-75"></span>
						<span className="relative inline-flex size-2 rounded-full bg-[#2563EB]"></span>
					</span>
					<Save className="h-4 w-4" />
					<span className="text-sm font-semibold tracking-tight">
						{t("common.actions.save", "Save")}
					</span>
				</Button>

				<div className="mx-1 h-5 w-px bg-white/10" />

				<DropdownMenu open={showExportDropdown} onOpenChange={setShowExportDropdown} modal={false}>
					<DropdownMenuTrigger asChild>
						<Button
							type="button"
							onClick={handleOpenExportDropdown}
							className="inline-flex h-8 min-w-[112px] items-center justify-center gap-2 rounded-[5px] bg-[#2563EB] px-4.5 text-white transition-colors hover:bg-[#2563EB]/92"
						>
							<Download className="h-4 w-4" />
							<span className="text-sm font-semibold tracking-tight">
								{t("common.actions.export", "Export")}
							</span>
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent
						align="end"
						sideOffset={10}
						className="w-[360px] border-none bg-transparent p-0 shadow-none"
					>
						{isExporting ? (
							<div className="rounded-2xl border border-white/10 bg-[#17171a] p-4 text-slate-200 shadow-2xl">
								<div className="mb-3 flex items-center justify-between gap-3">
									<div>
										<p className="text-sm font-semibold text-white">
											{t("editor.exportStatus.exporting", "Exporting")}
										</p>
										<p className="text-xs text-slate-400">
											{t("editor.exportStatus.renderingFile", "Rendering your file.")}
										</p>
									</div>
									<Button
										type="button"
										variant="outline"
										onClick={handleCancelExport}
										className="h-8 border-red-500/20 bg-red-500/10 px-3 text-xs text-red-400 hover:bg-red-500/20"
									>
										{t("common.actions.cancel")}
									</Button>
								</div>
								<div className="h-2 overflow-hidden rounded-full border border-white/5 bg-white/5">
									{isExportSaving ? (
										<div className="indeterminate-progress h-full rounded-full bg-transparent" />
									) : (
										<div
											className="h-full bg-[#2563EB] transition-all duration-300 ease-out"
											style={{
												width: `${Math.min(isExportFinalizing && typeof exportProgress?.renderProgress === "number" ? exportProgress.renderProgress : (exportProgress?.percentage ?? 8), 100)}%`,
											}}
										/>
									)}
								</div>
								<p className="mt-2 text-xs text-slate-400">{exportPercentLabel}</p>
							</div>
						) : exportError ? (
							<div className="rounded-2xl border border-white/10 bg-[#17171a] p-4 text-slate-200 shadow-2xl">
								<p className="text-sm font-semibold text-white">
									{t("editor.exportStatus.issue", "Export issue")}
								</p>
								<p className="mt-1 text-xs leading-relaxed text-slate-400">{exportError}</p>
								<div className="mt-4 flex gap-2">
									<Button
										type="button"
										variant="outline"
										onClick={handleExportDropdownClose}
										className="h-8 flex-1 border-white/10 bg-white/5 text-xs text-slate-300 hover:bg-white/10"
									>
										{t("common.actions.close", "Close")}
									</Button>
								</div>
							</div>
						) : exportedFilePath ? (
							<div className="rounded-2xl border border-white/10 bg-[#17171a] p-4 text-slate-200 shadow-2xl">
								<p className="text-sm font-semibold text-white">
									{t("editor.exportStatus.complete", "Export complete")}
								</p>
								<p className="mt-1 text-xs text-slate-400">
									{t("editor.exportStatus.savedSuccessfully", "Your file was saved successfully.")}
								</p>
								<p className="mt-3 truncate text-xs text-slate-500">
									{exportedFilePath.split(/[\\/]/).pop()}
								</p>
								<div className="mt-4 flex gap-2">
									<Button
										type="button"
										onClick={revealExportedFile}
										className="h-8 flex-1 rounded-[5px] bg-[#2563EB] text-xs font-semibold text-white hover:bg-[#2563EB]/92"
									>
										{t("editor.actions.showInFolder", "Show In Folder")}
									</Button>
									<Button
										type="button"
										variant="outline"
										onClick={handleExportDropdownClose}
										className="h-8 flex-1 border-white/10 bg-white/5 text-xs text-slate-300 hover:bg-white/10"
									>
										Done
									</Button>
								</div>
							</div>
						) : (
							<ExportSettingsMenu
								exportFormat={exportFormat}
								onExportFormatChange={setExportFormat}
								exportQuality={exportQuality}
								onExportQualityChange={setExportQuality}
								gifFrameRate={gifFrameRate}
								onGifFrameRateChange={setGifFrameRate}
								gifLoop={gifLoop}
								onGifLoopChange={setGifLoop}
								gifSizePreset={gifSizePreset}
								onGifSizePresetChange={setGifSizePreset}
								mp4OutputDimensions={mp4OutputDimensions}
								gifOutputDimensions={gifOutputDimensions}
								onExport={handleStartExportFromDropdown}
								className="shadow-2xl"
							/>
						)}
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
		</header>
	);
}
