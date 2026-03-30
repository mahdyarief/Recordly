import { execFile, spawn } from "node:child_process";
import { createWriteStream, constants as fsConstants } from "node:fs";
import fs from "node:fs/promises";
import { get as httpsGet } from "node:https";
import path from "node:path";
import { promisify } from "node:util";
import { app, dialog, ipcMain } from "electron";
import { state } from "../state";
import {
	ensureReadableFile,
	getFfmpegBinaryPath,
	normalizeVideoSourcePath,
	resolveWhisperExecutablePath,
} from "../utils";

const execFileAsync = promisify(execFile);

// Shared constants that should come from utils or be redefined here
const USER_DATA_PATH = app.getPath("userData");
const WHISPER_MODEL_DIR = path.join(USER_DATA_PATH, "whisper");
const WHISPER_MODELS: Record<string, { filename: string; url: string }> = {
	tiny: {
		filename: "ggml-tiny.bin",
		url: "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-tiny.bin",
	},
	base: {
		filename: "ggml-base.bin",
		url: "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.bin",
	},
	small: {
		filename: "ggml-small.bin",
		url: "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small.bin",
	},
	medium: {
		filename: "ggml-medium.bin",
		url: "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-medium.bin",
	},
};

function safeSend(webContents: Electron.WebContents | undefined, channel: string, ...args: any[]) {
	if (webContents && !webContents.isDestroyed()) {
		webContents.send(channel, ...args);
	}
}

function runWhisperWithProgress(
	executablePath: string,
	args: string[],
	onProgress: (progress: number) => void,
): Promise<void> {
	return new Promise((resolve, reject) => {
		const proc = spawn(executablePath, args);
		let output = "";

		proc.stdout?.on("data", (data) => {
			output += data.toString();
		});

		proc.stderr?.on("data", (data) => {
			const text = data.toString();
			output += text;
			const match = text.match(/progress\s*=\s*(\d+)%/i);
			if (match) {
				onProgress(Number.parseInt(match[1], 10));
			}
		});

		proc.on("close", (code) => {
			if (code === 0) {
				resolve();
			} else {
				reject(new Error(output.trim() || `Whisper exited with code ${code}`));
			}
		});

		proc.on("error", (err) => {
			reject(err);
		});
	});
}

function sendWhisperModelDownloadProgress(
	webContents: Electron.WebContents,
	payload: {
		status: "idle" | "downloading" | "downloaded" | "error";
		progress: number;
		model?: string;
		path?: string | null;
		error?: string;
	},
) {
	if (!payload.model || payload.model === "small") {
		webContents.send("whisper-small-model-download-progress", payload);
	}
	if (payload.model) {
		webContents.send("whisper-model-download-progress", payload);
	}
}

function downloadFileWithProgress(
	url: string,
	destinationPath: string,
	onProgress: (progress: number) => void,
): Promise<void> {
	const request = (currentUrl: string, redirectCount = 0): Promise<void> => {
		return new Promise((resolve, reject) => {
			const req = httpsGet(currentUrl, (response) => {
				const statusCode = response.statusCode ?? 0;
				const location = response.headers.location;

				if (statusCode >= 300 && statusCode < 400 && location) {
					response.resume();
					if (redirectCount >= 5) {
						reject(new Error("Too many redirects while downloading Whisper model."));
						return;
					}

					const nextUrl = new URL(location, currentUrl).toString();
					void request(nextUrl, redirectCount + 1)
						.then(resolve)
						.catch(reject);
					return;
				}

				if (statusCode < 200 || statusCode >= 300) {
					response.resume();
					reject(new Error(`Whisper model download failed with status ${statusCode}.`));
					return;
				}

				const totalBytes = Number.parseInt(String(response.headers["content-length"] ?? "0"), 10);
				let downloadedBytes = 0;
				const fileStream = createWriteStream(destinationPath);

				response.on("data", (chunk: Buffer) => {
					downloadedBytes += chunk.length;
					if (Number.isFinite(totalBytes) && totalBytes > 0) {
						onProgress(Math.min(100, Math.round((downloadedBytes / totalBytes) * 100)));
					}
				});

				response.on("error", (error) => fileStream.destroy(error));

				fileStream.on("error", (error) => {
					response.destroy(error);
					reject(error);
				});

				fileStream.on("finish", () => {
					onProgress(100);
					resolve();
				});

				response.pipe(fileStream);
			});

			req.on("error", reject);
		});
	};
	return request(url);
}

