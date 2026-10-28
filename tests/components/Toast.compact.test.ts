import { createRawSnippet } from 'svelte';
import { render } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Toaster, toast } from '../../src/lib';
import { flush, q, resetToastEnvironment, toastEl, toastEls } from '../helpers';

vi.mock('motion', async () => (await import('../mocks/motion')).motionMockFactory());

const li = (id: string) => toastEl(id)!;

beforeEach(() => {
	vi.useFakeTimers();
});
afterEach(() => {
	resetToastEnvironment();
	vi.useRealTimers();
});

describe('compact structure (RENDER-3)', () => {
	it('renders blob, content, header, icon, title and timestamp in order', async () => {
		render(Toaster);
		toast('Saved', { id: 't', duration: Infinity });
		await flush();
		const el = li('t');
		expect(el.tagName).toBe('LI');
		expect(el).toHaveAttribute('data-type', 'default');
		expect(el).toHaveAttribute('data-phase', 'default');
		expect(el).toHaveAttribute('data-expanded', 'false');
		expect(el).toHaveAttribute('data-state', 'pill');

		const blob = q(el, 'svg[data-cool-toast-blob]')!;
		expect(blob).toHaveAttribute('aria-hidden', 'true');
		expect(blob.querySelectorAll('path')).toHaveLength(1);

		const content = q(el, '[data-cool-toast-content]')!;
		const header = q(content, '[data-cool-toast-header]')!;
		expect(q(header, '[data-cool-toast-icon]')).not.toBeNull();
		expect(q(header, '[data-cool-toast-title]')).toHaveTextContent('Saved');
		expect(q(header, '[data-cool-toast-timestamp]')).not.toBeNull();
		// el blob precede al contenido
		expect(blob.compareDocumentPosition(content) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
	});

	it('has no description, action or progress elements', async () => {
		render(Toaster, { showProgress: true });
		toast('Saved', { id: 't', duration: Infinity });
		await flush();
		const el = li('t');
		expect(q(el, '[data-cool-toast-description]')).toBeNull();
		expect(q(el, '[data-cool-toast-action]')).toBeNull();
		expect(q(el, '[data-cool-toast-progress]')).toBeNull();
	});

	it('renders the title of a different toast (not hard-coded)', async () => {
		render(Toaster);
		toast('Another title', { id: 't', duration: Infinity });
		await flush();
		expect(q(li('t'), '[data-cool-toast-title]')).toHaveTextContent('Another title');
	});
});

describe('timestamp (RENDER-5, compact)', () => {
	const expected = () =>
		new Date(2026, 0, 1, 9, 5, 7).toLocaleTimeString(undefined, {
			hour: 'numeric',
			minute: '2-digit',
			second: '2-digit'
		});

	it('shows the creation time in the header', async () => {
		vi.setSystemTime(new Date(2026, 0, 1, 9, 5, 7));
		render(Toaster);
		toast('Saved', { id: 't', duration: Infinity });
		await flush();
		const stamp = q(li('t'), '[data-cool-toast-header] [data-cool-toast-timestamp]')!;
		expect(stamp).toHaveTextContent(expected());
		expect(stamp).toHaveAttribute('data-slot', 'header');
	});

	it('is removed with showTimestamp:false on the toast', async () => {
		render(Toaster);
		toast('Saved', { id: 't', showTimestamp: false, duration: Infinity });
		await flush();
		expect(q(li('t'), '[data-cool-toast-timestamp]')).toBeNull();
	});

	it('is removed with showTimestamp:false on the Toaster, and a toast can opt back in', async () => {
		render(Toaster, { showTimestamp: false });
		toast('Off', { id: 'off', duration: Infinity });
		toast('On', { id: 'on', showTimestamp: true, duration: Infinity });
		await flush();
		expect(q(li('off'), '[data-cool-toast-timestamp]')).toBeNull();
		expect(q(li('on'), '[data-cool-toast-timestamp]')).not.toBeNull();
	});
});

describe('icons (RENDER-6)', () => {
	const iconOf = (id: string) => q(li(id), '[data-cool-toast-icon]')!;

	it.each(['default', 'success', 'error', 'warning', 'info'] as const)(
		'%s icon is an 18×18 decorative stroke svg',
		async (type) => {
			render(Toaster);
			if (type === 'default') toast('x', { id: 't', duration: Infinity });
			else toast[type]('x', { id: 't', duration: Infinity });
			await flush();
			const svg = q(iconOf('t'), 'svg')!;
			expect(svg).toHaveAttribute('width', '18');
			expect(svg).toHaveAttribute('height', '18');
			expect(svg).toHaveAttribute('stroke', 'currentColor');
			expect(svg).toHaveAttribute('stroke-width', '2');
			expect(svg).toHaveAttribute('aria-hidden', 'true');
		}
	);

	it('uses a circle for success/error/warning/info but not for default', async () => {
		render(Toaster, { visibleToasts: 5 });
		toast('d', { id: 'd', duration: Infinity });
		toast.success('s', { id: 's', duration: Infinity });
		toast.error('e', { id: 'e', duration: Infinity });
		toast.warning('w', { id: 'w', duration: Infinity });
		await flush();
		expect(q(iconOf('d'), 'circle')).toBeNull();
		for (const id of ['s', 'e', 'w']) expect(q(iconOf(id), 'circle')).not.toBeNull();
	});

	it('draws a different glyph for each type', async () => {
		render(Toaster, { visibleToasts: 5 });
		toast('d', { id: 'd', duration: Infinity });
		toast.success('s', { id: 's', duration: Infinity });
		toast.error('e', { id: 'e', duration: Infinity });
		toast.warning('w', { id: 'w', duration: Infinity });
		toast.info('i', { id: 'i', duration: Infinity });
		await flush();
		const markup = ['d', 's', 'e', 'w', 'i'].map((id) => iconOf(id).innerHTML);
		expect(new Set(markup).size).toBe(5);
	});

	it('shows the spinner while a promise is pending', async () => {
		render(Toaster);
		toast.promise(new Promise(() => {}), { loading: 'Saving', success: 'ok', error: 'no' });
		await flush();
		const icon = q(toastEls()[0], '[data-cool-toast-icon]')!;
		expect(q(icon, 'path[d="M21 12a9 9 0 1 1-6.219-8.56"]')).not.toBeNull();
		expect(q(icon, '.cool-toast-spin')).not.toBeNull();
	});

	it('replaces the built-in icon with an icon snippet', async () => {
		render(Toaster);
		const icon = createRawSnippet(() => ({
			render: () => '<span data-testid="custom-icon">★</span>'
		}));
		toast('x', { id: 't', icon, duration: Infinity });
		await flush();
		expect(q(iconOf('t'), '[data-testid="custom-icon"]')).toHaveTextContent('★');
		expect(q(iconOf('t'), 'svg')).toBeNull();
	});
});

describe('roles and live attributes (RENDER-7)', () => {
	it.each(['default', 'success', 'info'] as const)('%s is a polite status', async (type) => {
		render(Toaster);
		if (type === 'default') toast('x', { id: 't', duration: Infinity });
		else toast[type]('x', { id: 't', duration: Infinity });
		await flush();
		expect(li('t')).toHaveAttribute('role', 'status');
		expect(li('t')).toHaveAttribute('aria-live', 'polite');
		expect(li('t')).toHaveAttribute('aria-atomic', 'true');
	});

	it.each(['error', 'warning'] as const)('%s is an assertive alert', async (type) => {
		render(Toaster);
		toast[type]('x', { id: 't', duration: Infinity });
		await flush();
		expect(li('t')).toHaveAttribute('role', 'alert');
		expect(li('t')).toHaveAttribute('aria-live', 'assertive');
		expect(li('t')).toHaveAttribute('aria-atomic', 'true');
	});

	it('a loading promise toast is a polite status', async () => {
		render(Toaster);
		toast.promise(new Promise(() => {}), { loading: 'Saving', success: 'ok', error: 'no' });
		await flush();
		const el = toastEls()[0];
		expect(el).toHaveAttribute('data-phase', 'loading');
		expect(el).toHaveAttribute('role', 'status');
		expect(el).toHaveAttribute('aria-live', 'polite');
	});
});

describe('stack order and mirroring (RENDER-14)', () => {
	const order = () =>
		Array.from(document.querySelectorAll('ol[data-cool-toast-list] > li')).map((el) =>
			el.getAttribute('data-id')
		);

	it.each(['bottom-right', 'top-right'] as const)('%s lists the newest first', async (position) => {
		render(Toaster, { position });
		toast('a', { id: 'a', duration: Infinity });
		toast('b', { id: 'b', duration: Infinity });
		await flush();
		expect(order()).toEqual(['b', 'a']);
		expect(document.querySelector('[data-cool-toaster]')).toHaveAttribute(
			'data-y',
			position.startsWith('top') ? 'top' : 'bottom'
		);
	});

	it.each([
		['bottom-right', 'right'],
		['bottom-left', 'left'],
		['top-center', 'center']
	] as const)('%s gives each toast data-side="%s"', async (position, side) => {
		render(Toaster, { position });
		toast('a', { id: 'a', duration: Infinity });
		await flush();
		expect(li('a')).toHaveAttribute('data-side', side);
	});
});

describe('custom colours (RENDER-16)', () => {
	const path = (id: string) => q(li(id), 'svg[data-cool-toast-blob] > path')!;

	it('applies fill and border colours with the default width 1.5', async () => {
		render(Toaster);
		toast('x', { id: 't', fillColor: '#123456', borderColor: '#abcdef', duration: Infinity });
		await flush();
		expect(path('t')).toHaveAttribute('fill', '#123456');
		expect(path('t')).toHaveAttribute('stroke', '#abcdef');
		expect(path('t')).toHaveAttribute('stroke-width', '1.5');
	});

	it('honours borderWidth when borderColor is set', async () => {
		render(Toaster);
		toast('x', { id: 't', borderColor: '#abcdef', borderWidth: 3, duration: Infinity });
		await flush();
		expect(path('t')).toHaveAttribute('stroke-width', '3');
	});

	it('falls back to the CSS variable fill and no border', async () => {
		render(Toaster);
		toast('x', { id: 't', duration: Infinity });
		await flush();
		expect(path('t')).toHaveAttribute('fill', 'var(--cool-toast-fill)');
		expect(path('t')).toHaveAttribute('stroke', 'none');
		expect(path('t')).toHaveAttribute('stroke-width', '0');
	});
});

describe('classes pass-through (RENDER-17, compact subset)', () => {
	it('appends each class to its element', async () => {
		render(Toaster);
		toast('x', {
			id: 't',
			duration: Infinity,
			classes: { wrapper: 'w', content: 'c', header: 'h', title: 'ti', icon: 'ic' }
		});
		await flush();
		const el = li('t');
		expect(q(el, '.w')).not.toBeNull();
		expect(q(el, '[data-cool-toast-content]')).toHaveClass('c');
		expect(q(el, '[data-cool-toast-header]')).toHaveClass('h');
		expect(q(el, '[data-cool-toast-title]')).toHaveClass('ti');
		expect(q(el, '[data-cool-toast-icon]')).toHaveClass('ic');
	});
});
