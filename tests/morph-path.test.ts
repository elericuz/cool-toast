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
		expect(norm(morphPath(120, 300, 90, 0))).toBe(
			'M 0,17 A 17,17 0 0 1 17,0 H 103 A 17,17 0 0 1 120,17 A 17,17 0 0 1 103,34 H 17 A 17,17 0 0 1 0,17 Z'
		);
	});

	it('MORPH-1 pill follows the pill width argument', () => {
		expect(norm(morphPath(200, 300, 90, 0))).toBe(
			'M 0,17 A 17,17 0 0 1 17,0 H 183 A 17,17 0 0 1 200,17 A 17,17 0 0 1 183,34 H 17 A 17,17 0 0 1 0,17 Z'
		);
	});

	it('MORPH-2 stays a pill while the body is below the threshold', () => {
		const pill = morphPath(120, 300, 90, 0);
		expect(morphPath(120, 300, 90, 0.1)).toBe(pill);
		// 56·0.14 = 7.84 < 8 sigue siendo píldora
		expect(morphPath(120, 300, 90, 0.14)).toBe(pill);
	});

	it('MORPH-2 leaves the pill once body − PH reaches the threshold', () => {
		expect(morphPath(120, 300, 90, 0.15)).not.toBe(morphPath(120, 300, 90, 0));
		expect(maxY(morphPath(120, 300, 90, 0.15))).toBeCloseTo(42.4, 3);
	});

	it('MORPH-3 draws the full body at t = 1', () => {
		expectInOrder(norm(morphPath(120, 300, 90, 1)), [
			'M 0,17',
			'A 17,17 0 0 1 17,0',
			'H 103',
			'A 17,17 0 0 1 120,17',
			'L 120,20',
			'Q 120,34 134,34',
			'H 284',
			'A 16,16 0 0 1 300,50',
			'L 300,74',
			'A 16,16 0 0 1 284,90',
			'H 16',
			'A 16,16 0 0 1 0,74',
			'Z'
		]);
	});

	it('MORPH-3 adapts to different body dimensions', () => {
		// th 70: cr = min(16, 36·0.45) = 16; bodyW 250 → H 234
		const d = norm(morphPath(100, 250, 70, 1));
		expectInOrder(d, ['L 100,20', 'Q 100,34 114,34', 'H 234', 'A 16,16 0 0 1 250,50', 'L 250,54']);
	});

	it('MORPH-4 interpolates the intermediate shape at t = 0.5', () => {
		const d = norm(morphPath(120, 300, 90, 0.5));
		// curve 7 aparece implícito: bodyTop 27 = 34 − 7 y qEndX 127 = 120 + 7
		expectInOrder(d, [
			'L 120,27',
			'Q 120,34 127,34',
			'H 197.4',
			'A 12.6,12.6 0 0 1 210,46.6',
			'L 210,49.4',
			'A 12.6,12.6 0 0 1 197.4,62',
			'H 12.6',
			'A 12.6,12.6 0 0 1 0,49.4',
			'Z'
		]);
	});

	it('MORPH-5 clamps the pill width to the body width', () => {
		expect(norm(morphPath(400, 300, 90, 0))).toBe(
			'M 0,17 A 17,17 0 0 1 17,0 H 283 A 17,17 0 0 1 300,17 A 17,17 0 0 1 283,34 H 17 A 17,17 0 0 1 0,17 Z'
		);
	});

	it('MORPH-7 grows monotonically in height', () => {
		const heights = [0, 0.25, 0.5, 0.75, 1].map((t) => maxY(morphPath(120, 300, 90, t)));
		expect(heights).toEqual([34, 48, 62, 76, 90]);
	});

	it('MORPH-8 memoises identical calls and stays correct across alternating args', () => {
		const first = morphPath(120, 300, 90, 0.5);
		expect(morphPath(120, 300, 90, 0.5)).toBe(first);
		const other = morphPath(150, 320, 100, 0.8);
		expect(other).not.toBe(first);
		expect(morphPath(120, 300, 90, 0.5)).toBe(first);
	});
});

describe('morphPathCenter', () => {
	it('MORPH-6 draws a centred pill at t = 0', () => {
		const d = norm(morphPathCenter(120, 300, 90, 0));
		expect(d.startsWith('M 90,17')).toBe(true);
		expect(d.endsWith('Z')).toBe(true);
		const found = numbers(d);
		expect(found).toContain(90);
		expect(found).toContain(210);
		// ningún punto sale del rango 90..210
		expect(found.filter((n) => n > 210)).toEqual([]);
	});

	it('MORPH-6 spans 0..300 with two fillets at t = 1', () => {
		const found = numbers(morphPathCenter(120, 300, 90, 1));
		expect(found).toContain(76); // qLeftX = max(16, 90 − 14)
		expect(found).toContain(224); // qRightX = min(284, 210 + 14)
		expect(found).toContain(300);
		expect(found).toContain(0);
		expect(maxY(morphPathCenter(120, 300, 90, 1))).toBe(90);
	});

	it('MORPH-6 centres a different pill width', () => {
		// pw 100, bw 300 → offset 100
		expect(norm(morphPathCenter(100, 300, 90, 0)).startsWith('M 100,17')).toBe(true);
	});
});
