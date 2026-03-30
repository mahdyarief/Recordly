import fs from "node:fs/promises";
import { ipcMain } from "electron";
import { closeCountdownWindow, createCountdownWindow, getCountdownWindow } from "../../windows";
import { state } from "../state";
import { COUNTDOWN_SETTINGS_FILE } from "../utils";

export function registerCountdownHandlers() {
	ipcMain.handle("get-countdown-delay", async () => {
		try {
			const content = await fs.readFile(COUNTDOWN_SETTINGS_FILE, "utf-8");
			const parsed = JSON.parse(content) as { delay?: number };
			return { success: true, delay: parsed.delay ?? 3 };
		} catch {
			return { success: true, delay: 3 };
		}
	});

	ipcMain.handle("set-countdown-delay", async (_, delay: number) => {
		try {
			await fs.writeFile(COUNTDOWN_SETTINGS_FILE, JSON.stringify({ delay }, null, 2), "utf-8");
			return { success: true };
		} catch (error) {
			console.error("Failed to save countdown delay:", error);
			return { success: false, error: String(error) };
		}
	});

	ipcMain.handle("start-countdown", async (_, seconds: number) => {
		if (state.countdownInProgress) {
			return { success: false, error: "Countdown already in progress" };
		}

		state.countdownInProgress = true;
		state.countdownCancelled = false;
		state.countdownRemaining = seconds;

		const countdownWin = createCountdownWindow();

		if (countdownWin.webContents.isLoadingMainFrame()) {
			await new Promise<void>((resolve) => {
				countdownWin.webContents.once("did-finish-load", () => {
					resolve();
				});
			});
		}

		return new Promise<{ success: boolean; cancelled?: boolean }>((resolve) => {
			let remaining = seconds;
			state.countdownRemaining = remaining;

			countdownWin.webContents.send("countdown-tick", remaining);

			state.countdownTimer = setInterval(() => {
				if (state.countdownCancelled) {
					if (state.countdownTimer) {
						clearInterval(state.countdownTimer);
						state.countdownTimer = null;
					}
					closeCountdownWindow();
					state.countdownInProgress = false;
					state.countdownRemaining = null;
					resolve({ success: false, cancelled: true });
					return;
				}

				remaining--;
				state.countdownRemaining = remaining;

				if (remaining <= 0) {
					if (state.countdownTimer) {
						clearInterval(state.countdownTimer);
						state.countdownTimer = null;
					}
					closeCountdownWindow();
					state.countdownInProgress = false;
					state.countdownRemaining = null;
					resolve({ success: true });
				} else {
					const win = getCountdownWindow();
					if (win && !win.isDestroyed()) {
						win.webContents.send("countdown-tick", remaining);
					}
				}
			}, 1000);
		});
	});

	ipcMain.handle("cancel-countdown", () => {
		state.countdownCancelled = true;
		state.countdownInProgress = false;
		state.countdownRemaining = null;
		if (state.countdownTimer) {
			clearInterval(state.countdownTimer);
			state.countdownTimer = null;
		}
		closeCountdownWindow();
		return { success: true };
	});

	ipcMain.handle("get-active-countdown", () => {
		return {
			success: true,
			seconds: state.countdownInProgress ? state.countdownRemaining : null,
		};
	});
}
