import { render } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, expectTypeOf, it, vi } from 'vitest';
import { Toaster, toast } from '../src/lib';
import type { ToasterProps, ToastOptions } from '../src/lib';
import { advance, flush, resetToastEnvironment } from './helpers';

vi.mock('motion', async () => (await import('./mocks/motion')).motionMockFactory());

beforeEach(() => {
	vi.useFakeTimers();
});
afterEach(() => {
	resetToastEnvironment();
	vi.useRealTimers();
});

// Cada toaster montado se identifica por su orden de montaje: 0 = 'a', 1 = default
const roots = () => Array.from(document.querySelectorAll<HTMLElement>('[data-cool-toaster]'));
const titlesIn = (root: HTMLElement) =>
	Array.from(root.querySelectorAll<HTMLElement>('[data-cool-toast]')).map(
		(el) => el.querySelector('[data-cool-toast-title]')?.textContent?.trim() ?? ''
	);
const idsIn = (root: HTMLElement) =>
	Array.from(root.querySelectorAll<HTMLElement>('[data-cool-toast]')).map((el) =>
		el.getAttribute('data-id')
	);

async function mountTwo(props: { a?: Partial<ToasterProps>; def?: Partial<ToasterProps> } = {}) {
	render(Toaster, { id: 'a', ...props.a });
	render(Toaster, { ...props.def });
	await flush();
	const [a, def] = roots();
	return { a, def };
}

describe('scoped toasters: routing (TOASTER-1, TOASTER-2)', () => {
	it('renders a toast only in the toaster whose id matches toasterId', async () => {
		const { a, def } = await mountTwo();
		toast('x', { toasterId: 'a', duration: Infinity });
		toast('y', { duration: Infinity });
		await flush();
		expect(titlesIn(a)).toEqual(['x']);
		expect(titlesIn(def)).toEqual(['y']);
	});

	it.each(['success', 'error', 'warning', 'info'] as const)(
		'toast.%s honours toasterId',
		async (type) => {
			const { a, def } = await mountTwo();
			toast[type]('typed', { toasterId: 'a', duration: Infinity });
			await flush();
			expect(titlesIn(a)).toEqual(['typed']);
			expect(titlesIn(def)).toEqual([]);
		}
	);

	it('toast.promise honours toasterId through loading and settle', async () => {
		const { a, def } = await mountTwo();
		let resolve!: (value: string) => void;
		const pending = new Promise<string>((r) => (resolve = r));
		toast.promise(pending, {
			loading: 'Working',
			success: 'Finished',
			error: 'Failed',
			toasterId: 'a'
		});
		await flush();
		expect(titlesIn(a)).toEqual(['Working']);
		expect(titlesIn(def)).toEqual([]);
		resolve('ok');
		await advance(0);
		expect(titlesIn(a)).toEqual(['Finished']);
		expect(titlesIn(def)).toEqual([]);
	});

	it('sends toasts without toasterId to the default toaster only', async () => {
		const { a, def } = await mountTwo();
		toast('plain', { duration: Infinity });
		await flush();
		expect(titlesIn(def)).toEqual(['plain']);
		expect(titlesIn(a)).toEqual([]);
	});

	it('announces toasts of every toaster in its own live region', async () => {
		const { a, def } = await mountTwo();
		toast.success('Alpha', { toasterId: 'a', duration: Infinity });
		toast.success('Beta', { duration: Infinity });
		await flush();
		const politeIn = (root: HTMLElement) =>
			root.querySelector('[data-cool-toast-announcer="polite"]')!;
		expect(politeIn(a)).toHaveTextContent('Alpha');
		expect(politeIn(def)).toHaveTextContent('Beta');
	});
});

describe('scoped toasters: update and dismiss (TOASTER-2)', () => {
	it('update(id) finds the toast in whichever toaster holds it', async () => {
		const { a, def } = await mountTwo();
		const idA = toast('old', { toasterId: 'a', duration: Infinity });
		toast('other', { duration: Infinity });
		await flush();
		toast.update(idA, { title: 'new' });
		await flush();
		expect(titlesIn(a)).toEqual(['new']);
		expect(titlesIn(def)).toEqual(['other']);
	});

	it('dismiss(id) removes the toast from whichever toaster holds it', async () => {
		const { a, def } = await mountTwo();
		const idA = toast('gone', { toasterId: 'a', duration: Infinity });
		toast('stays', { duration: Infinity });
		await flush();
		toast.dismiss(idA);
		await advance(1000);
		expect(idsIn(a)).toEqual([]);
		expect(titlesIn(def)).toEqual(['stays']);
	});

	it('dismiss() without arguments clears every toaster', async () => {
		const { a, def } = await mountTwo();
		toast('x', { toasterId: 'a', duration: Infinity });
		toast('y', { duration: Infinity });
		await flush();
		toast.dismiss();
		await advance(1000);
		expect(titlesIn(a)).toEqual([]);
		expect(titlesIn(def)).toEqual([]);
	});

	it('dismiss(filter) applies to every toaster', async () => {
		const { a, def } = await mountTwo();
		toast.error('ea', { toasterId: 'a', duration: Infinity });
		toast.info('ia', { toasterId: 'a', duration: Infinity });
		toast.error('ed', { duration: Infinity });
		await flush();
		toast.dismiss({ type: 'error' });
		await advance(1000);
		expect(titlesIn(a)).toEqual(['ia']);
		expect(titlesIn(def)).toEqual([]);
	});
});

describe('scoped toasters: per-toaster limits (TOASTER-3)', () => {
	it('visibleToasts on one toaster does not limit the other', async () => {
		const { a, def } = await mountTwo({ a: { visibleToasts: 1 } });
		for (const n of [1, 2, 3]) {
			toast(`a${n}`, { toasterId: 'a', duration: Infinity });
			toast(`d${n}`, { duration: Infinity });
		}
		await flush();
		expect(titlesIn(a)).toHaveLength(1);
		expect(titlesIn(def)).toHaveLength(3);
	});
});

describe('inline attribute (TOASTER-4)', () => {
	it('sets data-inline="true" when inline', () => {
		render(Toaster, { inline: true });
		expect(roots()[0]).toHaveAttribute('data-inline', 'true');
	});

	it.each([undefined, false])('does not set data-inline="true" when inline is %s', (inline) => {
		render(Toaster, { inline });
		expect(roots()[0].getAttribute('data-inline')).not.toBe('true');
	});
});

describe('public types (TOASTER-6)', () => {
	it('types id, inline and toasterId', () => {
		expectTypeOf<ToasterProps['id']>().toEqualTypeOf<string | undefined>();
		expectTypeOf<ToasterProps['inline']>().toEqualTypeOf<boolean | undefined>();
		expectTypeOf<ToastOptions['toasterId']>().toEqualTypeOf<string | undefined>();
		const props: ToasterProps = { id: 'hero', inline: true };
		const options: ToastOptions = { toasterId: 'hero' };
		expect(props.id).toBe('hero');
		expect(options.toasterId).toBe('hero');
	});
});
