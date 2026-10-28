import { render } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Toaster, toast } from '../../src/lib';
import { morphPath } from '../../src/lib/morph-path';
import { animateMock } from '../mocks/motion';
import { advance, flush, hover, q, resetToastEnvironment, toastEl, toastIds } from '../helpers';

vi.mock('motion', async () => (await import('../mocks/motion')).motionMockFactory());

// Medidas por defecto del stub de jsdom: pill 136 de ancho (100 + 36); contenido expandido 320×112
const PW = 136;
const BW = 320;
const TH = 112;
const norm = (d: string | null) => (d ?? '').replace(/\s+/g, ' ').trim();

const li = (id: string) => toastEl(id)!;
const pathD = (id: string) => q(li(id), 'svg[data-cool-toast-blob] > path')!.getAttribute('d');
const expandedToast = (extra: Record<string, unknown> = {}) =>
	toast('Saved', {
		id: 't',
		description: 'Body',
		action: { label: 'Undo', onClick: vi.fn() },
		...extra
	});

beforeEach(() => {
	vi.useFakeTimers();
});
afterEach(() => {
	resetToastEnvironment();
	vi.useRealTimers();
});

describe('expand timeline (ANIM-1 states)', () => {
	it('starts as a pill whose path matches the measured pill', async () => {
		render(Toaster);
		expandedToast();
		await flush();
		expect(li('t')).toHaveAttribute('data-state', 'pill');
		expect(li('t')).toHaveAttribute('data-expanded', 'false');
		expect(norm(pathD('t'))).toBe(norm(morphPath(PW, BW, TH, 0)));
	});

	it('is morphing at 330 ms and expanded once the controller completes', async () => {
		animateMock.setMode('manual');
		render(Toaster);
		expandedToast();
		await advance(330);
		expect(li('t')).toHaveAttribute('data-expanded', 'true');
		expect(li('t')).toHaveAttribute('data-state', 'morphing');
		expect(animateMock.calls.at(-1)).toMatchObject({
			from: 0,
			to: 1,
			options: { type: 'spring', duration: 0.9, bounce: 0.4 }
		});

		animateMock.completeAll();
		await flush();
		expect(li('t')).toHaveAttribute('data-state', 'expanded');
		expect(norm(pathD('t'))).toBe(norm(morphPath(PW, BW, TH, 1)));
	});

	it('leaves the body width and height inline on the wrapper when the morph completes', async () => {
		render(Toaster);
		expandedToast();
		await advance(330);
		expect(li('t')).toHaveAttribute('data-state', 'expanded');
		const wrapper = q(li('t'), '.cool-toast-wrapper')!;
		const content = q(li('t'), '[data-cool-toast-content]')!;
		// B.8-delta: expanded → el wrapper mide exactamente bw
		expect(wrapper.style.width).toBe(`${BW}px`);
		expect(wrapper.style.height).toBe(`${TH}px`);
		expect(content.style.maxHeight).toBe('');
		expect(content.style.clipPath).toBe('');
		expect(content.style.overflow).toBe('');
	});

	it('uses a tween with spring:false', async () => {
		animateMock.setMode('manual');
		render(Toaster);
		expandedToast({ spring: false });
		await advance(330);
		expect(animateMock.calls.at(-1)?.options).toMatchObject({
			duration: 0.6,
			ease: [0.4, 0, 0.2, 1]
		});
	});

	it('a compact toast never leaves the pill state', async () => {
		render(Toaster);
		toast('Plain', { id: 'c', duration: Infinity });
		await advance(2000);
		expect(li('c')).toHaveAttribute('data-state', 'pill');
		expect(li('c')).toHaveAttribute('data-expanded', 'false');
	});
});

describe('collapse → dismiss (ANIM-2)', () => {
	it('collapses at 330 + 2770 ms, drops the body, becomes a pill and dismisses 800 ms later', async () => {
		const onAutoClose = vi.fn();
		const onDismiss = vi.fn();
		render(Toaster);
		expandedToast({ onAutoClose, onDismiss });
		await advance(330);
		expect(li('t')).toHaveAttribute('data-state', 'expanded');

		await advance(2769);
		expect(li('t')).toHaveAttribute('data-state', 'expanded');

		animateMock.setMode('manual');
		await advance(1);
		expect(li('t')).toHaveAttribute('data-state', 'collapsing');

		await advance(350);
		expect(q(li('t'), '[data-cool-toast-description]')).toBeNull();
		expect(q(li('t'), '[data-cool-toast-action]')).toBeNull();

		animateMock.completeAll();
		await flush();
		expect(li('t')).toHaveAttribute('data-state', 'pill');
		expect(li('t')).toHaveAttribute('data-expanded', 'false');
		expect(onDismiss).not.toHaveBeenCalled();

		await advance(799);
		expect(onDismiss).not.toHaveBeenCalled();
		await advance(1);
		expect(onAutoClose).toHaveBeenCalledExactlyOnceWith('t');
		expect(onDismiss).toHaveBeenCalledExactlyOnceWith('t');
		expect(onAutoClose.mock.invocationCallOrder[0]).toBeLessThan(
			onDismiss.mock.invocationCallOrder[0]
		);

		await advance(350);
		expect(toastIds()).toEqual([]);
	});

	it('collapses with a tween right before dismissal', async () => {
		render(Toaster);
		expandedToast();
		await advance(330 + 2770);
		expect(animateMock.calls.at(-1)).toMatchObject({
			from: 1,
			to: 0,
			options: { duration: 0.9, ease: [0.4, 0, 0.2, 1] }
		});
	});

	it('respects timing.displayDuration for the collapse moment', async () => {
		render(Toaster);
		expandedToast({ timing: { displayDuration: 6000 } });
		await advance(330 + 4770 - 1);
		expect(li('t')).toHaveAttribute('data-state', 'expanded');
		await advance(1);
		expect(li('t')).not.toHaveAttribute('data-state', 'expanded');
	});

	it('ignores duration for expanded toasts', async () => {
		render(Toaster);
		expandedToast({ duration: 500 });
		await advance(2000);
		expect(li('t')).toHaveAttribute('data-state', 'expanded');
	});
});

