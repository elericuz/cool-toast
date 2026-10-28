// Infraestructura de pruebas compartida (handoff §E). Se carga antes de cada archivo de test.
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/svelte/pure';
import { afterEach } from 'vitest';

// ---------------------------------------------------------------------------
// matchMedia controlable por consulta
// ---------------------------------------------------------------------------
interface MediaEntry {
	matches: boolean;
}

const mediaEntries = new Map<string, MediaEntry>();

function getMediaEntry(query: string): MediaEntry {
	let entry = mediaEntries.get(query);
	if (!entry) {
		entry = { matches: false };
		mediaEntries.set(query, entry);
	}
	return entry;
}

/** Cambia el resultado de una consulta y dispara `change` en sus oyentes. */
export function setMediaQuery(query: string, matches: boolean): void {
	getMediaEntry(query).matches = matches;
	const list = mediaLists.get(query);
	if (!list) return;
	const event = Object.assign(new Event('change'), { matches, media: query });
	list.onchange?.(event as unknown as MediaQueryListEvent);
	list.dispatchEvent(event);
}

/** Restablece todas las consultas a `false` y descarta oyentes. */
export function resetMediaQueries(): void {
	mediaEntries.clear();
	mediaLists.clear();
}

class MediaQueryListStub extends EventTarget {
	onchange: ((event: MediaQueryListEvent) => void) | null = null;
	constructor(readonly media: string) {
		super();
	}
	get matches(): boolean {
		return getMediaEntry(this.media).matches;
	}
	addListener(listener: EventListener): void {
		this.addEventListener('change', listener);
	}
	removeListener(listener: EventListener): void {
		this.removeEventListener('change', listener);
	}
}

const mediaLists = new Map<string, MediaQueryListStub>();

function matchMediaStub(query: string): MediaQueryList {
	let list = mediaLists.get(query);
	if (!list) {
		list = new MediaQueryListStub(query);
		mediaLists.set(query, list);
	}
	return list as unknown as MediaQueryList;
}

// ---------------------------------------------------------------------------
// ResizeObserver con disparo manual
// ---------------------------------------------------------------------------
const resizeObservers = new Set<ResizeObserverStub>();

class ResizeObserverStub {
	private targets = new Set<Element>();
	constructor(private callback: ResizeObserverCallback) {
		resizeObservers.add(this);
	}
	observe(target: Element): void {
		this.targets.add(target);
	}
	unobserve(target: Element): void {
		this.targets.delete(target);
	}
	disconnect(): void {
		this.targets.clear();
		resizeObservers.delete(this);
	}
	fire(only?: Element): void {
		const entries = [...this.targets]
			.filter((target) => !only || target === only)
			.map((target) => ({ target, contentRect: target.getBoundingClientRect() }));
		if (entries.length > 0)
			this.callback(entries as unknown as ResizeObserverEntry[], this as never);
	}
}

/** Dispara los callbacks de todos los ResizeObserver activos (o solo los de `target`). */
export function triggerResize(target?: Element): void {
	for (const observer of [...resizeObservers]) observer.fire(target);
}

