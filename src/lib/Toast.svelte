<script lang="ts">
	import { flushSync, tick, untrack } from 'svelte';
	// cubicOut aproxima la curva de goey cubic-bezier(.4, 0, .2, 1) para las salidas (FADE_MS)
	import { cubicOut } from 'svelte/easing';
	import { fade, type TransitionConfig } from 'svelte/transition';
	import {
		pillResizeOptions,
		shakeTransform,
		squishSpring,
		squishTransform,
		type SquishKind
	} from './animation-config';
	import {
		DISMISS_AFTER_COLLAPSE_MS,
		EXPAND_DELAY_MS,
		EXPAND_SQUISH_DELAY_MS,
		FADE_MS,
		ICON_SWAP_MS,
		MORPH_DURATION_MS,
		MOUNT_SQUISH_DELAY_MS,
		PILL_HEIGHT,
		PILL_PADDING_X,
		REDUCED_MOTION_MS,
		SHAKE_DURATION_S,
		SQUISH_DEBOUNCE_MS,
		SUCCESS_LABEL_DISMISS_MS
	} from './constants';
	import Icon from './Icon.svelte';
	import { AnimationChannel, MorphDriver } from './morph-driver';
	import { morphPath, morphPathCenter, morphBox } from './morph-path';
	import { resolveOptions } from './resolve-options';
	import { createTimers } from './timers';
	import { getStore, type ToastRecord } from './toast-store.svelte';
	import type { ToastView } from './toast-view.svelte';

	type TimerName = 'expand' | 'life' | 'display' | 'dismiss' | 'squish';
	// Motivo del colapso en curso: solo el automático se revierte al pasar el puntero
	type CollapseReason = 'auto' | 'success';

	interface Props {
		record: ToastRecord;
		side: 'left' | 'center' | 'right';
		/** Estado visual compartido con el `<li>` que pinta el Toaster. */
		view: ToastView;
		/** `prefers-reduced-motion: reduce` activo: todo salta sin animar. */
		reducedMotion: boolean;
	}

	let { record, side, view, reducedMotion }: Props = $props();

	const store = getStore();
	const timers = createTimers();
	const createdAt = new Date();
	// Temporizadores que se congelan mientras el puntero está encima
	const PAUSABLE: readonly TimerName[] = ['life', 'display'];
	const ALL_TIMERS: readonly TimerName[] = ['expand', 'life', 'display', 'dismiss', 'squish'];

	const resolved = $derived(
		resolveOptions(
			{ ...record.options, description: record.description, action: record.action },
			store.config
		)
	);
	// Primitivos derivados: el ciclo de vida solo se reinicia cuando cambian de verdad
	const hasBody = $derived(resolved.expanded);
	const isLoading = $derived(record.phase === 'loading');
	const isAssertive = $derived(record.phase === 'error' || record.phase === 'warning');
	const classes = $derived(record.options.classes ?? {});
	// Con movimiento reducido no hay expansión ni morfología que descontar del tiempo visible
	const displayMs = $derived(
		reducedMotion
			? resolved.displayDuration - REDUCED_MOTION_MS
			: resolved.displayDuration - EXPAND_DELAY_MS - MORPH_DURATION_MS
	);
	const fadeMs = $derived(reducedMotion ? REDUCED_MOTION_MS : FADE_MS);
	const iconSwapMs = $derived(reducedMotion ? REDUCED_MOTION_MS : ICON_SWAP_MS);
	const closeLabel = $derived(store.config.labels?.close ?? 'Close notification');
	const stamp = createdAt.toLocaleTimeString(undefined, {
		hour: 'numeric',
		minute: '2-digit',
		second: '2-digit'
	});
	const fill = $derived(record.options.fillColor ?? 'var(--cool-toast-fill)');
	const stroke = $derived(record.options.borderColor ?? 'none');
	const strokeWidth = $derived(
		record.options.borderColor ? (record.options.borderWidth ?? 1.5) : 0
	);

	let bodyShown = $state(false);
	// Cada exhibición crea una barra de progreso nueva (la animación CSS vuelve a empezar)
	let progressKey = $state(0);

	let wrapperEl = $state<HTMLElement>();
	let headerEl = $state<HTMLElement>();
	let contentEl = $state<HTMLElement>();
	// Cuerpo actual (sigue en el DOM mientras corre su transición de salida)
	let bodyEl = $state<HTMLElement>();
	let blobEl = $state<SVGSVGElement>();
	let pathEl = $state<SVGPathElement>();

	// Medidas del blob: valores planos, nunca $state (se usan en cada frame)
	const dims = { pw: PILL_HEIGHT, bw: PILL_HEIGHT, th: PILL_HEIGHT };
	// Cada frame escribe solo el path y el tamaño del wrapper, que sigue a la caja del path (D16)
	const driver = new MorphDriver((t) => {
		const { pw, bw, th } = dims;
		const pathFn = side === 'center' ? morphPathCenter : morphPath;
		pathEl?.setAttribute('d', pathFn(pw, bw, th, t));
		if (!wrapperEl) return;
		const box = morphBox(pw, bw, th, t);
		wrapperEl.style.width = `${box.width}px`;
		wrapperEl.style.height = `${box.height}px`;
	});
	const squishChannel = new AnimationChannel();
	const shakeChannel = new AnimationChannel();
	let lastSquishAt = -Infinity;
	let collapseReason: CollapseReason = 'auto';

	type Dims = typeof dims;

	/**
	 * Lee las medidas que tendrá el toast: los nodos en salida ([data-leaving]) se ocultan
	 * durante la lectura para que no cuenten (D11). No escribe en `dims`.
	 */
	function readDims(): Dims | null {
		if (!headerEl || !contentEl) return null;
		const leaving = Array.from(contentEl.querySelectorAll<HTMLElement>('[data-leaving]'));
		const displays = leaving.map((node) => node.style.display);
		for (const node of leaving) node.style.display = 'none';
		const pw = headerEl.offsetWidth + PILL_PADDING_X;
		const next = {
			pw,
			bw: Math.max(contentEl.offsetWidth, pw),
			th: Math.max(contentEl.offsetHeight, PILL_HEIGHT)
		};
		leaving.forEach((node, index) => (node.style.display = displays[index]));
		return next;
	}

	// Cambia las medidas fuera de los frames. El SVG mide `bw`: el path centrado se dibuja en
	// [0, bw] y el CSS centra el SVG sobre el wrapper
	function setDims(next: Partial<Dims>) {
		Object.assign(dims, next);
		if (blobEl) blobEl.style.width = `${dims.bw}px`;
	}

	function measure() {
		const next = readDims();
		if (next) setDims(next);
	}

	// Medidas del cuerpo al expandir: la píldora conserva el ancho medido en estado píldora
	// (con la hora de la cabecera), así el cuello del path no salta al ocultarla
	function measureBody() {
		const next = readDims();
		if (!next) return;
		setDims({ bw: Math.max(next.bw, dims.pw), th: next.th });
	}

	// Ya en píldora y sin cuerpo saliente: las medidas vuelven a las compactas sin cambiar la forma
	function settlePill() {
		if (view.state !== 'pill' || bodyShown) return;
		measure();
		driver.redraw();
	}

	function startTimer(name: TimerName, ms: number, callback: () => void) {
		// Infinity (o NaN) desactiva el temporizador
		if (!Number.isFinite(ms)) return;
		timers.start(name, Math.max(0, ms), callback);
		if (view.hovered && PAUSABLE.includes(name)) timers.pause(name);
	}

	function clearTimers() {
		for (const name of ALL_TIMERS) timers.clear(name);
	}

	function stopAnimations() {
		driver.stop();
		squishChannel.stop();
		shakeChannel.stop();
	}

	// Una instancia saliente (version anterior) nunca debe descartar al registro que la reemplazó
	const isCurrent = () => record.version === view.version;
	const dismissSelf = (manual: boolean) => {
		if (isCurrent()) store.dismiss(record.id, { manual });
	};
	const autoClose = () => dismissSelf(false);
	// En la derecha el wrapper está espejado por CSS; los transforms en línea lo conservan
	const mirrorPrefix = () => (side === 'right' ? 'scaleX(-1) ' : '');

	// Arranque desde cero: píldora y, según el contenido, expansión (diferida) o vida compacta
	function restart() {
		clearTimers();
		// Solo la morfología: un squish o una sacudida en curso terminan por su cuenta
		driver.stop();
		view.state = 'pill';
		view.expanded = false;
		bodyShown = false;
		measure();
		driver.snap(0);
		if (hasBody) {
			if (reducedMotion) expand();
			else startTimer('expand', EXPAND_DELAY_MS, expand);
		} else if (!isLoading) {
			startTimer('life', resolved.lifetime, autoClose);
		}
	}

	// Muestra el cuerpo; la morfología arranca cuando el cuerpo ya está en el DOM (efecto de abajo)
	function expand() {
		timers.clear('dismiss');
		// Un cuerpo que estaba saliendo se reanuda: deja de marcarse como saliente
		bodyEl?.removeAttribute('data-leaving');
		view.expanded = true;
		view.state = 'morphing';
		bodyShown = true;
	}

	function onExpanded() {
		view.state = 'expanded';
		if (!isLoading) startDisplay();
	}

	function startDisplay() {
		progressKey += 1;
		startTimer('display', displayMs, () =>
			collapse(true, 'auto', () => startTimer('dismiss', DISMISS_AFTER_COLLAPSE_MS, autoClose))
		);
	}

	function collapse(preDismiss: boolean, reason: CollapseReason, after: () => void) {
		timers.clear('display');
		collapseReason = reason;
		view.state = 'collapsing';
		bodyEl?.setAttribute('data-leaving', 'true');
		bodyShown = false;
		// La cabecera recupera su hora en el DOM antes de medir el destino
		flushSync();
		// Interpola desde el cuerpo expandido (bw/th actuales) hasta la píldora destino (pw)
		const target = readDims();
		if (target) setDims({ pw: target.pw, bw: Math.max(dims.bw, target.pw) });
		const finish = () => {
			view.state = 'pill';
			view.expanded = false;
			after();
			// Con el DOM ya compacto se adoptan las medidas destino; la píldora no cambia
			void tick().then(settlePill);
		};
		if (reducedMotion) {
			driver.snap(0);
			finish();
			return;
		}
		// El colapso automático aterriza con un squish suave (solo con física de muelle)
		if (reason === 'auto' && resolved.spring) squish('collapse');
		driver.collapse(resolved.bounce, resolved.spring, preDismiss, finish);
	}

	// Squish de aterrizaje en el wrapper (con antirrebote para no encadenar sacudidas)
	function squish(kind: SquishKind) {
		const el = wrapperEl;
		if (reducedMotion || !el) return;
		const now = Date.now();
		if (now - lastSquishAt < SQUISH_DEBOUNCE_MS) return;
		lastSquishAt = now;
		const { bounce } = resolved;
		const mirrored = side === 'right';
		el.style.transformOrigin = 'center top';
		squishChannel.run(
			0,
			1,
			squishSpring(bounce),
			(v) => (el.style.transform = squishTransform(v, bounce, kind, mirrored)),
			() => {
				el.style.transform = '';
				el.style.transformOrigin = '';
			}
		);
	}

	// Sacudida al pasar a error (update o promesa rechazada); marca `data-shake` mientras dura
	function shake() {
		const el = wrapperEl;
		if (reducedMotion || !el) return;
		const mirror = mirrorPrefix();
		view.shaking = true;
		shakeChannel.run(
			0,
			1,
			{ duration: SHAKE_DURATION_S, ease: 'easeOut' },
			(v) => (el.style.transform = mirror + shakeTransform(v)),
			() => {
				el.style.transform = '';
				view.shaking = false;
			}
		);
	}

	// Ajusta la píldora al nuevo ancho de la cabecera (título, icono o hora cambiaron)
	function resizePill() {
		if (view.state !== 'pill' || bodyShown || !headerEl || !contentEl) return;
		const from = dims.pw;
		const to = headerEl.offsetWidth + PILL_PADDING_X;
		if (to === from) return;
		if (reducedMotion) {
			measure();
			driver.redraw();
			return;
		}
		// `bw` queda fijo durante la animación (la píldora solo depende de pw): el SVG no cambia de
		// ancho por frame
		setDims({ bw: Math.max(contentEl.offsetWidth, from, to) });
		driver.animateValue(
			from,
			to,
			pillResizeOptions(resolved.bounce, resolved.spring),
			(width) => {
				dims.pw = width;
				driver.redraw();
			},
			() => {
				measure();
				driver.redraw();
			}
		);
	}

	function handleAction() {
		const action = record.action;
		if (!action) return;
		try {
			action.onClick();
		} catch (error) {
			console.error(error);
		}
		if (!action.successLabel) return;
		// Con successLabel: confirma, colapsa y se descarta (manual) tras SUCCESS_LABEL_DISMISS_MS
		store.update(record.id, { title: action.successLabel, type: 'success' });
		collapse(true, 'success', () =>
			startTimer('dismiss', SUCCESS_LABEL_DISMISS_MS, () => dismissSelf(true))
		);
	}

	// Ciclo de vida: arranca al montar (cada version es una instancia nueva), al pasar a tener
	// cuerpo y al resolverse una promesa. Si ya estaba expandido al resolverse, solo arranca la exhibición.
	let wasLoading: boolean | null = null;
	$effect(() => {
		const loading = isLoading;
		const withBody = hasBody;
		untrack(() => {
			const settled = wasLoading === true && !loading;
			wasLoading = loading;
			if (settled && withBody && view.state === 'expanded') startDisplay();
			else restart();
		});
	});

	// Con el cuerpo ya en el DOM se miden las dimensiones expandidas y se anima (o salta) a t = 1
	$effect(() => {
		if (!bodyShown) return;
		untrack(() => {
			measureBody();
			if (reducedMotion) {
				driver.snap(1);
				onExpanded();
				return;
			}
			startTimer('squish', EXPAND_SQUISH_DELAY_MS, () => squish('mount'));
			driver.expand(resolved.bounce, resolved.spring, onExpanded);
		});
	});

	// Squish al montar
	$effect(() => {
		untrack(() => startTimer('squish', MOUNT_SQUISH_DELAY_MS, () => squish('mount')));
	});

	// Hover (lo registra el `<li>`): congela los temporizadores y revierte un colapso automático
	$effect(() => {
		const hovered = view.hovered;
		untrack(() => {
			for (const name of PAUSABLE) {
				if (hovered) timers.pause(name);
				else timers.resume(name);
			}
			if (hovered && view.state === 'collapsing' && collapseReason === 'auto') expand();
		});
	});

	// Paso a error: sacudida (no al montar un toast que ya nace como error)
	let previousPhase = untrack(() => record.phase);
	$effect(() => {
		const phase = record.phase;
		untrack(() => {
			if (phase === 'error' && previousPhase !== 'error') shake();
			previousPhase = phase;
		});
	});

	// Cambios de contenido de la cabecera: la píldora se ajusta al nuevo ancho
	let headerSeen = false;
	$effect(() => {
		void record.title;
		void record.icon;
		void resolved.showTimestamp;
		untrack(() => {
			if (headerSeen) resizePill();
			headerSeen = true;
		});
	});

	$effect(() => () => {
		clearTimers();
		stopAnimations();
	});

	// Anuncio accesible: "título: descripción" (solo el título si la descripción es un Snippet)
	$effect(() => {
		const { title, description } = record;
		const text =
			typeof description === 'string' && description ? `${title}: ${description}` : title;
		store.announce(text, isAssertive ? 'assertive' : 'polite');
	});

	// Cambio de icono entre fases: opacidad 0 ↔ 1 y escala .5 ↔ 1
	const iconSwap: (node: Element) => TransitionConfig = () => ({
		duration: iconSwapMs,
		css: (t) => `opacity: ${t}; transform: scale(${0.5 + 0.5 * t})`
	});
