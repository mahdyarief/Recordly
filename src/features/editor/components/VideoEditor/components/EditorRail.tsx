import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { type LucideIcon } from "lucide-react";

export interface EditorSectionButton {
	id: string;
	icon: LucideIcon;
	label: string;
}

interface EditorRailProps {
	sections: EditorSectionButton[];
	activeSection: string;
	onSectionChange: (id: string) => void;
}

export function EditorRail({ sections, activeSection, onSectionChange }: EditorRailProps) {
	return (
		<div className="flex w-11 flex-shrink-0 items-center justify-center pl-1">
			<LayoutGroup id="preview-icon-rail">
				<div className="flex flex-col items-center gap-3">
					{sections.map((section) => {
						const Icon = section.icon;
						const isActive = activeSection === section.id;
						return (
							<motion.button
								key={section.id}
								type="button"
								onClick={() => onSectionChange(section.id)}
								title={section.label}
								className="group relative flex h-8 w-8 items-center justify-center text-white/75 outline-none transition-colors hover:text-white focus:outline-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
								animate={{ scale: isActive ? 1.06 : 1, opacity: isActive ? 1 : 0.82 }}
								transition={{ type: "spring", stiffness: 420, damping: 28 }}
							>
								<motion.span
									animate={{ color: isActive ? "#2563EB" : "rgba(255,255,255,0.75)" }}
									transition={{ duration: 0.16 }}
								>
									<Icon className="h-4 w-4" />
								</motion.span>
								<AnimatePresence initial={false}>
									{isActive ? (
										<motion.span
											layoutId="preview-active-dot"
											className="absolute -left-1 h-1.5 w-1.5 rounded-full bg-[#2563EB]"
											initial={{ opacity: 0, scale: 0.6 }}
											animate={{ opacity: 1, scale: 1 }}
											exit={{ opacity: 0, scale: 0.6 }}
											transition={{ type: "spring", stiffness: 500, damping: 32 }}
										/>
									) : null}
								</AnimatePresence>
							</motion.button>
						);
					})}
				</div>
			</LayoutGroup>
		</div>
	);
}
