import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { toast } from '../src/lib/toast';
import { __resetToastStoreForTests, getStore } from '../src/lib/toast-store.svelte';

// Contrato del store (lo fija este archivo):
//   getStore().active  → registros visibles (status 'active' | 'exiting'), en orden de creación
//   getStore().queue   → registros en espera (status 'queued'), FIFO
//   getStore().dismiss(idOrFilter?, { manual = true })  → marca 'exiting' y dispara callbacks
//   getStore().remove(id)                               → fin de la transición de salida; avanza la cola
//   getStore().setConfig(partial)                       → { visibleToasts, maxQueue, queueOverflow, ... }
//   getStore().update(id, options)                      → también para toasts en cola
//   getStore().settle(id, 'success' | 'error', { title, description?, action? })
//   getStore().add({ title, type, phase?, options })    → id
const ids = (records: { id: string | number }[]) => records.map((record) => record.id);

beforeEach(() => {
	vi.useFakeTimers();
	__resetToastStoreForTests();
});

afterEach(() => {
	toast.dismiss();
	vi.runOnlyPendingTimers();
	__resetToastStoreForTests();
	vi.useRealTimers();
});

describe('records', () => {
	it('STORE-2 generates distinct non-empty string ids', () => {
		const first = toast('A');
		const second = toast('A');
		expect(typeof first).toBe('string');
		expect((first as string).length).toBeGreaterThan(0);
		expect(second).not.toBe(first);
		expect(ids(getStore().active)).toEqual([first, second]);
	});

	it('STORE-2 keeps custom string and number ids and dismisses exactly those', () => {
		expect(toast('A', { id: 'x' })).toBe('x');
		expect(toast('B', { id: 7 })).toBe(7);
		toast.dismiss('x');
		expect(getStore().active.map((r) => [r.id, r.status])).toEqual([
			['x', 'exiting'],
			[7, 'active']
		]);
		toast.dismiss(7);
		expect(getStore().active.map((r) => r.status)).toEqual(['exiting', 'exiting']);
	});

	it('STORE-3 default toast has type and phase "default"', () => {
		toast('A');
		expect(getStore().active[0]).toMatchObject({ title: 'A', type: 'default', phase: 'default' });
	});

	it.each(['success', 'error', 'warning', 'info'] as const)(
		'STORE-3 toast.%s has matching type and phase',
		(type) => {
			toast[type]('A');
			expect(getStore().active[0]).toMatchObject({ type, phase: type });
		}
	);

	it('stores description and action from the options', () => {
		const action = { label: 'Undo', onClick: vi.fn() };
		toast('A', { description: 'Body', action });
		expect(getStore().active[0]).toMatchObject({ description: 'Body', action });
	});

	it('STORE-7 dismissing a queued toast removes it silently', () => {
		const onDismiss = vi.fn();
		getStore().setConfig({ visibleToasts: 1 });
		toast('A', { id: 'a' });
		toast('Q', { id: 'q', onDismiss });
		expect(ids(getStore().queue)).toEqual(['q']);
		toast.dismiss('q');
		expect(getStore().queue).toHaveLength(0);
		expect(onDismiss).not.toHaveBeenCalled();
		expect(getStore().active.map((r) => [r.id, r.status])).toEqual([['a', 'active']]);
	});

	it('STORE-8 dismiss() clears the queue and exits every active toast once', () => {
		const onDismiss = vi.fn();
		const onAutoClose = vi.fn();
		const callbacks = { onDismiss, onAutoClose };
		for (const id of ['a1', 'a2', 'a3']) toast(id, { id, ...callbacks });
		for (const id of ['q1', 'q2']) toast(id, { id, ...callbacks });
		expect(ids(getStore().queue)).toEqual(['q1', 'q2']);

		toast.dismiss();

		expect(getStore().queue).toHaveLength(0);
		expect(getStore().active.map((r) => r.status)).toEqual(['exiting', 'exiting', 'exiting']);
		expect(onDismiss.mock.calls.map((c) => c[0])).toEqual(['a1', 'a2', 'a3']);
		expect(onAutoClose).not.toHaveBeenCalled();

		for (const id of ['a1', 'a2', 'a3']) getStore().remove(id);
		expect(getStore().active).toHaveLength(0);
		expect(getStore().queue).toHaveLength(0);
	});

	it('STORE-9 dismiss({ type }) hits active and queued toasts of that type only', () => {
		getStore().setConfig({ visibleToasts: 2 });
		toast.success('s1', { id: 's1' });
		toast.error('e1', { id: 'e1' });
		toast.success('s2', { id: 's2' });
		toast.info('i2', { id: 'i2' });

		toast.dismiss({ type: 'success' });
		expect(getStore().active.map((r) => [r.id, r.status])).toEqual([
			['s1', 'exiting'],
			['e1', 'active']
		]);
		expect(ids(getStore().queue)).toEqual(['i2']);

		toast.dismiss({ type: ['error', 'info'] });
		expect(getStore().active.map((r) => r.status)).toEqual(['exiting', 'exiting']);
		expect(getStore().queue).toHaveLength(0);
	});

	it('UPDATE-5 unknown ids are no-ops and leave existing toasts untouched', () => {
		toast('A', { id: 'a' });
		expect(() => {
			toast.update('nope', { title: 'x' });
			toast.dismiss('nope');
			getStore().settle('nope', 'success', { title: 'x' });
		}).not.toThrow();
		expect(getStore().active).toHaveLength(1);
		expect(getStore().active[0]).toMatchObject({ id: 'a', title: 'A', status: 'active' });
	});
});

