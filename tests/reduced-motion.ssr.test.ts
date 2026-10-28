// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { createReducedMotion } from '../src/lib/reduced-motion.svelte';

describe('createReducedMotion without a DOM', () => {
	it('runs without window', () => {
		expect(typeof window).toBe('undefined');
	});

	it('returns "no reduction" and does not throw', () => {
		expect(createReducedMotion().current).toBe(false);
	});
});
