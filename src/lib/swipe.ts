import type { Attachment } from 'svelte/attachments';
import { SWIPE_DEAD_ZONE_PX, SWIPE_FADE_DISTANCE_PX, SWIPE_THRESHOLD_PX } from './constants';

export interface SwipeOptions {
	/** Se consulta en cada `pointerdown`: permite activar o desactivar el gesto en caliente. */
	enabled: () => boolean;
	onSwipingChange: (swiping: boolean) => void;
	/** Se llama al soltar pasado el umbral (descarte manual). */
	onDismiss: () => void;
}

/**
 * Attachment de deslizamiento horizontal para descartar (Pointer Events: ratón y táctil).
 * Zona muerta de SWIPE_DEAD_ZONE_PX; un primer movimiento vertical cancela el gesto; al soltar
 * desde SWIPE_THRESHOLD_PX se descarta y, si no, vuelve a su sitio.
 */
export function swipe(options: SwipeOptions): Attachment<HTMLElement> {
	return (node) => {
		let pointerId: number | null = null;
		let startX = 0;
		let startY = 0;
		let active = false;

		const reset = () => {
			node.style.transform = '';
			node.style.opacity = '';
			node.style.transition = '';
			if (active) options.onSwipingChange(false);
			active = false;
			pointerId = null;
		};

		const onDown = (event: PointerEvent) => {
			if (!options.enabled()) return;
			pointerId = event.pointerId;
			startX = event.clientX;
			startY = event.clientY;
			active = false;
			node.setPointerCapture?.(event.pointerId);
		};

		const onMove = (event: PointerEvent) => {
			if (event.pointerId !== pointerId) return;
			const dx = event.clientX - startX;
			const dy = event.clientY - startY;
			if (!active) {
				// Un desplazamiento mayormente vertical se deja al scroll de la página
				if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > SWIPE_DEAD_ZONE_PX) {
					pointerId = null;
					return;
				}
				if (Math.abs(dx) <= SWIPE_DEAD_ZONE_PX) return;
				active = true;
				options.onSwipingChange(true);
			}
			node.style.transition = 'none';
			node.style.transform = `translateX(${dx}px)`;
			node.style.opacity = String(Math.max(0, 1 - Math.abs(dx) / SWIPE_FADE_DISTANCE_PX));
		};

		const onUp = (event: PointerEvent) => {
			if (event.pointerId !== pointerId) return;
			const dx = event.clientX - startX;
			if (active && Math.abs(dx) >= SWIPE_THRESHOLD_PX) {
				// Se conserva el desplazamiento: el toast sale desde donde lo soltó el usuario
				options.onSwipingChange(false);
				active = false;
				pointerId = null;
				options.onDismiss();
				return;
			}
			reset();
		};

		const onCancel = (event: PointerEvent) => {
			if (event.pointerId === pointerId) reset();
		};

		node.addEventListener('pointerdown', onDown);
		node.addEventListener('pointermove', onMove);
		node.addEventListener('pointerup', onUp);
		node.addEventListener('pointercancel', onCancel);
		return () => {
			node.removeEventListener('pointerdown', onDown);
			node.removeEventListener('pointermove', onMove);
			node.removeEventListener('pointerup', onUp);
			node.removeEventListener('pointercancel', onCancel);
		};
	};
}
