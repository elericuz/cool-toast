import { afterEach, describe, expect, it, vi } from 'vitest';
import { createReducedMotion } from '../src/lib/reduced-motion.svelte';
import { setMediaQuery } from './setup';

const QUERY = '(prefers-reduced-motion: reduce)';

// Contrato (W3-T5): createReducedMotion() → { readonly current: boolean }, creación perezosa
describe('createReducedMotion', () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('is false when the user has no preference', () => {
		expect(createReducedMotion().current).toBe(false);
	});

	it('is true when prefers-reduced-motion matches', () => {
		setMediaQuery(QUERY, true);
		expect(createReducedMotion().current).toBe(true);
	});

	it('follows change events', () => {
		const motion = createReducedMotion();
		expect(motion.current).toBe(false);
		setMediaQuery(QUERY, true);
		expect(motion.current).toBe(true);
		setMediaQuery(QUERY, false);
		expect(motion.current).toBe(false);
	});

	it('does not touch matchMedia until it is created', () => {
		const spy = vi.spyOn(window, 'matchMedia');
		expect(spy).not.toHaveBeenCalled();
		createReducedMotion();
		expect(spy).toHaveBeenCalledWith(QUERY);
	});
});
