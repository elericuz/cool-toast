import { render } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Toaster, toast } from '../../src/lib';
import { advance, flush, q, resetToastEnvironment, toastEl, toastIds } from '../helpers';

vi.mock('motion', async () => (await import('../mocks/motion')).motionMockFactory());

const li = (id: string) => toastEl(id)!;
const action = () => ({ label: 'Undo', onClick: vi.fn() });

beforeEach(() => {
	vi.useFakeTimers();
});
afterEach(() => {
	resetToastEnvironment();
	vi.useRealTimers();
});

describe('expanded structure (RENDER-4)', () => {
	it('expands at 330 ms with description, timestamp row and action button', async () => {
		render(Toaster);
		toast('Saved', {
			id: 't',
			description: 'Your file is safe',
			action: { label: 'Undo', onClick: vi.fn() }
		});
		await flush();
		expect(li('t')).toHaveAttribute('data-expanded', 'false');

		await advance(329);
		expect(li('t')).toHaveAttribute('data-expanded', 'false');
		await advance(1);
		expect(li('t')).toHaveAttribute('data-expanded', 'true');

		expect(q(li('t'), '[data-cool-toast-description]')).toHaveTextContent('Your file is safe');
		const row = q(li('t'), '[data-cool-toast-description-row]')!;
		expect(q(row, '[data-cool-toast-timestamp]')).not.toBeNull();
		expect(q(q(li('t'), '[data-cool-toast-header]')!, '[data-cool-toast-timestamp]')).toBeNull();
		const button = q(li('t'), 'button[data-cool-toast-action]')!;
		expect(button).toHaveTextContent('Undo');
		expect(button).toHaveAttribute('aria-label', 'Undo');
	});

	it('renders a different description and label (not hard-coded)', async () => {
		render(Toaster);
		toast.error('Failed', {
			id: 't',
			description: 'Disk full',
			action: { label: 'Retry', onClick: vi.fn() }
		});
		await advance(330);
		expect(q(li('t'), '[data-cool-toast-description]')).toHaveTextContent('Disk full');
		expect(q(li('t'), 'button[data-cool-toast-action]')).toHaveAttribute('aria-label', 'Retry');
	});
});

describe('timestamp placement (RENDER-5, expanded)', () => {
	it('sits beside the description', async () => {
		render(Toaster);
		toast('x', { id: 't', description: 'd' });
		await advance(330);
		const stamp = q(li('t'), '[data-cool-toast-description-row] > [data-cool-toast-timestamp]')!;
		expect(stamp).toHaveAttribute('data-slot', 'description');
	});

	it('sits above the action wrapper when there is only an action', async () => {
		render(Toaster);
		toast('x', { id: 't', action: action() });
		await advance(330);
		const stamp = q(li('t'), '[data-cool-toast-timestamp][data-slot="action"]')!;
		const wrapper = q(li('t'), '[data-cool-toast-action-wrapper]')!;
		expect(stamp).not.toBeNull();
		expect(stamp.compareDocumentPosition(wrapper) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
	});

	it('is omitted with showTimestamp:false', async () => {
		render(Toaster);
		toast('x', { id: 't', description: 'd', showTimestamp: false });
		await advance(330);
		expect(q(li('t'), '[data-cool-toast-timestamp]')).toBeNull();
	});
});

describe('close button (RENDER-9)', () => {
	it('is absent by default', async () => {
		render(Toaster);
		toast('x', { id: 't', duration: Infinity });
		await flush();
		expect(q(li('t'), '[data-cool-toast-close]')).toBeNull();
	});

	it.each([
		[true, 'top-left'],
		['top-left', 'top-left'],
		['top-right', 'top-right']
	] as const)('closeButton=%s renders on the %s side', async (closeButton, side) => {
		render(Toaster, { closeButton });
		toast('x', { id: 't', duration: Infinity });
		await flush();
		const button = q(li('t'), 'button[data-cool-toast-close]')!;
		expect(button).toHaveAttribute('data-side', side);
		expect(button).toHaveAttribute('aria-label', 'Close notification');
	});

	it('uses a custom label', async () => {
		render(Toaster, { closeButton: true, labels: { close: 'Cerrar' } });
		toast('x', { id: 't', duration: Infinity });
		await flush();
		expect(q(li('t'), 'button[data-cool-toast-close]')).toHaveAttribute('aria-label', 'Cerrar');
	});

	it('dismisses manually: onDismiss only, then leaves the DOM', async () => {
		const onDismiss = vi.fn();
		const onAutoClose = vi.fn();
		render(Toaster, { closeButton: true });
		toast('x', { id: 't', duration: Infinity, onDismiss, onAutoClose });
		await flush();
		q<HTMLButtonElement>(li('t'), 'button[data-cool-toast-close]')!.click();
		await flush();
		expect(onDismiss).toHaveBeenCalledExactlyOnceWith('t');
		expect(onAutoClose).not.toHaveBeenCalled();
		await advance(350);
		expect(toastIds()).toEqual([]);
	});

	it('is not rendered while a promise is loading', async () => {
		render(Toaster, { closeButton: true });
		toast.promise(new Promise(() => {}), { loading: 'Saving', success: 'ok', error: 'no' });
		await flush();
		const el = document.querySelector('[data-cool-toast]')!;
		expect(el).toHaveAttribute('data-phase', 'loading');
		expect(q(el as HTMLElement, '[data-cool-toast-close]')).toBeNull();
	});
});

describe('classes pass-through (RENDER-17, full)', () => {
	it('appends every class to its element', async () => {
		render(Toaster);
		toast('x', {
			id: 't',
			description: 'd',
			action: action(),
			classes: {
				wrapper: 'w',
				content: 'c',
				header: 'h',
				title: 'ti',
				icon: 'ic',
				description: 'de',
				actionWrapper: 'aw',
				actionButton: 'ab'
			}
		});
		await advance(330);
		const el = li('t');
		expect(q(el, '.w')).not.toBeNull();
		expect(q(el, '[data-cool-toast-content]')).toHaveClass('c');
		expect(q(el, '[data-cool-toast-header]')).toHaveClass('h');
		expect(q(el, '[data-cool-toast-title]')).toHaveClass('ti');
		expect(q(el, '[data-cool-toast-icon]')).toHaveClass('ic');
		expect(q(el, '[data-cool-toast-description]')).toHaveClass('de');
		expect(q(el, '[data-cool-toast-action-wrapper]')).toHaveClass('aw');
		expect(q(el, 'button[data-cool-toast-action]')).toHaveClass('ab');
	});
});

describe('action without successLabel (UPDATE-7)', () => {
	it('calls onClick once and leaves the toast expanded and unchanged', async () => {
		const onClick = vi.fn();
		render(Toaster);
		toast('Saved', { id: 't', description: 'Body', action: { label: 'Undo', onClick } });
		await advance(330);

		q<HTMLButtonElement>(li('t'), 'button[data-cool-toast-action]')!.click();
		await advance(100);

		expect(onClick).toHaveBeenCalledTimes(1);
		expect(li('t')).toHaveAttribute('data-expanded', 'true');
		expect(li('t')).toHaveAttribute('data-phase', 'default');
		expect(q(li('t'), '[data-cool-toast-title]')).toHaveTextContent('Saved');
		expect(q(li('t'), '[data-cool-toast-description]')).toHaveTextContent('Body');
		expect(q(li('t'), 'button[data-cool-toast-action]')).not.toBeNull();
	});
});
