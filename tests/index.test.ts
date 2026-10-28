import { describe, expect, it } from 'vitest';
import * as library from '../src/lib/index';
import { animationPresets } from '../src/lib/animation-presets';
import { toast } from '../src/lib/toast';

describe('public entry (STYLE-7)', () => {
	it('exports exactly Toaster, animationPresets and toast at runtime', () => {
		expect(Object.keys(library).sort()).toEqual(['Toaster', 'animationPresets', 'toast']);
	});

	it('re-exports the real implementations', () => {
		expect(library.toast).toBe(toast);
		expect(library.animationPresets).toBe(animationPresets);
		expect(typeof library.Toaster).toBe('function');
	});

	it('does not leak internal helpers', () => {
		for (const internal of [
			'getStore',
			'resolveOptions',
			'morphPath',
			'MorphDriver',
			'createTimers'
		]) {
			expect(internal in library, internal).toBe(false);
		}
	});
});