function getWhisperModelPath(modelName: string) {
	const model = WHISPER_MODELS[modelName as keyof typeof WHISPER_MODELS];
	return path.join(WHISPER_MODEL_DIR, model?.filename || `ggml-${modelName}.bin`);
}

async function getWhisperModelStatus(_event: any, modelName: string) {
	try {
		const modelPath = getWhisperModelPath(modelName);
		await fs.access(modelPath, fsConstants.R_OK);
		return { success: true, exists: true, path: modelPath };
	} catch {
		return { success: true, exists: false, path: null };
	}
}

async function downloadWhisperModel(webContents: Electron.WebContents, modelName: string) {
	const model = WHISPER_MODELS[modelName as keyof typeof WHISPER_MODELS];
	if (!model) throw new Error(`Unsupported Whisper model: ${modelName}`);

	await fs.mkdir(WHISPER_MODEL_DIR, { recursive: true });
	const modelPath = getWhisperModelPath(modelName);
	const tempPath = `${modelPath}.download`;

	sendWhisperModelDownloadProgress(webContents, {
		status: "downloading",
		progress: 0,
		model: modelName,
		path: null,
	});

	try {
		await fs.rm(tempPath, { force: true }).catch(() => undefined);
		await downloadFileWithProgress(model.url, tempPath, (progress) => {
			sendWhisperModelDownloadProgress(webContents, {
				status: "downloading",
				progress,
				model: modelName,
				path: null,
			});
		});

		let renameRetries = 0;
		const maxRetries = 5;
		while (renameRetries < maxRetries) {
			try {
				await fs.rename(tempPath, modelPath);
				break;
			} catch (err) {
				renameRetries++;
				if (renameRetries >= maxRetries) throw err;
				await new Promise((resolve) => setTimeout(resolve, 100 * renameRetries));
			}
		}

		sendWhisperModelDownloadProgress(webContents, {
			status: "downloaded",
			progress: 100,
			model: modelName,
			path: modelPath,
		});
		return modelPath;
	} catch (error) {
		await fs.rm(tempPath, { force: true }).catch(() => undefined);
		sendWhisperModelDownloadProgress(webContents, {
			status: "error",
			progress: 0,
			model: modelName,
			path: null,
			error: String(error),
		});
		throw error;
	}
}

async function deleteWhisperModel(_event: any, modelName: string) {
	const modelPath = getWhisperModelPath(modelName);
	await fs.rm(modelPath, { force: true }).catch(() => undefined);
}

function parseSrtTimestamp(value: string) {
	const match = value.trim().match(/^(\d{2}):(\d{2}):(\d{2}),(\d{3})$/);
	if (!match) return null;
	const [, hours, minutes, seconds, milliseconds] = match;
	return (
		Number(hours) * 60 * 60 * 1000 +
		Number(minutes) * 60 * 1000 +
		Number(seconds) * 1000 +
		Number(milliseconds)
	);
}

type CaptionWordPayload = { text: string; startMs: number; endMs: number; leadingSpace?: boolean };
type CaptionCuePayload = {
	id: string;
	startMs: number;
	endMs: number;
	text: string;
	words?: CaptionWordPayload[];
};
type WhisperJsonToken = { text?: unknown; offsets?: { from?: unknown; to?: unknown } };
type WhisperJsonSegment = {
	text?: unknown;
	offsets?: { from?: unknown; to?: unknown };
	tokens?: unknown;
};

