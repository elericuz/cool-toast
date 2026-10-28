import { render } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Toaster, toast } from '../src/lib';
import { advance, flush, resetToastEnvironment, toastEl, toastIds } from './helpers';

vi.mock('motion', async () => (await import('./mocks/motion')).motionMockFactory());

const li = () => toastEl('t')!;

type PointerKind = 'touch' | 'mouse';
function pointer(type: string, x: number, y = 0, pointerType: PointerKind = 'touch') {
	li().dispatchEvent(
		new PointerEvent(type, { clientX: x, clientY: y, pointerType, pointerId: 1, bubbles: true })
	);
}

beforeEach(() => {
	vi.useFakeTimers();
});
afterEach(() => {
	resetToastEnvironment();
	vi.useRealTimers();
});

describe('threshold reached (SWIPE-1, STORE-10 swipe line)', () => {
	it('dismisses past 100 px: manual flag, data-swiping during the move', async () => {
		const onDismiss = vi.fn();
		const onAutoClose = vi.fn();
		render(Toaster);
		toast('A', { id: 't', duration: Infinity, onDismiss, onAutoClose });
		await flush();

		pointer('pointerdown', 0);
		pointer('pointermove', 120);
		await flush();
		expect(li()).toHaveAttribute('data-swiping', 'true');

		pointer('pointerup', 120);
		await flush();
		expect(onDismiss).toHaveBeenCalledExactlyOnceWith('t');
		expect(onAutoClose).not.toHaveBeenCalled();
		await advance(350);
		expect(toastIds()).toEqual([]);
	});

	it('dismisses at exactly 100 px', async () => {
		render(Toaster);
		toast('A', { id: 't', duration: Infinity });
		await flush();
		pointer('pointerdown', 0);
		pointer('pointermove', 100);
		pointer('pointerup', 100);
		await advance(350);
		expect(toastIds()).toEqual([]);
	});
});

describe('below threshold (SWIPE-2)', () => {
	it('snaps back: toast stays, inline styles cleared, data-swiping removed', async () => {
		const onDismiss = vi.fn();
		render(Toaster);
		toast('A', { id: 't', duration: Infinity, onDismiss });
		await flush();

		pointer('pointerdown', 0);
		pointer('pointermove', 60);
		await flush();
		expect(li().style.transform).toBe('translateX(60px)');

		pointer('pointerup', 60);
		await advance(400);
		expect(toastIds()).toEqual(['t']);
		expect(onDismiss).not.toHaveBeenCalled();
		expect(li().style.transform).toBe('');
		expect(li().style.opacity).toBe('');
		expect(li()).not.toHaveAttribute('data-swiping');
	});

	it('pointercancel also snaps back', async () => {
		render(Toaster);
		toast('A', { id: 't', duration: Infinity });
		await flush();
		pointer('pointerdown', 0);
		pointer('pointermove', 80);
		pointer('pointercancel', 80);
		await flush();
		expect(toastIds()).toEqual(['t']);
		expect(li().style.transform).toBe('');
		expect(li()).not.toHaveAttribute('data-swiping');
	});
});

describe('live transform and opacity (SWIPE-3)', () => {
	it('follows the finger with opacity 1 − |dx|/150 and no transition', async () => {
		render(Toaster);
		toast('A', { id: 't', duration: Infinity });
		await flush();
		pointer('pointerdown', 0);
		pointer('pointermove', 75);
		await flush();
		expect(li().style.transform).toBe('translateX(75px)');
		expect(li().style.opacity).toBe('0.5');
		expect(li().style.transition).toBe('none');
	});

	it('clamps opacity at 0 from 150 px', async () => {
		render(Toaster);
		toast('A', { id: 't', duration: Infinity });
		await flush();
		pointer('pointerdown', 0);
		pointer('pointermove', 150);
		expect(li().style.opacity).toBe('0');
		pointer('pointermove', 200);
		expect(li().style.opacity).toBe('0');
		expect(li().style.transform).toBe('translateX(200px)');
	});
});

describe('dead zone and vertical rejection (SWIPE-4)', () => {
	it('ignores horizontal moves of 10 px or less', async () => {
		render(Toaster);
		toast('A', { id: 't', duration: Infinity });
		await flush();
		pointer('pointerdown', 0);
		pointer('pointermove', 8);
		expect(li().style.transform).toBe('');
		pointer('pointermove', 10);
		expect(li().style.transform).toBe('');
		pointer('pointermove', 11);
		expect(li().style.transform).toBe('translateX(11px)');
	});

	it('cancels the gesture when the first significant move is vertical', async () => {
		const onDismiss = vi.fn();
		render(Toaster);
		toast('A', { id: 't', duration: Infinity, onDismiss });
		await flush();
		pointer('pointerdown', 0, 0);
		pointer('pointermove', 3, 40);
		pointer('pointermove', 120, 40);
		expect(li().style.transform).toBe('');
		pointer('pointerup', 120, 40);
		await advance(400);
		expect(toastIds()).toEqual(['t']);
		expect(onDismiss).not.toHaveBeenCalled();
	});
});

describe('disabled (SWIPE-5)', () => {
	it('does nothing with swipeToDismiss:false', async () => {
		render(Toaster, { swipeToDismiss: false });
		toast('A', { id: 't', duration: Infinity });
		await flush();
		pointer('pointerdown', 0);
		pointer('pointermove', 120);
		expect(li().style.transform).toBe('');
		expect(li()).not.toHaveAttribute('data-swiping');
		pointer('pointerup', 120);
		await advance(400);
		expect(toastIds()).toEqual(['t']);
	});
});

describe('negative direction and mouse (SWIPE-6)', () => {
	it('dismisses a mouse swipe to the left', async () => {
		const onDismiss = vi.fn();
		render(Toaster);
		toast('A', { id: 't', duration: Infinity, onDismiss });
		await flush();
		pointer('pointerdown', 0, 0, 'mouse');
		pointer('pointermove', -120, 0, 'mouse');
		expect(li().style.transform).toBe('translateX(-120px)');
		pointer('pointerup', -120, 0, 'mouse');
		await advance(350);
		expect(onDismiss).toHaveBeenCalledTimes(1);
		expect(toastIds()).toEqual([]);
	});

	it('dismisses a touch swipe to the left', async () => {
		render(Toaster);
		toast('A', { id: 't', duration: Infinity });
		await flush();
		pointer('pointerdown', 0, 0, 'touch');
		pointer('pointermove', -130, 0, 'touch');
		pointer('pointerup', -130, 0, 'touch');
		await advance(350);
		expect(toastIds()).toEqual([]);
	});
});
