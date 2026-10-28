import { MediaQuery } from 'svelte/reactivity';
import type { Theme } from './types';

export type ResolvedTheme = 'light' | 'dark';

/**
 * Crea un resolvedor de tema reactivo. `'system'` sigue `prefers-color-scheme` y se actualiza
 * con el evento `change`; en el servidor la consulta devuelve `false` (tema claro).
 * Debe llamarse durante la inicialización de un componente.
 */
export function createThemeResolver(): (theme: Theme) => ResolvedTheme {
	const prefersDark = new MediaQuery('(prefers-color-scheme: dark)', false);
	return (theme) => {
		if (theme !== 'system') return theme;
		return prefersDark.current ? 'dark' : 'light';
	};
}