</script>

<div bind:this={wrapperEl} class={['cool-toast-wrapper', classes.wrapper]}>
	<svg bind:this={blobEl} class="cool-toast-blob" data-cool-toast-blob aria-hidden="true">
		<path bind:this={pathEl} {fill} {stroke} stroke-width={strokeWidth} />
	</svg>

	<!-- Caja de recorte: mide lo mismo que el path; fuera de "expanded" nada pinta fuera de ella -->
	<div class="cool-toast-clip">
		<div
			bind:this={contentEl}
			class={['cool-toast-content', classes.content]}
			data-cool-toast-content
		>
			<div
				bind:this={headerEl}
				class={['cool-toast-header', classes.header]}
				data-cool-toast-header
			>
				<span class={['cool-toast-icon', classes.icon]} data-cool-toast-icon>
					{#if record.icon !== null}
						{#key record.phase}
							<span class="cool-toast-icon-glyph" in:iconSwap out:iconSwap>
								{#if record.icon}
									{@render record.icon()}
								{:else}
									<Icon phase={record.phase} />
								{/if}
							</span>
						{/key}
					{/if}
				</span>
				<span class={['cool-toast-title', classes.title]} data-cool-toast-title>{record.title}</span
				>
				{#if resolved.showTimestamp && !bodyShown}
					<span class="cool-toast-timestamp" data-cool-toast-timestamp data-slot="header"
						>{stamp}</span
					>
				{/if}
			</div>

			{#if bodyShown}
				<div
					bind:this={bodyEl}
					class="cool-toast-body"
					out:fade={{ duration: fadeMs, easing: cubicOut }}
					onoutroend={settlePill}
				>
					{#if record.description}
						{@const description = record.description}
						<div class="cool-toast-description-row" data-cool-toast-description-row>
							<div
								class={['cool-toast-description', classes.description]}
								data-cool-toast-description
							>
								{#if typeof description === 'string'}
									{description}
								{:else}
									{@render description()}
								{/if}
							</div>
							{#if resolved.showTimestamp}
								<span
									class="cool-toast-timestamp"
									data-cool-toast-timestamp
									data-slot="description"
								>
									{stamp}
								</span>
							{/if}
						</div>
					{/if}

					{#if record.action}
						{#if resolved.showTimestamp && !record.description}
							<span class="cool-toast-timestamp" data-cool-toast-timestamp data-slot="action">
								{stamp}
							</span>
						{/if}
						<div
							class={['cool-toast-action-wrapper', classes.actionWrapper]}
							data-cool-toast-action-wrapper
						>
							<button
								type="button"
								class={['cool-toast-action', classes.actionButton]}
								data-cool-toast-action
								aria-label={record.action.label}
								onclick={handleAction}
							>
								{record.action.label}
							</button>
						</div>
					{/if}

					{#if resolved.showProgress && view.state === 'expanded'}
						{#key progressKey}
							<div
								class="cool-toast-progress"
								data-cool-toast-progress
								data-type={record.type}
								data-paused={String(view.hovered)}
								style:--cool-toast-progress-duration={`${displayMs}ms`}
							>
								<div class="cool-toast-progress-bar"></div>
							</div>
						{/key}
					{/if}
				</div>
			{/if}
		</div>
	</div>

	{#if resolved.closeButton && !isLoading}
		<button
			type="button"
			class="cool-toast-close"
			data-cool-toast-close
			data-side={resolved.closeButton}
			aria-label={closeLabel}
			onclick={() => dismissSelf(true)}
		>
			<svg
				width="12"
				height="12"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
				aria-hidden="true"
			>
				<path d="M18 6 6 18" />
				<path d="m6 6 12 12" />
			</svg>
		</button>
	{/if}
</div>
