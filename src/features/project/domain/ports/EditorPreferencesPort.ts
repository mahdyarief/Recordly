import { EditorPreferences } from "../entities/EditorPreferences";

export interface EditorPreferencesPort {
	load(): EditorPreferences;
	save(preferences: Partial<EditorPreferences>): void;
}
