import { MediaQuery } from 'svelte/reactivity';

const QUERY = '(prefers-reduced-motion: reduce)';

/**
 * Preferencia `prefers-reduced-motion` reactiva. Perezosa: `matchMedia` solo se consulta al
 * crearla; en el servidor (sin `window`) devuelve siempre `false` sin lanzar errores.
 */
export function createReducedMotion(): { readonly current: boolean } {
	if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
		return { current: false };
	}
	return new MediaQuery(QUERY, false);
}
