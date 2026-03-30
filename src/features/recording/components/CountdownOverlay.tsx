import { useCallback, useEffect, useRef, useState } from "react";
import { ElectronCountdownAdapter } from "../adapters/ElectronCountdownAdapter";

export function CountdownOverlay() {
	const countdownAdapter = useRef(new ElectronCountdownAdapter());
	const [countdown, setCountdown] = useState<number | null>(null);

	useEffect(() => {
		void countdownAdapter.current.getActiveCountdown().then((result) => {
			if (result.success && typeof result.seconds === "number") {
				setCountdown(result.seconds);
			}
		});

		const cleanup = countdownAdapter.current.onCountdownTick?.((seconds: number) => {
			setCountdown(seconds);
		});

		return cleanup;
	}, []);

	const handleCancel = useCallback(() => {
		void countdownAdapter.current.cancelCountdown();
	}, []);

	const handleKeyDown = useCallback(
		(event: KeyboardEvent) => {
			if (event.key === "Escape") {
				handleCancel();
			}
		},
		[handleCancel],
	);

	useEffect(() => {
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [handleKeyDown]);

	if (countdown === null) {
		return null;
	}

	return (
		<div
			className="fixed inset-0 flex items-center justify-center select-none cursor-pointer"
			onClick={handleCancel}
			style={{ zIndex: 9999 }}
		>
			<div
				className="flex items-center justify-center rounded-3xl"
				style={{
					width: 180,
					height: 180,
					background: "rgba(0, 0, 0, 0.85)",
					backdropFilter: "blur(20px)",
				}}
			>
				<span
					className="text-white font-bold tabular-nums"
					style={{
						fontSize: "100px",
						lineHeight: 1,
						textShadow: "0 0 30px rgba(255,255,255,0.2)",
					}}
				>
					{countdown}
				</span>
			</div>
		</div>
	);
}
