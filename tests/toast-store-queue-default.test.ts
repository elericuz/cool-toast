import { render } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Toaster, toast } from '../src/lib';
import { __resetToastStoreForTests, getStore } from '../src/lib/toast-store.svelte';
import { flush, resetToastEnvironment } from './helpers';

vi.mock('motion', async () => (await import('../tests/mocks/motion')).motionMockFactory());

// SEC-2: `maxQueue` por defecto es 100 (antes Infinity); `queueOverflow` sigue en 'drop-oldest'.

const ids = (records: { id: string | number }[]) => records.map((record) => record.id);
const addMany = (count: number) => {
	for (let i = 1; i <= count; i++) toast(`T${i}`, { id: `t${i}` });
};

beforeEach(() => {
	vi.useFakeTimers();
	__resetToastStoreForTests();
});

afterEach(() => {
	resetToastEnvironment();
	vi.useRealTimers();
});

describe('store default config (SEC-2)', () => {
	it('defaults maxQueue to 100 and keeps drop-oldest', () => {
		expect(getStore().config.maxQueue).toBe(100);
		expect(getStore().config.queueOverflow).toBe('drop-oldest');
	});

	it('keeps 1 active + 100 queued and drops the oldest queued when 102 toasts are added', () => {
		getStore().setConfig({ visibleToasts: 1 });
		addMany(102);

		expect(ids(getStore().active)).toEqual(['t1']);
		expect(getStore().queue).toHaveLength(100);
		// t2 era el más antiguo en cola y fue descartado
		expect(getStore().queue[0].id).toBe('t3');
		expect(getStore().queue.at(-1)?.id).toBe('t102');
	});

	it('still allows an unbounded queue when maxQueue is explicitly Infinity', () => {
		getStore().setConfig({ visibleToasts: 1, maxQueue: Infinity });
		addMany(150);

		expect(getStore().active).toHaveLength(1);
		expect(getStore().queue).toHaveLength(149);
	});
});

describe('Toaster default (SEC-2)', () => {
	it('applies maxQueue 100 when the Toaster does not set it', async () => {
		render(Toaster, { visibleToasts: 1 });
		await flush();
		addMany(102);
		await flush();

		expect(getStore().config.maxQueue).toBe(100);
		expect(getStore().active).toHaveLength(1);
		expect(getStore().queue).toHaveLength(100);
		expect(getStore().queue[0].id).toBe('t3');
	});

	it('accepts maxQueue Infinity explicitly on the Toaster', async () => {
		render(Toaster, { visibleToasts: 1, maxQueue: Infinity });
		await flush();
		addMany(150);
		await flush();

		expect(getStore().queue).toHaveLength(149);
	});
});
