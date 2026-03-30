import React from "react";
import styles from "../LaunchWindow.module.css";

export function Separator() {
	return <div className={styles.sep} />;
}

export function DropdownSeparator() {
	return <div className={styles.ddSep} />;
}

interface IconButtonProps {
	onClick?: () => void;
	title?: string;
	className?: string;
	buttonRef?: React.Ref<HTMLButtonElement>;
	children: React.ReactNode;
}

export function IconButton({
	onClick,
	title,
	className = "",
	buttonRef,
	children,
}: IconButtonProps) {
	return (
		<button
			ref={buttonRef}
			type="button"
			className={`${styles.ib} ${styles.electronNoDrag} ${className}`}
			onClick={onClick}
			title={title}
		>
			{children}
		</button>
	);
}

interface DropdownItemProps {
	onClick: () => void;
	selected?: boolean;
	icon: React.ReactNode;
	children: React.ReactNode;
	trailing?: React.ReactNode;
}

export function DropdownItem({ onClick, selected, icon, children, trailing }: DropdownItemProps) {
	return (
		<button
			type="button"
			className={`${styles.ddItem} ${selected ? styles.ddItemSelected : ""} ${styles.electronNoDrag}`}
			onClick={onClick}
		>
			<span className="shrink-0">{icon}</span>
			<span className="truncate">{children}</span>
			{trailing}
		</button>
	);
}
