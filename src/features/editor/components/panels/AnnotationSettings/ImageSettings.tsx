import { Upload } from "lucide-react";
import React, { useRef } from "react";
import { toast } from "sonner";
import { type AnnotationRegion } from "@/features/editor/types";
import { useScopedT } from "@/shared/adapters/I18nProvider";
import { Button } from "@/shared/components/ui/button";

interface ImageSettingsProps {
	annotation: AnnotationRegion;
	onContentChange: (content: string) => void;
}

export function ImageSettings({ annotation, onContentChange }: ImageSettingsProps) {
	const t = useScopedT("editor");
	const fileInputRef = useRef<HTMLInputElement>(null);

	const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
		const files = event.target.files;
		if (!files || files.length === 0) return;

		const file = files[0];
		const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];

		if (!validTypes.includes(file.type)) {
			toast.error(t("annotations.imageUploadError"), {
				description: t("annotations.imageUploadErrorDescription"),
			});
			event.target.value = "";
			return;
		}

		const reader = new FileReader();
		reader.onload = (e) => {
			const dataUrl = e.target?.result as string;
			if (dataUrl) {
				onContentChange(dataUrl);
				toast.success(t("annotations.imageUploadSuccess"));
			}
		};

		reader.onerror = () => {
			toast.error(t("annotations.imageUploadFailed"), {
				description: t("annotations.imageUploadFailedDescription"),
			});
		};

		reader.readAsDataURL(file);
		event.target.value = "";
	};

	return (
		<div className="space-y-4">
			<input
				type="file"
				ref={fileInputRef}
				onChange={handleImageUpload}
				accept=".jpg,.jpeg,.png,.gif,.webp,image/*"
				className="hidden"
			/>
			<Button
				onClick={() => fileInputRef.current?.click()}
				variant="outline"
				className="w-full gap-2 bg-white/5 text-slate-200 border-white/10 hover:bg-primary hover:text-white hover:border-primary transition-all py-8"
			>
				<Upload className="w-5 h-5" />
				{t("annotations.uploadImage")}
			</Button>

			{annotation.content && annotation.content.startsWith("data:image") && (
				<div className="rounded-lg border border-white/10 overflow-hidden bg-white/5 p-2">
					<img
						src={annotation.content}
						alt="Uploaded annotation"
						className="w-full h-auto rounded-md"
					/>
				</div>
			)}

			<p className="text-xs text-slate-500 text-center leading-relaxed">
				{t("annotations.supportedFormats")}
			</p>
		</div>
	);
}
