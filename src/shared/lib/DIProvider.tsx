import type React from "react";
import { type ReactNode } from "react";
import { type Dependencies, DIContext } from "./DIContext";

export const DIProvider: React.FC<{ dependencies: Dependencies; children: ReactNode }> = ({
	dependencies,
	children,
}) => {
	return <DIContext.Provider value={dependencies}>{children}</DIContext.Provider>;
};