describe('existing id (STORE-14)', () => {
	it('updates an active record in place: one record, same position, new content and options', () => {
		const oldDismiss = vi.fn();
		const newDismiss = vi.fn();
		toast('first', { id: 'a' });
		toast('A', { id: 'x', onDismiss: oldDismiss });
		toast('last', { id: 'z' });

		const returned = toast.success('B', { id: 'x', description: 'd', onDismiss: newDismiss });

		expect(returned).toBe('x');
		expect(ids(getStore().active)).toEqual(['a', 'x', 'z']);
		expect(getStore().active[1]).toMatchObject({
			title: 'B',
			type: 'success',
			phase: 'success',
			description: 'd',
			status: 'active'
		});
		toast.dismiss('x');
		expect(newDismiss).toHaveBeenCalledTimes(1);
		expect(oldDismiss).not.toHaveBeenCalled();
	});

	it('updates a queued record in place without promoting it or duplicating it', () => {
		getStore().setConfig({ visibleToasts: 1 });
		toast('a', { id: 'a' });
		toast('q1', { id: 'q1' });
		toast('q2', { id: 'q2' });

		toast.warning('Changed', { id: 'q1', description: 'd' });

		expect(ids(getStore().active)).toEqual(['a']);
		expect(ids(getStore().queue)).toEqual(['q1', 'q2']);
		expect(getStore().queue[0]).toMatchObject({
			title: 'Changed',
			type: 'warning',
			description: 'd'
		});
	});

	it('bumps record.version so the component restarts the lifetime timer', () => {
		toast('A', { id: 'x' });
		const before = getStore().active[0].version;
		toast('B', { id: 'x' });
		const afterFirst = getStore().active[0].version;
		toast('C', { id: 'x' });
		const afterSecond = getStore().active[0].version;
		expect(afterFirst).toBeGreaterThan(before);
		expect(afterSecond).toBeGreaterThan(afterFirst);
		expect(getStore().active).toHaveLength(1);
	});

	it('resurrects a record whose dismissal is in progress', () => {
		const firstDismiss = vi.fn();
		const secondDismiss = vi.fn();
		toast('A', { id: 'x', onDismiss: firstDismiss });
		const before = getStore().active[0].version;
		toast.dismiss('x');
		expect(getStore().active[0].status).toBe('exiting');

		toast.success('B', { id: 'x', onDismiss: secondDismiss });

		expect(getStore().active).toHaveLength(1);
		expect(getStore().active[0]).toMatchObject({
			id: 'x',
			title: 'B',
			type: 'success',
			status: 'active'
		});
		expect(getStore().active[0].version).toBeGreaterThan(before);
		expect(firstDismiss).toHaveBeenCalledTimes(1);

		// la resurrección cancela el cierre: un nuevo dismiss vuelve a funcionar con los callbacks nuevos
		toast.dismiss('x');
		expect(getStore().active[0].status).toBe('exiting');
		expect(secondDismiss).toHaveBeenCalledTimes(1);
		expect(firstDismiss).toHaveBeenCalledTimes(1);
	});

	it('update() and settle() keep the version (in-place changes)', () => {
		toast('A', { id: 'x' });
		getStore().add({ title: 'Saving', type: 'default', phase: 'loading', options: { id: 'p' } });
		const [x, p] = getStore().active;
		const versions = [x.version, p.version];

		toast.update('x', { title: 'B', type: 'success' });
		getStore().settle('p', 'success', { title: 'Done' });

		expect(getStore().active.map((r) => r.version)).toEqual(versions);
		expect(getStore().active.map((r) => r.title)).toEqual(['B', 'Done']);
	});

	it('remove(id, version) ignores a stale version after a resurrection', () => {
		toast('A', { id: 'x' });
		const stale = getStore().active[0].version;
		toast.dismiss('x');
		toast('B', { id: 'x' });
		expect(getStore().active[0].version).toBeGreaterThan(stale);

		getStore().remove('x', stale);

		expect(ids(getStore().active)).toEqual(['x']);
		expect(getStore().active[0]).toMatchObject({ title: 'B', status: 'active' });
	});

	it('remove(id, version) removes the matching exiting record and promotes the queue', () => {
		getStore().setConfig({ visibleToasts: 1 });
		toast('A', { id: 'x' });
		toast('Q', { id: 'q' });
		toast.dismiss('x');
		const current = getStore().active[0].version;

		getStore().remove('x', current);

		expect(ids(getStore().active)).toEqual(['q']);
		expect(getStore().queue).toHaveLength(0);
	});

	it('remove(id, version) does not remove a record that is still active', () => {
		toast('A', { id: 'x' });
		getStore().remove('x', getStore().active[0].version);
		expect(ids(getStore().active)).toEqual(['x']);
	});

	it('does not touch other records and different ids still create new records', () => {
		toast('A', { id: 'x' });
		const versionX = getStore().active[0].version;
		toast('B', { id: 'y' });
		expect(ids(getStore().active)).toEqual(['x', 'y']);
		expect(getStore().active[0].version).toBe(versionX);
	});
});

