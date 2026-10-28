import { SMOOTH_EASE } from './constants';

export interface SpringOptions {
	type: 'spring';
	duration: number;
	bounce: number;
}

export type CubicBezier = [number, number, number, number];

export interface TweenOptions {
	duration: number;
	ease: CubicBezier;
}

export interface PhysicsSpringOptions {
	type: 'spring';
	stiffness: number;
	damping: number;
	mass: number;
}

export type SquishKind = 'mount' | 'collapse';

// Duraciones en segundos (formato de `motion`)
const MORPH_SPRING_S = 0.9;
const MORPH_EXPAND_TWEEN_S = 0.6;
const MORPH_COLLAPSE_TWEEN_S = 0.9;
const PILL_RESIZE_SPRING_S = 0.5;
const PILL_RESIZE_TWEEN_S = 0.4;
// El colapso y el redimensionado usan un rebote algo menor que la expansión
const SOFT_BOUNCE_FACTOR = 0.875;
// Rebote de referencia sobre el que se escalan las intensidades del squish
const REFERENCE_BOUNCE = 0.4;

const SQUISH_FACTORS: Record<SquishKind, { compressY: number; expandX: number }> = {
	mount: { compressY: 0.12, expandX: 0.06 },
	collapse: { compressY: 0.035, expandX: 0.018 }
};

// Redondea para evitar ruido de coma flotante en los strings de transform (y normaliza -0)
function round(value: number, decimals = 4): number {
	const factor = 10 ** decimals;
	return Math.round(value * factor) / factor + 0;
}

const tween = (duration: number): TweenOptions => ({
	duration,
	ease: [...SMOOTH_EASE] as CubicBezier
});

/** Transición de la morfología píldora → cuerpo. */
export function morphExpandOptions(bounce: number, spring: boolean): SpringOptions | TweenOptions {
	return spring
		? { type: 'spring', duration: MORPH_SPRING_S, bounce }
		: tween(MORPH_EXPAND_TWEEN_S);
}

/** Transición de cuerpo → píldora; antes de descartar siempre es un tween. */
export function morphCollapseOptions(
	bounce: number,
	spring: boolean,
	preDismiss: boolean
): SpringOptions | TweenOptions {
	if (preDismiss || !spring) return tween(MORPH_COLLAPSE_TWEEN_S);
	return { type: 'spring', duration: MORPH_SPRING_S, bounce: bounce * SOFT_BOUNCE_FACTOR };
}

/** Transición del ancho de la píldora al cambiar el contenido. */
export function pillResizeOptions(bounce: number, spring: boolean): SpringOptions | TweenOptions {
	return spring
		? { type: 'spring', duration: PILL_RESIZE_SPRING_S, bounce: bounce * SOFT_BOUNCE_FACTOR }
		: tween(PILL_RESIZE_TWEEN_S);
}

/** Muelle físico del squish de aterrizaje. */
export function squishSpring(bounce: number): PhysicsSpringOptions {
	return {
		type: 'spring',
		stiffness: 200 + bounce * 437.5,
		damping: 24 - bounce * 20,
		mass: 0.7
	};
}

/** Transform del squish para el progreso `v` ∈ [0, 1]; `mirrored` antepone el espejo horizontal. */
export function squishTransform(
	v: number,
	bounce: number,
	kind: SquishKind,
	mirrored = false
): string {
	const scale = bounce / REFERENCE_BOUNCE;
	const intensity = Math.sin(v * Math.PI);
	const { compressY, expandX } = SQUISH_FACTORS[kind];
	const sx = round(1 + expandX * scale * intensity);
	const sy = round(1 - compressY * scale * intensity);
	return `${mirrored ? 'scaleX(-1) ' : ''}scaleX(${sx}) scaleY(${sy})`;
}

/** Transform de la sacudida de error para el progreso `v` ∈ [0, 1]. */
export function shakeTransform(v: number): string {
	const offset = Math.sin(v * Math.PI * 6) * (1 - v) * 3;
	return `translateX(${round(offset)}px)`;
}
