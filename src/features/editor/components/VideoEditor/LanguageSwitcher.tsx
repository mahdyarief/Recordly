import { Languages } from "lucide-react";
import { type AppLocale, SUPPORTED_LOCALES } from "@/i18n/config";
import { useI18n } from "@/shared/adapters/I18nProvider";
import { Button } from "@/shared/components/ui/button";
import { APP_HEADER_ACTION_BUTTON_CLASS } from "./HeaderStyles";

export function LanguageSwitcher() {
	const { locale, setLocale, t } = useI18n();
	const idx = SUPPORTED_LOCALES.indexOf(locale as (typeof SUPPORTED_LOCALES)[number]);
	const next = SUPPORTED_LOCALES[(idx + 1) % SUPPORTED_LOCALES.length] as AppLocale;
	const labels: Record<string, string> = {
		en: "EN",
		es: "ES",
		"zh-CN": "中文",
	};
	return (
		<Button
			type="button"
			variant="ghost"
			size="sm"
			onClick={() => setLocale(next)}
			className={APP_HEADER_ACTION_BUTTON_CLASS}
			title={t("common.app.language", "Language")}
			aria-label={t("common.app.language", "Language")}
		>
			<Languages className="h-4 w-4" />
			<span className="font-medium">{labels[locale] ?? locale.toUpperCase()}</span>
		</Button>
	);
}
