import { render } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Toaster, toast } from '../../src/lib';
import {
	advance,
	flush,
	hover,
	pressEscape,
	q,
	resetToastEnvironment,
	toastEl,
	toastIds,
	unhover
} from '../helpers';

vi.mock('motion', async () => (await import('../mocks/motion')).motionMockFactory());

const li = (id: string) => toastEl(id)!;

beforeEach(() => {
	vi.useFakeTimers();
});
afterEach(() => {
	resetToastEnvironment();
	vi.useRealTimers();
});

describe('compact auto-dismiss (RENDER-12)', () => {
	it('closes after the default 4000 ms and leaves 350 ms later', async () => {
		const onAutoClose = vi.fn();
		render(Toaster);
		toast('A', { id: 't', onAutoClose });
		await flush();

		await advance(3999);
		expect(toastIds()).toEqual(['t']);
		expect(onAutoClose).not.toHaveBeenCalled();

		await advance(1);
		expect(onAutoClose).toHaveBeenCalledExactlyOnceWith('t');
		await advance(349);
		expect(toastIds()).toEqual(['t']);
		await advance(1);
		expect(toastIds()).toEqual([]);
	});

	it('honours a custom duration option and the Toaster duration', async () => {
		render(Toaster, { duration: 2000 });
		toast('own', { id: 'own', duration: 1000 });
		toast('inherited', { id: 'inh' });
		await flush();
		await advance(1000 + 350);
		expect(toastIds()).toEqual(['inh']);
		await advance(1000);
		await advance(350);
		expect(toastIds()).toEqual([]);
	});

	it('never auto closes with duration Infinity', async () => {
		const onAutoClose = vi.fn();
		render(Toaster);
		toast('A', { id: 't', duration: Infinity, onAutoClose });
		await flush();
		await advance(60_000);
		expect(toastIds()).toEqual(['t']);
		expect(onAutoClose).not.toHaveBeenCalled();
	});
});

describe('hover pause (RENDER-11)', () => {
	it('keeps the remaining time while hovered', async () => {
		const onAutoClose = vi.fn();
		render(Toaster);
		toast('A', { id: 't', duration: 1000, onAutoClose });
		await flush();

		await advance(400);
		hover(li('t'));
		await advance(1600);
		expect(toastIds()).toEqual(['t']);
		expect(onAutoClose).not.toHaveBeenCalled();

		unhover(li('t'));
		await advance(599);
		expect(onAutoClose).not.toHaveBeenCalled();
		await advance(1);
		expect(onAutoClose).toHaveBeenCalledTimes(1);
	});
});

describe('callbacks at DOM level (STORE-10)', () => {
	const setup = () => {
		const onAutoClose = vi.fn();
		const onDismiss = vi.fn();
		return { onAutoClose, onDismiss };
	};

	it('auto close calls onAutoClose then onDismiss', async () => {
		const { onAutoClose, onDismiss } = setup();
		render(Toaster);
		toast('A', { id: 't', duration: 1000, onAutoClose, onDismiss });
		await flush();
		await advance(1000);
		expect(onAutoClose).toHaveBeenCalledTimes(1);
		expect(onDismiss).toHaveBeenCalledTimes(1);
		expect(onAutoClose.mock.invocationCallOrder[0]).toBeLessThan(
			onDismiss.mock.invocationCallOrder[0]
		);
	});

	it('toast.dismiss(id) at 500 ms calls only onDismiss and the timer never fires again', async () => {
		const { onAutoClose, onDismiss } = setup();
		render(Toaster);
		toast('A', { id: 't', duration: 1000, onAutoClose, onDismiss });
		await flush();
		await advance(500);
		toast.dismiss('t');
		await advance(2000);
		expect(onDismiss).toHaveBeenCalledTimes(1);
		expect(onAutoClose).not.toHaveBeenCalled();
		expect(toastIds()).toEqual([]);
	});

	it('Escape calls only onDismiss', async () => {
		const { onAutoClose, onDismiss } = setup();
		render(Toaster);
		toast('A', { id: 't', duration: 1000, onAutoClose, onDismiss });
		await flush();
		pressEscape();
		await advance(2000);
		expect(onDismiss).toHaveBeenCalledTimes(1);
		expect(onAutoClose).not.toHaveBeenCalled();
	});

	it('the close button calls only onDismiss', async () => {
		const { onAutoClose, onDismiss } = setup();
		render(Toaster, { closeButton: true });
		toast('A', { id: 't', duration: 1000, onAutoClose, onDismiss });
		await flush();
		q<HTMLButtonElement>(li('t'), 'button[data-cool-toast-close]')!.click();
		await advance(2000);
		expect(onDismiss).toHaveBeenCalledTimes(1);
		expect(onAutoClose).not.toHaveBeenCalled();
	});
});

describe('toast.dismiss() at DOM level (STORE-8)', () => {
	it('removes every active toast within 350 ms and never renders the queued ones', async () => {
		const onDismiss = vi.fn();
		const onAutoClose = vi.fn();
		render(Toaster);
		for (const id of ['a1', 'a2', 'a3', 'q1', 'q2']) {
			toast(id, { id, duration: Infinity, onDismiss, onAutoClose });
		}
		await flush();
		expect(toastIds().sort()).toEqual(['a1', 'a2', 'a3']);

		toast.dismiss();
		await advance(350);

		expect(toastIds()).toEqual([]);
		expect(onDismiss.mock.calls.map((c) => c[0]).sort()).toEqual(['a1', 'a2', 'a3']);
		expect(onAutoClose).not.toHaveBeenCalled();
	});
});

describe('queue advance at DOM level (STORE-11)', () => {
	it('shows the queued toast only after the exiting one is gone', async () => {
		const onDismiss = vi.fn();
		render(Toaster, { visibleToasts: 1 });
		toast('a', { id: 'a', duration: 1000, onDismiss });
		toast('b', { id: 'b', duration: Infinity });
		await flush();
		expect(toastIds()).toEqual(['a']);

		await advance(1000);
		expect(onDismiss).toHaveBeenCalledTimes(1);
		expect(toastIds()).toEqual(['a']);
		await advance(349);
		expect(toastIds()).toEqual(['a']);
		await advance(1);
		expect(toastIds()).toEqual(['b']);
	});
});
