import { useEffect, useState } from "react";
import { type AnnotationRegion } from "@/features/editor/components/VideoEditor/types";
import { TypeSelector } from "./AnnotationSettings/TypeSelector";

interface AnnotationSettingsPanelProps {
	selectedAnnotation: AnnotationRegion | null;
	onAnnotationContentChange: (id: string, content: string) => void;
	onAnnotationTypeChange: (id: string, type: any) => void;
	onAnnotationStyleChange: (id: string, style: any) => void;
	onAnnotationDelete: (id: string) => void;
}

export function AnnotationSettingsPanel({
	selectedAnnotation,
	onAnnotationContentChange,
	onAnnotationTypeChange,
	onAnnotationStyleChange: _onAnnotationStyleChange,
	onAnnotationDelete,
}: AnnotationSettingsPanelProps) {
	const [content, setContent] = useState("");

	useEffect(() => {
		if (selectedAnnotation) setContent(selectedAnnotation.content || "");
	}, [selectedAnnotation]);

	if (!selectedAnnotation) return null;

	return (
		<div className="space-y-4 animate-in fade-in slide-in-from-top-1">
			<section className="space-y-2">
				<p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Type</p>
				<TypeSelector
					selectedType={selectedAnnotation.type as any}
					onTypeChange={(type) => onAnnotationTypeChange(selectedAnnotation.id, type)}
				/>
			</section>

			<section className="space-y-2">
				<p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Content</p>
				<input
					className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none focus:border-primary/50"
					value={content}
					onChange={(e) => {
						const v = e.target.value;
						setContent(v);
						onAnnotationContentChange(selectedAnnotation.id, v);
					}}
					placeholder="Enter annotation text..."
				/>
			</section>

			<button
				type="button"
				onClick={() => onAnnotationDelete(selectedAnnotation.id)}
				className="w-full h-8 flex items-center justify-center gap-2 rounded-lg border border-red-500/20 bg-red-500/5 text-red-500 hover:bg-red-500/10 transition-all text-[10px] font-bold uppercase tracking-wider"
			>
				Delete Annotation
			</button>
		</div>
	);
}