// Los stubs de DOM solo se instalan si hay `window` (los tests con `@vitest-environment node` los omiten)
if (typeof window !== 'undefined') {
	// ---------------------------------------------------------------------------
	// PointerEvent (jsdom puede no incluirlo con todas las propiedades)
	// ---------------------------------------------------------------------------
	class PointerEventPolyfill extends MouseEvent {
		pointerId: number;
		pointerType: string;
		isPrimary: boolean;
		width: number;
		height: number;
		pressure: number;
		constructor(type: string, init: PointerEventInit = {}) {
			super(type, init);
			this.pointerId = init.pointerId ?? 1;
			this.pointerType = init.pointerType ?? 'mouse';
			this.isPrimary = init.isPrimary ?? true;
			this.width = init.width ?? 1;
			this.height = init.height ?? 1;
			this.pressure = init.pressure ?? 0;
		}
	}

	// ---------------------------------------------------------------------------
	// Medidas de layout (jsdom devuelve 0): atributos data-test-w/h o mapa por defecto
	// ---------------------------------------------------------------------------
	function defaultSize(el: HTMLElement): { w: number; h: number } {
		if (el.matches('[data-cool-toast-header]')) return { w: 100, h: 20 };
		if (el.matches('[data-cool-toast-content]')) {
			// Los nodos en salida ([data-leaving]) no cuentan como contenido expandido
			const expanded = [
				...el.querySelectorAll(
					'[data-cool-toast-description-row], [data-cool-toast-action-wrapper]'
				)
			].some((node) => !node.closest('[data-leaving]'));
			return expanded ? { w: 320, h: 112 } : { w: 150, h: 44 };
		}
		return { w: 0, h: 0 };
	}

	function readSize(el: HTMLElement, attr: 'data-test-w' | 'data-test-h'): number {
		const explicit = el.getAttribute(attr);
		if (explicit !== null) return Number(explicit);
		const size = defaultSize(el);
		return attr === 'data-test-w' ? size.w : size.h;
	}

	// ---------------------------------------------------------------------------
	// Instalación de los stubs
	// ---------------------------------------------------------------------------
	Object.defineProperty(window, 'matchMedia', {
		configurable: true,
		writable: true,
		value: matchMediaStub
	});
	Object.defineProperty(globalThis, 'ResizeObserver', {
		configurable: true,
		writable: true,
		value: ResizeObserverStub
	});
	if (typeof window.PointerEvent === 'undefined') {
		Object.defineProperty(window, 'PointerEvent', {
			configurable: true,
			writable: true,
			value: PointerEventPolyfill
		});
		Object.defineProperty(globalThis, 'PointerEvent', {
			configurable: true,
			writable: true,
			value: PointerEventPolyfill
		});
	}

	// rAF síncrono: el callback corre de inmediato (los tests no esperan frames reales)
	Object.defineProperty(globalThis, 'requestAnimationFrame', {
		configurable: true,
		writable: true,
		value: (callback: FrameRequestCallback) => {
			callback(performance.now());
			return 1;
		}
	});
	Object.defineProperty(globalThis, 'cancelAnimationFrame', {
		configurable: true,
		writable: true,
		value: () => {}
	});

	Element.prototype.setPointerCapture = () => {};
	Element.prototype.releasePointerCapture = () => {};
	Element.prototype.hasPointerCapture = () => false;
	Element.prototype.scrollIntoView = () => {};
	Element.prototype.getAnimations = () => [];

	// Element.animate (Web Animations) no existe en jsdom y Svelte lo usa en transiciones.
	// Se simula con setTimeout para que los temporizadores falsos controlen la duración.
	Element.prototype.animate = function (
		this: Element,
		_keyframes: unknown,
		options?: number | { duration?: number; delay?: number }
	) {
		const duration = typeof options === 'number' ? options : (options?.duration ?? 0);
		const delay = typeof options === 'number' ? 0 : (options?.delay ?? 0);
		const startedAt = Date.now();
		let handle: ReturnType<typeof setTimeout> | undefined;
		let resolveFinished: () => void = () => {};
		const animation = {
			playState: 'running' as 'running' | 'finished' | 'idle',
			effect: {} as unknown,
			onfinish: null as null | (() => void),
			oncancel: null as null | (() => void),
			finished: new Promise<void>((resolve) => (resolveFinished = resolve)),
			get currentTime() {
				return Math.min(Date.now() - startedAt, duration + delay);
			},
			set currentTime(_value: number) {},
			cancel() {
				if (handle !== undefined) clearTimeout(handle);
				handle = undefined;
				animation.playState = 'idle';
				animation.oncancel?.();
			},
			finish() {
				if (handle !== undefined) clearTimeout(handle);
				handle = undefined;
				if (animation.playState === 'finished') return;
				animation.playState = 'finished';
				resolveFinished();
				animation.onfinish?.();
			},
			play() {},
			pause() {},
			reverse() {},
			persist() {},
			commitStyles() {},
			addEventListener() {},
			removeEventListener() {}
		};
		// Los timers falsos tratan setTimeout(fn, 0) como 1 ms; la animación vacía de Svelte (0 ms)
		// debe terminar en un microtask para que la salida dure exactamente `duration`
		if (duration + delay === 0) {
			let cancelled = false;
			const cancel = animation.cancel;
			animation.cancel = () => {
				cancelled = true;
				cancel();
			};
			queueMicrotask(() => {
				if (!cancelled) animation.finish();
			});
		} else {
			handle = setTimeout(() => animation.finish(), duration + delay);
		}
		return animation as unknown as Animation;
	};

	Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
		configurable: true,
		get(this: HTMLElement) {
			return readSize(this, 'data-test-w');
		}
	});
	Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
		configurable: true,
		get(this: HTMLElement) {
			return readSize(this, 'data-test-h');
		}
	});
}

afterEach(() => {
	// globals:false desactiva la limpieza automática de Testing Library; se hace aquí
	cleanup();
	resetMediaQueries();
	resizeObservers.clear();
});
