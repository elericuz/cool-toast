import { render, screen } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { setMediaQuery, triggerResize } from './setup';
import { animateMock } from './mocks/motion';
import { animate } from 'motion';
import Hello from './fixtures/Hello.svelte';
import { Counter } from './fixtures/counter.svelte';

vi.mock('motion', async () => (await import('./mocks/motion')).motionMockFactory());

describe('test harness', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		animateMock.reset();
	});
	afterEach(() => {
		vi.useRealTimers();
	});

	it('renders a Svelte 5 component with Testing Library and jest-dom', () => {
		render(Hello, { name: 'World' });
		expect(screen.getByTestId('greeting')).toHaveTextContent('Hello, World');
	});

	it('renders different props to prove the component actually ran', () => {
		render(Hello, { name: 'Toast' });
		expect(screen.getByText('Hello, Toast')).toBeInTheDocument();
	});

	it('compiles runes in .svelte.ts modules', () => {
		const counter = new Counter();
		counter.increment();
		counter.increment();
		expect(counter.value).toBe(2);
		expect(counter.double).toBe(4);
	});

	it('exposes a controllable matchMedia that notifies change listeners', () => {
		const query = '(prefers-reduced-motion: reduce)';
		const list = window.matchMedia(query);
		const listener = vi.fn();
		list.addEventListener('change', listener);
		expect(list.matches).toBe(false);
		setMediaQuery(query, true);
		expect(window.matchMedia(query).matches).toBe(true);
		expect(listener).toHaveBeenCalledTimes(1);
		expect(listener.mock.calls[0][0]).toMatchObject({ matches: true, media: query });
	});

	it('fires ResizeObserver callbacks on demand', () => {
		const callback = vi.fn();
		const target = document.createElement('div');
		new ResizeObserver(callback).observe(target);
		expect(callback).not.toHaveBeenCalled();
		triggerResize();
		expect(callback).toHaveBeenCalledTimes(1);
	});

	it('runs requestAnimationFrame synchronously', () => {
		const callback = vi.fn();
		requestAnimationFrame(callback);
		expect(callback).toHaveBeenCalledTimes(1);
	});

	it('provides PointerEvent with pointerType and clientX', () => {
		const event = new PointerEvent('pointerdown', { pointerType: 'touch', clientX: 42 });
		expect(event.pointerType).toBe('touch');
		expect(event.clientX).toBe(42);
	});

	it('reads measured sizes from data-test attributes and the default map', () => {
		const custom = document.createElement('div');
		custom.setAttribute('data-test-w', '250');
		custom.setAttribute('data-test-h', '60');
		expect(custom.offsetWidth).toBe(250);
		expect(custom.offsetHeight).toBe(60);
		const content = document.createElement('div');
		content.setAttribute('data-cool-toast-content', '');
		expect([content.offsetWidth, content.offsetHeight]).toEqual([150, 44]);
		const row = document.createElement('div');
		row.setAttribute('data-cool-toast-description-row', '');
		content.append(row);
		expect([content.offsetWidth, content.offsetHeight]).toEqual([320, 112]);
		// Los nodos en salida no cuentan como contenido expandido
		const leaving = document.createElement('div');
		leaving.setAttribute('data-leaving', 'true');
		const leavingRow = document.createElement('div');
		leavingRow.setAttribute('data-cool-toast-description-row', '');
		leaving.append(leavingRow);
		row.remove();
		content.append(leaving);
		expect([content.offsetWidth, content.offsetHeight]).toEqual([150, 44]);
	});

	it('advances fake timers without real waiting', () => {
		const callback = vi.fn();
		setTimeout(callback, 4000);
		vi.advanceTimersByTime(3999);
		expect(callback).not.toHaveBeenCalled();
		vi.advanceTimersByTime(1);
		expect(callback).toHaveBeenCalledTimes(1);
	});

	it('mocks motion.animate: sync mode completes and records the call', () => {
		const onUpdate = vi.fn();
		const onComplete = vi.fn();
		animate(0, 1, { duration: 0.9, bounce: 0.4, onUpdate, onComplete });
		expect(onUpdate).toHaveBeenLastCalledWith(1);
		expect(onComplete).toHaveBeenCalledTimes(1);
		expect(animateMock.calls).toHaveLength(1);
		expect(animateMock.calls[0]).toMatchObject({
			from: 0,
			to: 1,
			options: { duration: 0.9, bounce: 0.4 }
		});
	});

	it('mocks motion.animate: manual mode drives frames and honours stop()', () => {
		animateMock.setMode('manual');
		const onUpdate = vi.fn();
		const onComplete = vi.fn();
		const controls = animate(0, 10, { onUpdate, onComplete });
		animateMock.progressAll(0.5);
		expect(onUpdate).toHaveBeenLastCalledWith(5);
		expect(onComplete).not.toHaveBeenCalled();
		animateMock.completeAll();
		expect(onUpdate).toHaveBeenLastCalledWith(10);
		expect(onComplete).toHaveBeenCalledTimes(1);

		const stoppedComplete = vi.fn();
		const stopped = animate(0, 10, { onComplete: stoppedComplete });
		stopped.stop();
		animateMock.completeAll();
		expect(stoppedComplete).not.toHaveBeenCalled();
		expect(controls).toBeDefined();
	});
});
