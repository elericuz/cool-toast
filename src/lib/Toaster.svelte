<script lang="ts">
	import { onMount, untrack } from 'svelte';
	import { flip } from 'svelte/animate';
	// cubicOut aproxima la curva de goey cubic-bezier(.4, 0, .2, 1) (FADE_MS)
	import { cubicOut } from 'svelte/easing';
	import { fade } from 'svelte/transition';
	import Announcer from './Announcer.svelte';
	import { FADE_MS, REDUCED_MOTION_MS } from './constants';
	import { createReducedMotion } from './reduced-motion.svelte';
	import { swipe } from './swipe';
	import { createThemeResolver } from './theme.svelte';
	import Toast from './Toast.svelte';
	import { DEFAULT_TOASTER_ID, getStore, type ToastRecord } from './toast-store.svelte';
	import { ToastView } from './toast-view.svelte';
	import type { ToasterProps } from './types';

	// bounce, spring, duration, showProgress y showTimestamp quedan `undefined` si no se pasan,
	// para que el preset del Toaster pueda aplicarse (resolveOptions pone los valores por defecto)
	let {
		id = DEFAULT_TOASTER_ID,
		inline = false,
		position = 'bottom-right',
		theme = 'system',
		gap = 14,
		offset = '24px',
		duration,
		visibleToasts = 3,
		maxQueue = 100,
		queueOverflow = 'drop-oldest',
		closeButton = false,
		closeOnEscape = true,
		swipeToDismiss = true,
		preset,
		spring,
		bounce,
		showProgress,
		showTimestamp,
		dir = 'ltr',
		labels
	}: ToasterProps = $props();

	// Cada Toaster usa el store de su id: solo pinta, limita y anuncia sus propios toasts
	const store = $derived(getStore(id));
	const resolveTheme = createThemeResolver();
	const reducedMotion = createReducedMotion();
	const exitMs = $derived(reducedMotion.current ? REDUCED_MOTION_MS : FADE_MS);

	// La lista solo se pinta en el cliente para evitar desajustes de hidratación
	let mounted = $state(false);
	onMount(() => {
		mounted = true;
	});

	$effect.pre(() => {
		const config = {
			position,
			theme,
			gap,
			offset,
			duration,
			visibleToasts,
			maxQueue,
			queueOverflow,
			closeButton,
			closeOnEscape,
			swipeToDismiss,
			preset,
			spring,
			bounce,
			showProgress,
			showTimestamp,
			dir,
			labels
		};
		// El store se lee fuera de untrack: si cambia el id, la config se registra en el nuevo store.
		// untrack: el efecto depende solo de las props, no de la cola que setConfig recorre
		const target = store;
		untrack(() => target.setConfig(config));
	});

	const [y, x] = $derived(position.split('-') as ['top' | 'bottom', 'left' | 'center' | 'right']);
	// En RTL los lados se intercambian; el centro no cambia
	const side = $derived(x === 'center' || dir !== 'rtl' ? x : x === 'left' ? 'right' : 'left');
	const resolvedTheme = $derived(resolveTheme(theme));
	// Más reciente primero; los registros que están saliendo dejan la lista y se desvanecen
	const visible = $derived(store.active.filter((record) => record.status === 'active').reverse());

	// Cada clave id:version es una instancia nueva; la vista se liga a la versión con la que nació
	const createView = (record: ToastRecord) => untrack(() => new ToastView(record.version));
	const isAssertive = (record: ToastRecord) =>
		record.phase === 'error' || record.phase === 'warning';

	// Descarte manual desde el `<li>`; una instancia antigua no afecta al registro vigente
	const dismissFrom = (record: ToastRecord, view: ToastView) => {
		if (record.version === view.version) store.dismiss(record.id, { manual: true });
	};

	function handleKeydown(event: KeyboardEvent) {
		if (!closeOnEscape || event.key !== 'Escape') return;
		const newest = store.active.findLast((record) => record.status === 'active');
		if (newest) store.dismiss(newest.id, { manual: true });
	}
</script>

<svelte:document onkeydown={handleKeydown} />

<div
	class="cool-toaster"
	data-cool-toaster
	data-inline={inline ? 'true' : undefined}
	data-position={position}
	data-side={side}
	data-y={y}
	data-theme={resolvedTheme}
	{dir}
	style:--cool-toast-gap={`${gap}px`}
	style:--cool-toast-offset={offset}
>
	<ol class="cool-toast-list" data-cool-toast-list>
		{#if mounted}
			{#each visible as record (`${record.id}:${record.version}`)}
				{@const view = createView(record)}
				<li
					class="cool-toast"
					data-cool-toast
					data-id={record.id}
					data-type={record.type}
					data-phase={record.phase}
					data-expanded={String(view.expanded)}
					data-state={view.state}
					data-side={side}
					data-hovered={String(view.hovered)}
					data-swiping={view.swiping ? 'true' : undefined}
					data-shake={view.shaking ? 'true' : undefined}
					data-reduced-motion={String(reducedMotion.current)}
					role={isAssertive(record) ? 'alert' : 'status'}
					aria-live={isAssertive(record) ? 'assertive' : 'polite'}
					aria-atomic="true"
					onpointerenter={() => (view.hovered = true)}
					onpointerleave={() => (view.hovered = false)}
					onoutroend={() => store.remove(record.id, view.version)}
					{@attach swipe({
						enabled: () => swipeToDismiss,
						onSwipingChange: (swiping) => (view.swiping = swiping),
						onDismiss: () => dismissFrom(record, view)
					})}
					animate:flip={{ duration: exitMs, easing: cubicOut }}
					out:fade={{ duration: exitMs, easing: cubicOut }}
				>
					<Toast {record} {side} {view} {store} reducedMotion={reducedMotion.current} />
				</li>
			{/each}
		{/if}
	</ol>
	<Announcer {store} />
</div>
