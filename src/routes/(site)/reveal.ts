const VISIBLE_THRESHOLD = 0.15;

/**
 * Añade `is-visible` cuando el elemento entra en pantalla y deja de observar.
 * El contenido es visible sin esta clase; solo repite la animación de aparición.
 * Devuelve la limpieza para usarla dentro de `$effect`.
 */
export function revealOnScroll(node: HTMLElement): () => void {
	if (typeof IntersectionObserver === 'undefined') return () => {};
	const observer = new IntersectionObserver(
		(entries) => {
			for (const entry of entries) {
				if (!entry.isIntersecting) continue;
				entry.target.classList.add('is-visible');
				observer.unobserve(entry.target);
			}
		},
		{ threshold: VISIBLE_THRESHOLD }
	);
	observer.observe(node);
	return () => observer.disconnect();
}
