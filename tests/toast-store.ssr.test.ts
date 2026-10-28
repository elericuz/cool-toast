// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// STORE-1: sin `window` el módulo se importa sin efectos ni temporizadores
describe('toast store without a DOM (STORE-1)', () => {
	beforeEach(() => {
		vi.resetModules();
		vi.useFakeTimers();
	});
	afterEach(() => {
		vi.useRealTimers();
	});

	it('runs in an environment without window', () => {
		expect(typeof window).toBe('undefined');
	});

	it('imports without throwing and without scheduling timers', async () => {
		const setTimeoutSpy = vi.spyOn(globalThis, 'setTimeout');
		await expect(import('../src/lib/toast-store.svelte')).resolves.toBeDefined();
		await expect(import('../src/lib/toast')).resolves.toBeDefined();
		expect(setTimeoutSpy).not.toHaveBeenCalled();
		expect(vi.getTimerCount()).toBe(0);
	});

	it('creates records on the server without starting timers', async () => {
		const { toast } = await import('../src/lib/toast');
		const { getStore } = await import('../src/lib/toast-store.svelte');
		const id = toast('Server side', { id: 'ssr' });
		expect(id).toBe('ssr');
		expect(getStore().active[0]).toMatchObject({ id: 'ssr', title: 'Server side' });
		expect(vi.getTimerCount()).toBe(0);
	});
});
