import { describe, expect, it } from 'vitest';
import * as constants from '../src/lib/constants';

// Verificación estática de handoff §B.7
describe('constants (handoff §B.7)', () => {
	it('exposes the geometry constants', () => {
		expect(constants.PILL_HEIGHT).toBe(44);
		expect(constants.PILL_RADIUS).toBe(22);
		expect(constants.PILL_PADDING_X).toBe(36);
		expect(constants.NECK_CURVE_MAX).toBe(14);
		expect(constants.BODY_CORNER_MAX).toBe(16);
		expect(constants.PILL_THRESHOLD).toBe(8);
	});

	it('exposes the timing constants', () => {
		expect(constants.EXPAND_DELAY_MS).toBe(330);
		expect(constants.MORPH_DURATION_MS).toBe(900);
		expect(constants.DISMISS_AFTER_COLLAPSE_MS).toBe(800);
		expect(constants.SUCCESS_LABEL_DISMISS_MS).toBe(1200);
		expect(constants.DEFAULT_DISPLAY_MS).toBe(4000);
		expect(constants.DEFAULT_DURATION_MS).toBe(4000);
		expect(constants.SQUISH_DEBOUNCE_MS).toBe(300);
		expect(constants.MOUNT_SQUISH_DELAY_MS).toBe(45);
		expect(constants.EXPAND_SQUISH_DELAY_MS).toBe(80);
		expect(constants.ANNOUNCER_CLEAR_MS).toBe(7000);
		expect(constants.ICON_SWAP_MS).toBe(200);
		expect(constants.FADE_MS).toBe(350);
		expect(constants.REMEASURE_MS).toBe(100);
	});

	it('exposes the swipe threshold', () => {
		expect(constants.SWIPE_THRESHOLD_PX).toBe(100);
	});
});
