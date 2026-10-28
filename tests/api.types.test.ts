import type { Snippet } from 'svelte';
import { describe, expect, expectTypeOf, it } from 'vitest';
import { toast } from '../src/lib/toast';
import type * as Public from '../src/lib';
import type {
	DismissFilter,
	PromiseData,
	ToastOptions,
	ToastUpdateOptions
} from '../src/lib/types';

// API-1: firmas verificadas a nivel de tipos (svelte-check/tsc) y existencia en runtime
describe('toast public signatures (API-1)', () => {
	it('toast and the typed helpers accept (title, options?) and return string | number', () => {
		expectTypeOf(toast).parameters.toEqualTypeOf<[title: string, options?: ToastOptions]>();
		expectTypeOf(toast).returns.toEqualTypeOf<string | number>();
		for (const type of ['success', 'error', 'warning', 'info'] as const) {
			expectTypeOf(toast[type]).parameters.toEqualTypeOf<[string, ToastOptions?]>();
			expectTypeOf(toast[type]).returns.toEqualTypeOf<string | number>();
			expect(typeof toast[type]).toBe('function');
		}
	});

	it('toast.promise<T> takes (Promise<T>, PromiseData<T>) and returns string', () => {
		expectTypeOf(toast.promise<number>).parameters.toEqualTypeOf<
			[Promise<number>, PromiseData<number>]
		>();
		expectTypeOf(toast.promise<number>).returns.toEqualTypeOf<string>();
	});

	it('toast.update and toast.dismiss have the documented shapes', () => {
		expectTypeOf(toast.update).parameters.toEqualTypeOf<[string | number, ToastUpdateOptions]>();
		expectTypeOf(toast.update).returns.toEqualTypeOf<void>();
		expectTypeOf(toast.dismiss).parameters.toEqualTypeOf<
			[idOrFilter?: string | number | DismissFilter]
		>();
		expectTypeOf(toast.dismiss).returns.toEqualTypeOf<void>();
		expect(typeof toast.update).toBe('function');
		expect(typeof toast.dismiss).toBe('function');
	});

	it('toast.custom and toast.loading do not exist', () => {
		// @ts-expect-error toast.custom no forma parte de la API v1
		expect(toast.custom).toBeUndefined();
		// @ts-expect-error toast.loading no forma parte de la API v1
		expect(toast.loading).toBeUndefined();
		expect('custom' in toast).toBe(false);
		expect('loading' in toast).toBe(false);
	});
});

// API-6: en PromiseData toda función es un resolver; un Snippet pelado no se acepta
describe('PromiseData resolvers vs Snippets (API-6)', () => {
	const snippet = (() => {}) as unknown as Snippet;

	it('accepts string and resolver functions, including a wrapped Snippet', () => {
		const data: PromiseData<number> = {
			loading: 'Saving',
			success: (n) => `Saved ${n}`,
			error: (e) => String(e),
			description: {
				loading: snippet,
				success: () => snippet,
				error: (e) => String(e)
			}
		};
		expectTypeOf(data.description?.loading).toEqualTypeOf<string | Snippet | undefined>();
		expect(typeof data.description?.success).toBe('function');
	});

	it('rejects a bare Snippet in success, error and description.success/error', () => {
		const rejected: PromiseData<number>[] = [
			// @ts-expect-error un Snippet pelado no es válido en success
			{ loading: 'l', success: snippet, error: 'e' },
			// @ts-expect-error un Snippet pelado no es válido en error
			{ loading: 'l', success: 's', error: snippet },
			// @ts-expect-error un Snippet pelado no es válido en description.success
			{ loading: 'l', success: 's', error: 'e', description: { success: snippet } },
			// @ts-expect-error un Snippet pelado no es válido en description.error
			{ loading: 'l', success: 's', error: 'e', description: { error: snippet } }
		];
		expect(rejected).toHaveLength(4);
	});
});

