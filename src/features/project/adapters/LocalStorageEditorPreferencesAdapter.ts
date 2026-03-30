import {
	DEFAULT_EDITOR_PREFERENCES,
	EDITOR_PREFERENCES_STORAGE_KEY,
	EditorPreferences,
	normalizeEditorPreferences,
} from "../domain/entities/EditorPreferences";
import { EditorPreferencesPort } from "../domain/ports/EditorPreferencesPort";

export class LocalStorageEditorPreferencesAdapter implements EditorPreferencesPort {
	load(): EditorPreferences {
		if (typeof globalThis.localStorage === "undefined") {
			return DEFAULT_EDITOR_PREFERENCES;
		}

		try {
			const stored = globalThis.localStorage.getItem(EDITOR_PREFERENCES_STORAGE_KEY);
			if (!stored) {
				return DEFAULT_EDITOR_PREFERENCES;
			}

			return normalizeEditorPreferences(JSON.parse(stored));
		} catch {
			return DEFAULT_EDITOR_PREFERENCES;
		}
	}

	save(preferences: Partial<EditorPreferences>): void {
		if (typeof globalThis.localStorage === "undefined") {
			return;
		}

		try {
			const current = this.load();
			const merged = normalizeEditorPreferences({ ...current, ...preferences }, current);
			globalThis.localStorage.setItem(EDITOR_PREFERENCES_STORAGE_KEY, JSON.stringify(merged));
		} catch {
			// Ignore storage failures
		}
	}
}
