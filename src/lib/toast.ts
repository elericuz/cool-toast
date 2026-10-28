import { getStore } from './toast-store.svelte';
import type {
	DismissFilter,
	PromiseData,
	ToastOptions,
	ToastType,
	ToastUpdateOptions
} from './types';

type ToastFn = (title: string, options?: ToastOptions) => string | number;

const createTyped =
	(type: ToastType): ToastFn =>
	(title, options) =>
		getStore().add({ title, type, options });

// Resuelve un valor fijo o calculado a partir del resultado de la promesa.
// Toda función es un resolver (API-6): un Snippet debe llegar envuelto en `() => snippet`.
function resolveValue<V, R>(value: R | ((input: V) => R), input: V): R {
	return typeof value === 'function' ? (value as (input: V) => R)(input) : value;
}

function promise<T>(promise: Promise<T>, data: PromiseData<T>): string {
	const { loading, success, error, description, action, ...rest } = data;
	// Sin `options.id` el store siempre genera un id de tipo string
	const id = getStore().add({
		title: loading,
		type: 'default',
		phase: 'loading',
		options: { ...rest, description: description?.loading }
	}) as string;

	promise.then(
		(value) =>
			getStore().settle(id, 'success', {
				title: resolveValue(success, value),
				description:
					description?.success === undefined ? undefined : resolveValue(description.success, value),
				action: action?.success
			}),
		(reason: unknown) =>
			getStore().settle(id, 'error', {
				title: resolveValue(error, reason),
				description:
					description?.error === undefined ? undefined : resolveValue(description.error, reason),
				action: action?.error
			})
	);
	return id;
}

function update(id: string | number, options: ToastUpdateOptions): void {
	getStore().update(id, options);
}

function dismiss(idOrFilter?: string | number | DismissFilter): void {
	getStore().dismiss(idOrFilter, { manual: true });
}

/** API pública para crear, actualizar y descartar toasts. */
export const toast = Object.assign(
	(title: string, options?: ToastOptions): string | number =>
		getStore().add({ title, type: 'default', options }),
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
