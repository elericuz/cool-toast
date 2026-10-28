import { render } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Toaster, toast } from '../../src/lib';
import { setMediaQuery } from '../setup';
import { advance, flush, pressEscape, resetToastEnvironment, toastIds } from '../helpers';

vi.mock('motion', async () => (await import('../mocks/motion')).motionMockFactory());

const root = () => document.querySelector<HTMLElement>('[data-cool-toaster]')!;

beforeEach(() => {
	vi.useFakeTimers();
});
afterEach(() => {
	resetToastEnvironment();
	vi.useRealTimers();
});

describe('Toaster DOM (RENDER-1)', () => {
	it('renders one root with the default attributes, list and both announcers', () => {
		render(Toaster);
		expect(document.querySelectorAll('[data-cool-toaster]')).toHaveLength(1);
		expect(root()).toHaveAttribute('data-position', 'bottom-right');
		expect(root()).toHaveAttribute('data-side', 'right');
		expect(root().getAttribute('data-theme')).toMatch(/^(light|dark)$/);
		expect(root()).toHaveAttribute('dir', 'ltr');
		expect(root().style.getPropertyValue('--cool-toast-gap')).toBe('14px');
		expect(root().style.getPropertyValue('--cool-toast-offset')).toBe('24px');
		const list = root().querySelector('ol[data-cool-toast-list]');
		expect(list).not.toBeNull();
		expect(list!.querySelectorAll('li')).toHaveLength(0);
		expect(root().querySelector('[data-cool-toast-announcer="polite"]')).not.toBeNull();
		expect(root().querySelector('[data-cool-toast-announcer="assertive"]')).not.toBeNull();
	});

	it('reflects custom gap, offset and dir', () => {
		render(Toaster, { gap: 20, offset: '10px', dir: 'rtl' });
		expect(root().style.getPropertyValue('--cool-toast-gap')).toBe('20px');
		expect(root().style.getPropertyValue('--cool-toast-offset')).toBe('10px');
		expect(root()).toHaveAttribute('dir', 'rtl');
	});
});

describe('position → side mapping (RENDER-2)', () => {
	it.each([
		['top-left', 'left', 'top'],
		['bottom-left', 'left', 'bottom'],
		['top-right', 'right', 'top'],
		['bottom-right', 'right', 'bottom'],
		['top-center', 'center', 'top'],
		['bottom-center', 'center', 'bottom']
	] as const)('%s → data-side %s, data-y %s', (position, side, y) => {
		render(Toaster, { position });
		expect(root()).toHaveAttribute('data-position', position);
		expect(root()).toHaveAttribute('data-side', side);
		expect(root()).toHaveAttribute('data-y', y);
	});

	it.each([
		['top-left', 'right'],
		['bottom-left', 'right'],
		['top-right', 'left'],
		['bottom-right', 'left'],
		['top-center', 'center'],
		['bottom-center', 'center']
	] as const)('rtl mirrors %s → data-side %s', (position, side) => {
		render(Toaster, { position, dir: 'rtl' });
		expect(root()).toHaveAttribute('data-side', side);
	});
});

describe('Escape (RENDER-10)', () => {
	it('dismisses the newest toast first, then the older one', async () => {
		render(Toaster);
		toast('a', { id: 'a', duration: Infinity });
		toast('b', { id: 'b', duration: Infinity });
		await flush();
		expect(toastIds()).toHaveLength(2);

		pressEscape();
		await advance(350);
		expect(toastIds()).toEqual(['a']);

		pressEscape();
		await advance(350);
		expect(toastIds()).toEqual([]);
	});

	it('does nothing when closeOnEscape is false', async () => {
		render(Toaster, { closeOnEscape: false });
		toast('a', { id: 'a', duration: Infinity });
		await flush();
		pressEscape();
		await advance(1000);
		expect(toastIds()).toEqual(['a']);
	});

	it('stops listening after the Toaster is destroyed', async () => {
		const { unmount } = render(Toaster);
		toast('a', { id: 'a', duration: Infinity });
		await flush();
		unmount();
		const onDismiss = vi.fn();
		toast('b', { id: 'b', duration: Infinity, onDismiss });
		pressEscape();
		await advance(350);
		expect(onDismiss).not.toHaveBeenCalled();
	});
});

describe('theme (RENDER-13)', () => {
	it.each(['light', 'dark'] as const)('theme="%s" sets data-theme', (theme) => {
		render(Toaster, { theme });
		expect(root()).toHaveAttribute('data-theme', theme);
	});

	it('theme="system" follows prefers-color-scheme at mount', () => {
		setMediaQuery('(prefers-color-scheme: dark)', true);
		render(Toaster, { theme: 'system' });
		expect(root()).toHaveAttribute('data-theme', 'dark');
	});

	it('theme="system" resolves to light when the media query does not match', () => {
		render(Toaster);
		expect(root()).toHaveAttribute('data-theme', 'light');
	});

	it('theme="system" flips when the media query fires change', async () => {
		render(Toaster, { theme: 'system' });
		expect(root()).toHaveAttribute('data-theme', 'light');
		setMediaQuery('(prefers-color-scheme: dark)', true);
		await flush();
		expect(root()).toHaveAttribute('data-theme', 'dark');
		setMediaQuery('(prefers-color-scheme: dark)', false);
		await flush();
		expect(root()).toHaveAttribute('data-theme', 'light');
	});
});

describe('visibleToasts (STORE-4 DOM, STORE-13)', () => {
	it('renders at most 3 toasts by default and none of the queued ones', async () => {
		render(Toaster);
		for (const id of ['1', '2', '3', '4', '5']) toast(id, { id, duration: Infinity });
		await flush();
		expect(toastIds().sort()).toEqual(['1', '2', '3']);
	});

	it('promotes the queue FIFO after an exit completes', async () => {
		render(Toaster);
		for (const id of ['1', '2', '3', '4', '5']) toast(id, { id, duration: Infinity });
		await flush();
		toast.dismiss('1');
		await advance(350);
		expect(toastIds().sort()).toEqual(['2', '3', '4']);
	});

	it('STORE-13 reacts to a changed visibleToasts prop without a new toast() call', async () => {
		const { rerender } = render(Toaster, { visibleToasts: 1 });
		toast('a', { id: 'a', duration: Infinity });
		toast('b', { id: 'b', duration: Infinity });
		await flush();
		expect(toastIds()).toEqual(['a']);

		await rerender({ visibleToasts: 2 });
		await flush();
		expect(toastIds().sort()).toEqual(['a', 'b']);
	});
});
