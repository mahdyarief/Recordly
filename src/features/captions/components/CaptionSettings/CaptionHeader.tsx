import { useI18n, useScopedT } from "@/shared/adapters/I18nProvider";
import { Switch } from "@/shared/components/ui/switch";

export function SectionLabel({ children }: { children: React.ReactNode }) {
	return (
		<p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">{children}</p>
	);
}

export function CaptionHeader({
	enabled,
	onEnabledChange,
	onReset,
}: {
	enabled: boolean;
	onEnabledChange: (enabled: boolean) => void;
	onReset: () => void;
}) {
	const tSettings = useScopedT("settings");
	const { t } = useI18n();

	return (
		<div className="flex items-center justify-between gap-3">
			<div className="flex items-center gap-3">
				<SectionLabel>{tSettings("sections.captions", "Captions")}</SectionLabel>
				<button
					type="button"
					onClick={onReset}
					className="text-[10px] text-[#2563EB] transition-opacity hover:opacity-80"
				>
					{t("common.actions.reset", "Reset")}
				</button>
			</div>
			<div className="flex items-center gap-2 text-[10px] text-slate-400">
				<span>{tSettings("captions.enabled", "Show")}</span>
				<Switch
					checked={enabled}
					onCheckedChange={onEnabledChange}
					className="data-[state=checked]:bg-[#2563EB] scale-75"
				/>
			</div>
		</div>
	);
}