describe('queue', () => {
	it('STORE-4 caps visible toasts at 3 and queues the rest FIFO', () => {
		for (const id of [1, 2, 3, 4, 5]) toast(String(id), { id });
		expect(ids(getStore().active)).toEqual([1, 2, 3]);
		expect(ids(getStore().queue)).toEqual([4, 5]);

		toast.dismiss(1);
		getStore().remove(1);

		expect(ids(getStore().active)).toEqual([2, 3, 4]);
		expect(ids(getStore().queue)).toEqual([5]);
	});

	it('STORE-5 drop-oldest removes the oldest queued toast when maxQueue is exceeded', () => {
		getStore().setConfig({ visibleToasts: 1, maxQueue: 2 });
		for (const id of ['a', 'b', 'c', 'd']) toast(id, { id });
		expect(ids(getStore().active)).toEqual(['a']);
		expect(ids(getStore().queue)).toEqual(['c', 'd']);
	});

	it('STORE-6 drop-newest rejects the incoming toast but still returns an id', () => {
		getStore().setConfig({ visibleToasts: 1, maxQueue: 2, queueOverflow: 'drop-newest' });
		for (const id of ['a', 'b', 'c']) toast(id, { id });
		const returned = toast('d', { id: 'd' });
		expect(returned).toBe('d');
		expect(ids(getStore().active)).toEqual(['a']);
		expect(ids(getStore().queue)).toEqual(['b', 'c']);
	});

	it('STORE-11 advances the queue only after the exiting record is removed', () => {
		const onDismiss = vi.fn();
		getStore().setConfig({ visibleToasts: 1 });
		toast('a', { id: 'a', onDismiss });
		toast('b', { id: 'b' });

		getStore().dismiss('a', { manual: false });
		expect(onDismiss).toHaveBeenCalledTimes(1);
		expect(ids(getStore().queue)).toEqual(['b']);
		expect(getStore().active.map((r) => [r.id, r.status])).toEqual([['a', 'exiting']]);

		getStore().remove('a');
		expect(getStore().active.map((r) => [r.id, r.status])).toEqual([['b', 'active']]);
		expect(getStore().queue).toHaveLength(0);
	});

	it('STORE-13 raising visibleToasts promotes queued toasts without a new toast() call', () => {
		getStore().setConfig({ visibleToasts: 1 });
		toast('a', { id: 'a' });
		toast('b', { id: 'b' });
		expect(ids(getStore().queue)).toEqual(['b']);

		getStore().setConfig({ visibleToasts: 2 });

		expect(ids(getStore().active)).toEqual(['a', 'b']);
		expect(getStore().queue).toHaveLength(0);
	});

	it('STORE-13 lowering visibleToasts does not evict active toasts', () => {
		getStore().setConfig({ visibleToasts: 3 });
		for (const id of ['a', 'b', 'c']) toast(id, { id });
		getStore().setConfig({ visibleToasts: 1 });
		toast('d', { id: 'd' });
		expect(ids(getStore().active)).toEqual(['a', 'b', 'c']);
		expect(ids(getStore().queue)).toEqual(['d']);
	});
});

