import type { Snippet } from 'svelte';
import { describe, expect, it } from 'vitest';
import { resolveOptions } from '../src/lib/resolve-options';

// Snippet de prueba: basta con que sea una función (se trata como contenido expandido)
const snippet = (() => {}) as unknown as Snippet;

describe('resolveOptions — precedence (API-3)', () => {
	it('uses the Toaster preset and showTimestamp when the toast sets nothing', () => {
		const r = resolveOptions({}, { preset: 'bouncy', showTimestamp: false });
		expect(r).toMatchObject({ bounce: 0.6, spring: true, showTimestamp: false });
	});

	it('toast preset beats the Toaster preset', () => {
		expect(resolveOptions({ preset: 'subtle' }, { preset: 'bouncy' }).bounce).toBe(0.05);
	});

	it('explicit toast bounce beats its own preset', () => {
		expect(resolveOptions({ preset: 'subtle', bounce: 0.2 }, { preset: 'bouncy' }).bounce).toBe(
			0.2
		);
	});

	it('explicit toast showTimestamp beats the Toaster prop', () => {
		expect(resolveOptions({ showTimestamp: true }, { showTimestamp: false }).showTimestamp).toBe(
			true
		);
	});

	it('Toaster bounce beats the Toaster preset', () => {
		expect(resolveOptions({}, { preset: 'bouncy', bounce: 0.2 }).bounce).toBe(0.2);
	});

	it('toast preset beats an explicit Toaster bounce', () => {
		expect(resolveOptions({ preset: 'subtle' }, { bounce: 0.2 }).bounce).toBe(0.05);
	});

	it('explicit toast spring:false beats a spring preset', () => {
		expect(resolveOptions({ preset: 'smooth', spring: false }, {}).spring).toBe(false);
	});

	it('Toaster spring:false applies when the toast sets nothing', () => {
		expect(resolveOptions({}, { spring: false }).spring).toBe(false);
	});

	it('falls back to the documented defaults with no options and no props', () => {
		expect(resolveOptions({}, {})).toMatchObject({
			bounce: 0.4,
			spring: true,
			showProgress: false,
			showTimestamp: true,
			duration: 4000,
			displayDuration: 4000,
			closeButton: false,
			swipeToDismiss: true
		});
	});

	it('resolves showProgress, closeButton and swipeToDismiss from the Toaster, toast first', () => {
		const toaster = { showProgress: true, closeButton: true, swipeToDismiss: false } as const;
		expect(resolveOptions({}, toaster)).toMatchObject({
			showProgress: true,
			closeButton: 'top-left',
			swipeToDismiss: false
		});
		expect(resolveOptions({ showProgress: false }, toaster).showProgress).toBe(false);
		expect(resolveOptions({}, { closeButton: 'top-right' }).closeButton).toBe('top-right');
	});
});

describe('resolveOptions — duration semantics (API-4)', () => {
	it('compact toast: option → Toaster duration → 4000', () => {
		expect(resolveOptions({ duration: 1500 }, { duration: 2500 })).toMatchObject({
			expanded: false,
			duration: 1500,
			lifetime: 1500
		});
		expect(resolveOptions({}, { duration: 2500 }).lifetime).toBe(2500);
		expect(resolveOptions({}, {}).lifetime).toBe(4000);
	});

	it('compact toast: Infinity disables auto close', () => {
		expect(resolveOptions({ duration: Infinity }, {}).lifetime).toBe(Infinity);
	});

	it('compact toast ignores timing.displayDuration', () => {
		const r = resolveOptions({ timing: { displayDuration: 9000 } }, {});
		expect(r.expanded).toBe(false);
		expect(r.lifetime).toBe(4000);
	});

	it('expanded toast (description) ignores duration and uses displayDuration', () => {
		expect(resolveOptions({ description: 'd', duration: 1000 }, { duration: 1000 })).toMatchObject({
			expanded: true,
			displayDuration: 4000,
			lifetime: 4000
		});
		expect(
			resolveOptions({ description: 'd', timing: { displayDuration: 6000 } }, {}).lifetime
		).toBe(6000);
	});

	it('expanded toast via action only or Snippet description', () => {
		const action = { label: 'Undo', onClick: () => {} };
		expect(resolveOptions({ action }, {})).toMatchObject({ expanded: true, lifetime: 4000 });
		expect(resolveOptions({ description: snippet }, {})).toMatchObject({ expanded: true });
	});
});

describe('resolveOptions — purity (API-5)', () => {
	const deepFreeze = <T extends object>(value: T): T => {
		for (const inner of Object.values(value)) {
			if (inner && typeof inner === 'object') deepFreeze(inner);
		}
		return Object.freeze(value);
	};

	it('returns deep-equal output for the same input and does not mutate it', () => {
		const options = deepFreeze({ preset: 'subtle' as const, timing: { displayDuration: 5000 } });
		const toaster = deepFreeze({ preset: 'bouncy' as const, showProgress: true });
		const before = structuredClone({ options, toaster });
		const first = resolveOptions(options, toaster);
		const second = resolveOptions(options, toaster);
		expect(second).toEqual(first);
		expect(second).not.toBe(first);
		expect({ options, toaster }).toEqual(before);
	});
});