// STYLE-7 / API-1: todos los tipos de handoff §B.3 salen del punto de entrada público
describe('public type surface (STYLE-7)', () => {
	it('exports the string unions', () => {
		expectTypeOf<Public.ToastType>().toEqualTypeOf<
			'default' | 'success' | 'error' | 'warning' | 'info'
		>();
		expectTypeOf<Public.ToastPhase>().toEqualTypeOf<
			'default' | 'success' | 'error' | 'warning' | 'info' | 'loading'
		>();
		expectTypeOf<Public.Position>().toEqualTypeOf<
			'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right'
		>();
		expectTypeOf<Public.Theme>().toEqualTypeOf<'light' | 'dark' | 'system'>();
		expectTypeOf<Public.AnimationPresetName>().toEqualTypeOf<
			'smooth' | 'subtle' | 'snappy' | 'bouncy'
		>();
	});

	it('exports the option and data shapes', () => {
		expectTypeOf<Public.AnimationPreset>().toEqualTypeOf<{ bounce: number; spring: boolean }>();
		expectTypeOf<Public.ToastTimings>().toEqualTypeOf<{ displayDuration?: number }>();
		expectTypeOf<Public.DismissFilter>().toEqualTypeOf<{
			type: Public.ToastType | Public.ToastType[];
		}>();
		expectTypeOf<keyof Public.ToastAction>().toEqualTypeOf<'label' | 'onClick' | 'successLabel'>();
		expectTypeOf<keyof Public.ToastClasses>().toEqualTypeOf<
			| 'wrapper'
			| 'content'
			| 'header'
			| 'title'
			| 'icon'
			| 'description'
			| 'actionWrapper'
			| 'actionButton'
		>();
		expectTypeOf<keyof Public.ToastUpdateOptions>().toEqualTypeOf<
			'title' | 'description' | 'type' | 'action' | 'icon' | 'showTimestamp'
		>();
		expectTypeOf<keyof Public.ToastOptions>().toEqualTypeOf<
			| 'description'
			| 'action'
			| 'icon'
			| 'duration'
			| 'id'
			| 'classes'
			| 'fillColor'
			| 'borderColor'
			| 'borderWidth'
			| 'timing'
			| 'preset'
			| 'spring'
			| 'bounce'
			| 'showProgress'
			| 'showTimestamp'
			| 'onDismiss'
			| 'onAutoClose'
		>();
	});

	it('exports ToasterProps with every Toaster prop', () => {
		expectTypeOf<keyof Public.ToasterProps>().toEqualTypeOf<
			| 'position'
			| 'theme'
			| 'gap'
			| 'offset'
			| 'duration'
			| 'visibleToasts'
			| 'maxQueue'
			| 'queueOverflow'
			| 'closeButton'
			| 'closeOnEscape'
			| 'swipeToDismiss'
			| 'preset'
			| 'spring'
			| 'bounce'
			| 'showProgress'
			| 'showTimestamp'
			| 'dir'
			| 'labels'
		>();
		expectTypeOf<Public.ToasterProps['closeButton']>().toEqualTypeOf<
			boolean | 'top-left' | 'top-right' | undefined
		>();
	});

	it('exports PromiseData', () => {
		expectTypeOf<Public.PromiseData<number>['loading']>().toEqualTypeOf<string>();
		expectTypeOf<Public.PromiseData<number>['success']>().toEqualTypeOf<
			string | ((data: number) => string)
		>();
	});

	it('exposes toast and animationPresets with their declared types', () => {
		// la implementación puede ser más estricta (valores Readonly) que el contrato
		expectTypeOf<typeof import('../src/lib').animationPresets>().toExtend<
			Readonly<Record<Public.AnimationPresetName, Public.AnimationPreset>>
		>();
		expectTypeOf<typeof import('../src/lib').toast>().toEqualTypeOf<typeof toast>();
	});
});
