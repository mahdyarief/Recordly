import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";

interface LibraryWorkflowProps {
	t: (key: string) => string;
	onOpenProject: (path: string) => void;
}

interface ProjectLibraryEntry {
	path: string;
	name: string;
	updatedAt: number;
	thumbnailPath: string | null;
	isCurrent: boolean;
	isInProjectsDirectory: boolean;
}

export function useLibraryWorkflow({ t, onOpenProject }: LibraryWorkflowProps) {
	const [projectBrowserOpen, setProjectBrowserOpen] = useState(false);
	const [projectLibraryEntries, setProjectLibraryEntries] = useState<ProjectLibraryEntry[]>([]);
	const projectBrowserTriggerRef = useRef<HTMLButtonElement>(null);
	const projectBrowserFallbackTriggerRef = useRef<HTMLButtonElement>(null);

	const handleOpenProjectBrowser = useCallback(async () => {
		try {
			const result = await window.electronAPI.listProjectFiles();
			if (result.success) {
				setProjectLibraryEntries(result.entries);
				setProjectBrowserOpen(true);
			} else {
				toast.error(t("editor.failedToLoadLibrary"));
			}
		} catch (err) {
			console.error("Failed to load library:", err);
			toast.error(t("editor.failedToLoadLibrary"));
		}
	}, [t]);

	return {
		projectBrowserOpen,
		setProjectBrowserOpen,
		projectLibraryEntries,
		projectBrowserTriggerRef,
		projectBrowserFallbackTriggerRef,
		handleOpenProjectBrowser,
		onOpenProject,
	};
}
