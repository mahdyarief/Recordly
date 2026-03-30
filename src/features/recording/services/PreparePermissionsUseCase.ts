import type { PermissionsPort } from "../domain/ports/PermissionsPort";
import type { RecordingStoragePort } from "../domain/ports/RecordingStoragePort";

export class PreparePermissionsUseCase {
	constructor(
		private permissionsPort: PermissionsPort,
		private storagePort: RecordingStoragePort,
	) {}

	async execute(options: { startup?: boolean } = {}): Promise<boolean> {
		const platform = await this.storagePort.getPlatform();
		if (platform !== "darwin") {
			return true;
		}

		const screenPermission = await this.permissionsPort.getScreenRecordingStatus();
		if (!screenPermission.success || screenPermission.status !== "granted") {
			await this.permissionsPort.openScreenRecordingPreferences();
			alert(
				options.startup
					? "Recordly needs Screen Recording permission before you start. System Settings has been opened. After enabling it, quit and reopen Recordly."
					: "Screen Recording permission is still missing. System Settings has been opened again. Enable it, then quit and reopen Recordly before recording.",
			);
			return false;
		}

		const accessibilityPermission = await this.permissionsPort.getAccessibilityStatus();
		if (!accessibilityPermission.success) {
			return false;
		}

		if (accessibilityPermission.trusted) {
			return true;
		}

		const requestedAccessibility = await this.permissionsPort.requestAccessibilityPermission();
		if (requestedAccessibility.success && requestedAccessibility.trusted) {
			return true;
		}

		await this.permissionsPort.openAccessibilityPreferences();
		alert(
			options.startup
				? "Recordly also needs Accessibility permission for cursor tracking. System Settings has been opened. After enabling it, quit and reopen Recordly."
				: "Accessibility permission is still missing. System Settings has been opened again. Enable it, then quit and reopen Recordly before recording.",
		);

		return false;
	}
}
