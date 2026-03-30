import { Info } from "lucide-react";
import { useScopedT } from "@/shared/adapters/I18nProvider";

export function ShortcutsSection() {
	const t = useScopedT("editor");

	return (
		<div className="mt-6 p-3 bg-white/5 rounded-lg border border-white/5">
			<div className="flex items-center gap-2 mb-2 text-slate-300">
				<Info className="w-3.5 h-3.5" />
				<span className="text-xs font-medium">{t("annotations.shortcutsAndTips")}</span>
			</div>
			<ul className="text-[10px] text-slate-400 space-y-1.5 list-disc pl-3 leading-relaxed">
				<li>{t("annotations.tipSelectAnnotation")}</li>
				<li>{t("annotations.tipCycleForward")}</li>
				<li>{t("annotations.tipCycleBackward")}</li>
			</ul>
		</div>
	);
}
