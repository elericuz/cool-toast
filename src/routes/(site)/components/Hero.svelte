<script lang="ts">
	import BellIcon from 'phosphor-svelte/lib/BellIcon';
	import CheckCircleIcon from 'phosphor-svelte/lib/CheckCircleIcon';
	import CopyIcon from 'phosphor-svelte/lib/CopyIcon';
	import InfoIcon from 'phosphor-svelte/lib/InfoIcon';
	import WarningIcon from 'phosphor-svelte/lib/WarningIcon';
	import XCircleIcon from 'phosphor-svelte/lib/XCircleIcon';
	import { Toaster, type ToastType } from '#lib';
	import { HERO_TOASTER_ID, HeroLoop, heroTypes } from '../hero-loop.svelte';
	import { playground, samples, typeChoices } from '../playground.svelte';

	let root: HTMLElement;
	let stage: HTMLElement;

	// Icono y color de cada tipo; los colores son los del tema oscuro de la librería (fondo azul marino)
	const typeIcons = {
		default: BellIcon,
		success: CheckCircleIcon,
		error: XCircleIcon,
		warning: WarningIcon,
		info: InfoIcon
	};
	const typeTints: Record<ToastType, string> = {
		default: 'text-type-default',
		success: 'text-type-success',
		error: 'text-type-error',
		warning: 'text-type-warning',
		info: 'text-type-info'
	};
	const labelOf = (type: ToastType) =>
		typeChoices.find((choice) => choice.value === type)?.label ?? type;

	const loop = new HeroLoop();

	// Arranca solo si se permite el movimiento; se detiene (y limpia su temporizador) al destruirse
	$effect(() => {
		if (loop.reducedMotion.current) return;
		loop.start();
		return () => loop.stop();
	});

	$effect(() => loop.observe(stage));

	// El foco solo cuenta como pausa mientras siga dentro del escenario
	function onFocusOut(event: FocusEvent) {
		if (!stage.contains(event.relatedTarget as Node | null)) loop.hold('focus', false);
	}

	// El contenido se pinta visible; la entrada se activa un frame después para no ocultar nada
	// si el navegador o una herramienta de captura pausa las animaciones
	$effect(() => {
		const frame = requestAnimationFrame(() => root.classList.add('is-entering'));
		return () => cancelAnimationFrame(frame);
	});
</script>

<section id="top" aria-labelledby="hero-title" bind:this={root}>
	<div class="page-container hero-grid">
		<div class="hero-copy">
			<h1 id="hero-title" class="heading-hero rise">Toasts that melt into place.</h1>
			<p class="body-lead rise rise-delay-1">
				A pill that morphs into a card when there is more to say, driven by a real spring.
			</p>
			<div class="rise rise-delay-2 flex flex-wrap gap-3">
				<button class="btn-primary" type="button" onclick={() => playground.showcase()}>
					Fire a toast
				</button>
				<button class="btn-secondary" type="button" onclick={() => playground.copyInstall()}>
					<CopyIcon size={20} weight="regular" aria-hidden="true" />
					Copy install
				</button>
			</div>
		</div>

		<!-- Escenario: un Toaster propio en línea; cada fila lanza ese tipo y el bucle los recorre -->
		<div
			class="hero-stage rise rise-delay-3"
			role="group"
			aria-labelledby="stage-title"
			bind:this={stage}
			onpointerenter={() => loop.hold('hover', true)}
			onpointerleave={() => loop.hold('hover', false)}
			onfocusin={() => loop.hold('focus', true)}
			onfocusout={onFocusOut}
		>
			<p id="stage-title" class="stage-title">Try every type</p>
			<div class="stage-types">
				{#each heroTypes as type (type)}
					{@const Icon = typeIcons[type]}
					<button
						class="stage-type"
						type="button"
						aria-pressed={loop.activeType === type}
						onclick={() => loop.fire(type)}
					>
						<Icon size={20} weight="fill" class={typeTints[type]} aria-hidden="true" />
						<span class="stage-type-name">{labelOf(type)}</span>
						<span class="stage-type-sample">{samples[type].title}</span>
					</button>
				{/each}
			</div>
			<Toaster
				id={HERO_TOASTER_ID}
				inline
				position="bottom-center"
				theme="light"
				visibleToasts={1}
				offset="24px"
				preset="snappy"
			/>
		</div>
	</div>
</section>
