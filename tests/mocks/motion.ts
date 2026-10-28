// Doble de `motion`: registra cada llamada a `animate` y permite controlar los fotogramas.
// Uso en un test (vi.mock se hoistea solo dentro del archivo de test):
//   vi.mock('motion', async () => (await import('./mocks/motion')).motionMockFactory());
//   import { animateMock } from './mocks/motion';
import { vi } from 'vitest';

export interface AnimateOptions {
	onUpdate?: (value: number) => void;
	onComplete?: () => void;
	[key: string]: unknown;
}

export interface AnimateCall {
	from: unknown;
	to: unknown;
	options: AnimateOptions;
	stopped: boolean;
	completed: boolean;
}

export interface MockControls {
	stop: () => void;
	cancel: () => void;
	complete: () => void;
	finished: Promise<void>;
	then: Promise<void>['then'];
}

type Mode = 'sync' | 'manual';

let mode: Mode = 'sync';
const calls: AnimateCall[] = [];

function finish(call: AnimateCall): void {
	if (call.stopped || call.completed) return;
	call.completed = true;
	if (typeof call.to === 'number') call.options.onUpdate?.(call.to);
	call.options.onComplete?.();
}

function running(): AnimateCall[] {
	return calls.filter((call) => !call.stopped && !call.completed);
}

const implementation = (from: unknown, to: unknown, options: AnimateOptions = {}): MockControls => {
	const call: AnimateCall = { from, to, options, stopped: false, completed: false };
	calls.push(call);
	// Modo por defecto: completa de forma síncrona (onUpdate(to) y luego onComplete())
	if (mode === 'sync') finish(call);
	const finished = Promise.resolve();
	return {
		stop: () => {
			call.stopped = true;
		},
		cancel: () => {
			call.stopped = true;
		},
		complete: () => finish(call),
		finished,
		then: finished.then.bind(finished)
	};
};

export const animateMock = Object.assign(vi.fn(implementation), {
	/** Registro de llamadas (from, to, options) en orden. */
	calls,
	/** 'sync' completa al instante; 'manual' deja las animaciones en curso. */
	setMode(next: Mode) {
		mode = next;
	},
	/** Completa todas las animaciones en curso: onUpdate(to) y onComplete(). */
	completeAll() {
		for (const call of running()) finish(call);
	},
	/** Avanza todas las animaciones numéricas en curso a la fracción `t` (0..1). */
	progressAll(t: number) {
		for (const call of running()) {
			if (typeof call.from === 'number' && typeof call.to === 'number') {
				call.options.onUpdate?.(call.from + (call.to - call.from) * t);
			}
		}
	},
	/** Limpia el historial y vuelve al modo síncrono. */
	reset() {
		calls.length = 0;
		mode = 'sync';
		animateMock.mockClear();
	}
});

/** Fábrica para `vi.mock('motion', …)`. */
export function motionMockFactory() {
	return { animate: animateMock };
}
