import { describe, expect, it } from 'vitest';
import { morphPath, morphPathCenter } from '../src/lib/morph-path';

// Normaliza espacios para comparar contra los strings de la especificación
const norm = (d: string) => d.replace(/\s+/g, ' ').trim();

// Extrae todos los números del path, redondeados a 3 decimales
const numbers = (d: string) =>
	(d.match(/-?\d+(?:\.\d+)?/g) ?? []).map((n) => Math.round(parseFloat(n) * 1000) / 1000);

// Mayor coordenada y entre los puntos finales de cada comando
function maxY(d: string): number {
	const ys: number[] = [];
	for (const [, cmd, args] of d.matchAll(/([MLQAHZ])([^MLQAHZ]*)/g)) {
		const n = args.match(/-?\d+(?:\.\d+)?/g)?.map(Number) ?? [];
		if (cmd === 'M' || cmd === 'L') ys.push(n[1]);
		if (cmd === 'Q') ys.push(n[1], n[3]);
		if (cmd === 'A') ys.push(n[6]);
	}
	return Math.round(Math.max(...ys) * 1000) / 1000;
}

// Comprueba que los fragmentos aparecen en el path en el orden dado
function expectInOrder(d: string, fragments: string[]) {
	let from = 0;
	for (const fragment of fragments) {
		const at = d.indexOf(fragment, from);
		expect(at, `fragment "${fragment}" after index ${from} in "${d}"`).toBeGreaterThanOrEqual(0);
		from = at + fragment.length;
	}
}

describe('morphPath', () => {
	it('MORPH-1 returns the pill at t = 0', () => {
		expect(norm(morphPath(136, 320, 112, 0))).toBe(
			'M 0,22 A 22,22 0 0 1 22,0 H 114 A 22,22 0 0 1 136,22 A 22,22 0 0 1 114,44 H 22 A 22,22 0 0 1 0,22 Z'
		);
	});

	it('MORPH-1 pill follows the pill width argument', () => {
		expect(norm(morphPath(200, 320, 112, 0))).toBe(
			'M 0,22 A 22,22 0 0 1 22,0 H 178 A 22,22 0 0 1 200,22 A 22,22 0 0 1 178,44 H 22 A 22,22 0 0 1 0,22 Z'
		);
	});

	it('MORPH-2 stays a pill while the body is below the threshold', () => {
		const pill = morphPath(136, 320, 112, 0);
		expect(morphPath(136, 320, 112, 0.1)).toBe(pill);
		// 68·0.11 = 7.48 < 8 sigue siendo píldora
		expect(morphPath(136, 320, 112, 0.11)).toBe(pill);
	});

	it('MORPH-2 leaves the pill once body − PH reaches the threshold', () => {
		expect(morphPath(136, 320, 112, 0.12)).not.toBe(morphPath(136, 320, 112, 0));
		expect(maxY(morphPath(136, 320, 112, 0.12))).toBeCloseTo(52.16, 3);
	});

	it('MORPH-3 draws the full body at t = 1', () => {
		expectInOrder(norm(morphPath(136, 320, 112, 1)), [
			'M 0,22',
			'A 22,22 0 0 1 22,0',
			'H 114',
			'A 22,22 0 0 1 136,22',
			'L 136,30',
			'Q 136,44 150,44',
			'H 304',
			'A 16,16 0 0 1 320,60',
			'L 320,96',
			'A 16,16 0 0 1 304,112',
			'H 16',
			'A 16,16 0 0 1 0,96',
			'Z'
		]);
	});

	it('MORPH-3 adapts to different body dimensions', () => {
		// th 100: cr = min(16, 56·0.45) = 16; bodyW 250 → H 234
		const d = norm(morphPath(100, 250, 100, 1));
		expectInOrder(d, ['L 100,30', 'Q 100,44 114,44', 'H 234', 'A 16,16 0 0 1 250,60', 'L 250,84']);
	});

	it('MORPH-4 interpolates the intermediate shape at t = 0.5', () => {
		const d = norm(morphPath(136, 320, 112, 0.5));
		// curve 7 aparece implícito: bodyTop 37 = 44 − 7 y qEndX 143 = 136 + 7
		expectInOrder(d, [
			'L 136,37',
			'Q 136,44 143,44',
			'H 212.7',
			'A 15.3,15.3 0 0 1 228,59.3',
			'L 228,62.7',
			'A 15.3,15.3 0 0 1 212.7,78',
			'H 15.3',
			'A 15.3,15.3 0 0 1 0,62.7',
			'Z'
		]);
	});

	it('MORPH-5 clamps the pill width to the body width', () => {
		expect(norm(morphPath(400, 320, 112, 0))).toBe(
			'M 0,22 A 22,22 0 0 1 22,0 H 298 A 22,22 0 0 1 320,22 A 22,22 0 0 1 298,44 H 22 A 22,22 0 0 1 0,22 Z'
		);
	});

	it('MORPH-7 grows monotonically in height', () => {
		const heights = [0, 0.25, 0.5, 0.75, 1].map((t) => maxY(morphPath(136, 320, 112, t)));
		expect(heights).toEqual([44, 61, 78, 95, 112]);
	});

	it('MORPH-8 memoises identical calls and stays correct across alternating args', () => {
		const first = morphPath(136, 320, 112, 0.5);
		expect(morphPath(136, 320, 112, 0.5)).toBe(first);
		const other = morphPath(150, 340, 120, 0.8);
		expect(other).not.toBe(first);
		expect(morphPath(136, 320, 112, 0.5)).toBe(first);
	});
});

describe('morphPathCenter', () => {
	it('MORPH-6 draws a centred pill at t = 0', () => {
		const d = norm(morphPathCenter(136, 320, 112, 0));
		expect(d.startsWith('M 92,22')).toBe(true);
		expect(d.endsWith('Z')).toBe(true);
		const found = numbers(d);
		expect(found).toContain(92);
		expect(found).toContain(228);
		// ningún punto sale del rango 92..228
		expect(found.filter((n) => n > 228)).toEqual([]);
	});

	it('MORPH-6 spans 0..320 with two fillets at t = 1', () => {
		const found = numbers(morphPathCenter(136, 320, 112, 1));
		expect(found).toContain(78); // qLeftX = max(16, 92 − 14)
		expect(found).toContain(242); // qRightX = min(304, 228 + 14)
		expect(found).toContain(320);
		expect(found).toContain(0);
		expect(maxY(morphPathCenter(136, 320, 112, 1))).toBe(112);
	});

	it('MORPH-6 centres a different pill width', () => {
		// pw 120, bw 320 → offset 100
		expect(norm(morphPathCenter(120, 320, 112, 0)).startsWith('M 100,22')).toBe(true);
	});
});
