import { animationPresets } from './animation-presets';
import { DEFAULT_DISPLAY_MS, DEFAULT_DURATION_MS } from './constants';
import type { CloseButtonSide, ResolvedToastOptions, ToasterProps, ToastOptions } from './types';

// Valores por defecto cuando ni el toast ni el Toaster definen el campo
const DEFAULT_BOUNCE = 0.4;
const DEFAULT_SPRING = true;

// Primer valor definido de la cadena de precedencia
function firstDefined<T>(...values: (T | undefined)[]): T | undefined {
	return values.find((value) => value !== undefined);
}

function normalizeCloseButton(value: ToasterProps['closeButton']): false | CloseButtonSide {
	if (value === true) return 'top-left';
	return value || false;
}

/**
 * Resuelve las opciones efectivas de un toast (función pura).
 * Orden: opción del toast → preset del toast (solo bounce/spring) → prop del Toaster →
 * preset del Toaster → valor por defecto.
 */
export function resolveOptions(
	options: ToastOptions,
	toaster: Partial<ToasterProps>
): ResolvedToastOptions {
	const toastPreset = options.preset ? animationPresets[options.preset] : undefined;
	const toasterPreset = toaster.preset ? animationPresets[toaster.preset] : undefined;

	const bounce =
		firstDefined(options.bounce, toastPreset?.bounce, toaster.bounce, toasterPreset?.bounce) ??
		DEFAULT_BOUNCE;
	const spring =
		firstDefined(options.spring, toastPreset?.spring, toaster.spring, toasterPreset?.spring) ??
		DEFAULT_SPRING;

	const duration = firstDefined(options.duration, toaster.duration) ?? DEFAULT_DURATION_MS;
	const displayDuration = options.timing?.displayDuration ?? DEFAULT_DISPLAY_MS;
	// Un toast se expande cuando tiene descripción (texto o Snippet) o acción
	const expanded = Boolean(options.description) || Boolean(options.action);

	return {
		bounce,
		spring,
		showProgress: firstDefined(options.showProgress, toaster.showProgress) ?? false,
		showTimestamp: firstDefined(options.showTimestamp, toaster.showTimestamp) ?? true,
		duration,
		displayDuration,
		closeButton: normalizeCloseButton(toaster.closeButton),
		swipeToDismiss: toaster.swipeToDismiss ?? true,
		expanded,
		// Los expandidos ignoran `duration`; los compactos ignoran `timing.displayDuration`
		lifetime: expanded ? displayDuration : duration
	};
}
