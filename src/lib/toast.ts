import { allStores, DEFAULT_TOASTER_ID, findStoreOf, getStore } from './toast-store.svelte';
import type {
	DismissFilter,
	PromiseData,
	ToastOptions,
	ToastType,
	ToastUpdateOptions
} from './types';

type ToastFn = (title: string, options?: ToastOptions) => string | number;

// Cada toast va al store del Toaster indicado en `toasterId` (TOASTER-2)
const storeFor = (options?: ToastOptions) => getStore(options?.toasterId ?? DEFAULT_TOASTER_ID);

const createTyped =
	(type: ToastType): ToastFn =>
	(title, options) =>
		storeFor(options).add({ title, type, options });

// Resuelve un valor fijo o calculado a partir del resultado de la promesa.
// Toda función es un resolver (API-6): un Snippet debe llegar envuelto en `() => snippet`.
function resolveValue<V, R>(value: R | ((input: V) => R), input: V): R {
	return typeof value === 'function' ? (value as (input: V) => R)(input) : value;
}

function promise<T>(promise: Promise<T>, data: PromiseData<T>): string {
	const { loading, success, error, description, action, ...rest } = data;
	// Sin `options.id` el store siempre genera un id de tipo string
	// El toast se liquida en el mismo store en el que nació
	const store = storeFor(rest);
	const id = store.add({
		title: loading,
		type: 'default',
		phase: 'loading',
		options: { ...rest, description: description?.loading }
	}) as string;

	// SEC-1: si un resolver o la liquidación lanzan, el toast se descarta y el error se reporta una
	// sola vez; nunca queda un rechazo sin manejar
	const settleSafely = (run: () => void) => {
		try {
			run();
		} catch (failure) {
			console.error(failure);
			store.dismiss(id);
		}
	};

	promise
		.then(
			(value) =>
				settleSafely(() =>
					store.settle(id, 'success', {
						title: resolveValue(success, value),
						description:
							description?.success === undefined
								? undefined
								: resolveValue(description.success, value),
						action: action?.success
					})
				),
			(reason: unknown) =>
				settleSafely(() =>
					store.settle(id, 'error', {
						title: resolveValue(error, reason),
						description:
							description?.error === undefined
								? undefined
								: resolveValue(description.error, reason),
						action: action?.error
					})
				)
		)
		// Red final: si el propio descarte fallara, se reporta en lugar de rechazar la promesa derivada
		.catch((failure: unknown) => console.error(failure));
	return id;
}

function update(id: string | number, options: ToastUpdateOptions): void {
	// El id es único entre Toasters: se busca en el store que lo contiene
	findStoreOf(id)?.update(id, options);
}

function dismiss(idOrFilter?: string | number | DismissFilter): void {
	// Un id afecta solo a su store; sin argumento o con filtro se aplica a todos los Toasters
	if (typeof idOrFilter === 'string' || typeof idOrFilter === 'number') {
		findStoreOf(idOrFilter)?.dismiss(idOrFilter, { manual: true });
		return;
	}
	for (const store of allStores()) store.dismiss(idOrFilter, { manual: true });
}

/** API pública para crear, actualizar y descartar toasts. */
export const toast = Object.assign(
	(title: string, options?: ToastOptions): string | number =>
		storeFor(options).add({ title, type: 'default', options }),
	{
		success: createTyped('success'),
		error: createTyped('error'),
		warning: createTyped('warning'),
		info: createTyped('info'),
		promise,
		update,
		dismiss
	}
);
