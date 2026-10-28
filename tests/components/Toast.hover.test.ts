import { render } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Toaster, toast } from '../../src/lib';
import { animateMock } from '../mocks/motion';
import { advance, flush, hover, q, resetToastEnvironment, toastEl, unhover } from '../helpers';

vi.mock('motion', async () => (await import('../mocks/motion')).motionMockFactory());

const li = () => toastEl('t')!;
const expandedToast = (extra: Record<string, unknown> = {}) =>
	toast('Saved', { id: 't', description: 'Body', ...extra });

// Lleva el toast hasta `collapsing` con el mock en modo manual
async function reachCollapsing() {
	await advance(330);
	await advance(2769);
	animateMock.setMode('manual');
	await advance(1);
	expect(li()).toHaveAttribute('data-state', 'collapsing');
}

beforeEach(() => {
	vi.useFakeTimers();
});
afterEach(() => {
	resetToastEnvironment();
	vi.useRealTimers();
});

describe('hover during collapse (ANIM-3)', () => {
	it('re-expands from the current t: morphing, then expanded', async () => {
		render(Toaster);
		expandedToast();
		await reachCollapsing();
		animateMock.progressAll(0.5);

		hover(li());
		await flush();

		expect(li()).toHaveAttribute('data-state', 'morphing');
		expect(li()).toHaveAttribute('data-expanded', 'true');
		expect(animateMock.calls.at(-1)).toMatchObject({ from: 0.5, to: 1 });
		animateMock.completeAll();
		await flush();
		expect(li()).toHaveAttribute('data-state', 'expanded');
		expect(q(li(), '[data-cool-toast-description]')).toHaveTextContent('Body');
	});

	it('does not dismiss while hovered', async () => {
		const onDismiss = vi.fn();
		render(Toaster);
		expandedToast({ onDismiss });
		await reachCollapsing();
		hover(li());
		await flush();
		animateMock.completeAll();
		await advance(20_000);
		expect(onDismiss).not.toHaveBeenCalled();
		expect(li()).toHaveAttribute('data-state', 'expanded');
	});

	it('re-keys the progress bar (a new element instance)', async () => {
		render(Toaster, { showProgress: true });
		expandedToast();
		await advance(330);
		const before = q(li(), '[data-cool-toast-progress]')!;
		expect(before).not.toBeNull();
		await advance(2769);
		animateMock.setMode('manual');
		await advance(1);

		hover(li());
		await flush();
		animateMock.completeAll();
		await flush();

		const after = q(li(), '[data-cool-toast-progress]')!;
		expect(after).not.toBeNull();
		expect(after).not.toBe(before);
		expect(before.isConnected).toBe(false);
	});

	it('collapses again after the pointer leaves, a full display time later', async () => {
		const onDismiss = vi.fn();
		render(Toaster);
		expandedToast({ onDismiss });
		await reachCollapsing();
		hover(li());
		await flush();
		animateMock.completeAll();
		await advance(5000);
		expect(li()).toHaveAttribute('data-state', 'expanded');

		unhover(li());
		await advance(2769);
		expect(li()).toHaveAttribute('data-state', 'expanded');
		await advance(1);
		expect(li()).toHaveAttribute('data-state', 'collapsing');
	});

	it('hovering while fully expanded only pauses (no extra animation)', async () => {
		render(Toaster);
		expandedToast();
		await advance(330);
		// deja pasar el squish de expansión (80 ms) para medir solo lo que provoca el hover
		await advance(100);
		const callsBefore = animateMock.calls.length;
		hover(li());
		await advance(10_000);
		expect(animateMock.calls).toHaveLength(callsBefore);
		expect(li()).toHaveAttribute('data-state', 'expanded');
		expect(li()).toHaveAttribute('data-hovered', 'true');
	});
});

describe('hover and swipe interplay (SWIPE-7)', () => {
	const pointer = (type: string, x: number) =>
		li().dispatchEvent(
			new PointerEvent(type, {
				clientX: x,
				clientY: 0,
				pointerType: 'touch',
				pointerId: 1,
				bubbles: true
			})
		);

	it('keeps the timer paused during a swipe and resumes after snap-back and pointerleave', async () => {
		const onAutoClose = vi.fn();
		render(Toaster);
		toast('A', { id: 't', duration: 1000, onAutoClose });
		await flush();

		await advance(400);
		hover(li());
		pointer('pointerdown', 0);
		pointer('pointermove', 60);
		await advance(5000);
		pointer('pointerup', 60);
		await advance(5000);
		expect(li()).toBeInTheDocument();
		expect(onAutoClose).not.toHaveBeenCalled();

		unhover(li());
		await advance(599);
		expect(onAutoClose).not.toHaveBeenCalled();
		await advance(1);
		expect(onAutoClose).toHaveBeenCalledTimes(1);
	});
});

describe('hover never reverts a successLabel collapse (ANIM-3b)', () => {
	it('keeps collapsing and still dismisses manually 1200 ms after the collapse', async () => {
		const onDismiss = vi.fn();
		render(Toaster);
		toast('Saved', {
			id: 't',
			description: 'Body',
			onDismiss,
			action: { label: 'Undo', onClick: vi.fn(), successLabel: 'Undone' }
		});
		await advance(330);
		animateMock.setMode('manual');
		q<HTMLButtonElement>(li(), 'button[data-cool-toast-action]')!.click();
		await flush();
		expect(li()).toHaveAttribute('data-state', 'collapsing');
		const callsBefore = animateMock.calls.length;

		hover(li());
		await flush();

		expect(li()).toHaveAttribute('data-state', 'collapsing');
		expect(animateMock.calls.slice(callsBefore).filter((call) => call.to === 1)).toHaveLength(0);

		animateMock.completeAll();
		await flush();
		expect(li()).toHaveAttribute('data-state', 'pill');
		await advance(1199);
		expect(onDismiss).not.toHaveBeenCalled();
		await advance(1);
		expect(onDismiss).toHaveBeenCalledExactlyOnceWith('t');
	});
});