function isFiniteNumber(value: unknown): value is number {
	return typeof value === "number" && Number.isFinite(value);
}

function buildCaptionTextFromWords(words: CaptionWordPayload[]) {
	return words
		.map((word, index) => `${index > 0 && word.leadingSpace ? " " : ""}${word.text}`)
		.join("")
		.trim();
}

function parseWhisperJsonWords(tokens: unknown) {
	if (!Array.isArray(tokens)) return [];
	const words: CaptionWordPayload[] = [];
	let nextLeadingSpace = false;

	for (const token of tokens) {
		if (!token || typeof token !== "object") continue;
		const tokenData = token as WhisperJsonToken;
		const tokenText = typeof tokenData.text === "string" ? tokenData.text : "";
		if (!tokenText) continue;

		const tokenStartMs = isFiniteNumber(tokenData.offsets?.from)
			? Math.round(tokenData.offsets.from)
			: null;
		const tokenEndMs = isFiniteNumber(tokenData.offsets?.to)
			? Math.round(tokenData.offsets.to)
			: null;
		const parts = tokenText.match(/\s+|[^\s]+/g) ?? [];

		for (const part of parts) {
			if (/^\s+$/.test(part)) {
				nextLeadingSpace = words.length > 0;
				continue;
			}
			if (tokenStartMs == null || tokenEndMs == null || tokenEndMs <= tokenStartMs) return [];

			const previousWord = words.length > 0 ? words[words.length - 1] : null;
			if (!previousWord || nextLeadingSpace) {
				words.push({
					text: part,
					startMs: tokenStartMs,
					endMs: tokenEndMs,
					...(words.length > 0 && nextLeadingSpace ? { leadingSpace: true } : {}),
				});
			} else {
				previousWord.text += part;
				previousWord.endMs = Math.max(previousWord.endMs, tokenEndMs);
			}
			nextLeadingSpace = false;
		}
	}
	return words.filter((word) => word.text.trim().length > 0);
}

function parseWhisperJsonCues(content: string) {
	try {
		const parsed = JSON.parse(content) as { transcription?: unknown };
		if (!Array.isArray(parsed.transcription)) return [];

		return parsed.transcription
			.map((segment, index) => {
				if (!segment || typeof segment !== "object") return null;
				const segmentData = segment as WhisperJsonSegment;
				const startMs = isFiniteNumber(segmentData.offsets?.from)
					? Math.round(segmentData.offsets.from)
					: null;
				const endMs = isFiniteNumber(segmentData.offsets?.to)
					? Math.round(segmentData.offsets.to)
					: null;
				const segmentText = typeof segmentData.text === "string" ? segmentData.text.trim() : "";

				if (startMs == null || endMs == null || endMs <= startMs) return null;

				const words = parseWhisperJsonWords(segmentData.tokens);
				const text = words.length > 0 ? buildCaptionTextFromWords(words) : segmentText;

				if (!text) return null;
				return {
					id: `caption-${index + 1}`,
					startMs,
					endMs,
					text,
					...(words.length > 0 ? { words } : {}),
				};
			})
			.filter((cue): cue is CaptionCuePayload => cue != null);
	} catch (error) {
		console.warn("[auto-captions] Failed to parse Whisper JSON output:", error);
		return [];
	}
}

function parseSrtCues(content: string) {
	return content
		.split(/\r?\n\r?\n/)
		.map((block, index) => {
			const lines = block.split(/\r?\n/).map((line) => line.trim());
			const timingLine = lines.find((line) => line.includes("-->"));
			if (!timingLine) return null;

			const [rawStart, rawEnd] = timingLine.split("-->").map((part) => part.trim());
			const startMs = parseSrtTimestamp(rawStart);
			const endMs = parseSrtTimestamp(rawEnd);
			if (startMs == null || endMs == null || endMs <= startMs) return null;

			const text = lines
				.slice(lines.indexOf(timingLine) + 1)
				.filter((line) => line.length > 0)
				.join("\n")
				.trim();
			if (!text) return null;
			return { id: `caption-${index + 1}`, startMs, endMs, text };
		})
		.filter((cue): cue is CaptionCuePayload => cue != null);
}