describe('progress bar (ANIM-8, RENDER-15)', () => {
	it('exposes the shrink duration and pauses on hover', async () => {
		render(Toaster, { showProgress: true });
		expandedToast();
		await advance(330);
		const progress = q(li('t'), '[data-cool-toast-progress]')!;
		expect(progress).not.toBeNull();
		expect(progress).toHaveAttribute('data-type', 'default');
		expect(progress.style.getPropertyValue('--cool-toast-progress-duration')).toBe('2770ms');
		expect(progress).toHaveAttribute('data-paused', 'false');
		expect(q(progress, '.cool-toast-progress-bar')).not.toBeNull();

		hover(li('t'));
		await flush();
		expect(q(li('t'), '[data-cool-toast-progress]')).toHaveAttribute('data-paused', 'true');
	});

	it('derives the duration from displayDuration − 330 − 900', async () => {
		render(Toaster, { showProgress: true });
		expandedToast({ timing: { displayDuration: 6000 } });
		await advance(330);
		expect(
			q(li('t'), '[data-cool-toast-progress]')!.style.getPropertyValue(
				'--cool-toast-progress-duration'
			)
		).toBe('4770ms');
	});

	it('is absent for compact toasts and when showProgress is false', async () => {
		render(Toaster, { showProgress: true });
		toast('Plain', { id: 'c', duration: Infinity });
		expandedToast({ id: 'e', showProgress: false });
		await advance(330);
		expect(q(li('c'), '[data-cool-toast-progress]')).toBeNull();
		expect(q(li('e'), '[data-cool-toast-progress]')).toBeNull();
	});

	it('a toast option beats the Toaster value', async () => {
		render(Toaster);
		expandedToast({ showProgress: true });
		await advance(330);
		expect(q(li('t'), '[data-cool-toast-progress]')).not.toBeNull();
	});
});

describe('action with successLabel (UPDATE-6)', () => {
	const successToast = (onClick = vi.fn(), extra: Record<string, unknown> = {}) =>
		toast('Saved', {
			id: 't',
			description: 'Body',
			action: { label: 'Undo', onClick, successLabel: 'Undone' },
			...extra
		});

	it('runs onClick, shows the success label, collapses and dismisses manually 1200 ms later', async () => {
		const onClick = vi.fn();
		const onDismiss = vi.fn();
		const onAutoClose = vi.fn();
		render(Toaster);
		successToast(onClick, { onDismiss, onAutoClose });
		await advance(330);

		animateMock.setMode('manual');
		q<HTMLButtonElement>(li('t'), 'button[data-cool-toast-action]')!.click();
		await flush();

		expect(onClick).toHaveBeenCalledTimes(1);
		expect(q(li('t'), '[data-cool-toast-title]')).toHaveTextContent('Undone');
		expect(li('t')).toHaveAttribute('data-phase', 'success');
		expect(li('t')).toHaveAttribute('data-state', 'collapsing');

		await advance(350);
		expect(q(li('t'), '[data-cool-toast-description]')).toBeNull();
		expect(q(li('t'), '[data-cool-toast-action]')).toBeNull();

		animateMock.completeAll();
		await flush();
		expect(li('t')).toHaveAttribute('data-state', 'pill');

		await advance(1199);
		expect(onDismiss).not.toHaveBeenCalled();
		await advance(1);
		expect(onDismiss).toHaveBeenCalledExactlyOnceWith('t');
		expect(onAutoClose).not.toHaveBeenCalled();
		await advance(350);
		expect(toastIds()).toEqual([]);
	});

	it('catches a throwing onClick, logs it and continues the flow', async () => {
		const error = vi.spyOn(console, 'error').mockImplementation(() => {});
		const onClick = vi.fn(() => {
			throw new Error('boom');
		});
		render(Toaster);
		successToast(onClick);
		await advance(330);

		q<HTMLButtonElement>(li('t'), 'button[data-cool-toast-action]')!.click();
		await flush();

		expect(onClick).toHaveBeenCalledTimes(1);
		expect(error).toHaveBeenCalled();
		expect(q(li('t'), '[data-cool-toast-title]')).toHaveTextContent('Undone');
		expect(li('t')).toHaveAttribute('data-phase', 'success');
		error.mockRestore();
	});
});
