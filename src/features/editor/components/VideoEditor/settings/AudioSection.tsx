import { Music } from "lucide-react";
import { AudioSettingsPanel } from "../../panels/AudioSettingsPanel";
import { type AudioRegion, type SettingsPanelProps } from "../types";

export function AudioSection({ props }: { props: SettingsPanelProps }) {
	const {
		audioRegions,
		selectedAudioId,
		onAudioVolumeChange,
		onAudioMutedChange,
		onAudioSoloedChange,
		onAudioFadeInMsChange,
		onAudioFadeOutMsChange,
		onAudioDelete,
		isMasterSelected,
		videoDuration,
		videoPath,
		masterAudioVolume = 1,
		masterAudioMuted = false,
		masterAudioSoloed = false,
		onMasterAudioVolumeChange,
		onMasterAudioMutedChange,
		onMasterAudioSoloedChange,
	} = props;

	const selectedAudio = audioRegions?.find((a: AudioRegion) => a.id === selectedAudioId);
	if (selectedAudio) {
		return (
			<AudioSettingsPanel
				audio={selectedAudio}
				onVolumeChange={(volume: number) => onAudioVolumeChange?.(selectedAudio.id, volume)}
				onMutedChange={(muted: boolean) => onAudioMutedChange?.(selectedAudio.id, muted)}
				onSoloedChange={(soloed: boolean) => onAudioSoloedChange?.(selectedAudio.id, soloed)}
				onFadeInMsChange={(ms: number) => onAudioFadeInMsChange?.(selectedAudio.id, ms)}
				onFadeOutMsChange={(ms: number) => onAudioFadeOutMsChange?.(selectedAudio.id, ms)}
				onDelete={() => onAudioDelete?.(selectedAudio.id)}
			/>
		);
	}

	if (isMasterSelected) {
		const masterAudioMock: AudioRegion = {
			id: "master",
			startMs: 0,
			endMs: (videoDuration || 0) * 1000,
			volume: masterAudioVolume,
			muted: masterAudioMuted,
			soloed: masterAudioSoloed,
			audioPath: videoPath || "",
			fadeInMs: 0,
			fadeOutMs: 0,
		};
		return (
			<AudioSettingsPanel
				audio={masterAudioMock}
				onVolumeChange={
					onMasterAudioVolumeChange ||
					(() => {
						/* no-op */
					})
				}
				onMutedChange={
					onMasterAudioMutedChange ||
					(() => {
						/* no-op */
					})
				}
				onSoloedChange={
					onMasterAudioSoloedChange ||
					(() => {
						/* no-op */
					})
				}
				onFadeInMsChange={() => {
					/* no-op */
				}}
				onFadeOutMsChange={() => {
					/* no-op */
				}}
				onDelete={() => {
					/* no-op */
				}}
			/>
		);
	}

	return (
		<div className="flex flex-col items-center justify-center h-full text-slate-500 gap-2 py-12">
			<Music className="w-8 h-8 opacity-20" />
			<p className="text-xs">Select an audio region to edit its settings</p>
		</div>
	);
}
