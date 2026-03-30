import { LocalStorageEditorPreferencesAdapter } from "@/features/project/adapters/LocalStorageEditorPreferencesAdapter";
import {
	DEFAULT_EDITOR_PREFERENCES as DEFAULT,
	EDITOR_PREFERENCES_STORAGE_KEY as KEY,
	normalizeEditorPreferences as normalize,
	EditorPreferences as Preferences,
} from "@/features/project/domain/entities/EditorPreferences";

export type EditorPreferences = Preferences;
export const DEFAULT_EDITOR_PREFERENCES = DEFAULT;
export const EDITOR_PREFERENCES_STORAGE_KEY = KEY;
export const normalizeEditorPreferences = normalize;

const adapter = new LocalStorageEditorPreferencesAdapter();

export function loadEditorPreferences(): EditorPreferences {
	return adapter.load();
}

export function saveEditorPreferences(preferences: Partial<EditorPreferences>): void {
	adapter.save(preferences);
}
