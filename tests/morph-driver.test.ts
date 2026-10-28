import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MorphDriver } from '../src/lib/morph-driver';
import { animateMock } from './mocks/motion';

vi.mock('motion', async () => (await import('./mocks/motion')).motionMockFactory());

// Contrato del driver (W3-T1): el driver elige las opciones de animación (animation-config)
//   driver.expand(bounce, spring, onComplete)
//   driver.collapse(bounce, spring, preDismiss, onComplete)
//   driver.animateValue(from, to, options, onFrame, onComplete)  → p. ej. el ancho de la píldora
//   driver.snap(t) / driver.stop() / driver.redraw() / driver.t
const lastCall = () => animateMock.calls.at(-1)!;

let draw: ReturnType<typeof vi.fn<(t: number) => void>>;
let driver: MorphDriver;

beforeEach(() => {
	animateMock.reset();
	draw = vi.fn<(t: number) => void>();
	driver = new MorphDriver(draw);
});
afterEach(() => {
	animateMock.reset();
});

describe('expand / collapse options (ANIM-1, ANIM-9 wiring)', () => {
	it('expand animates 0 → 1 with a 0.9 s spring using the given bounce', () => {
		animateMock.setMode('manual');
		driver.expand(0.4, true, vi.fn());
		expect(lastCall()).toMatchObject({
			from: 0,
			to: 1,
			options: { type: 'spring', duration: 0.9, bounce: 0.4 }
		});
		driver.expand(0.6, true, vi.fn());
		expect(lastCall().options).toMatchObject({ type: 'spring', duration: 0.9, bounce: 0.6 });
	});

	it('expand uses a 0.6 s tween without spring', () => {
		animateMock.setMode('manual');
		driver.expand(0.4, false, vi.fn());
		expect(lastCall().options).toMatchObject({ duration: 0.6, ease: [0.4, 0, 0.2, 1] });
	});

	it('collapse uses a spring with bounce·0.875 unless pre-dismiss', () => {
		animateMock.setMode('manual');
		driver.snap(1);
		driver.collapse(0.4, true, false, vi.fn());
		expect(lastCall()).toMatchObject({
			from: 1,
			to: 0,
			options: { type: 'spring', duration: 0.9 }
		});
		expect((lastCall().options as { bounce: number }).bounce).toBeCloseTo(0.35, 10);
	});

	it('collapse before dismissal uses the 0.9 s tween', () => {
		animateMock.setMode('manual');
		driver.snap(1);
		driver.collapse(0.4, true, true, vi.fn());
		expect(lastCall().options).toMatchObject({ duration: 0.9, ease: [0.4, 0, 0.2, 1] });
	});
});

describe('frames and completion', () => {
	it('draws every frame and ends exactly on the target', () => {
		animateMock.setMode('manual');
		const onComplete = vi.fn();
		driver.expand(0.4, true, onComplete);
		animateMock.progressAll(0.25);
		expect(draw).toHaveBeenLastCalledWith(0.25);
		expect(driver.t).toBe(0.25);
		animateMock.completeAll();
		expect(draw).toHaveBeenLastCalledWith(1);
		expect(driver.t).toBe(1);
		expect(onComplete).toHaveBeenCalledTimes(1);
	});

	it('completes synchronously with the default mock mode', () => {
		const onComplete = vi.fn();
		driver.expand(0.4, true, onComplete);
		expect(driver.t).toBe(1);
		expect(onComplete).toHaveBeenCalledTimes(1);
	});
});

describe('interrupt and start-from-current (ANIM-3 driver level)', () => {
	it('starting a collapse mid-expand stops the running controller and starts from the current t', () => {
		animateMock.setMode('manual');
		const expandDone = vi.fn();
		driver.expand(0.4, true, expandDone);
		animateMock.progressAll(0.5);
		const expandCall = lastCall();

		driver.collapse(0.4, true, false, vi.fn());

		expect(expandCall.stopped).toBe(true);
		expect(lastCall()).toMatchObject({ from: 0.5, to: 0 });
		animateMock.completeAll();
		expect(expandDone).not.toHaveBeenCalled();
	});

	it('expanding again mid-collapse restarts from the current t', () => {
		animateMock.setMode('manual');
		driver.snap(1);
		driver.collapse(0.4, true, false, vi.fn());
		animateMock.progressAll(0.5);
		const collapseCall = lastCall();

		driver.expand(0.4, true, vi.fn());

		expect(collapseCall.stopped).toBe(true);
		expect(lastCall()).toMatchObject({ from: 0.5, to: 1 });
	});

	it('stop() cancels the animation without calling onComplete', () => {
		animateMock.setMode('manual');
		const onComplete = vi.fn();
		driver.expand(0.4, true, onComplete);
		driver.stop();
		animateMock.completeAll();
		expect(onComplete).not.toHaveBeenCalled();
		expect(lastCall().stopped).toBe(true);
	});
});

describe('snap and redraw', () => {
	it('snap writes the value immediately and never calls animate', () => {
		driver.snap(1);
		expect(draw).toHaveBeenLastCalledWith(1);
		expect(driver.t).toBe(1);
		expect(animateMock.calls).toHaveLength(0);
	});

	it('snap interrupts a running animation', () => {
		animateMock.setMode('manual');
		driver.expand(0.4, true, vi.fn());
		const running = lastCall();
		driver.snap(0);
		expect(running.stopped).toBe(true);
		expect(driver.t).toBe(0);
	});

	it('redraw repeats the current value', () => {
		driver.snap(0.5);
		draw.mockClear();
		driver.redraw();
		expect(draw).toHaveBeenCalledExactlyOnceWith(0.5);
	});
});

describe('animateValue (pill resize, ANIM-7 driver level)', () => {
	it('animates between arbitrary values with the given options and reports frames', () => {
		animateMock.setMode('manual');
		const onFrame = vi.fn();
		const onComplete = vi.fn();
		driver.animateValue(
			120,
			220,
			{ type: 'spring', duration: 0.5, bounce: 0.35 },
			onFrame,
			onComplete
		);
		expect(lastCall()).toMatchObject({
			from: 120,
			to: 220,
			options: { type: 'spring', duration: 0.5, bounce: 0.35 }
		});
		animateMock.progressAll(0.5);
		expect(onFrame).toHaveBeenLastCalledWith(170);
		animateMock.completeAll();
		expect(onFrame).toHaveBeenLastCalledWith(220);
		expect(onComplete).toHaveBeenCalledTimes(1);
	});

	it('a new animateValue stops the previous one', () => {
		animateMock.setMode('manual');
		driver.animateValue(100, 200, { duration: 0.4 }, vi.fn(), vi.fn());
		const first = lastCall();
		driver.animateValue(150, 300, { duration: 0.4 }, vi.fn(), vi.fn());
		expect(first.stopped).toBe(true);
		expect(lastCall()).toMatchObject({ from: 150, to: 300 });
	});
});
