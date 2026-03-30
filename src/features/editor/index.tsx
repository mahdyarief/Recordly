import { EditorContent } from "./components/VideoEditor/EditorContent";
import { EditorProvider } from "./context/EditorContext";

export function VideoEditor() {
	return (
		<EditorProvider>
			<EditorContent />
		</EditorProvider>
	);
}

export default VideoEditor;
