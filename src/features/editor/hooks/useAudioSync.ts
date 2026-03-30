import { useEffect, useRef } from "react";
import { toFileUrl } from "@/shared/lib/fileUrl";
import { type AudioRegion } from "../components/VideoEditor/types";

interface UseAudioSyncProps {
	audioRegions: AudioRegion[];
	previewVolume: number;
	masterAudioVolume: number;
	audioTrackVolume: number;
	masterAudioSoloed: boolean;
	isPlaying: boolean;
	currentTime: number;
	isAudioEngineReady: boolean;
	audioContextRef: React.RefObject<AudioContext | null>;
	masterGainRef: React.RefObject<GainNode | null>;
}

export function useAudioSync({
	audioRegions,
	previewVolume,
	masterAudioVolume,
	audioTrackVolume,
	masterAudioSoloed,
	isPlaying,
	currentTime,
	isAudioEngineReady,
	audioContextRef,
	masterGainRef,
}: UseAudioSyncProps) {
	const audioElementsRef = useRef<Map<string, HTMLAudioElement>>(new Map());
	const audioRegionNodesRef = useRef<
		Map<string, { source: AudioNode; gain: GainNode; fadeInMs: number; fadeOutMs: number }>
	>(new Map());

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			audioElementsRef.current.forEach((audio) => {
				audio.pause();
				audio.src = "";
			});
			audioElementsRef.current.clear();

			audioRegionNodesRef.current.forEach((node) => {
				try {
					node.source.disconnect();
					node.gain.disconnect();
				} catch (e) {
					/* ignore */
				}
			});
			audioRegionNodesRef.current.clear();
		};
	}, []);

	// Manage Audio elements and AudioContext routing
	useEffect(() => {
		const existing = audioElementsRef.current;
		const unused = new Set(existing.keys());

		const hasAudioContext = !!(
			audioContextRef.current &&
			masterGainRef.current &&
			isAudioEngineReady
		);

		for (const region of audioRegions) {
			unused.delete(region.id);
			let audio = existing.get(region.id);
			if (!audio) {
				audio = new Audio();
				audio.crossOrigin = "anonymous";
				existing.set(region.id, audio);
			}
			const expectedSrc = toFileUrl(region.audioPath);
			if (audio.src !== expectedSrc) {
				audio.src = expectedSrc;
			}

			// Route through Web Audio API if ready
			if (hasAudioContext && !audioRegionNodesRef.current.has(region.id)) {
				try {
					const source = audioContextRef.current!.createMediaElementSource(audio);
					const gain = audioContextRef.current!.createGain();
					source.connect(gain);
					gain.connect(masterGainRef.current!);
					audioRegionNodesRef.current.set(region.id, {
						source,
						gain,
						fadeInMs: region.fadeInMs || 0,
						fadeOutMs: region.fadeOutMs || 0,
					});
					console.log(`[AudioSync] Audio region ${region.id} routed through GainNode`);
				} catch (e) {
					console.warn(`[AudioSync] Failed to route audio ${region.id}:`, e);
				}
			}

			// Update volume/gain
			const hasGlobalSolo = masterAudioSoloed || audioRegions.some((r) => r.soloed);
			let baseVolume = region.volume * audioTrackVolume * previewVolume * masterAudioVolume;
			if (region.muted || (hasGlobalSolo && !region.soloed)) {
				baseVolume = 0;
			}

			const nodeEntry = audioRegionNodesRef.current.get(region.id);
			if (nodeEntry) {
				audio.volume = 1;
				nodeEntry.gain.gain.setTargetAtTime(baseVolume, 0, 0.03);
			} else {
				audio.volume = Math.max(0, Math.min(1, baseVolume));
			}
		}

		// Cleanup unused
		for (const id of unused) {
			const audio = existing.get(id);
			if (audio) {
				audio.pause();
				audio.src = "";
			}
			existing.delete(id);

			const nodeEntry = audioRegionNodesRef.current.get(id);
			if (nodeEntry) {
				try {
					nodeEntry.source.disconnect();
					nodeEntry.gain.disconnect();
				} catch (e) {
					/* ignore */
				}
				audioRegionNodesRef.current.delete(id);
			}
		}
	}, [audioRegions, previewVolume, masterAudioVolume, audioTrackVolume, isAudioEngineReady]);

	// Sync with playback state
	useEffect(() => {
		for (const region of audioRegions) {
			const audio = audioElementsRef.current.get(region.id);
			if (!audio) continue;

			const currentTimeMs = currentTime * 1000;
			const isInRegion = currentTimeMs >= region.startMs && currentTimeMs < region.endMs;

			if (isPlaying && isInRegion) {
				// Calculate fade multiplier
				let fadeMultiplier = 1;
				if (region.fadeInMs && currentTimeMs < region.startMs + region.fadeInMs) {
					fadeMultiplier = (currentTimeMs - region.startMs) / region.fadeInMs;
				} else if (region.fadeOutMs && currentTimeMs > region.endMs - region.fadeOutMs) {
					fadeMultiplier = (region.endMs - currentTimeMs) / region.fadeOutMs;
				}
				fadeMultiplier = Math.max(0, Math.min(1, fadeMultiplier));

				const hasGlobalSolo = masterAudioSoloed || audioRegions.some((r) => r.soloed);
				let baseVolume = region.volume * audioTrackVolume * previewVolume * masterAudioVolume;
				if (region.muted || (hasGlobalSolo && !region.soloed)) {
					baseVolume = 0;
				}

				const targetVolume = baseVolume * fadeMultiplier;
				const nodeEntry = audioRegionNodesRef.current.get(region.id);

				if (nodeEntry) {
					nodeEntry.gain.gain.setTargetAtTime(targetVolume, 0, 0.03);
				} else {
					const fallbackValue = Math.max(0, Math.min(1, targetVolume));
					if (Math.abs(audio.volume - fallbackValue) > 0.01) {
						audio.volume = fallbackValue;
					}
				}

				const audioOffset = (currentTimeMs - region.startMs) / 1000;
				if (Math.abs(audio.currentTime - audioOffset) > 0.02) {
					audio.currentTime = audioOffset;
				}
				if (audio.paused) {
					audio.play().catch(() => undefined);
				}
			} else {
				if (!audio.paused) {
					audio.pause();
				}
			}
		}
	}, [isPlaying, currentTime, audioRegions, previewVolume, masterAudioVolume, audioTrackVolume]);

	return {
		audioElementsRef,
		audioRegionNodesRef,
	};
}
