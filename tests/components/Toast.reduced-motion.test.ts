import { render } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Toaster, toast } from '../../src/lib';
import { morphPath } from '../../src/lib/morph-path';
import { setMediaQuery } from '../setup';
import { animateMock } from '../mocks/motion';
import { advance, flush, q, resetToastEnvironment, toastEl, toastIds } from '../helpers';

vi.mock('motion', async () => (await import('../mocks/motion')).motionMockFactory());

const li = () => toastEl('t')!;
const norm = (d: string | null) => (d ?? '').replace(/\s+/g, ' ').trim();
const pathD = () => q(li(), 'svg[data-cool-toast-blob] > path')!.getAttribute('d');
const reduce = () => setMediaQuery('(prefers-reduced-motion: reduce)', true);
const expandedToast = (extra: Record<string, unknown> = {}) =>
	toast('Saved', { id: 't', description: 'Body', ...extra });

beforeEach(() => {
	vi.useFakeTimers();
});
afterEach(() => {
	resetToastEnvironment();
	vi.useRealTimers();
});

describe('snapping (ANIM-4)', () => {
	it('expands at 0 ms with the final path and never calls animate', async () => {
		reduce();
		render(Toaster);
		expandedToast();
		await flush();

		expect(li()).toHaveAttribute('data-reduced-motion', 'true');
		expect(li()).toHaveAttribute('data-expanded', 'true');
		expect(li()).toHaveAttribute('data-state', 'expanded');
		expect(norm(pathD())).toBe(norm(morphPath(120, 300, 90, 1)));
		await advance(1000);
		expect(animateMock.calls).toHaveLength(0);
		expect(q(li(), '.cool-toast-wrapper')!.style.transform).toBe('');
	});

	it('is not flagged and keeps the 330 ms delay without the preference', async () => {
		render(Toaster);
		expandedToast();
		await flush();
		expect(li()).not.toHaveAttribute('data-reduced-motion', 'true');
		expect(li()).toHaveAttribute('data-expanded', 'false');
		await advance(330);
		expect(li()).toHaveAttribute('data-expanded', 'true');
	});

	it('collapses at displayDuration − 10 ms, snapping to the pill, then dismisses 800 ms later', async () => {
		const onAutoClose = vi.fn();
		reduce();
		render(Toaster);
		expandedToast({ onAutoClose });
		await advance(3989);
		expect(li()).toHaveAttribute('data-state', 'expanded');
		await advance(1);
		expect(li()).toHaveAttribute('data-state', 'pill');
		expect(li()).toHaveAttribute('data-expanded', 'false');
		expect(norm(pathD())).toBe(norm(morphPath(120, 300, 90, 0)));
		await advance(799);
		expect(onAutoClose).not.toHaveBeenCalled();
		await advance(1);
		expect(onAutoClose).toHaveBeenCalledTimes(1);
		expect(animateMock.calls).toHaveLength(0);
	});

	it('does not squish or shake (no animate calls for updates either)', async () => {
		reduce();
		render(Toaster);
		toast('Plain', { id: 't', duration: Infinity });
		await advance(100);
		toast.update('t', { type: 'error' });
		await advance(500);
		expect(li()).not.toHaveAttribute('data-shake');
		expect(animateMock.calls).toHaveLength(0);
	});

	it('fades out in 10 ms instead of 350 ms', async () => {
		reduce();
		render(Toaster);
		toast('Plain', { id: 't', duration: Infinity });
		await flush();
		toast.dismiss('t');
		await advance(10);
		expect(toastIds()).toEqual([]);
	});
});

describe('progress duration (ANIM-8, reduced value)', () => {
	it('uses displayDuration − 10 ms', async () => {
		reduce();
		render(Toaster, { showProgress: true });
		expandedToast();
		await flush();
		expect(
			q(li(), '[data-cool-toast-progress]')!.style.getPropertyValue(
				'--cool-toast-progress-duration'
			)
		).toBe('3990ms');
	});

	it('uses displayDuration − 10 ms for a custom displayDuration', async () => {
		reduce();
		render(Toaster, { showProgress: true });
		expandedToast({ timing: { displayDuration: 6000 } });
		await flush();
		expect(
			q(li(), '[data-cool-toast-progress]')!.style.getPropertyValue(
				'--cool-toast-progress-duration'
			)
		).toBe('5990ms');
	});
});