function shouldRetryWhisperWithoutJson(error: unknown) {
	const message = error instanceof Error ? error.message : String(error);
	return /unknown argument|output-json-full|output-json|ojf|\boj\b/i.test(message);
}

async function resolveCaptionAudioCandidates(videoPath: string) {
	const candidates: Array<{ path: string; label: string }> = [];
	const seenPaths = new Set<string>();

	const pushCandidate = (candidatePath: string | null | undefined, label: string) => {
		const normalizedCandidatePath = normalizeVideoSourcePath(candidatePath);
		if (!normalizedCandidatePath || seenPaths.has(normalizedCandidatePath)) return;
		seenPaths.add(normalizedCandidatePath);
		candidates.push({ path: normalizedCandidatePath, label });
	};

	pushCandidate(videoPath, "recording");
	pushCandidate(state.currentRecordingSession?.webcamPath, "linked webcam recording");
	return candidates;
}

async function extractCaptionAudioSource(options: {
	videoPath: string;
	ffmpegPath: string;
	wavPath: string;
	startTime?: number;
	duration?: number;
}) {
	const candidates = await resolveCaptionAudioCandidates(options.videoPath);
	const attemptedCandidates: Array<{
		path: string;
		label: string;
		readable: boolean;
		extractedAudio: boolean;
		error?: string;
	}> = [];

	for (const candidate of candidates) {
		try {
			await ensureReadableFile(candidate.path, "video file");
			console.log(
				"[auto-captions] Extracting audio from:",
				path.basename(candidate.path),
				options.startTime ? `at ${options.startTime}s` : "",
			);

			const ffmpegArgs = ["-y"];
			if (options.startTime !== undefined) ffmpegArgs.push("-ss", options.startTime.toString());
			if (options.duration !== undefined) ffmpegArgs.push("-t", options.duration.toString());
			ffmpegArgs.push(
				"-i",
				candidate.path,
				"-map",
				"0:a:0",
				"-vn",
				"-ac",
				"1",
				"-ar",
				"16000",
				"-c:a",
				"pcm_s16le",
				options.wavPath,
			);

			await execFileAsync(options.ffmpegPath, ffmpegArgs, {
				timeout: 5 * 60 * 1000,
				maxBuffer: 20 * 1024 * 1024,
			});
			console.log("[auto-captions] Audio extracted successfully to temporary workspace");
			attemptedCandidates.push({ ...candidate, readable: true, extractedAudio: true });
			return candidate;
		} catch (error) {
			attemptedCandidates.push({
				...candidate,
				readable: true,
				extractedAudio: false,
				error: error instanceof Error ? error.message : String(error),
			});
		}
	}

	console.warn(
		"[auto-captions] No audio source candidate could be extracted:",
		attemptedCandidates,
	);
	throw new Error(
		"No audio was found to transcribe in the saved recording file. Captions need an audio track.",
	);
}

