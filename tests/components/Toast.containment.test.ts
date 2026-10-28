import { render } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Toaster, toast } from '../../src/lib';
import { morphPath } from '../../src/lib/morph-path';
import { animateMock } from '../mocks/motion';
import { advance, flush, q, resetToastEnvironment, toastEl } from '../helpers';

vi.mock('motion', async () => (await import('../mocks/motion')).motionMockFactory());

// Medidas por defecto del stub: header 100×20 → pw = 136; contenido compacto 150×44; expandido 320×112
const norm = (d: string | null) => (d ?? '').replace(/\s+/g, ' ').trim();
const li = () => toastEl('t')!;
const wrapper = () => q(li(), '.cool-toast-wrapper')!;
const header = () => q(li(), '[data-cool-toast-header]')!;
const pathD = () => q(li(), 'svg[data-cool-toast-blob] > path')!.getAttribute('d');
const headerStamp = () => q(header(), '[data-cool-toast-timestamp][data-slot="header"]');

beforeEach(() => {
	vi.useFakeTimers();
});
afterEach(() => {
	resetToastEnvironment();
	vi.useRealTimers();
});

describe('compact pill width includes the timestamp (RENDER-18)', () => {
	it('renders the header timestamp inside the header', async () => {
		render(Toaster);
		toast('Saved', { id: 't', duration: Infinity });
		await flush();
		expect(li()).toHaveAttribute('data-state', 'pill');
		expect(headerStamp()).not.toBeNull();
	});

	it('draws the pill with the header width + 36 and sizes the wrapper to it', async () => {
		render(Toaster);
		toast('Saved', { id: 't', duration: Infinity });
		await flush();
		expect(norm(pathD())).toBe(norm(morphPath(136, 150, 44, 0)));
		expect(wrapper().style.width).toBe('136px');
		expect(wrapper().style.height).toBe('44px');
	});

	it('follows a narrower header when the timestamp is hidden', async () => {
		render(Toaster);
		toast('Saved', { id: 't', duration: Infinity, showTimestamp: false });
		await flush();
		expect(headerStamp()).toBeNull();
		header().setAttribute('data-test-w', '80');
		toast.update('t', { title: 'Saved!' });
		await flush();
		expect(norm(pathD())).toBe(norm(morphPath(116, 150, 44, 0)));
		expect(wrapper().style.width).toBe('116px');
	});

	it('grows past the compact content width for a long title', async () => {
		render(Toaster);
		toast('Saved', { id: 't', duration: Infinity });
		await flush();
		header().setAttribute('data-test-w', '140');
		toast.update('t', { title: 'A considerably longer title for the pill' });
		await flush();
		expect(norm(pathD())).toBe(norm(morphPath(176, 176, 44, 0)));
		expect(wrapper().style.width).toBe('176px');
	});
});

