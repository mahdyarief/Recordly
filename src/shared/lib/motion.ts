/**
 * Shared motion configurations for standard Recordly animations.
 * Using motion (formerly framer-motion) for high-performance transitions.
 */

export const SPRINGS = {
	gentle: { type: "spring", stiffness: 100, damping: 20, mass: 1 },
	snappy: { type: "spring", stiffness: 300, damping: 25, mass: 0.8 },
	bouncy: { type: "spring", stiffness: 400, damping: 12, mass: 1 },
	tight: { type: "spring", stiffness: 500, damping: 40, mass: 1 },
} as const;

export const TRANSITIONS = {
	default: { duration: 0.2, ease: "easeOut" },
	smooth: { duration: 0.3, ease: [0.22, 1, 0.36, 1] }, // Cubic-Bezier
	delayed: { duration: 0.3, ease: "easeOut", delay: 0.1 },
} as const;

export const VARIANTS = {
	fadeInScale: {
		initial: { opacity: 0, scale: 0.96, filter: "blur(4px)" },
		animate: { opacity: 1, scale: 1, filter: "blur(0px)" },
		exit: { opacity: 0, scale: 0.96, filter: "blur(4px)" },
	},
	slideUp: {
		initial: { opacity: 0, y: 10 },
		animate: { opacity: 1, y: 0 },
		exit: { opacity: 0, y: -10 },
	},
	list: {
		container: {
			animate: { transition: { staggerChildren: 0.05 } },
		},
		item: {
			initial: { opacity: 0, y: 5 },
			animate: { opacity: 1, y: 0 },
		},
	},
} as const;
