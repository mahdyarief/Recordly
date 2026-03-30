import { useMemo } from "react";
import { AnnotationSettingsPanel } from "../panels/AnnotationSettingsPanel";
import { CaptionSettingsPanel } from "../panels/CaptionSettingsPanel";
import { AudioSection } from "./settings/AudioSection";
import { CursorSection } from "./settings/CursorSection";
import { SceneSection } from "./settings/SceneSection";
import { WebcamSection } from "./settings/WebcamSection";
import { type SettingsPanelProps } from "./types";

export function SettingsPanel(props: SettingsPanelProps) {
	const {
		panelMode = "editor",
		activeEffectSection = "scene",
		selectedAnnotationId,
		annotationRegions = [],
		onAnnotationContentChange,
		onAnnotationTypeChange,
		onAnnotationStyleChange,
		onAnnotationDelete,
	} = props;

	const isBackgroundPanel = panelMode === "background";
	const selectedAnnotation = useMemo(
		() =>
			selectedAnnotationId ? annotationRegions.find((a) => a.id === selectedAnnotationId) : null,
		[selectedAnnotationId, annotationRegions],
	);

	// Annotation Overlay Override
	if (!isBackgroundPanel && selectedAnnotation && onAnnotationContentChange) {
		return (
			<AnnotationSettingsPanel
				selectedAnnotation={selectedAnnotation}
				onAnnotationContentChange={(id: string, content: string) =>
					onAnnotationContentChange?.(id, content)
				}
				onAnnotationTypeChange={(id: string, type: string) =>
					onAnnotationTypeChange?.(id, type as any)
				}
				onAnnotationStyleChange={(id: string, style: object) =>
					onAnnotationStyleChange?.(id, style as any)
				}
				onAnnotationDelete={(id: string) => onAnnotationDelete?.(id)}
			/>
		);
	}

	const renderSection = () => {
		switch (activeEffectSection) {
			case "scene":
				return <SceneSection props={props} />;
			case "cursor":
				return <CursorSection props={props} />;
			case "webcam":
				return <WebcamSection props={props} />;
			case "audio":
				return <AudioSection props={props} />;
			case "captions":
				return <CaptionSettingsPanel props={props} />;
			default:
				return <SceneSection props={props} />;
		}
	};

	return (
		<div className="flex flex-col h-full w-80 bg-[#161619] border-r border-white/5 overflow-y-auto custom-scrollbar">
			<div className="p-4 space-y-6">{renderSection()}</div>
		</div>
	);
}
