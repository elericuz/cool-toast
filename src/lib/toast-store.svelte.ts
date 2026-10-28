import type {
	DismissFilter,
	ToastAction,
	ToasterProps,
	ToastOptions,
	ToastPhase,
	ToastType,
	ToastUpdateOptions
} from './types';
import type { Snippet } from 'svelte';

export type ToastId = string | number;
export type ToastStatus = 'active' | 'exiting' | 'queued';

/** Registro interno de un toast (no forma parte de la API pública). */
export interface ToastRecord {
	id: ToastId;
	title: string;
	type: ToastType;
	phase: ToastPhase;
	description?: string | Snippet;
	action?: ToastAction;
	/** `null` = sin icono (borrado con `update`); `undefined` = icono por defecto del tipo. */
	icon?: Snippet | null;
	options: ToastOptions;
	status: ToastStatus;
	/** Sube en cada reemplazo in situ; el componente reinicia su temporizador al cambiar. */
	version: number;
}

/** Configuración del Toaster que el store necesita para la cola, más el resto de props. */
export interface ToasterConfig extends ToasterProps {
	visibleToasts: number;
	maxQueue: number;
	queueOverflow: 'drop-oldest' | 'drop-newest';
}

export interface AddInput {
	title: string;
	type: ToastType;
	phase?: ToastPhase;
	options?: ToastOptions;
}

export interface SettleContent {
	title: string;
	description?: string | Snippet;
	action?: ToastAction;
}

export interface DismissOptions {
	manual?: boolean;
}

export type Politeness = 'polite' | 'assertive';

const defaultConfig = (): ToasterConfig => ({
	visibleToasts: 3,
	maxQueue: Infinity,
	queueOverflow: 'drop-oldest'
});

// Contador de ids a nivel de módulo: no es estado reactivo ni programa nada al importar
let idCounter = 0;
const nextId = (): string => `cool-toast-${++idCounter}`;

function matcherFor(idOrFilter?: ToastId | DismissFilter): (record: ToastRecord) => boolean {
	if (idOrFilter === undefined) return () => true;
	if (typeof idOrFilter === 'object') {
		const types = Array.isArray(idOrFilter.type) ? idOrFilter.type : [idOrFilter.type];
		return (record) => types.includes(record.type);
	}
	return (record) => record.id === idOrFilter;
}

class ToastStore {
	/** Toasts visibles (`active` o `exiting`) en orden de creación. */
	active = $state<ToastRecord[]>([]);
	/** Toasts en espera (`queued`), FIFO. */
	queue = $state<ToastRecord[]>([]);
	config = $state<ToasterConfig>(defaultConfig());
	/** Texto actual de cada región aria-live del Announcer. */
	announcements = $state<Record<Politeness, string>>({ polite: '', assertive: '' });

	announce(text: string, politeness: Politeness): void {
		this.announcements[politeness] = text;
	}

	add({ title, type, phase, options = {} }: AddInput): ToastId {
		const id = options.id ?? nextId();
		const existing = options.id === undefined ? undefined : this.find(id);
		if (existing) {
			// Un id existente se reemplaza en su sitio (STORE-14): sin duplicar ni mover el registro
			existing.title = title;
			existing.type = type;
			existing.phase = phase ?? type;
			existing.description = options.description;
			existing.action = options.action;
			existing.icon = options.icon;
			existing.options = options;
			existing.version += 1;
			// Un registro que estaba saliendo vuelve a estar activo (se cancela su salida)
			if (existing.status === 'exiting') existing.status = 'active';
			return id;
		}

		const record: ToastRecord = {
			id,
			title,
			type,
			phase: phase ?? type,
			description: options.description,
			action: options.action,
			icon: options.icon,
			options,
			status: 'queued',
			version: 0
		};

		if (this.queue.length === 0 && this.active.length < this.config.visibleToasts) {
			record.status = 'active';
			this.active.push(record);
			return id;
		}

		this.enqueue(record);
		return id;
	}

	dismiss(idOrFilter?: ToastId | DismissFilter, { manual = true }: DismissOptions = {}): void {
		const matches = matcherFor(idOrFilter);

		// Los toasts en cola nunca se mostraron: se quitan sin callbacks
		if (this.queue.some(matches)) {
			this.queue = this.queue.filter((record) => !matches(record));
		}

		for (const record of this.active) {
			// Un toast que ya está saliendo no vuelve a disparar callbacks
			if (record.status !== 'active' || !matches(record)) continue;
			record.status = 'exiting';
			if (!manual) record.options.onAutoClose?.(record.id);
			record.options.onDismiss?.(record.id);
		}
	}

	/**
	 * Fin de la transición de salida: elimina el registro y avanza la cola.
	 * Con `version`, solo elimina si el registro sigue saliendo con esa misma versión: la salida
	 * de una instancia reemplazada (o resucitada) no debe borrar al registro vigente.
	 */
	remove(id: ToastId, version?: number): void {
		const record = this.active.find((candidate) => candidate.id === id);
		if (!record) return;
		if (version !== undefined && (record.version !== version || record.status !== 'exiting'))
			return;
		this.active = this.active.filter((candidate) => candidate !== record);
		this.processQueue();
	}

	setConfig(partial: Partial<ToasterConfig>): void {
		Object.assign(this.config, partial);
		// Si crece la capacidad se promueven toasts en espera; nunca se expulsan los activos
		this.processQueue();
	}

	update(id: ToastId, changes: ToastUpdateOptions): void {
		const record = this.find(id);
		if (!record) return;
		if (changes.title !== undefined) record.title = changes.title;
		if (changes.description !== undefined) record.description = changes.description;
		if (changes.action !== undefined) record.action = changes.action;
		if (changes.icon !== undefined) record.icon = changes.icon;
		if (changes.showTimestamp !== undefined) record.options.showTimestamp = changes.showTimestamp;
		if (changes.type !== undefined) {
			record.type = changes.type;
			record.phase = changes.type;
		}
	}

	/** Lleva un toast (normalmente en `loading`) a su fase final; no hace nada si ya no existe. */
	settle(id: ToastId, type: 'success' | 'error', content: SettleContent): void {
		const record = this.find(id);
		if (!record) return;
		record.type = type;
		record.phase = type;
		record.title = content.title;
		record.description = content.description;
		record.action = content.action;
	}

	private find(id: ToastId): ToastRecord | undefined {
		return (
			this.active.find((record) => record.id === id) ??
			this.queue.find((record) => record.id === id)
		);
	}

	private enqueue(record: ToastRecord): void {
		const { maxQueue, queueOverflow } = this.config;
		if (this.queue.length < maxQueue) {
			this.queue.push(record);
			return;
		}
		// Cola llena: 'drop-newest' descarta el entrante; 'drop-oldest' hace sitio quitando el más antiguo
		if (queueOverflow === 'drop-newest' || maxQueue <= 0) return;
		this.queue = [...this.queue.slice(this.queue.length - maxQueue + 1), record];
	}

	private processQueue(): void {
		while (this.queue.length > 0 && this.active.length < this.config.visibleToasts) {
			const [next, ...rest] = this.queue;
			this.queue = rest;
			next.status = 'active';
			this.active.push(next);
		}
	}
}

// Singleton perezoso: no se crea ningún $state hasta el primer uso (SSR-safe al importar)
let store: ToastStore | null = null;

export function getStore(): ToastStore {
	store ??= new ToastStore();
	return store;
}

/** Solo para tests: descarta el store para empezar cada caso desde cero. */
export function __resetToastStoreForTests(): void {
	store = null;
}
