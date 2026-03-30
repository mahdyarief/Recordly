import { Trash2, Upload } from "lucide-react";
import type { WebcamOverlaySettings } from "@/features/editor/types";
import { useScopedT } from "@/shared/adapters/I18nProvider";
import { Button } from "@/shared/components/ui/button";

interface FootageSettingsProps {
	webcam: WebcamOverlaySettings | undefined;
	onUploadWebcam: (() => void) | undefined;
	onClearWebcam: (() => void) | undefined;
}

export function FootageSettings({ webcam, onUploadWebcam, onClearWebcam }: FootageSettingsProps) {
	const tSettings = useScopedT("settings");
	const webcamFileName = webcam?.sourcePath?.split(/[\\/]/).pop() ?? null;

	return (
		<div className="rounded-xl bg-white/[0.03] border border-white/10 px-3 py-2.5 shadow-sm transition-all hover:bg-white/[0.05]">
			<div className="flex items-center justify-between gap-3">
				<div className="flex-1 min-w-0">
					<div className="text-[10px] text-slate-300 font-semibold uppercase tracking-wider mb-0.5">
						{tSettings("effects.webcamFootage", "Webcam Device")}
					</div>
					<div className="text-[10px] text-slate-500 italic truncate pr-2">
						{webcamFileName || tSettings("effects.webcamFootageDescription", "None selected")}
					</div>
				</div>
				<div className="flex items-center gap-2">
					<Button
						type="button"
						variant="outline"
						onClick={onUploadWebcam}
						className="h-8 gap-1.5 border-white/10 bg-white/5 px-2.5 text-[10px] text-slate-200 hover:bg-primary hover:text-white hover:border-primary transition-all duration-200"
					>
						<Upload className="h-3 w-3" />
						{webcam?.sourcePath
							? tSettings("effects.replaceWebcamFootage", "Replace")
							: tSettings("effects.uploadWebcamFootage", "Select")}
					</Button>
					{webcam?.sourcePath && (
						<Button
							type="button"
							variant="outline"
							onClick={onClearWebcam}
							className="h-8 w-8 p-0 border-white/10 bg-white/5 text-slate-400 hover:bg-destructive hover:text-white hover:border-destructive transition-all duration-200"
							title={tSettings("effects.removeWebcamFootage", "Remove")}
						>
							<Trash2 className="h-3.5 w-3.5" />
						</Button>
					)}
				</div>
			</div>
		</div>
	);
}
