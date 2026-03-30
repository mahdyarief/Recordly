export type PermissionStatus = "granted" | "denied" | "undetermined";

export interface PermissionsPort {
	getScreenRecordingStatus(): Promise<{ success: boolean; status: PermissionStatus }>;
	openScreenRecordingPreferences(): Promise<void>;
	getAccessibilityStatus(): Promise<{ success: boolean; trusted: boolean }>;
	requestAccessibilityPermission(): Promise<{ success: boolean; trusted: boolean }>;
	openAccessibilityPreferences(): Promise<void>;
}
