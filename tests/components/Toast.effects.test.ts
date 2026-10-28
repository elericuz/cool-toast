import { render } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Toaster, toast } from '../../src/lib';
import { morphPath } from '../../src/lib/morph-path';
import { animateMock } from '../mocks/motion';
import { advance, flush, q, resetToastEnvironment, toastEl } from '../helpers';

vi.mock('motion', async () => (await import('../mocks/motion')).motionMockFactory());

const li = () => toastEl('t')!;
const wrapper = () => q(li(), '.cool-toast-wrapper')!;
const norm = (d: string | null) => (d ?? '').replace(/\s+/g, ' ').trim();
const pathD = () => q(li(), 'svg[data-cool-toast-blob] > path')!.getAttribute('d');
const callsWith = (predicate: (options: Record<string, unknown>) => boolean) =>
	animateMock.calls.filter((call) => predicate(call.options));

beforeEach(() => {
	vi.useFakeTimers();
});
afterEach(() => {
	resetToastEnvironment();
	vi.useRealTimers();
});

describe('error shake (ANIM-6)', () => {
	it('marks the toast with data-shake while the shake runs and removes it on completion', async () => {
		render(Toaster);
		toast('Saved', { id: 't', duration: Infinity });
		await flush();
		animateMock.setMode('manual');

		toast.update('t', { type: 'error' });
		await flush();

		expect(li()).toHaveAttribute('data-shake', 'true');
		expect(callsWith((o) => o.duration === 0.4 && o.ease === 'easeOut')).toHaveLength(1);
		const shake = callsWith((o) => o.duration === 0.4)[0];
		expect(shake.options).toMatchObject({ duration: 0.4, ease: 'easeOut' });

		animateMock.progressAll(0.25);
		// translateX(sin(v·π·6)·(1−v)·3 px); con mirroring a la derecha empieza con scaleX(-1)
		expect(wrapper().style.transform).toContain('translateX(');

		animateMock.completeAll();
		await flush();
		expect(li()).not.toHaveAttribute('data-shake');
		expect(wrapper().style.transform).toBe('');
	});

	it('also shakes when a promise rejects', async () => {
		render(Toaster);
		let reject!: (reason: unknown) => void;
		const promise = new Promise<string>((_, rej) => (reject = rej));
		const id = toast.promise(promise, { loading: 'l', success: 's', error: 'e' });
		await flush();
		animateMock.setMode('manual');
		reject(new Error('x'));
		await advance(0);
		expect(toastEl(id)).toHaveAttribute('data-shake', 'true');
	});

	it('does not shake when updating to a non-error type', async () => {
		render(Toaster);
		toast('Saved', { id: 't', duration: Infinity });
		await flush();
		animateMock.setMode('manual');
		toast.update('t', { type: 'success' });
		await flush();
		expect(li()).not.toHaveAttribute('data-shake');
		expect(callsWith((o) => o.duration === 0.4 && o.ease === 'easeOut')).toHaveLength(0);
	});
});

describe('pill resize on title change (ANIM-7)', () => {
	const setHeaderWidth = (px: number) =>
		q(li(), '[data-cool-toast-header]')!.setAttribute('data-test-w', String(px));

	it('animates the pill to the new measured width and stays a pill', async () => {
		render(Toaster);
		toast('Short', { id: 't', duration: Infinity });
		await flush();
		animateMock.setMode('manual');

		setHeaderWidth(200); // pw = 200 + 20 de padding
		toast.update('t', { title: 'Much longer title here' });
		await flush();

		const resize = callsWith((o) => o.duration === 0.5)[0];
		expect(resize).toMatchObject({
			from: 120,
			to: 220,
			options: { type: 'spring', duration: 0.5 }
		});
		expect((resize.options as { bounce: number }).bounce).toBeCloseTo(0.35, 10);
		expect(li()).toHaveAttribute('data-state', 'pill');

		animateMock.completeAll();
		await flush();
		expect(norm(pathD())).toBe(norm(morphPath(220, 220, 34, 0)));
		expect(li()).toHaveAttribute('data-state', 'pill');
	});

	it('uses a 0.4 s tween when spring is disabled', async () => {
		render(Toaster, { spring: false });
		toast('Short', { id: 't', duration: Infinity });
		await flush();
		animateMock.setMode('manual');
		setHeaderWidth(160);
		toast.update('t', { title: 'Longer title' });
		await flush();
		expect(callsWith((o) => o.duration === 0.4 && Array.isArray(o.ease))[0]).toMatchObject({
			from: 120,
			to: 180,
			options: { duration: 0.4, ease: [0.4, 0, 0.2, 1] }
		});
	});

	it('does not animate when the measured width does not change', async () => {
		render(Toaster);
		toast('Short', { id: 't', duration: Infinity });
		await flush();
		animateMock.setMode('manual');
		toast.update('t', { title: 'Same width' });
		await flush();
		expect(callsWith((o) => o.duration === 0.5 || o.duration === 0.4)).toHaveLength(0);
	});
});

