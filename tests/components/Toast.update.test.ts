import { createRawSnippet } from 'svelte';
import { render } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Toaster, toast } from '../../src/lib';
import { advance, flush, q, resetToastEnvironment, toastEl, toastIds } from '../helpers';

vi.mock('motion', async () => (await import('../mocks/motion')).motionMockFactory());

const polite = () => document.querySelector<HTMLElement>('[data-cool-toast-announcer="polite"]')!;
const li = (id: string) => toastEl(id)!;

beforeEach(() => {
	vi.useFakeTimers();
});
afterEach(() => {
	resetToastEnvironment();
	vi.useRealTimers();
});

describe('title, description and type (UPDATE-1)', () => {
	it('updates content, becomes expanded and announces "title: description"', async () => {
		render(Toaster);
		toast('Old', { id: 'a', duration: Infinity });
		await flush();

		toast.update('a', { title: 'New', description: 'Desc', type: 'success' });
		await advance(330);

		expect(q(li('a'), '[data-cool-toast-title]')).toHaveTextContent('New');
		expect(q(li('a'), '[data-cool-toast-description]')).toHaveTextContent('Desc');
		expect(li('a')).toHaveAttribute('data-type', 'success');
		expect(li('a')).toHaveAttribute('data-phase', 'success');
		expect(li('a')).toHaveAttribute('data-expanded', 'true');
		expect(polite()).toHaveTextContent('New: Desc');
	});

	it('updating only the title keeps type and adds no description', async () => {
		render(Toaster);
		toast.error('Old', { id: 'a', duration: Infinity });
		await flush();
		toast.update('a', { title: 'Changed' });
		await advance(400);
		expect(q(li('a'), '[data-cool-toast-title]')).toHaveTextContent('Changed');
		expect(li('a')).toHaveAttribute('data-type', 'error');
		expect(q(li('a'), '[data-cool-toast-description]')).toBeNull();
		expect(li('a')).toHaveAttribute('data-expanded', 'false');
	});
});

describe('icon (UPDATE-2)', () => {
	it('icon:null clears the icon and a Snippet restores it', async () => {
		render(Toaster);
		toast.success('x', { id: 'a', duration: Infinity });
		await flush();
		expect(q(li('a'), '[data-cool-toast-icon] svg')).not.toBeNull();

		toast.update('a', { icon: null });
		await flush();
		const icon = q(li('a'), '[data-cool-toast-icon]');
		expect(icon === null || icon.querySelector('svg') === null).toBe(true);
		expect(icon?.childElementCount ?? 0).toBe(0);

		const custom = createRawSnippet(() => ({ render: () => '<b data-testid="restored">!</b>' }));
		toast.update('a', { icon: custom });
		await flush();
		expect(q(li('a'), '[data-testid="restored"]')).toHaveTextContent('!');
	});
});

describe('action and timestamp (UPDATE-3)', () => {
	it('adds an action button', async () => {
		const onClick = vi.fn();
		render(Toaster);
		toast('x', { id: 'a', duration: Infinity });
		await flush();
		expect(q(li('a'), 'button[data-cool-toast-action]')).toBeNull();

		toast.update('a', { action: { label: 'Go', onClick } });
		await advance(330);
		const button = q<HTMLButtonElement>(li('a'), 'button[data-cool-toast-action]')!;
		expect(button).toHaveTextContent('Go');
		button.click();
		expect(onClick).toHaveBeenCalledTimes(1);
	});

	it('showTimestamp:false removes the timestamp', async () => {
		render(Toaster);
		toast('x', { id: 'a', duration: Infinity });
		await flush();
		expect(q(li('a'), '[data-cool-toast-timestamp]')).not.toBeNull();
		toast.update('a', { showTimestamp: false });
		await flush();
		expect(q(li('a'), '[data-cool-toast-timestamp]')).toBeNull();
	});
});

describe('queued toast update (UPDATE-4)', () => {
	it('renders the updated content once the queued toast is promoted', async () => {
		render(Toaster, { visibleToasts: 1 });
		toast('a', { id: 'a', duration: Infinity });
		toast('b', { id: 'b', duration: Infinity });
		await flush();
		expect(toastIds()).toEqual(['a']);

		toast.update('b', { title: 'Later', type: 'warning' });
		toast.dismiss('a');
		await advance(350);

		expect(toastIds()).toEqual(['b']);
		expect(q(li('b'), '[data-cool-toast-title]')).toHaveTextContent('Later');
		expect(li('b')).toHaveAttribute('data-type', 'warning');
	});

	it('dismiss({ type }) removes a queued toast updated to that type', async () => {
		render(Toaster, { visibleToasts: 1 });
		toast('a', { id: 'a', duration: Infinity });
		toast('b', { id: 'b', duration: Infinity });
		await flush();
		toast.update('b', { type: 'warning' });

		toast.dismiss({ type: 'warning' });
		toast.dismiss('a');
		await advance(350);

		expect(toastIds()).toEqual([]);
	});
});

describe('in-place updates keep the same <li> (no remount)', () => {
	it('toast.update keeps the same element instance', async () => {
		render(Toaster);
		toast('Old', { id: 'a', duration: Infinity });
		await flush();
		const before = li('a');

		toast.update('a', { title: 'New', type: 'success' });
		await advance(400);

		expect(li('a')).toBe(before);
		expect(q(li('a'), '[data-cool-toast-title]')).toHaveTextContent('New');
	});

	it('promise settlement keeps the same element instance', async () => {
		render(Toaster);
		let resolve!: (value: string) => void;
		const promise = new Promise<string>((res) => (resolve = res));
		const id = toast.promise(promise, { loading: 'l', success: 'Done', error: 'e' });
		await flush();
		const before = li(id);

		resolve('x');
		await advance(400);

		expect(li(id)).toBe(before);
		expect(q(li(id), '[data-cool-toast-title]')).toHaveTextContent('Done');
	});

	it('toast() with an existing id mounts a new instance', async () => {
		render(Toaster);
		toast('Old', { id: 'a', duration: Infinity });
		await flush();
		const before = li('a');
		toast('New', { id: 'a', duration: Infinity });
		await advance(400);
		expect(li('a')).not.toBe(before);
		expect(q(li('a'), '[data-cool-toast-title]')).toHaveTextContent('New');
		expect(document.querySelectorAll('[data-cool-toast][data-id="a"]')).toHaveLength(1);
	});
});
