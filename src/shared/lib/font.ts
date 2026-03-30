export function getDefaultCaptionFontFamily() {
	if (typeof navigator !== "undefined" && /mac/i.test(navigator.platform)) {
		return '"SF Pro Text", "SF Pro Display", -apple-system, BlinkMacSystemFont, sans-serif';
	}

	return '"Helvetica Neue", Helvetica, Arial, sans-serif';
}
