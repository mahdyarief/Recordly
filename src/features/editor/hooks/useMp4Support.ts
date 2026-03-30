import { useCallback, useEffect, useMemo, useRef } from "react";
import {
	DEFAULT_MP4_CODEC,
	getSourceQualityBitrate,
	probeSupportedMp4Dimensions,
} from "@/features/exporter";
import { getAspectRatioValue } from "@/shared/lib/aspectRatio";
import { useEditorContext } from "../context/EditorContext";

const MP4_EXPORT_FRAME_RATE = 30;

export function useMp4Support() {
	const { state, videoPlaybackRef, supportedMp4SourceDimensions, setSupportedMp4SourceDimensions } =
		useEditorContext();
	const { aspectRatio } = state;

	const mp4SupportRequestRef = useRef(0);

	const desiredMp4SourceDimensions = useMemo(() => {
		const video = videoPlaybackRef.current?.video;
		if (aspectRatio === "native") {
			return {
				width: video?.videoWidth || 1920,
				height: video?.videoHeight || 1080,
			};
		}
		const value = getAspectRatioValue(aspectRatio);
		const baseSize = Math.max(video?.videoWidth || 1920, video?.videoHeight || 1080);

		// Target at least 1080p-equivalent area but match requested ratio
		if (value >= 1) {
			return { width: baseSize, height: Math.round(baseSize / value) };
		}
		return { width: Math.round(baseSize * value), height: baseSize };
	}, [
		aspectRatio,
		videoPlaybackRef.current?.video?.videoWidth,
		videoPlaybackRef.current?.video?.videoHeight,
	]);

	const ensureSupportedMp4SourceDimensions = useCallback(async () => {
		const result = await probeSupportedMp4Dimensions({
			width: desiredMp4SourceDimensions.width,
			height: desiredMp4SourceDimensions.height,
			frameRate: MP4_EXPORT_FRAME_RATE,
			codec: DEFAULT_MP4_CODEC,
			getBitrate: getSourceQualityBitrate,
		});

		if (!result.encoderPath) {
			throw new Error(
				`Video encoding not supported on this system. Tried codec ${DEFAULT_MP4_CODEC} at up to ${desiredMp4SourceDimensions.width}x${desiredMp4SourceDimensions.height}.`,
			);
		}

		setSupportedMp4SourceDimensions((current: any) => {
			if (
				current.width === result.width &&
				current.height === result.height &&
				current.capped === result.capped &&
				current.encoderPath?.codec === result.encoderPath?.codec &&
				current.encoderPath?.hardwareAcceleration === result.encoderPath?.hardwareAcceleration
			) {
				return current;
			}

			return result;
		});

		return result;
	}, [
		desiredMp4SourceDimensions.height,
		desiredMp4SourceDimensions.width,
		setSupportedMp4SourceDimensions,
	]);

	useEffect(() => {
		if (desiredMp4SourceDimensions.width === 0) return;

		let cancelled = false;
		const requestId = mp4SupportRequestRef.current + 1;
		mp4SupportRequestRef.current = requestId;

		void ensureSupportedMp4SourceDimensions().catch((err) => {
			if (!cancelled) console.error("Failed to ensure MP4 support:", err);
		});

		return () => {
			cancelled = true;
		};
	}, [desiredMp4SourceDimensions, ensureSupportedMp4SourceDimensions]);

	return {
		desiredMp4SourceDimensions,
		supportedMp4SourceDimensions,
		ensureSupportedMp4SourceDimensions,
	};
}
