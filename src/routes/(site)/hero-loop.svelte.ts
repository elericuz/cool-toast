import { untrack } from 'svelte';
import { MediaQuery } from 'svelte/reactivity';
import { toast, type ToastAction, type ToastType } from '#lib';
import { samples } from './playground.svelte';

/** Id del Toaster en línea del escenario del hero. */
export const HERO_TOASTER_ID = 'hero';

// Un tipo cada 3600 ms: ≈ 2770 ms visible más la salida (handoff §E)
export const HERO_INTERVAL_MS = 3600;
// El bucle retira cada toast antes de que caduque; si se pausa, el toast sigue a la vista
const HERO_DISPLAY_MS = 60_000;
const VISIBLE_THRESHOLD = 0.25;

export const heroTypes: ToastType[] = ['default', 'success', 'error', 'warning', 'info'];

// Acción por tipo: hace que el toast se expanda (píldora → cuerpo) y confirma al pulsarla
const actions: Record<ToastType, ToastAction> = {
	default: { label: 'Open', onClick: () => {}, successLabel: 'Opened' },
	success: { label: 'View', onClick: () => {}, successLabel: 'Opened' },
	error: { label: 'Retry', onClick: () => {}, successLabel: 'Sent again' },
	warning: { label: 'Upgrade', onClick: () => {}, successLabel: 'Upgraded' },
	info: { label: 'Reload', onClick: () => {}, successLabel: 'Reloaded' }
};

/** Motivos por los que el bucle se detiene sin perder su posición. */
type HoldReason = 'hover' | 'focus' | 'offscreen';

/**
 * Bucle del escenario del hero: muestra cada tipo de toast por turnos en el Toaster `hero`.
 * Se pausa con el puntero o el foco dentro del escenario y fuera de pantalla; con
 * `prefers-reduced-motion: reduce` no arranca solo, pero los clics siguen lanzando toasts.
 */
export class HeroLoop {
	activeType = $state<ToastType>('default');
	running = $state(false);

	readonly reducedMotion = new MediaQuery('(prefers-reduced-motion: reduce)', false);

	#timer: ReturnType<typeof setTimeout> | undefined;
	#currentId: string | number | undefined;
	#holds: Record<HoldReason, boolean> = { hover: false, focus: false, offscreen: false };

	/**
	 * Arranca el ciclo mostrando el tipo activo. Sin seguimiento: llamarlo desde un `$effect` no
	 * debe suscribirlo al estado que lee y escribe (activeType, running y el store de toasts).
	 */
	start(): void {
		untrack(() => {
			this.running = true;
			this.#show(this.activeType);
			this.#schedule();
		});
	}

	/** Detiene el ciclo, cancela el temporizador y retira el toast del escenario (sin seguimiento). */
	stop(): void {
		untrack(() => {
			this.running = false;
			this.#clear();
			if (this.#currentId !== undefined) toast.dismiss(this.#currentId);
			this.#currentId = undefined;
		});
	}

	/** Lanza ya el tipo pedido y reinicia el ciclo desde él. */
	fire(type: ToastType): void {
		this.#show(type);
		this.#schedule();
	}

	/** Activa o libera un motivo de pausa; el ciclo sigue cuando no queda ninguno. */
	hold(reason: HoldReason, on: boolean): void {
		if (this.#holds[reason] === on) return;
		this.#holds[reason] = on;
		this.#schedule();
	}

	/** Pausa el ciclo mientras `node` está fuera de pantalla. Devuelve la limpieza. */
	observe(node: HTMLElement): () => void {
		if (typeof IntersectionObserver === 'undefined') return () => {};
		const observer = new IntersectionObserver(
			([entry]) => this.hold('offscreen', !entry.isIntersecting),
			{ threshold: VISIBLE_THRESHOLD }
		);
		observer.observe(node);
		return () => observer.disconnect();
	}

	get #paused(): boolean {
		return Object.values(this.#holds).some(Boolean);
	}

	#show(type: ToastType): void {
		// visibleToasts={1}: el anterior sale y el nuevo entra en cuanto queda sitio
		if (this.#currentId !== undefined) toast.dismiss(this.#currentId);
		this.activeType = type;
		const { title, description } = samples[type];
		const options = {
			toasterId: HERO_TOASTER_ID,
			description,
			action: actions[type],
			timing: { displayDuration: HERO_DISPLAY_MS }
		};
		this.#currentId = type === 'default' ? toast(title, options) : toast[type](title, options);
	}

	#next(): void {
		const index = heroTypes.indexOf(this.activeType);
		this.#show(heroTypes[(index + 1) % heroTypes.length]);
		this.#schedule();
	}

	// Un único temporizador vivo: se reprograma en cada cambio y nunca corre en pausa
	#schedule(): void {
		this.#clear();
		if (!this.running || this.#paused) return;
		this.#timer = setTimeout(() => this.#next(), HERO_INTERVAL_MS);
	}

	#clear(): void {
		clearTimeout(this.#timer);
		this.#timer = undefined;
	}
}
