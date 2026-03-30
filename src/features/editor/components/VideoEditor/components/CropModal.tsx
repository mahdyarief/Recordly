import { Button } from "@/shared/components/ui/button";

interface CropModalProps {
	isOpen: boolean;
	t: (key: string) => string;
	onCancel: () => void;
}

export function CropModal({ isOpen, t, onCancel }: CropModalProps) {
	if (!isOpen) return null;

	return (
		<>
			<div
				className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
				onClick={onCancel}
			/>
			<div className="fixed left-1/2 top-1/2 z-[60] max-h-[90vh] w-[90vw] max-w-5xl -translate-x-1/2 -translate-y-1/2 overflow-auto rounded-2xl border border-white/10 bg-[#09090b] p-8 shadow-2xl">
				<div className="mb-6 flex items-center justify-between">
					<div>
						<span className="text-xl font-bold text-slate-200">{t("settings.crop.title")}</span>
						<p className="mt-2 text-sm text-slate-400">{t("settings.crop.instruction")}</p>
					</div>
					<Button variant="ghost" onClick={onCancel} className="text-white hover:bg-white/10">
						Done
					</Button>
				</div>
				{/* Crop Editor content would go here, maybe passed as children or rendered via a library */}
			</div>
		</>
	);
}