describe('landing squish (ANIM-9 wiring)', () => {
	const squishCalls = () => callsWith((o) => o.type === 'spring' && o.stiffness !== undefined);

	it('squishes on mount after 45 ms with the bounce-derived spring', async () => {
		render(Toaster, { position: 'bottom-left' });
		toast('Saved', { id: 't', duration: Infinity });
		await flush();
		animateMock.setMode('manual');

		await advance(44);
		expect(squishCalls()).toHaveLength(0);
		await advance(1);
		expect(squishCalls()).toHaveLength(1);
		expect(squishCalls()[0].options).toMatchObject({
			type: 'spring',
			stiffness: 375,
			damping: 16,
			mass: 0.7
		});
		expect(wrapper().style.transformOrigin).toBe('center top');

		animateMock.progressAll(0.5);
		expect(wrapper().style.transform).toBe('scaleX(1.06) scaleY(0.88)');
		animateMock.completeAll();
		await flush();
		expect(wrapper().style.transform).toBe('');
	});

	it('prefixes scaleX(-1) when the toast is mirrored (right side)', async () => {
		render(Toaster, { position: 'bottom-right' });
		toast('Saved', { id: 't', duration: Infinity });
		await flush();
		animateMock.setMode('manual');
		await advance(45);
		animateMock.progressAll(0.5);
		expect(wrapper().style.transform).toBe('scaleX(-1) scaleX(1.06) scaleY(0.88)');
	});

	it('uses a stiffer spring for a higher bounce', async () => {
		render(Toaster, { bounce: 0.6 });
		toast('Saved', { id: 't', duration: Infinity });
		await flush();
		animateMock.setMode('manual');
		await advance(45);
		expect(squishCalls()[0].options).toMatchObject({ stiffness: 462.5, damping: 12 });
	});

	it('squishes again 80 ms after an expanded toast starts expanding', async () => {
		render(Toaster, { position: 'bottom-left' });
		toast('Saved', { id: 't', description: 'Body', duration: Infinity });
		await flush();
		await advance(45);
		animateMock.setMode('manual');
		await advance(330 - 45);
		const before = squishCalls().length;
		await advance(79);
		expect(squishCalls()).toHaveLength(before);
		await advance(1);
		expect(squishCalls()).toHaveLength(before + 1);
	});
});

describe('collapse landing squish (ANIM-10)', () => {
	// La compresión de aterrizaje es una animación 0 → 1 con spring que arranca al empezar el colapso
	const landing = (fromIndex: number) =>
		animateMock.calls
			.slice(fromIndex)
			.filter((call) => call.from === 0 && call.to === 1 && call.options.type === 'spring');

	async function startAutomaticCollapse(props: Record<string, unknown> = {}) {
		render(Toaster, props);
		toast('Saved', { id: 't', description: 'Body' });
		await advance(330 + 300);
		animateMock.setMode('manual');
		await advance(2770 - 300 - 1);
		const mark = animateMock.calls.length;
		await advance(1);
		expect(li()).toHaveAttribute('data-state', 'collapsing');
		return mark;
	}

	it('starts one squish with compress .035 / expand .018 when the automatic collapse starts', async () => {
		const mark = await startAutomaticCollapse({ position: 'bottom-left' });
		expect(landing(mark)).toHaveLength(1);

		animateMock.progressAll(0.5);
		expect(wrapper().style.transform).toBe('scaleX(1.018) scaleY(0.965)');
		expect(wrapper().style.transformOrigin).toBe('center top');

		animateMock.completeAll();
		await flush();
		expect(wrapper().style.transform).toBe('');
	});

	it('prefixes scaleX(-1) on the right side and scales with bounce', async () => {
		const mark = await startAutomaticCollapse({ position: 'bottom-right', bounce: 0.8 });
		expect(landing(mark)).toHaveLength(1);
		animateMock.progressAll(0.5);
		// b/.4 = 2 → scaleY 1 − .07, scaleX 1 + .036
		expect(wrapper().style.transform).toBe('scaleX(-1) scaleX(1.036) scaleY(0.93)');
	});

	it('is skipped when spring is false', async () => {
		const mark = await startAutomaticCollapse({ spring: false });
		expect(landing(mark)).toHaveLength(0);
	});
});