describe('callbacks/update', () => {
	it('STORE-10 auto close calls onAutoClose then onDismiss once each', () => {
		const onAutoClose = vi.fn();
		const onDismiss = vi.fn();
		toast('A', { id: 'a', onAutoClose, onDismiss });

		getStore().dismiss('a', { manual: false });
		getStore().dismiss('a', { manual: false });

		expect(onAutoClose).toHaveBeenCalledExactlyOnceWith('a');
		expect(onDismiss).toHaveBeenCalledExactlyOnceWith('a');
		expect(onAutoClose.mock.invocationCallOrder[0]).toBeLessThan(
			onDismiss.mock.invocationCallOrder[0]
		);
	});

	it('STORE-10 manual dismissal (toast.dismiss or { manual: true }) calls only onDismiss', () => {
		const onAutoClose = vi.fn();
		const onDismiss = vi.fn();
		toast('A', { id: 'a', onAutoClose, onDismiss });
		toast('B', { id: 'b', onAutoClose, onDismiss });

		toast.dismiss('a');
		getStore().dismiss('b', { manual: true });

		expect(onDismiss.mock.calls.map((c) => c[0])).toEqual(['a', 'b']);
		expect(onAutoClose).not.toHaveBeenCalled();
	});

	it('UPDATE-1 update changes title, description and type/phase of an active toast', () => {
		toast('Old', { id: 'a' });
		toast.update('a', { title: 'New', description: 'Desc', type: 'success' });
		expect(getStore().active[0]).toMatchObject({
			id: 'a',
			title: 'New',
			description: 'Desc',
			type: 'success',
			phase: 'success'
		});
	});

	it('UPDATE-1 update only touches the provided fields', () => {
		toast('Keep', { id: 'a', description: 'Body' });
		toast.update('a', { title: 'Changed' });
		expect(getStore().active[0]).toMatchObject({
			title: 'Changed',
			description: 'Body',
			type: 'default'
		});
	});

	it('UPDATE-4 updating a queued toast applies when it becomes active', () => {
		getStore().setConfig({ visibleToasts: 1 });
		toast('a', { id: 'a' });
		toast('b', { id: 'b' });

		toast.update('b', { title: 'Later', type: 'warning' });
		expect(getStore().queue[0]).toMatchObject({ title: 'Later', type: 'warning' });

		toast.dismiss('a');
		getStore().remove('a');
		expect(getStore().active[0]).toMatchObject({
			id: 'b',
			title: 'Later',
			type: 'warning',
			status: 'active'
		});
	});

	it('UPDATE-4 an updated queued toast matches dismiss({ type }) with its new type', () => {
		getStore().setConfig({ visibleToasts: 1 });
		toast('a', { id: 'a' });
		toast('b', { id: 'b' });
		toast.update('b', { type: 'warning' });

		toast.dismiss({ type: 'warning' });

		expect(getStore().queue).toHaveLength(0);
		expect(getStore().active[0]).toMatchObject({ id: 'a', status: 'active' });
	});

	it('PROMISE-7 settle moves a loading record to its final phase', () => {
		const id = getStore().add({
			title: 'Saving',
			type: 'default',
			phase: 'loading',
			options: { id: 'p' }
		});
		expect(id).toBe('p');
		expect(getStore().active[0]).toMatchObject({ type: 'default', phase: 'loading' });

		getStore().settle('p', 'success', { title: 'Saved', description: 'ok' });
		expect(getStore().active[0]).toMatchObject({
			title: 'Saved',
			description: 'ok',
			type: 'success',
			phase: 'success'
		});

		getStore().add({ title: 'Saving', type: 'default', phase: 'loading', options: { id: 'q' } });
		getStore().settle('q', 'error', { title: 'Failed' });
		expect(getStore().active[1]).toMatchObject({ title: 'Failed', type: 'error', phase: 'error' });
	});

	it('PROMISE-7 settle after the record was dismissed and removed is a no-op', () => {
		getStore().add({ title: 'Saving', type: 'default', phase: 'loading', options: { id: 'p' } });
		toast.dismiss('p');
		getStore().remove('p');

		expect(() => getStore().settle('p', 'success', { title: 'Saved' })).not.toThrow();
		expect(getStore().active).toHaveLength(0);
		expect(getStore().queue).toHaveLength(0);
	});
});
