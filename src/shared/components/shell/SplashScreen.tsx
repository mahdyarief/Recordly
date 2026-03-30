import { useI18n } from "@/shared/adapters/I18nProvider";

export function SplashScreen() {
	const { t } = useI18n();

	return (
		<div className="flex h-full w-full items-center justify-center bg-slate-950 text-white animate-in fade-in duration-500">
			<div className="flex items-center gap-5 rounded-3xl border border-white/10 bg-white/5 px-8 py-6 shadow-2xl shadow-black/50 backdrop-blur-2xl ring-1 ring-white/5">
				<div className="relative">
					<div className="absolute -inset-1 rounded-2xl bg-gradient-to-tr from-primary to-blue-400 opacity-20 blur-lg animate-pulse" />
					<img
						src="/app-icons/recordly-128.png"
						alt={t("app.name", "Recordly")}
						className="relative h-14 w-14 rounded-2xl shadow-lg ring-1 ring-white/10"
					/>
				</div>
				<div>
					<h1 className="text-2xl font-bold tracking-tight text-white/95">
						{t("app.name", "Recordly")}
					</h1>
					<p className="text-[13px] font-medium text-white/50 mt-0.5">
						{t("app.subtitle", "Professional Screen Recording & Editing")}
					</p>
				</div>
			</div>
		</div>
	);
}
