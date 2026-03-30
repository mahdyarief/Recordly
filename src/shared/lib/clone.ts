export function cloneStructured<T>(value: T): T {
	try {
		return JSON.parse(JSON.stringify(value));
	} catch (e) {
		console.error("Failed to clone object:", e);
		return value;
	}
}
