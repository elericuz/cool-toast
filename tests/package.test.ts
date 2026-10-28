import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = resolve(import.meta.dirname, '..');
const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));

describe('package.json contract (STYLE-8)', () => {
	it('has the scoped package name', () => {
		expect(pkg.name).toBe('@elericuz/cool-toast');
	});

	it('exposes the root entry with types and svelte conditions', () => {
		expect(pkg.exports['.']).toMatchObject({
			types: './dist/index.d.ts',
			svelte: './dist/index.js'
		});
		expect(pkg.svelte).toBe('./dist/index.js');
	});

	it('publishes only dist and NOTICE', () => {
		// NOTICE incluye la atribución de goey-toast
		expect(pkg.files).toEqual(['dist', 'NOTICE']);
	});

	it('declares the registry metadata', () => {
		expect(pkg.repository.url).toBe('git+https://github.com/elericuz/cool-toast.git');
		expect(pkg.homepage).toBeTypeOf('string');
		expect(pkg.homepage.length).toBeGreaterThan(0);
		expect(pkg.author).toBe('Eric Valera Miller');
		expect(pkg.keywords).toEqual(expect.arrayContaining(['svelte', 'toast']));
	});

	it('requires Svelte 5 as a peer and motion as the only runtime dependency', () => {
		expect(pkg.peerDependencies.svelte).toMatch(/^\^5/);
		expect(Object.keys(pkg.dependencies)).toEqual(['motion']);
	});

	it('marks CSS files as side effects', () => {
		expect(pkg.sideEffects).toContain('**/*.css');
	});

	it('provides the documented scripts', () => {
		for (const script of [
			'dev',
			'build',
			'preview',
			'package',
			'check',
			'lint',
			'format',
			'format:check',
			'test',
			'test:watch'
		]) {
			expect(pkg.scripts[script], script).toBeTypeOf('string');
		}
		expect(pkg.scripts.test).toBe('vitest run');
	});
});

describe('stylesheet export (STYLE-1)', () => {
	it('points ./styles.css to dist/styles.css', () => {
		expect(pkg.exports['./styles.css'].replace(/^\.\//, '')).toBe('dist/styles.css');
	});

	it('ships a non-empty src/lib/styles.css for svelte-package to copy', () => {
		const path = resolve(root, 'src/lib/styles.css');
		expect(existsSync(path)).toBe(true);
		expect(readFileSync(path, 'utf8').trim().length).toBeGreaterThan(0);
	});
});
