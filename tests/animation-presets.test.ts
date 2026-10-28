import { describe, expect, it } from 'vitest';
import { animationPresets } from '../src/lib/animation-presets';

describe('animationPresets', () => {
	it('API-2 equals exactly the four documented presets', () => {
		expect(animationPresets).toEqual({
			smooth: { bounce: 0.1, spring: true },
			subtle: { bounce: 0.05, spring: true },
			snappy: { bounce: 0.4, spring: true },
			bouncy: { bounce: 0.6, spring: true }
		});
	});

	it('API-2 is frozen so consumers cannot mutate shared presets', () => {
		expect(Object.isFrozen(animationPresets)).toBe(true);
		expect(() => {
			(animationPresets as unknown as Record<string, unknown>).smooth = {
				bounce: 1,
				spring: false
			};
		}).toThrow();
		expect(animationPresets.smooth.bounce).toBe(0.1);
	});
});
