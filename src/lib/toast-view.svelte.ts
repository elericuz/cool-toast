export type ViewState = 'pill' | 'morphing' | 'expanded' | 'collapsing';

/**
 * Estado visual de una instancia de toast, compartido entre el `<li>` que pinta el Toaster
 * (atributos data-*, hover, animate:flip) y el contenido que gestiona `Toast.svelte`.
 * Cada instancia queda ligada a la `version` del registro con la que se montó.
 */
export class ToastView {
	state = $state<ViewState>('pill');
	expanded = $state(false);
	hovered = $state(false);
	/** Gesto de deslizamiento en curso (`data-swiping`). */
	swiping = $state(false);
	/** Sacudida de error en curso (`data-shake`). */
	shaking = $state(false);
	readonly version: number;

	constructor(version: number) {
		this.version = version;
	}
}
