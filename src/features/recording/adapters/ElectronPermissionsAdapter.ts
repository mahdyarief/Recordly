import type { PermissionStatus, PermissionsPort } from "../domain/ports/PermissionsPort";

export class ElectronPermissionsAdapter implements PermissionsPort {
	async getScreenRecordingStatus(): Promise<{ success: boolean; status: PermissionStatus }> {
		const result = await window.electronAPI.getScreenRecordingPermissionStatus();
		return {
			success: result.success,
			status: (result.status as PermissionStatus) ?? "undetermined",
		};
	}

	async openScreenRecordingPreferences(): Promise<void> {
		await window.electronAPI.openScreenRecordingPreferences();
	}

	async getAccessibilityStatus(): Promise<{ success: boolean; trusted: boolean }> {
		const result = await window.electronAPI.getAccessibilityPermissionStatus();
		return {
			success: result.success,
			trusted: !!result.trusted,
		};
	}

	async requestAccessibilityPermission(): Promise<{ success: boolean; trusted: boolean }> {
		const result = await window.electronAPI.requestAccessibilityPermission();
		return {
			success: result.success,
			trusted: !!result.trusted,
		};
	}

	async openAccessibilityPreferences(): Promise<void> {
		await window.electronAPI.openAccessibilityPreferences();
	}
}