describe('collapse keeps content inside the shrinking blob (RENDER-19)', () => {
	const bodyEl = () => q(li(), '.cool-toast-body');

	// Lleva el toast a `collapsing` con animaciones controladas a mano
	async function startCollapse() {
		render(Toaster);
		toast('Saved', { id: 't', description: 'Your file is safe' });
		await advance(330);
		expect(li()).toHaveAttribute('data-state', 'expanded');
		await advance(2769);
		animateMock.setMode('manual');
		await advance(1);
		expect(li()).toHaveAttribute('data-state', 'collapsing');
	}

	it('shows the header timestamp from the first collapsing frame and marks the body as leaving', async () => {
		await startCollapse();
		expect(headerStamp()).not.toBeNull();
		expect(bodyEl()).toHaveAttribute('data-leaving', 'true');
	});

	it('shrinks the wrapper width monotonically along the body width of the path', async () => {
		await startCollapse();
		const widths: number[] = [];
		for (const progress of [0, 0.25, 0.5, 0.75, 1]) {
			animateMock.progressAll(progress);
			widths.push(parseFloat(wrapper().style.width));
		}
		expect(widths).toEqual([320, 274, 228, 182, 136]);
		for (let i = 1; i < widths.length; i++) expect(widths[i]).toBeLessThanOrEqual(widths[i - 1]);
	});

	it('shrinks the wrapper height along the body height of the path (112 → 44)', async () => {
		await startCollapse();
		expect(wrapper().style.height).toBe('112px');
		const heights: number[] = [];
		for (const progress of [0, 0.25, 0.5, 0.75, 1]) {
			animateMock.progressAll(progress);
			heights.push(parseFloat(wrapper().style.height));
		}
		expect(heights).toEqual([112, 95, 78, 61, 44]);
		for (let i = 1; i < heights.length; i++) expect(heights[i]).toBeLessThanOrEqual(heights[i - 1]);
	});

	it('ends as the pill with the width the timestamped header needs', async () => {
		await startCollapse();
		// El cuerpo saliente no cuenta en la medición, aunque mida mucho
		bodyEl()?.setAttribute('data-test-h', '200');
		animateMock.completeAll();
		await flush();
		expect(li()).toHaveAttribute('data-state', 'pill');
		expect(norm(pathD())).toBe(norm(morphPath(136, 320, 112, 0)));
		expect(wrapper().style.width).toBe('136px');
		expect(wrapper().style.height).toBe('44px');
		const before = norm(pathD());

		// Termina la salida del cuerpo y se vuelve a medir: las dimensiones son compactas y el path no cambia
		await advance(350);
		expect(bodyEl()).toBeNull();
		expect(norm(pathD())).toBe(before);
		expect(wrapper().style.width).toBe('136px');
	});

	it('does not let a leaving body receive pointer events (data-leaving removed with the node)', async () => {
		await startCollapse();
		expect(bodyEl()).toHaveAttribute('data-leaving', 'true');
		await advance(350);
		expect(bodyEl()).toBeNull();
	});
});

describe('close button anchored to the blob (RENDER-20)', () => {
	it.each([
		['top-right', 'top-right'],
		[true, 'top-left']
	] as const)('closeButton=%s is a direct child of the wrapper', async (closeButton, side) => {
		render(Toaster, { closeButton });
		toast('Saved', { id: 't', duration: Infinity });
		await flush();
		const button = q(li(), 'button[data-cool-toast-close]')!;
		expect(button).toHaveAttribute('data-side', side);
		expect(button.parentElement).toBe(wrapper());
		expect(button.parentElement).not.toBe(li());
		// Va después del contenido, dentro del wrapper
		expect(wrapper().lastElementChild).toBe(button);
	});

	it('has the wrapper as offset parent while the wrapper is pill-sized', async () => {
		render(Toaster, { closeButton: 'top-right' });
		toast('Saved', { id: 't', duration: Infinity });
		await flush();
		const button = q(li(), 'button[data-cool-toast-close]')! as HTMLElement;
		expect(wrapper().style.width).toBe('136px');
		expect(button.closest('.cool-toast-wrapper')).toBe(wrapper());
	});

	it('still dismisses manually from inside the wrapper', async () => {
		const onDismiss = vi.fn();
		render(Toaster, { closeButton: true });
		toast('Saved', { id: 't', duration: Infinity, onDismiss });
		await flush();
		q<HTMLButtonElement>(wrapper(), 'button[data-cool-toast-close]')!.click();
		await flush();
		expect(onDismiss).toHaveBeenCalledExactlyOnceWith('t');
	});
});

describe('clip box structure (D16 amendment)', () => {
	it('holds the content in .cool-toast-clip, a child of the wrapper, leaving the close button unclipped', async () => {
		render(Toaster, { closeButton: true });
		toast('Saved', { id: 't', duration: Infinity });
		await flush();
		const clip = q(wrapper(), '.cool-toast-clip')!;
		expect(clip.parentElement).toBe(wrapper());
		expect(clip.querySelector('[data-cool-toast-content]')).not.toBeNull();
		expect(clip.querySelector('[data-cool-toast-close]')).toBeNull();
	});
});

describe('nothing renders outside the wrapper (handoff §G.7)', () => {
	it('keeps every toast descendant under .cool-toast-wrapper', async () => {
		render(Toaster, { closeButton: true });
		toast('Saved', { id: 't', description: 'Body', duration: Infinity });
		await flush();
		const stray = Array.from(li().children).filter(
			(child) => !child.matches('.cool-toast-wrapper')
		);
		expect(stray).toEqual([]);
	});
});
