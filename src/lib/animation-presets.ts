import type { AnimationPreset, AnimationPresetName } from './types';

// Congelado en profundidad: los presets se comparten entre todos los toasts
export const animationPresets: Readonly<Record<AnimationPresetName, Readonly<AnimationPreset>>> =
	Object.freeze({
		smooth: Object.freeze({ bounce: 0.1, spring: true }),
		subtle: Object.freeze({ bounce: 0.05, spring: true }),
		snappy: Object.freeze({ bounce: 0.4, spring: true }),
		bouncy: Object.freeze({ bounce: 0.6, spring: true })
	});
