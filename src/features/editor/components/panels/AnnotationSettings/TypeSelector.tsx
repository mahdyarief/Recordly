import { type AnnotationType } from "@/features/project/domain/entities/AnnotationRegion";

interface TypeSelectorProps {
	selectedType: AnnotationType | null;
	onTypeChange: (type: AnnotationType) => void;
}

export function TypeSelector({ selectedType, onTypeChange }: TypeSelectorProps) {
	const types: { id: AnnotationType; label: string }[] = [
		{ id: "text" as AnnotationType, label: "Text" },
		{ id: "arrow" as AnnotationType, label: "Arrow" },
		{ id: "rect" as AnnotationType, label: "Rectangle" },
		{ id: "circle" as AnnotationType, label: "Circle" },
		{ id: "blur" as AnnotationType, label: "Blur" },
		{ id: "focus" as AnnotationType, label: "Focus" },
	];

	return (
		<div className="grid grid-cols-3 gap-2">
			{types.map((type) => (
				<button
					key={type.id}
					type="button"
					onClick={() => onTypeChange(type.id)}
					className={`flex items-center justify-center rounded-md border h-8 text-[10px] font-bold uppercase tracking-wider transition-all ${
						selectedType === type.id
							? "border-primary bg-primary/10 text-primary"
							: "border-white/10 text-slate-500 hover:border-white/20 hover:text-slate-300"
					}`}
				>
					{type.label}
				</button>
			))}
		</div>
	);
}
