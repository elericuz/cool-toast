import { render } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Toaster, toast } from '../../src/lib';
import { advance, flush, q, resetToastEnvironment, toastEl, toastEls, toastIds } from '../helpers';

vi.mock('motion', async () => (await import('../mocks/motion')).motionMockFactory());

const polite = () => document.querySelector<HTMLElement>('[data-cool-toast-announcer="polite"]')!;
const assertive = () =>
	document.querySelector<HTMLElement>('[data-cool-toast-announcer="assertive"]')!;

function deferred<T>() {
	let resolve!: (value: T) => void;
	let reject!: (reason: unknown) => void;
	const promise = new Promise<T>((res, rej) => {
		resolve = res;
		reject = rej;
	});
	return { promise, resolve, reject };
}

const li = (id: string | number) => toastEl(id)!;
const unhandled: unknown[] = [];
const onUnhandled = (reason: unknown) => unhandled.push(reason);

beforeEach(() => {
	vi.useFakeTimers();
	unhandled.length = 0;
	process.on('unhandledRejection', onUnhandled);
});
afterEach(() => {
	process.off('unhandledRejection', onUnhandled);
	resetToastEnvironment();
	vi.useRealTimers();
});

describe('loading state (PROMISE-1)', () => {
	it('returns a string id and renders a loading toast that never auto closes', async () => {
		render(Toaster, { closeButton: true });
		const { promise } = deferred<string>();
		const id = toast.promise(promise, { loading: 'Saving…', success: 'Saved', error: 'Failed' });
		await flush();

		expect(typeof id).toBe('string');
		expect(li(id)).toHaveAttribute('data-type', 'default');
		expect(li(id)).toHaveAttribute('data-phase', 'loading');
		expect(q(li(id), '[data-cool-toast-title]')).toHaveTextContent('Saving…');
		expect(q(li(id), '[data-cool-toast-icon] .cool-toast-spin')).not.toBeNull();
		expect(q(li(id), '[data-cool-toast-close]')).toBeNull();
		expect(polite()).toHaveTextContent('Saving…');

		await advance(60_000);
		expect(toastIds()).toEqual([id]);
	});
});

describe('settlement with resolvers (PROMISE-2, PROMISE-3)', () => {
	it('resolves to a success toast with the resolver title', async () => {
		render(Toaster);
		const { promise, resolve } = deferred<{ n: number }>();
		const id = toast.promise(promise, {
			loading: 'Saving…',
			success: (d) => `Saved ${d.n}`,
			error: 'Failed'
		});
		await flush();
		resolve({ n: 3 });
		await advance(0);

		expect(q(li(id), '[data-cool-toast-title]')).toHaveTextContent('Saved 3');
		expect(li(id)).toHaveAttribute('data-type', 'success');
		expect(li(id)).toHaveAttribute('data-phase', 'success');
		expect(polite()).toHaveTextContent('Saved 3');
	});

	it('uses a different resolved value (not hard-coded)', async () => {
		render(Toaster);
		const { promise, resolve } = deferred<{ n: number }>();
		const id = toast.promise(promise, {
			loading: 'Saving…',
			success: (d) => `Saved ${d.n}`,
			error: 'Failed'
		});
		resolve({ n: 42 });
		await advance(0);
		expect(q(li(id), '[data-cool-toast-title]')).toHaveTextContent('Saved 42');
	});

	it('rejects to an error toast without propagating the rejection', async () => {
		render(Toaster);
		const { promise, reject } = deferred<string>();
		const id = toast.promise(promise, {
			loading: 'Saving…',
			success: 'Saved',
			error: (e) => `Failed: ${(e as Error).message}`
		});
		await flush();
		reject(new Error('boom'));
		await advance(0);

		expect(q(li(id), '[data-cool-toast-title]')).toHaveTextContent('Failed: boom');
		expect(li(id)).toHaveAttribute('data-type', 'error');
		expect(li(id)).toHaveAttribute('data-phase', 'error');
		expect(assertive()).toHaveTextContent('Failed: boom');
		expect(unhandled).toEqual([]);
	});

	it('accepts plain string success and error', async () => {
		render(Toaster);
		const ok = deferred<string>();
		const idOk = toast.promise(ok.promise, { loading: 'l', success: 'Done', error: 'Nope' });
		ok.resolve('x');
		await advance(0);
		expect(q(li(idOk), '[data-cool-toast-title]')).toHaveTextContent('Done');
	});
});

describe('per-phase description and action (PROMISE-4)', () => {
	const data = (onOpen = vi.fn(), onRetry = vi.fn()) => ({
		loading: 'Saving',
		success: 'Saved',
		error: 'Failed',
		description: { loading: 'Please wait', success: () => 'All good', error: 'Try again' },
		action: {
			success: { label: 'Open', onClick: onOpen },
			error: { label: 'Retry', onClick: onRetry }
		}
	});

	it('shows the loading description without an action', async () => {
		render(Toaster);
		const { promise } = deferred<string>();
		const id = toast.promise(promise, data());
		await advance(330);
		expect(q(li(id), '[data-cool-toast-description]')).toHaveTextContent('Please wait');
		expect(q(li(id), '[data-cool-toast-action]')).toBeNull();
	});

	it('shows the success description and action after resolve', async () => {
		const onOpen = vi.fn();
		render(Toaster);
		const { promise, resolve } = deferred<string>();
		const id = toast.promise(promise, data(onOpen));
		await advance(330);
		resolve('ok');
		await advance(400);
		expect(q(li(id), '[data-cool-toast-description]')).toHaveTextContent('All good');
		const button = q<HTMLButtonElement>(li(id), 'button[data-cool-toast-action]')!;
		expect(button).toHaveTextContent('Open');
		button.click();
		expect(onOpen).toHaveBeenCalledTimes(1);
	});

	it('shows the error description and action after reject', async () => {
		render(Toaster);
		const { promise, reject } = deferred<string>();
		const id = toast.promise(promise, data());
		await advance(330);
		reject(new Error('x'));
		await advance(400);
		expect(q(li(id), '[data-cool-toast-description]')).toHaveTextContent('Try again');
		expect(q(li(id), 'button[data-cool-toast-action]')).toHaveTextContent('Retry');
	});
});