async function generateAutoCaptionsFromVideo(
	webContents: Electron.WebContents,
	options: {
		videoPath: string;
		whisperExecutablePath?: string;
		whisperModelPath: string;
		language?: string;
		durationMs?: number;
		startTimeMs?: number;
	},
) {
	const ffmpegPath = getFfmpegBinaryPath();
	const normalizedVideoPath = normalizeVideoSourcePath(options.videoPath);
	if (!normalizedVideoPath) throw new Error("Missing source video path.");

	const whisperExecutablePath = await resolveWhisperExecutablePath(options.whisperExecutablePath);
	const whisperModelPath = path.resolve(options.whisperModelPath);
	await ensureReadableFile(whisperExecutablePath, "whisper executable");
	await ensureReadableFile(whisperModelPath, "whisper model");

	const CHUNK_SIZE_MS = 5 * 60 * 1000;
	const OVERLAP_MS = 10 * 1000;
	const startTimeMs = options.startTimeMs || 0;
	const totalDurationMs = options.durationMs || 0;
	const endTimeMs = totalDurationMs > 0 ? startTimeMs + totalDurationMs : Number.POSITIVE_INFINITY;

	console.log(
		"[auto-captions] Starting segmented caption generation sequence\n[auto-captions] Video:",
		path.basename(normalizedVideoPath),
	);

	const allCues: any[] = [];
	let audioSourceLabel = "Unknown";

	for (let offsetMs = startTimeMs; offsetMs < endTimeMs; offsetMs += CHUNK_SIZE_MS) {
		const chunkIndex = Math.floor((offsetMs - startTimeMs) / CHUNK_SIZE_MS);
		const tempBase = path.join(
			app.getPath("temp"),
			`recordly-captions-chunk-${chunkIndex}-${Date.now()}`,
		);
		const wavPath = `${tempBase}.wav`;
		const outputBase = `${tempBase}-whisper`;
		const srtPath = `${outputBase}.srt`;
		const jsonPath = `${outputBase}.json`;

		try {
			const audioSource = await extractCaptionAudioSource({
				videoPath: normalizedVideoPath,
				ffmpegPath,
				wavPath,
				startTime: offsetMs / 1000,
				duration: (CHUNK_SIZE_MS + OVERLAP_MS) / 1000,
			});
			audioSourceLabel = audioSource.label;

			const language =
				options.language && options.language.trim() ? options.language.trim() : "auto";
			const whisperBaseArgs = [
				"-m",
				whisperModelPath,
				"-f",
				wavPath,
				"-osrt",
				"-of",
				outputBase,
				"-l",
				language,
				"-np",
			];

			let jsonEnabled = true;
			const updateChunkProgress = (progress: number) => {
				if (totalDurationMs > 0) {
					const totalRangeMs = totalDurationMs > 0 ? totalDurationMs : 1;
					const rangeOffsetMs = offsetMs - startTimeMs;
					const totalProgress =
						(rangeOffsetMs / totalRangeMs) * 100 + progress / (totalRangeMs / CHUNK_SIZE_MS);
					safeSend(webContents, "auto-caption-progress", { progress: Math.min(99, totalProgress) });
				} else {
					safeSend(webContents, "auto-caption-progress", { progress });
				}
			};

			try {
				await runWhisperWithProgress(
					whisperExecutablePath,
					[...whisperBaseArgs, "-ojf"],
					updateChunkProgress,
				);
			} catch (error) {
				if (!shouldRetryWhisperWithoutJson(error)) throw error;
				jsonEnabled = false;
				console.warn(`[auto-captions] Whisper runtime error, retrying with SRT: ${error}`);
				await runWhisperWithProgress(whisperExecutablePath, whisperBaseArgs, updateChunkProgress);
			}

			let cues = jsonEnabled
				? parseWhisperJsonCues(await fs.readFile(jsonPath, "utf-8"))
				: parseSrtCues(await fs.readFile(srtPath, "utf-8"));
			if (cues.length === 0 && !jsonEnabled) {
				try {
					cues = parseSrtCues(await fs.readFile(srtPath, "utf-8"));
				} catch {
					/* ignore */
				}
			}

			const adjustedCues = cues
				.map((cue: any, idx: number) => ({
					...cue,
					id: `caption-${offsetMs}-${idx}`,
					startMs: cue.startMs + offsetMs,
					endMs: cue.endMs + offsetMs,
				}))
				.filter((cue: any) => {
					const isLastChunk = offsetMs + CHUNK_SIZE_MS >= endTimeMs;
					if (isLastChunk) return true;
					return cue.startMs < offsetMs + CHUNK_SIZE_MS;
				});

			if (adjustedCues.length > 0) {
				allCues.push(...adjustedCues);
				safeSend(webContents, "auto-caption-chunk", { cues: adjustedCues });
			}

			const stats = await fs.stat(wavPath).catch(() => null);
			if (stats && stats.size < 1000) break;
			if (offsetMs + CHUNK_SIZE_MS >= endTimeMs) break;
		} finally {
			await Promise.allSettled([
				fs.rm(wavPath, { force: true }),
				fs.rm(srtPath, { force: true }),
				fs.rm(jsonPath, { force: true }),
			]);
		}
	}

	safeSend(webContents, "auto-caption-progress", { progress: 100 });
	return { cues: allCues, audioSourceLabel };
}

