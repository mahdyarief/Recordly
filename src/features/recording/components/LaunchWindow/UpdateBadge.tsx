import { ArrowUpCircle, CheckCircle2, RefreshCw } from "lucide-react";
import React from "react";
import { useI18n } from "@/shared/adapters/I18nProvider";
import type { UpdateStatus } from "../../types";
import styles from "../LaunchWindow.module.css";

interface UpdateBadgeProps {
	updateStatus: UpdateStatus;
	updateActionPending: boolean;
	onClick: () => void;
}

export const UpdateBadge: React.FC<UpdateBadgeProps> = ({
	updateStatus,
	updateActionPending,
	onClick,
}) => {
	const { t } = useI18n();

	const label =
		updateStatus.status === "up-to-date"
			? t("launch.recording.update.updated")
			: t("launch.recording.update.update");

	const title = (() => {
		switch (updateStatus.status) {
			case "up-to-date":
				return t("launch.recording.update.upToDateTitle", "Recordly {{version}} is up to date.", {
					version: updateStatus.currentVersion,
				});
			case "available":
			case "ready":
				return updateStatus.availableVersion
					? t("launch.recording.update.availableTitle", "Recordly {{version}} is available.", {
							version: updateStatus.availableVersion,
						})
					: t("launch.recording.update.availableGenericTitle");
			case "downloading":
				return updateStatus.detail ?? t("launch.recording.update.downloadingTitle");
			case "checking":
				return t("launch.recording.update.checkingTitle");
			case "error":
				return updateStatus.detail ?? t("launch.recording.update.errorTitle");
			default:
				return t("launch.recording.update.idleTitle");
		}
	})();

	const className = `${styles.updateBadge} ${updateStatus.status === "up-to-date" ? styles.updateBadgeQuiet : styles.updateBadgeHot} ${styles.electronNoDrag}`;

	const icon = (() => {
		switch (updateStatus.status) {
			case "up-to-date":
				return <CheckCircle2 size={14} />;
			case "checking":
			case "downloading":
				return <RefreshCw size={14} className={styles.updateBadgeSpin} />;
			default:
				return <ArrowUpCircle size={14} />;
		}
	})();

	return (
		<button
			type="button"
			onClick={onClick}
			className={className}
			title={title}
			disabled={updateActionPending}
		>
			{icon}
			<span>{label}</span>
		</button>
	);
};
