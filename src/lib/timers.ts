type TimerId = string | number;

interface TimerEntry {
	callback: () => void;
	remaining: number;
	// Instante en que arrancó el tramo actual; null mientras está en pausa
	startedAt: number | null;
	handle: ReturnType<typeof setTimeout> | null;
}

export interface Timers {
	start(id: TimerId, ms: number, callback: () => void): void;
	pause(id: TimerId): void;
	resume(id: TimerId): void;
	clear(id: TimerId): void;
	remaining(id: TimerId): number | undefined;
}

/** Temporizadores pausables por id que conservan el tiempo restante entre pausas. */
export function createTimers(): Timers {
	const entries = new Map<TimerId, TimerEntry>();

	function run(id: TimerId, entry: TimerEntry) {
		entry.startedAt = Date.now();
		entry.handle = setTimeout(() => {
			entries.delete(id);
			entry.callback();
		}, entry.remaining);
	}

	function clear(id: TimerId) {
		const entry = entries.get(id);
		if (!entry) return;
		if (entry.handle !== null) clearTimeout(entry.handle);
		entries.delete(id);
	}

	return {
		start(id, ms, callback) {
			// Reiniciar un id reemplaza el temporizador anterior
			clear(id);
			const entry: TimerEntry = { callback, remaining: ms, startedAt: null, handle: null };
			entries.set(id, entry);
			run(id, entry);
		},
		pause(id) {
			const entry = entries.get(id);
			if (!entry || entry.startedAt === null) return;
			if (entry.handle !== null) clearTimeout(entry.handle);
			entry.remaining = Math.max(0, entry.remaining - (Date.now() - entry.startedAt));
			entry.startedAt = null;
			entry.handle = null;
		},
		resume(id) {
			const entry = entries.get(id);
			if (!entry || entry.startedAt !== null) return;
			run(id, entry);
		},
		clear,
		remaining(id) {
			const entry = entries.get(id);
			if (!entry) return undefined;
			if (entry.startedAt === null) return entry.remaining;
			return Math.max(0, entry.remaining - (Date.now() - entry.startedAt));
		}
	};
}
