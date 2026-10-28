// Utilidades compartidas por los tests de componentes (solo API pública + DOM renderizado).
import { tick } from 'svelte';
import { vi } from 'vitest';
import { toast } from '../src/lib';
import { __resetToastStoreForTests } from '../src/lib/toast-store.svelte';
import { animateMock } from './mocks/motion';

/** Espera a que Svelte vacíe sus efectos pendientes. */
export async function flush(): Promise<void> {
	await tick();
}

/** Avanza el reloj falso `ms` y deja que Svelte refleje el DOM. */
export async function advance(ms: number): Promise<void> {
	await vi.advanceTimersByTimeAsync(ms);
	await tick();
}

export const toastEls = (): HTMLElement[] =>
	Array.from(document.querySelectorAll<HTMLElement>('[data-cool-toast]'));

export const toastEl = (id?: string | number): HTMLElement | null =>
	id === undefined
		? document.querySelector<HTMLElement>('[data-cool-toast]')
		: document.querySelector<HTMLElement>(`[data-cool-toast][data-id="${id}"]`);

export const toastIds = (): (string | null)[] => toastEls().map((el) => el.getAttribute('data-id'));

export const q = <T extends Element = HTMLElement>(root: ParentNode, selector: string): T | null =>
	root.querySelector<T>(selector);

export function hover(el: Element): void {
	el.dispatchEvent(new PointerEvent('pointerenter', { pointerType: 'mouse' }));
}

export function unhover(el: Element): void {
	el.dispatchEvent(new PointerEvent('pointerleave', { pointerType: 'mouse' }));
}

export function pressEscape(): void {
	document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
}

/** Estado limpio entre tests (handoff §E). */
export function resetToastEnvironment(): void {
	toast.dismiss();
	vi.runOnlyPendingTimers();
	__resetToastStoreForTests();
	animateMock.reset();
}
