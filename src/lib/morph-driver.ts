import { animate } from 'motion';
import {
	morphCollapseOptions,
	morphExpandOptions,
	type PhysicsSpringOptions,
	type SpringOptions,
	type TweenOptions
} from './animation-config';

type Controls = { stop: () => void };

// Firma numérica de `motion.animate` (valor → valor), sin depender de los tipos internos de motion-dom
const animateNumber = animate as unknown as (
	from: number,
	to: number,
	options: Record<string, unknown>
) => Controls;
export type ValueAnimationOptions =
	| SpringOptions
	| TweenOptions
	| PhysicsSpringOptions
	| { duration: number; ease?: TweenOptions['ease'] | 'easeOut' };

/**
 * Controlador de una animación numérica: al detenerse invalida su ejecución para que un
 * `onComplete` tardío (o el de una animación interrumpida) nunca se dispare.
 */
export class AnimationChannel {
	#controls: Controls | null = null;
	#token = 0;

	run(
		from: number,
		to: number,
		options: ValueAnimationOptions,
		onFrame: (value: number) => void,
		onComplete: () => void
	): void {
		this.stop();
		const token = this.#token;
		let finished = false;
		const controls = animateNumber(from, to, {
			...options,
			onUpdate: (value: number) => {
				if (token === this.#token) onFrame(value);
			},
			onComplete: () => {
				if (token !== this.#token) return;
				finished = true;
				this.#controls = null;
				onComplete();
			}
		});
		// En modo síncrono la animación pudo terminar (o ser reemplazada) dentro de `animate`
		if (!finished && token === this.#token) this.#controls = controls;
	}

	stop(): void {
		this.#token += 1;
		this.#controls?.stop();
		this.#controls = null;
	}
}

/**
 * Anima el progreso `t` del blob (0 = píldora, 1 = cuerpo) con `motion` y dibuja cada frame
 * directamente en el DOM a través de `draw`. El valor por frame nunca entra en la reactividad.
 */
export class MorphDriver {
	#t = 0;
	readonly #draw: (t: number) => void;
	readonly #morph = new AnimationChannel();
	readonly #value = new AnimationChannel();

	constructor(draw: (t: number) => void) {
		this.#draw = draw;
	}

	get t(): number {
		return this.#t;
	}

	/** Coloca el blob en `t` sin animar (interrumpe la morfología en curso). */
	snap(t: number): void {
		this.#morph.stop();
		this.#t = t;
		this.#draw(t);
	}

	/** Vuelve a dibujar el valor actual (p. ej. tras medir de nuevo). */
	redraw(): void {
		this.#draw(this.#t);
	}

	/** Píldora → cuerpo desde el `t` actual. */
	expand(bounce: number, spring: boolean, onComplete: () => void): void {
		this.#animateT(1, morphExpandOptions(bounce, spring), onComplete);
	}

	/** Cuerpo → píldora desde el `t` actual; `preDismiss` fuerza el tween previo al descarte. */
	collapse(bounce: number, spring: boolean, preDismiss: boolean, onComplete: () => void): void {
		this.#animateT(0, morphCollapseOptions(bounce, spring, preDismiss), onComplete);
	}

	/** Anima un valor arbitrario (p. ej. el ancho de la píldora); reemplaza la anterior. */
	animateValue(
		from: number,
		to: number,
		options: ValueAnimationOptions,
		onFrame: (value: number) => void,
		onComplete: () => void
	): void {
		this.#value.run(from, to, options, onFrame, onComplete);
	}

	/** Detiene toda animación sin disparar sus `onComplete`. */
	stop(): void {
		this.#morph.stop();
		this.#value.stop();
	}

	#animateT(target: number, options: ValueAnimationOptions, onComplete: () => void): void {
		this.#morph.run(
			this.#t,
			target,
			options,
			(value) => {
				this.#t = value;
				this.#draw(value);
			},
			() => {
				this.#t = target;
				onComplete();
			}
		);
	}
}