describe('timer after settlement (PROMISE-5)', () => {
	it('compact: auto closes 4000 ms after the promise settles', async () => {
		const onAutoClose = vi.fn();
		render(Toaster);
		const { promise, resolve } = deferred<string>();
		toast.promise(promise, { loading: 'l', success: 'Done', error: 'e', onAutoClose });
		await advance(1000);
		resolve('x');
		await advance(0);

		await advance(3999);
		expect(onAutoClose).not.toHaveBeenCalled();
		await advance(1);
		expect(onAutoClose).toHaveBeenCalledTimes(1);
	});

	it('expanded: follows the expand timeline from settlement', async () => {
		render(Toaster);
		const { promise, resolve } = deferred<string>();
		const id = toast.promise(promise, {
			loading: 'l',
			success: 'Done',
			error: 'e',
			description: { success: () => 'Body' }
		});
		await advance(500);
		resolve('x');
		await advance(330);
		expect(li(id)).toHaveAttribute('data-expanded', 'true');
		await advance(2769);
		expect(li(id)).toHaveAttribute('data-state', 'expanded');
		await advance(1);
		expect(li(id)).not.toHaveAttribute('data-state', 'expanded');
	});
});

describe('showProgress on promise toasts (PROMISE-6, RENDER-15)', () => {
	it.each([
		['PromiseData', { showProgress: true }, {}],
		['the Toaster', {}, { showProgress: true }]
	] as const)(
		'renders the progress bar after resolve with %s',
		async (_label, dataProps, toaster) => {
			render(Toaster, toaster);
			const { promise, resolve } = deferred<string>();
			const id = toast.promise(promise, {
				loading: 'l',
				success: 'Done',
				error: 'e',
				description: { success: () => 'Body' },
				...dataProps
			});
			await flush();
			resolve('x');
			await advance(330);
			expect(q(li(id), '[data-cool-toast-progress]')).not.toBeNull();
		}
	);

	it('has no progress bar when showProgress is off', async () => {
		render(Toaster);
		const { promise, resolve } = deferred<string>();
		const id = toast.promise(promise, {
			loading: 'l',
			success: 'Done',
			error: 'e',
			description: { success: () => 'Body' }
		});
		resolve('x');
		await advance(330);
		expect(q(li(id), '[data-cool-toast-progress]')).toBeNull();
	});
});

describe('dismissed while pending (PROMISE-7)', () => {
	it('renders nothing and does not throw when the promise settles later', async () => {
		render(Toaster);
		const { promise, resolve } = deferred<string>();
		const id = toast.promise(promise, { loading: 'l', success: 'Done', error: 'e' });
		await flush();
		toast.dismiss(id);
		await advance(350);
		expect(toastIds()).toEqual([]);

		resolve('x');
		await advance(5000);
		expect(toastEls()).toHaveLength(0);
		expect(unhandled).toEqual([]);
	});

	it('also ignores a later rejection', async () => {
		render(Toaster);
		const { promise, reject } = deferred<string>();
		const id = toast.promise(promise, { loading: 'l', success: 'Done', error: 'e' });
		await flush();
		toast.dismiss(id);
		await advance(350);
		reject(new Error('late'));
		await advance(5000);
		expect(toastEls()).toHaveLength(0);
		expect(unhandled).toEqual([]);
	});
});

describe('icon swap (ANIM-5)', () => {
	it('replaces the spinner with the success icon within 200 ms', async () => {
		render(Toaster);
		const { promise, resolve } = deferred<string>();
		const id = toast.promise(promise, { loading: 'l', success: 'Done', error: 'e' });
		await flush();
		expect(q(li(id), '[data-cool-toast-icon] .cool-toast-spin')).not.toBeNull();

		resolve('x');
		await advance(200);
		const icon = q(li(id), '[data-cool-toast-icon]')!;
		expect(q(icon, '.cool-toast-spin')).toBeNull();
		expect(q(icon, 'circle')).not.toBeNull();
	});

	it('swaps to the error icon on reject', async () => {
		render(Toaster);
		const { promise, reject } = deferred<string>();
		const id = toast.promise(promise, { loading: 'l', success: 'Done', error: 'e' });
		await flush();
		const loadingMarkup = q(li(id), '[data-cool-toast-icon]')!.innerHTML;
		reject(new Error('x'));
		await advance(200);
		const icon = q(li(id), '[data-cool-toast-icon]')!;
		expect(q(icon, '.cool-toast-spin')).toBeNull();
		expect(icon.innerHTML).not.toBe(loadingMarkup);
	});
});
