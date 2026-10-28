import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createTimers } from '../src/lib/timers';

describe('createTimers (STORE-12)', () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});
	afterEach(() => {
		vi.useRealTimers();
	});

	it('fires the callback after the given time', () => {
		const timers = createTimers();
		const callback = vi.fn();
		timers.start('x', 1000, callback);
		vi.advanceTimersByTime(999);
		expect(callback).not.toHaveBeenCalled();
		vi.advanceTimersByTime(1);
		expect(callback).toHaveBeenCalledTimes(1);
	});

	it('preserves the remaining time across pause/resume and fires once', () => {
		const timers = createTimers();
		const callback = vi.fn();
		timers.start('x', 1000, callback);
		vi.advanceTimersByTime(400);
		timers.pause('x');
		vi.advanceTimersByTime(5000);
		expect(callback).not.toHaveBeenCalled();
		timers.resume('x');
		vi.advanceTimersByTime(599);
		expect(callback).not.toHaveBeenCalled();
		vi.advanceTimersByTime(1);
		expect(callback).toHaveBeenCalledTimes(1);
		vi.advanceTimersByTime(10_000);
		expect(callback).toHaveBeenCalledTimes(1);
	});

	it('supports several pause/resume cycles accumulating elapsed time', () => {
		const timers = createTimers();
		const callback = vi.fn();
		timers.start('x', 1000, callback);
		vi.advanceTimersByTime(300);
		timers.pause('x');
		timers.resume('x');
		vi.advanceTimersByTime(300);
		timers.pause('x');
		vi.advanceTimersByTime(2000);
		timers.resume('x');
		vi.advanceTimersByTime(399);
		expect(callback).not.toHaveBeenCalled();
		vi.advanceTimersByTime(1);
		expect(callback).toHaveBeenCalledTimes(1);
	});

	it('reports the remaining time', () => {
		const timers = createTimers();
		timers.start('x', 1000, vi.fn());
		vi.advanceTimersByTime(250);
		expect(timers.remaining('x')).toBe(750);
		timers.pause('x');
		vi.advanceTimersByTime(3000);
		expect(timers.remaining('x')).toBe(750);
	});

	it('ignores a second pause and a resume that was never paused', () => {
		const timers = createTimers();
		const callback = vi.fn();
		timers.start('x', 1000, callback);
		timers.resume('x');
		vi.advanceTimersByTime(400);
		timers.pause('x');
		vi.advanceTimersByTime(300);
		timers.pause('x');
		timers.resume('x');
		vi.advanceTimersByTime(600);
		expect(callback).toHaveBeenCalledTimes(1);
	});

	it('keeps timers independent per id', () => {
		const timers = createTimers();
		const a = vi.fn();
		const b = vi.fn();
		timers.start('a', 500, a);
		timers.start('b', 1000, b);
		timers.pause('a');
		vi.advanceTimersByTime(1000);
		expect(a).not.toHaveBeenCalled();
		expect(b).toHaveBeenCalledTimes(1);
	});

	it('clear cancels a running or paused timer', () => {
		const timers = createTimers();
		const running = vi.fn();
		const paused = vi.fn();
		timers.start('r', 500, running);
		timers.start('p', 500, paused);
		timers.pause('p');
		timers.clear('r');
		timers.clear('p');
		timers.resume('p');
		vi.advanceTimersByTime(5000);
		expect(running).not.toHaveBeenCalled();
		expect(paused).not.toHaveBeenCalled();
	});

	it('starting an id again replaces the previous timer', () => {
		const timers = createTimers();
		const first = vi.fn();
		const second = vi.fn();
		timers.start('x', 500, first);
		timers.start('x', 800, second);
		vi.advanceTimersByTime(800);
		expect(first).not.toHaveBeenCalled();
		expect(second).toHaveBeenCalledTimes(1);
	});

	it('treats unknown ids as no-ops', () => {
		const timers = createTimers();
		expect(() => {
			timers.pause('nope');
			timers.resume('nope');
			timers.clear('nope');
		}).not.toThrow();
		expect(timers.remaining('nope')).toBeUndefined();
	});
});