export function registerCaptionHandlers() {
	ipcMain.handle("open-whisper-executable-picker", async () => {
		try {
			const result = await dialog.showOpenDialog({
				title: "Select Whisper Executable",
				filters: [
					{
						name: "Executables",
						extensions: process.platform === "win32" ? ["exe", "cmd", "bat"] : ["*"],
					},
					{ name: "All Files", extensions: ["*"] },
				],
				properties: ["openFile"],
			});
			if (result.canceled || result.filePaths.length === 0)
				return { success: false, canceled: true };
			return { success: true, path: result.filePaths[0] };
		} catch (error) {
			return { success: false, error: String(error) };
		}
	});

	ipcMain.handle("open-whisper-model-picker", async () => {
		try {
			const result = await dialog.showOpenDialog({
				title: "Select Whisper Model",
				filters: [
					{ name: "Whisper Models", extensions: ["bin"] },
					{ name: "All Files", extensions: ["*"] },
				],
				properties: ["openFile"],
			});
			if (result.canceled || result.filePaths.length === 0)
				return { success: false, canceled: true };
			return { success: true, path: result.filePaths[0] };
		} catch (error) {
			return { success: false, error: String(error) };
		}
	});

	ipcMain.handle("get-whisper-model-status", async (event, modelName: string) => {
		return await getWhisperModelStatus(event, modelName);
	});

	ipcMain.handle("download-whisper-model", async (event, modelName: string) => {
		return await downloadWhisperModel(event.sender, modelName);
	});

	ipcMain.handle("delete-whisper-model", async (event, modelName: string) => {
		try {
			await deleteWhisperModel(event, modelName);
			return { success: true };
		} catch (error) {
			return { success: false, error: String(error) };
		}
	});

	ipcMain.handle("get-whisper-small-model-status", async () => {
		try {
			return await getWhisperModelStatus(null, "small");
		} catch (error) {
			return { success: false, exists: false, path: null, error: String(error) };
		}
	});

	ipcMain.handle("download-whisper-small-model", async (event) => {
		try {
			return await downloadWhisperModel(event.sender, "small");
		} catch (error) {
			return { success: false, error: String(error) };
		}
	});

	ipcMain.handle("delete-whisper-small-model", async (event) => {
		try {
			await deleteWhisperModel(event, "small");
			return { success: true };
		} catch (error) {
			return { success: false, error: String(error) };
		}
	});

	ipcMain.handle("generate-auto-captions", async (event, options: any) => {
		try {
			const result = await generateAutoCaptionsFromVideo(event.sender, options);
			return {
				success: true,
				cues: result.cues,
				message:
					result.audioSourceLabel === "recording"
						? `Generated ${result.cues.length} caption cues.`
						: `Generated ${result.cues.length} caption cues from the ${result.audioSourceLabel}.`,
			};
		} catch (error) {
			console.error("Failed to generate auto captions:", error);
			return { success: false, error: String(error), message: "Failed to generate auto captions" };
		}
	});
}
