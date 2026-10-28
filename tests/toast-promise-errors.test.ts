import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { toast } from '../src/lib';
import { __resetToastStoreForTests, getStore } from '../src/lib/toast-store.svelte';

// SEC-1: toast.promise nunca produce un rechazo no manejado si un resolver lanza.
// Sin Toaster montado: el toast "descartado" queda en estado 'exiting' dentro del store.

const unhandled: unknown[] = [];
const onUnhandled = (reason: unknown) => unhandled.push(reason);

// Cede un macrotask real para que Node emita 'unhandledRejection' si existiera alguno
const macrotask = () => new Promise<void>((resolve) => setImmediate(resolve));

const record = (id: string) => getStore().active.find((r) => r.id === id);

let consoleError: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
	__resetToastStoreForTests();
	unhandled.length = 0;
	process.on('unhandledRejection', onUnhandled);
	consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
	process.off('unhandledRejection', onUnhandled);
	consoleError.mockRestore();
	__resetToastStoreForTests();
});

describe('resolver errors (SEC-1)', () => {
	it('dismisses the toast and reports once when the success resolver throws', async () => {
		const boom = new Error('success resolver failed');
		const id = toast.promise(Promise.resolve('ok'), {
			loading: 'Loading',
			success: () => {
				throw boom;
			},
			error: 'Failed'
		});

		await macrotask();

		expect(unhandled).toEqual([]);
		expect(record(id)?.status).toBe('exiting');
		expect(consoleError).toHaveBeenCalledTimes(1);
		expect(consoleError.mock.calls[0]).toContain(boom);
	});

	it('dismisses the toast and reports once when the error resolver throws', async () => {
		const boom = new Error('error resolver failed');
		const id = toast.promise(Promise.reject(new Error('network')), {
			loading: 'Loading',
			success: 'Done',
			error: () => {
				throw boom;
			}
		});

		await macrotask();

		expect(unhandled).toEqual([]);
		expect(record(id)?.status).toBe('exiting');
		expect(consoleError).toHaveBeenCalledTimes(1);
		expect(consoleError.mock.calls[0]).toContain(boom);
	});

	it('dismisses the toast when a description resolver throws', async () => {
		const id = toast.promise(Promise.resolve('ok'), {
			loading: 'Loading',
			success: 'Done',
			error: 'Failed',
			description: {
				success: () => {
					throw new Error('description failed');
				}
			}
		});

		await macrotask();

		expect(unhandled).toEqual([]);
		expect(record(id)?.status).toBe('exiting');
		expect(consoleError).toHaveBeenCalledTimes(1);
	});
});

describe('normal paths stay unchanged (SEC-1)', () => {
	it('settles to success with the resolved title and no console error', async () => {
		const id = toast.promise(Promise.resolve('Ada'), {
			loading: 'Loading',
			success: (name) => `Hello ${name}`,
			error: 'Failed'
		});

		await macrotask();

		expect(record(id)).toMatchObject({ type: 'success', phase: 'success', title: 'Hello Ada' });
		expect(record(id)?.status).toBe('active');
		expect(consoleError).not.toHaveBeenCalled();
		expect(unhandled).toEqual([]);
	});

	it('settles to error with the resolved title and no console error', async () => {
		const id = toast.promise(Promise.reject(new Error('nope')), {
			loading: 'Loading',
			success: 'Done',
			error: (reason) => `Failed: ${(reason as Error).message}`
		});

		await macrotask();

		expect(record(id)).toMatchObject({ type: 'error', phase: 'error', title: 'Failed: nope' });
		expect(record(id)?.status).toBe('active');
		expect(consoleError).not.toHaveBeenCalled();
		expect(unhandled).toEqual([]);
	});

	it('returns the id synchronously as a string with a loading toast already in the store', () => {
		const id = toast.promise(new Promise<string>(() => {}), {
			loading: 'Loading',
			success: 'Done',
			error: 'Failed'
		});

		expect(typeof id).toBe('string');
		expect(record(id)).toMatchObject({ phase: 'loading', title: 'Loading' });
	});
});
