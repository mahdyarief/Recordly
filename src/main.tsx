import React from "react";
import ReactDOM from "react-dom/client";
import { I18nProvider } from "@/shared/adapters/I18nProvider";
import App from "./App.tsx";
import "./index.css";

import { CompositionRoot } from "./CompositionRoot.tsx";

document.documentElement.dataset.platform = /mac/i.test(navigator.platform) ? "macos" : "other";

console.log("[renderer] Starting main.tsx");
ReactDOM.createRoot(document.getElementById("root")!).render(
	<React.StrictMode>
		<I18nProvider>
			<CompositionRoot>
				<App />
			</CompositionRoot>
		</I18nProvider>
	</React.StrictMode>,
);
