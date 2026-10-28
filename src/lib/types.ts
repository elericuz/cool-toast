import type { Snippet } from 'svelte';

export type ToastType = 'default' | 'success' | 'error' | 'warning' | 'info';
export type ToastPhase = ToastType | 'loading';
export type Position =
	'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
export type Theme = 'light' | 'dark' | 'system';
export type AnimationPresetName = 'smooth' | 'subtle' | 'snappy' | 'bouncy';

export interface AnimationPreset {
	bounce: number;
	spring: boolean;
}

export interface ToastAction {
	label: string;
	onClick: () => void;
	successLabel?: string;
}

export interface ToastClasses {
	wrapper?: string;
	content?: string;
	header?: string;
	title?: string;
	icon?: string;
	description?: string;
	actionWrapper?: string;
	actionButton?: string;
}

export interface ToastTimings {
	/** ms; only for expanded toasts. Default 4000. */
	displayDuration?: number;
}

export interface ToastOptions {
	description?: string | Snippet;
	action?: ToastAction;
	icon?: Snippet;
	/** ms; only for compact toasts. `Infinity` disables auto close. */
	duration?: number;
	id?: string | number;
	classes?: ToastClasses;
	fillColor?: string;
	borderColor?: string;
	/** Default 1.5 when `borderColor` is set. */
	borderWidth?: number;
	timing?: ToastTimings;
	preset?: AnimationPresetName;
	spring?: boolean;
	bounce?: number;
	showProgress?: boolean;
	showTimestamp?: boolean;
	onDismiss?: (id: string | number) => void;
	onAutoClose?: (id: string | number) => void;
	/** Id del `<Toaster>` que muestra el toast. Por defecto `'default'`. */
	toasterId?: string;
}

export interface ToastUpdateOptions {
	title?: string;
	description?: string | Snippet;
	type?: ToastType;
	action?: ToastAction;
	/** `null` clears the icon. */
	icon?: Snippet | null;
	showTimestamp?: boolean;
}

export interface PromiseData<T> {
	loading: string;
	success: string | ((data: T) => string);
	error: string | ((error: unknown) => string);
	description?: {
		loading?: string | Snippet;
		// Toda función es un resolver; un Snippet debe envolverse: `() => snippet` (API-6)
		success?: string | ((data: T) => string | Snippet);
		error?: string | ((error: unknown) => string | Snippet);
	};
	action?: { success?: ToastAction; error?: ToastAction };
	classes?: ToastClasses;
	fillColor?: string;
	borderColor?: string;
	borderWidth?: number;
	timing?: ToastTimings;
	preset?: AnimationPresetName;
	spring?: boolean;
	bounce?: number;
	showProgress?: boolean;
	showTimestamp?: boolean;
	onDismiss?: (id: string | number) => void;
	onAutoClose?: (id: string | number) => void;
	/** Id del `<Toaster>` que muestra el toast. Por defecto `'default'`. */
	toasterId?: string;
}

export interface DismissFilter {
	type: ToastType | ToastType[];
}

export interface ToasterProps {
	/** Identifica el Toaster; los toasts con el mismo `toasterId` se muestran aquí. Por defecto `'default'`. */
	id?: string;
	/** Se posiciona dentro de su ancestro posicionado en vez de en la ventana. Por defecto `false`. */
	inline?: boolean;
	position?: Position;
	theme?: Theme;
	gap?: number;
	offset?: string;
	duration?: number;
	visibleToasts?: number;
	/** Máximo de toasts en cola. Por defecto `100`; `Infinity` permite una cola sin límite. */
	maxQueue?: number;
	queueOverflow?: 'drop-oldest' | 'drop-newest';
	closeButton?: boolean | 'top-left' | 'top-right';
	closeOnEscape?: boolean;
	swipeToDismiss?: boolean;
	preset?: AnimationPresetName;
	spring?: boolean;
	bounce?: number;
	showProgress?: boolean;
	showTimestamp?: boolean;
	dir?: 'ltr' | 'rtl';
	labels?: { close?: string };
}

// --- Tipos internos (no se re-exportan desde index.ts) ---

export type CloseButtonSide = 'top-left' | 'top-right';

/** Opciones efectivas de un toast tras aplicar la precedencia de `resolveOptions`. */
export interface ResolvedToastOptions {
	bounce: number;
	spring: boolean;
	showProgress: boolean;
	showTimestamp: boolean;
	duration: number;
	displayDuration: number;
	closeButton: false | CloseButtonSide;
	swipeToDismiss: boolean;
	expanded: boolean;
	lifetime: number;
}
