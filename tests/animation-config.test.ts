import { describe, expect, it } from 'vitest';
import {
	morphCollapseOptions,
	morphExpandOptions,
	pillResizeOptions,
	shakeTransform,
	squishSpring,
	squishTransform
} from '../src/lib/animation-config';

describe('animation-config (ANIM-9)', () => {
	describe('morphExpandOptions', () => {
		it('uses a spring with the given bounce', () => {
			expect(morphExpandOptions(0.4, true)).toEqual({ type: 'spring', duration: 0.9, bounce: 0.4 });
			expect(morphExpandOptions(0.6, true)).toEqual({ type: 'spring', duration: 0.9, bounce: 0.6 });
		});
		it('uses a tween when spring is false', () => {
			expect(morphExpandOptions(0.4, false)).toEqual({ duration: 0.6, ease: [0.4, 0, 0.2, 1] });
		});
	});

	describe('morphCollapseOptions', () => {
		it('uses a 0.9 s tween before dismiss', () => {
			expect(morphCollapseOptions(0.4, true, true)).toEqual({
				duration: 0.9,
				ease: [0.4, 0, 0.2, 1]
			});
		});
		it('uses a tween without spring even when not pre-dismiss', () => {
			expect(morphCollapseOptions(0.4, false, false)).toEqual({
				duration: 0.9,
				ease: [0.4, 0, 0.2, 1]
			});
		});
		it('uses a spring with bounce·0.875 otherwise', () => {
			const options = morphCollapseOptions(0.4, true, false);
			expect(options).toMatchObject({ type: 'spring', duration: 0.9 });
			expect((options as { bounce: number }).bounce).toBeCloseTo(0.35, 10);
			expect((morphCollapseOptions(0.8, true, false) as { bounce: number }).bounce).toBeCloseTo(
				0.7,
				10
			);
		});
	});

	describe('pillResizeOptions', () => {
		it('uses a spring with bounce·0.875', () => {
			const options = pillResizeOptions(0.4, true);
			expect(options).toMatchObject({ type: 'spring', duration: 0.5 });
			expect((options as { bounce: number }).bounce).toBeCloseTo(0.35, 10);
		});
		it('uses a 0.4 s tween when spring is false', () => {
			expect(pillResizeOptions(0.4, false)).toEqual({ duration: 0.4, ease: [0.4, 0, 0.2, 1] });
		});
	});

	describe('squishSpring', () => {
		it('derives stiffness and damping from bounce', () => {
			expect(squishSpring(0.4)).toEqual({ type: 'spring', stiffness: 375, damping: 16, mass: 0.7 });
			expect(squishSpring(0.6)).toEqual({
				type: 'spring',
				stiffness: 462.5,
				damping: 12,
				mass: 0.7
			});
		});
	});

	describe('squishTransform', () => {
		it('mount squish peaks at v = 0.5 with bounce 0.4', () => {
			expect(squishTransform(0.5, 0.4, 'mount')).toBe('scaleX(1.06) scaleY(0.88)');
		});
		it('collapse squish uses the smaller compress/expand factors', () => {
			expect(squishTransform(0.5, 0.4, 'collapse')).toBe('scaleX(1.018) scaleY(0.965)');
		});
		it('is identity at the ends of the animation', () => {
			expect(squishTransform(0, 0.4, 'mount')).toBe('scaleX(1) scaleY(1)');
			expect(squishTransform(1, 0.4, 'mount')).toBe('scaleX(1) scaleY(1)');
		});
		it('prefixes scaleX(-1) when mirrored', () => {
			expect(squishTransform(0.5, 0.4, 'mount', true)).toBe('scaleX(-1) scaleX(1.06) scaleY(0.88)');
			expect(squishTransform(0.5, 0.4, 'mount', false).startsWith('scaleX(-1)')).toBe(false);
		});
	});

	describe('shakeTransform', () => {
		it('follows sin(v·π·6)·(1−v)·3', () => {
			expect(shakeTransform(0)).toBe('translateX(0px)');
			expect(shakeTransform(0.25)).toBe('translateX(-2.25px)');
		});
	});
});
