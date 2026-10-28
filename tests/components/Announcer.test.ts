import { createRawSnippet } from 'svelte';
import { render } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Toaster, toast } from '../../src/lib';
import { advance, flush, resetToastEnvironment } from '../helpers';

vi.mock('motion', async () => (await import('../mocks/motion')).motionMockFactory());

const polite = () => document.querySelector<HTMLElement>('[data-cool-toast-announcer="polite"]')!;
const assertive = () =>
	document.querySelector<HTMLElement>('[data-cool-toast-announcer="assertive"]')!;

beforeEach(() => {
	vi.useFakeTimers();
});
afterEach(() => {
	resetToastEnvironment();
	vi.useRealTimers();
});

describe('Announcer (RENDER-8)', () => {
	it('exposes two live regions with the right roles', () => {
		render(Toaster);
		expect(polite()).toHaveAttribute('role', 'status');
		expect(polite()).toHaveAttribute('aria-live', 'polite');
		expect(polite()).toHaveAttribute('aria-atomic', 'true');
		expect(assertive()).toHaveAttribute('role', 'alert');
		expect(assertive()).toHaveAttribute('aria-live', 'assertive');
		expect(assertive()).toHaveAttribute('aria-atomic', 'true');
		expect(polite()).toHaveTextContent('');
		expect(assertive()).toHaveTextContent('');
	});

	it('announces "title: description" politely and clears after 7000 ms', async () => {
		render(Toaster);
		toast.success('Saved', { description: 'Done', duration: Infinity });
		await flush();
		expect(polite()).toHaveTextContent('Saved: Done');
		expect(assertive()).toHaveTextContent('');

		await advance(6999);
		expect(polite()).toHaveTextContent('Saved: Done');
		await advance(1);
		expect(polite()).toHaveTextContent('');
	});

	it('announces errors assertively with the title only', async () => {
		render(Toaster);
		toast.error('Failed', { duration: Infinity });
		await flush();
		expect(assertive()).toHaveTextContent('Failed');
		expect(polite()).toHaveTextContent('');
	});

	it('announces warnings assertively and info politely', async () => {
		render(Toaster);
		toast.warning('Careful', { duration: Infinity });
		await flush();
		expect(assertive()).toHaveTextContent('Careful');
		toast.info('FYI', { duration: Infinity });
		await flush();
		expect(polite()).toHaveTextContent('FYI');
	});

	it('announces only the title when the description is a Snippet', async () => {
		render(Toaster);
		const description = createRawSnippet(() => ({ render: () => '<span>rich body</span>' }));
		toast.success('Saved', { description, duration: Infinity });
		await flush();
		expect(polite().textContent?.trim()).toBe('Saved');
	});
});
