// Punto de entrada público de Cool-Toast (handoff §B.5): nada más se exporta
export { default as Toaster } from './Toaster.svelte';
export { toast } from './toast';
export { animationPresets } from './animation-presets';
export type {
	ToastType,
	ToastPhase,
	ToastOptions,
	ToastUpdateOptions,
	ToastAction,
	ToastClasses,
	ToastTimings,
	PromiseData,
	DismissFilter,
	AnimationPreset,
	AnimationPresetName,
	ToasterProps,
	Position,
	Theme
} from './types';
