import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { PILL_HEIGHT } from '../src/lib/constants';

// COOL_TOAST_CSS permite validar el propio test contra una hoja de referencia
const cssPath = process.env.COOL_TOAST_CSS ?? resolve(import.meta.dirname, '../src/lib/styles.css');
const css = readFileSync(cssPath, 'utf8');

// ---------------------------------------------------------------------------
// Parser mínimo de CSS: árbol de reglas con declaraciones (sin anidamiento de selectores)
// ---------------------------------------------------------------------------
interface Rule {
	prelude: string;
	declarations: Record<string, string>;
	children: Rule[];
}

function parse(source: string): Rule[] {
	const text = source.replace(/\/\*[\s\S]*?\*\//g, '');
	let i = 0;
	function block(): Rule[] {
		const rules: Rule[] = [];
		let prelude = '';
		while (i < text.length) {
			const ch = text[i++];
			if (ch === '{') {
				const rule: Rule = { prelude: prelude.trim(), declarations: {}, children: [] };
				const isAtGroup =
					/^@(media|supports|layer)/.test(rule.prelude) || /^@keyframes/.test(rule.prelude);
				const inner = bodyOrChildren(isAtGroup);
				rule.declarations = inner.declarations;
				rule.children = inner.children;
				rules.push(rule);
				prelude = '';
			} else if (ch === '}') {
				return rules;
			} else if (ch === ';') {
				// at-rule sin cuerpo (@import)
				rules.push({ prelude: prelude.trim(), declarations: {}, children: [] });
				prelude = '';
			} else {
				prelude += ch;
			}
		}
		return rules;
	}
	function bodyOrChildren(group: boolean) {
		if (group) return { declarations: {}, children: block() };
		const declarations: Record<string, string> = {};
		let chunk = '';
		let depth = 0;
		while (i < text.length) {
			const ch = text[i++];
			if (ch === '(') depth++;
			if (ch === ')') depth--;
			if (ch === '}' && depth === 0) break;
			if (ch === ';' && depth === 0) {
				addDeclaration(declarations, chunk);
				chunk = '';
			} else chunk += ch;
		}
		addDeclaration(declarations, chunk);
		return { declarations, children: [] as Rule[] };
	}
	return block();
}

function addDeclaration(target: Record<string, string>, chunk: string) {
	const at = chunk.indexOf(':');
	if (at < 0) return;
	target[chunk.slice(0, at).trim()] = chunk.slice(at + 1).trim();
}

const tree = parse(css);

function flat(rules: Rule[]): Rule[] {
	return rules.flatMap((rule) => [rule, ...flat(rule.children)]);
}
const allRules = flat(tree);
const styleRules = allRules.filter((r) => !r.prelude.startsWith('@'));

// Normaliza valores para comparar: sin espacios, minúsculas, comillas dobles y sin ceros a la izquierda
const norm = (value: string | undefined) =>
	(value ?? '')
		.toLowerCase()
		.replace(/!important/g, '')
		.replace(/'/g, '"')
		.replace(/\s+/g, '')
		.replace(/(^|[^0-9])0\./g, '$1.')
		// Prettier reescribe .10 como .1: se ignoran los ceros finales de los decimales
		.replace(/(\.\d*?)0+(?=\D|$)/g, '$1');

const selectorsOf = (rule: Rule) =>
	rule.prelude.split(',').map((s) => s.replace(/\s+/g, ' ').trim());

/** Declaraciones de todas las reglas cuyo selector (alguno de la lista) cumple `test`. */
function declarationsFor(
	test: (selector: string) => boolean,
	within = styleRules
): Record<string, string> {
	const result: Record<string, string> = {};
	for (const rule of within) {
		if (selectorsOf(rule).some(test)) Object.assign(result, rule.declarations);
	}
	return result;
}
const rootSelector = (s: string) => s === '[data-cool-toaster]';
const darkSelector = (s: string) => /^\[data-cool-toaster\]\[data-theme="dark"\]$/.test(s);

// ---------------------------------------------------------------------------
// STYLE-2: variables y valores por defecto (handoff §B.6)
// ---------------------------------------------------------------------------
const FONT = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif';

const lightVariables: Record<string, string> = {
	'--cool-toast-font': FONT,
	'--cool-toast-fill': '#ffffff',
	'--cool-toast-border-color': 'none',
	'--cool-toast-border-width': '1.5',
	'--cool-toast-shadow':
		'drop-shadow(0 10px 24px rgba(0,0,0,.10)) drop-shadow(0 2px 6px rgba(0,0,0,.06))',
	'--cool-toast-pill-padding': '12px 18px',
	'--cool-toast-body-padding': '12px 18px 18px',
	'--cool-toast-title-size': '13px',
	'--cool-toast-description-size': '14px',
	'--cool-toast-radius-body': '16px',
	'--cool-toast-description-color': '#444444',
	'--cool-toast-timestamp-color': '#999999',
	'--cool-toast-close-color': '#555555',
	'--cool-toast-progress-track': 'rgba(0,0,0,.06)',
	'--cool-toast-default-color': '#555555',
	'--cool-toast-default-progress': '#999999',
	'--cool-toast-default-action-bg': '#E8E8E8',
	'--cool-toast-default-action-bg-hover': '#DCDCDC',
	'--cool-toast-default-action-bg-active': '#D0D0D0',
	'--cool-toast-success-color': '#4CAF50',
	'--cool-toast-success-action-bg': '#C8E6C9',
	'--cool-toast-success-action-bg-hover': '#A5D6A7',
	'--cool-toast-success-action-bg-active': '#81C784',
	'--cool-toast-error-color': '#E53935',
	'--cool-toast-error-action-bg': '#FFCDD2',
	'--cool-toast-error-action-bg-hover': '#EF9A9A',
	'--cool-toast-error-action-bg-active': '#E57373',
	'--cool-toast-warning-color': '#C49000',
	'--cool-toast-warning-action-bg': '#FFECB3',
	'--cool-toast-warning-action-bg-hover': '#FFE082',
	'--cool-toast-warning-action-bg-active': '#FFD54F',
	'--cool-toast-info-color': '#1E88E5',
	'--cool-toast-info-action-bg': '#BBDEFB',
	'--cool-toast-info-action-bg-hover': '#90CAF9',
	'--cool-toast-info-action-bg-active': '#64B5F6',
	'--cool-toast-loading-color': '#555555'
};

// Solo las variables que cambian en oscuro
const darkVariables: Record<string, string> = {
	'--cool-toast-fill': '#1a1a1a',
	'--cool-toast-shadow':
		'drop-shadow(0 10px 24px rgba(0,0,0,.45)) drop-shadow(0 2px 6px rgba(0,0,0,.3))',
	'--cool-toast-description-color': '#e0e0e0',
	'--cool-toast-timestamp-color': '#777777',
	'--cool-toast-close-color': '#e0e0e0',
	'--cool-toast-progress-track': 'rgba(255,255,255,.1)',
	'--cool-toast-default-color': '#cccccc',
	'--cool-toast-default-progress': '#888888',
	'--cool-toast-default-action-bg': '#3a3a3a',
	'--cool-toast-default-action-bg-hover': '#444444',
	'--cool-toast-default-action-bg-active': '#4e4e4e',
	'--cool-toast-success-color': '#66BB6A',
	'--cool-toast-success-action-bg': '#1b5e20',
	'--cool-toast-success-action-bg-hover': '#2e7d32',
	'--cool-toast-success-action-bg-active': '#388e3c',
	'--cool-toast-error-color': '#EF5350',
	'--cool-toast-error-action-bg': '#b71c1c',
	'--cool-toast-error-action-bg-hover': '#c62828',
	'--cool-toast-error-action-bg-active': '#d32f2f',
	'--cool-toast-warning-color': '#FFB300',
	'--cool-toast-warning-action-bg': '#4a3800',
	'--cool-toast-warning-action-bg-hover': '#5c4600',
	'--cool-toast-warning-action-bg-active': '#6e5400',
	'--cool-toast-info-color': '#42A5F5',
	'--cool-toast-info-action-bg': '#0d47a1',
	'--cool-toast-info-action-bg-hover': '#1565c0',
	'--cool-toast-info-action-bg-active': '#1976d2',
	'--cool-toast-loading-color': '#cccccc'
};

describe('stylesheet exists', () => {
	it('is not empty', () => {
		expect(css.trim().length).toBeGreaterThan(0);
		expect(styleRules.length).toBeGreaterThan(0);
	});
});

describe('light variables on [data-cool-toaster] (STYLE-2)', () => {
	const declared = declarationsFor(rootSelector);

	it.each(Object.entries(lightVariables))('%s has its default', (name, value) => {
		expect(norm(declared[name]), name).toBe(norm(value));
	});
});

describe('dark overrides under [data-theme="dark"] (STYLE-2)', () => {
	const declared = declarationsFor(darkSelector);

	it.each(Object.entries(darkVariables))('%s has its dark value', (name, value) => {
		expect(norm(declared[name]), name).toBe(norm(value));
	});

	it('does not leak dark values into the light block', () => {
		const light = declarationsFor(rootSelector);
		expect(norm(light['--cool-toast-fill'])).not.toBe(norm(darkVariables['--cool-toast-fill']));
	});
});

describe('every variable is consumed (STYLE-2)', () => {
	const used = Object.keys(lightVariables).filter(
		(name) => !['--cool-toast-border-color', '--cool-toast-border-width'].includes(name)
	);
	it.each(used)('%s is read through var()', (name) => {
		expect(css, name).toMatch(new RegExp(`var\\(\\s*${name}\\b`));
	});
});

describe('blob fill fallback', () => {
	it('falls back to var(--cool-toast-fill) on the blob path', () => {
		const blob = declarationsFor((s) => /blob/.test(s) && /\bpath\b/.test(s));
		expect(blob.fill).toContain('var(--cool-toast-fill');
	});

	it('applies the shadow filter through the shadow variable', () => {
		const filters = styleRules.filter((r) =>
			(r.declarations.filter ?? '').includes('var(--cool-toast-shadow)')
		);
		expect(filters.length).toBeGreaterThan(0);
	});
});

// ---------------------------------------------------------------------------
// STYLE-3: sin dependencia de Tailwind
// ---------------------------------------------------------------------------
describe('no Tailwind dependency (STYLE-3)', () => {
	it.each([/@import\s+['"]tailwindcss/, /@apply/, /@theme/, /@layer/, /tailwind/i])(
		'does not contain %s',
		(pattern) => {
			expect(css).not.toMatch(pattern);
		}
	);
});

// ---------------------------------------------------------------------------
// STYLE-6: colores por tipo
// ---------------------------------------------------------------------------
describe('type colour hooks (STYLE-6)', () => {
	const types = ['success', 'error', 'warning', 'info'] as const;
	const forType = (type: string, part: (selector: string) => boolean) =>
		declarationsFor((s) => s.includes(`[data-type="${type}"]`) && part(s));
	const values = (d: Record<string, string>) => Object.values(d).join(' ');

	it.each(types)('%s colours title, icon and progress bar with its colour variable', (type) => {
		const variable = `var(--cool-toast-${type}-color)`;
		expect(values(forType(type, (s) => s.includes('[data-cool-toast-title]')))).toContain(variable);
		expect(values(forType(type, (s) => s.includes('[data-cool-toast-icon]')))).toContain(variable);
		expect(values(forType(type, (s) => s.includes('progress-bar')))).toContain(variable);
	});

	it.each(types)('%s action button uses its colour and action backgrounds', (type) => {
		const action = forType(
			type,
			(s) => s.includes('[data-cool-toast-action]') && !/:hover|:active/.test(s)
		);
		expect(values(action)).toContain(`var(--cool-toast-${type}-color)`);
		expect(values(action)).toContain(`var(--cool-toast-${type}-action-bg)`);
		const hover = forType(
			type,
			(s) => s.includes('[data-cool-toast-action]') && s.includes(':hover')
		);
		expect(values(hover)).toContain(`var(--cool-toast-${type}-action-bg-hover)`);
		const active = forType(
			type,
			(s) => s.includes('[data-cool-toast-action]') && s.includes(':active')
		);
		expect(values(active)).toContain(`var(--cool-toast-${type}-action-bg-active)`);
	});

	it('default type uses the default variables', () => {
		const title = declarationsFor(
			(s) => s.includes('[data-type="default"]') && s.includes('[data-cool-toast-title]')
		);
		expect(Object.values(title).join(' ')).toContain('var(--cool-toast-default-color)');
		const bar = declarationsFor(
			(s) => s.includes('[data-type="default"]') && s.includes('progress-bar')
		);
		expect(Object.values(bar).join(' ')).toContain('var(--cool-toast-default-progress)');
	});

	it('loading phase uses the loading colour and the info action colours', () => {
		const loading = declarationsFor((s) => s.includes('[data-phase="loading"]'));
		expect(Object.values(loading).join(' ')).toContain('var(--cool-toast-loading-color)');
		expect(css).toMatch(/\[data-phase="loading"\][^{]*\{[^}]*var\(--cool-toast-info-action-bg\)/);
	});
});

// ---------------------------------------------------------------------------
// STYLE-4: keyframes de progreso y spinner
// ---------------------------------------------------------------------------
describe('progress and spinner animations (STYLE-4)', () => {
	const keyframes = (name: string) => allRules.find((r) => r.prelude === `@keyframes ${name}`);

	it('shrinks the progress bar from scaleX(1) to scaleX(0)', () => {
		const frames = keyframes('cool-toast-progress-shrink');
		expect(frames).toBeDefined();
		const text = norm(JSON.stringify(frames!.children.map((c) => [c.prelude, c.declarations])));
		expect(text).toContain('scalex(1)');
		expect(text).toContain('scalex(0)');
	});

	it('wires the progress bar animation to the per-toast duration variable', () => {
		const bar = declarationsFor((s) => s.trim() === '.cool-toast-progress-bar');
		expect(norm(bar.animation)).toBe(
			norm('cool-toast-progress-shrink var(--cool-toast-progress-duration, 4000ms) linear forwards')
		);
		expect(norm(bar['transform-origin'])).toBe('leftcenter');
		expect(norm(bar.height)).toBe('3px');
	});

	it('pauses the progress bar when data-paused is true', () => {
		const paused = declarationsFor(
			(s) => s.includes('[data-paused="true"]') && s.includes('.cool-toast-progress-bar')
		);
		expect(norm(paused['animation-play-state'])).toBe('paused');
	});

	it('spins the loading icon once per second', () => {
		expect(keyframes('cool-toast-spin')).toBeDefined();
		const spin = declarationsFor((s) => s.trim() === '.cool-toast-spin');
		expect(norm(spin.animation)).toBe(norm('cool-toast-spin 1s linear infinite'));
	});
});

// ---------------------------------------------------------------------------
// STYLE-5: movimiento reducido
// ---------------------------------------------------------------------------
describe('reduced motion (STYLE-5)', () => {
	const media = allRules.find((r) =>
		/^@media\s*\(\s*prefers-reduced-motion:\s*reduce\s*\)/.test(r.prelude)
	);

	it('has a prefers-reduced-motion block', () => {
		expect(media).toBeDefined();
	});

	it('removes transitions and shortens animations for toast descendants except the progress bar', () => {
		const rule = media!.children.find(
			(r) => r.prelude.includes('[data-cool-toast]') && r.prelude.includes('*')
		);
		expect(rule, 'rule for [data-cool-toast] *').toBeDefined();
		expect(norm(rule!.declarations.transition)).toBe('none');
		expect(norm(rule!.declarations['animation-duration'])).toContain('.01ms');
		expect(rule!.prelude).toMatch(/:not\([^)]*progress/);
	});
});

// ---------------------------------------------------------------------------
// Diseño D6/D10: layout de la pila y espejado
// ---------------------------------------------------------------------------
describe('stack layout (design D6)', () => {
	it('anchors the Toaster with the offset variable per data-y and data-side', () => {
		expect(norm(declarationsFor(rootSelector).position)).toBe('fixed');
		const top = declarationsFor((s) => s.includes('[data-y="top"]'));
		expect(norm(top.top)).toContain('var(--cool-toast-offset)');
		const bottom = declarationsFor((s) => s.includes('[data-y="bottom"]'));
		expect(norm(bottom.bottom)).toContain('var(--cool-toast-offset)');
		const left = declarationsFor(
			(s) => /data-side="left"/.test(s) && !/\bli\b|cool-toast-wrapper|content/.test(s)
		);
		expect(norm(left.left)).toContain('var(--cool-toast-offset)');
		const right = declarationsFor(
			(s) => /data-side="right"/.test(s) && !/\bli\b|cool-toast-wrapper|content/.test(s)
		);
		expect(norm(right.right)).toContain('var(--cool-toast-offset)');
	});

	it('lays the list out as a flex column with the gap variable', () => {
		const list = declarationsFor(
			(s) => s.includes('[data-cool-toast-list]') && !s.includes('data-'.concat('y'))
		);
		expect(norm(list.display)).toBe('flex');
		expect(norm(list['flex-direction'])).toBe('column');
		expect(norm(list.gap)).toContain('var(--cool-toast-gap)');
	});

	it('reverses the column for bottom positions so the newest is nearest the edge', () => {
		const bottom = declarationsFor(
			(s) => s.includes('[data-y="bottom"]') && s.includes('[data-cool-toast-list]')
		);
		expect(norm(bottom['flex-direction'])).toBe('column-reverse');
	});

	it.each([
		['left', 'flex-start'],
		['center', 'center'],
		['right', 'flex-end']
	])('aligns the list for data-side=%s with align-items: %s', (side, alignment) => {
		const list = declarationsFor(
			(s) => s.includes(`[data-side="${side}"]`) && s.includes('[data-cool-toast-list]')
		);
		expect(norm(list['align-items'])).toBe(alignment);
	});

	it('sizes the expanded content between 320px and 400px', () => {
		const content = declarationsFor((s) => s.includes('[data-cool-toast-content]'));
		expect(norm(content['min-width'])).toBe('320px');
		expect(norm(content['max-width'])).toBe('400px');
	});
});

describe('mirroring for the right side (design D10)', () => {
	it('mirrors the blob wrapper and un-mirrors the content', () => {
		const wrapper = declarationsFor(
			(s) => s.includes('[data-side="right"]') && s.includes('.cool-toast-wrapper')
		);
		expect(norm(wrapper.transform)).toContain('scalex(-1)');
		const content = declarationsFor(
			(s) => s.includes('[data-side="right"]') && s.includes('[data-cool-toast-content]')
		);
		expect(norm(content.transform)).toContain('scalex(-1)');
		expect(norm(content['text-align'])).toBe('right');
	});

	it('pushes right toasts to the end and centres centre toasts', () => {
		const right = declarationsFor((s) => /^\[data-cool-toast\]\[data-side="right"\]$/.test(s));
		expect(norm(right['margin-left'])).toBe('auto');
		const center = declarationsFor((s) => /^\[data-cool-toast\]\[data-side="center"\]$/.test(s));
		expect(norm(center.margin)).toBe('0auto');
	});
});

// ---------------------------------------------------------------------------
// Helpers v1.1: declaraciones de reglas con un selector exacto (sin mezclar reglas vecinas)
// ---------------------------------------------------------------------------
const squash = (selector: string) => selector.replace(/\s+/g, ' ').trim();
const exact = (selector: string) => declarationsFor((s) => squash(s) === squash(selector));

// ---------------------------------------------------------------------------
// STYLE-9: densidad premium
// ---------------------------------------------------------------------------
describe('premium density values (STYLE-9)', () => {
	it('compact content uses the pill padding variable', () => {
		expect(norm(exact('[data-cool-toast-content]').padding)).toBe('var(--cool-toast-pill-padding)');
	});

	it('expanded content is 320-400px wide with the body padding variable', () => {
		const expanded = exact('[data-cool-toast][data-expanded="true"] [data-cool-toast-content]');
		expect(norm(expanded['min-width'])).toBe('320px');
		expect(norm(expanded['max-width'])).toBe('400px');
		expect(norm(expanded.padding)).toBe('var(--cool-toast-body-padding)');
	});

	it('header is 20px tall with a 10px gap', () => {
		const header = exact('[data-cool-toast-header]');
		expect(norm(header.height)).toBe('20px');
		expect(norm(header.gap)).toBe('10px');
	});

	it('title uses the size variable, weight 600, 20px line and tight tracking', () => {
		const title = exact('[data-cool-toast-title]');
		expect(norm(title['font-size'])).toBe('var(--cool-toast-title-size)');
		expect(norm(title['font-weight'])).toBe('600');
		expect(norm(title['line-height'])).toBe('20px');
		expect(norm(title['letter-spacing'])).toBe('-.01em');
	});

	it('timestamp is 12px', () => {
		expect(norm(exact('[data-cool-toast-timestamp]')['font-size'])).toBe('12px');
	});

	it('description uses the size variable with line-height 1.5; body adds 10px on top', () => {
		const description = exact('[data-cool-toast-description]');
		expect(norm(description['font-size'])).toBe('var(--cool-toast-description-size)');
		expect(norm(description['line-height'])).toBe('1.5');
		expect(norm(exact('.cool-toast-body')['padding-top'])).toBe('10px');
	});

	it('action button is 12px 20px, 14px, weight 600 and fully rounded', () => {
		const action = exact('[data-cool-toast-action]');
		expect(norm(action.padding)).toBe('12px20px');
		expect(norm(action['font-size'])).toBe('14px');
		expect(norm(action['font-weight'])).toBe('600');
		expect(norm(action['border-radius'])).toBe('999px');
	});

	it('icon is 18x18', () => {
		const icon = exact('[data-cool-toast-icon]');
		expect(norm(icon.width)).toBe('18px');
		expect(norm(icon.height)).toBe('18px');
	});

	it('keeps the pill height budget: header 20 + vertical padding 12 + 12', () => {
		expect(20 + 12 + 12).toBe(PILL_HEIGHT);
	});

	it.each([
		'--cool-toast-pill-padding',
		'--cool-toast-body-padding',
		'--cool-toast-title-size',
		'--cool-toast-description-size',
		'--cool-toast-radius-body'
	])('%s is read through var()', (name) => {
		expect(css, name).toMatch(new RegExp(`var\\(\\s*${name}\\b`));
	});
});

// ---------------------------------------------------------------------------
// STYLE-10: inset de la barra de progreso
// ---------------------------------------------------------------------------
describe('progress bar inset (STYLE-10)', () => {
	it('insets the progress track 14px from the action and rounds it', () => {
		const progress = exact('[data-cool-toast-progress]');
		expect(norm(progress.margin)).toBe('14px00');
		expect(norm(progress['border-radius'])).toBe('2px');
		expect(norm(progress.overflow)).toBe('hidden');
	});

	it('keeps the bar 3px tall', () => {
		expect(norm(exact('.cool-toast-progress-bar').height)).toBe('3px');
	});
});

// ---------------------------------------------------------------------------
// STYLE-11: reglas de contención
// ---------------------------------------------------------------------------
describe('containment rules (STYLE-11)', () => {
	it('wrapper is positioned and fits its content', () => {
		const wrapper = exact('.cool-toast-wrapper');
		expect(norm(wrapper.position)).toBe('relative');
		expect(norm(wrapper.width)).toBe('fit-content');
	});

	it('clips the inner box (.cool-toast-clip) in every non-expanded state', () => {
		const clipped = exact('[data-cool-toast]:not([data-state="expanded"]) .cool-toast-clip');
		expect(norm(clipped.overflow)).toBe('hidden');
		expect(norm(clipped['clip-path'])).toBe('inset(0roundvar(--cool-toast-radius-body))');
	});

	it('releases the inner clip when expanded', () => {
		const open = exact('[data-cool-toast][data-state="expanded"] .cool-toast-clip');
		expect(norm(open.overflow)).toBe('visible');
		expect(norm(open['clip-path'])).toBe('none');
	});

	it('no longer clips at the content level', () => {
		const content = declarationsFor(
			(s) => s.includes('[data-cool-toast-content]') && s.includes('[data-state'),
			styleRules
		);
		expect(content['clip-path']).toBeUndefined();
		expect(content.overflow).toBeUndefined();
	});

	it('leaving body ignores pointer events', () => {
		expect(norm(exact('.cool-toast-body[data-leaving="true"]')['pointer-events'])).toBe('none');
	});

	it('anchors the close button on the wrapper corners', () => {
		const close = exact('[data-cool-toast-close]');
		expect(norm(close.position)).toBe('absolute');
		expect(norm(close.top)).toBe('-6px');
		expect(norm(close.width)).toBe('20px');
		expect(norm(close.height)).toBe('20px');
		expect(norm(close['border-radius'])).toBe('50%');
		const right = exact('[data-cool-toast-close][data-side="top-right"]');
		expect(norm(right.right)).toBe('-6px');
		expect(norm(right.left)).toBe('auto');
		const left = exact('[data-cool-toast-close][data-side="top-left"]');
		expect(norm(left.left)).toBe('-6px');
		expect(norm(left.right)).toBe('auto');
	});

	it('counter-mirrors the close button on the right side', () => {
		const mirrored = exact('[data-cool-toast][data-side="right"] [data-cool-toast-close]');
		expect(norm(mirrored.transform)).toBe('scalex(-1)');
	});
});
