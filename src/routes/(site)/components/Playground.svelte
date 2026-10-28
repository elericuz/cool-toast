<script lang="ts">
	import {
		closeButtonChoices,
		playground,
		positionChoices,
		presetChoices,
		themeChoices,
		typeChoices
	} from '../playground.svelte';
	import CodeBlock from './CodeBlock.svelte';
	import SegmentedControl from './SegmentedControl.svelte';
	import ToggleControl from './ToggleControl.svelte';

	// Sin acción no tiene sentido una etiqueta de éxito
	$effect(() => {
		if (!playground.withAction) playground.withSuccessLabel = false;
	});
</script>

<section id="playground" class="section" aria-labelledby="playground-title">
	<div class="mb-12 flex flex-col gap-4">
		<p class="eyebrow">Playground</p>
		<h2 id="playground-title" class="heading-section">Tune it, fire it, copy it.</h2>
		<p class="body-lead">
			Every control updates the live Toaster on this page and the code on the right.
		</p>
	</div>

	<div class="grid gap-8 lg:grid-cols-5">
		<form
			class="panel flex flex-col gap-8 lg:col-span-3"
			onsubmit={(event) => event.preventDefault()}
		>
			<SegmentedControl
				legend="Type"
				name="type"
				choices={typeChoices}
				bind:value={playground.type}
			/>

			<div class="grid gap-3 sm:grid-cols-2">
				<ToggleControl
					label="Description"
					hint="Expands the pill into a card"
					bind:checked={playground.withDescription}
				/>
				<ToggleControl
					label="Action button"
					hint="Adds an Undo button"
					bind:checked={playground.withAction}
				/>
				<ToggleControl
					label="Success label"
					hint="Confirms the action, then closes"
					bind:checked={playground.withSuccessLabel}
					disabled={!playground.withAction}
				/>
			</div>

			<div class="flex flex-wrap gap-3">
				<button class="btn-primary" type="button" onclick={() => playground.fire()}>
					Show toast
				</button>
				<button class="btn-small" type="button" onclick={() => playground.firePromise('resolve')}>
					Promise that resolves
				</button>
				<button class="btn-small" type="button" onclick={() => playground.firePromise('reject')}>
					Promise that rejects
				</button>
				<button class="btn-small" type="button" onclick={() => playground.fireBurst()}>
					Queue burst (6 toasts)
				</button>
			</div>

			<hr class="border-ink-800" />

			<SegmentedControl
				legend="Position"
				name="position"
				choices={positionChoices}
				bind:value={playground.position}
			/>
			<SegmentedControl
				legend="Animation preset"
				name="preset"
				choices={presetChoices}
				bind:value={playground.preset}
			/>
			<SegmentedControl
				legend="Theme"
				name="theme"
				choices={themeChoices}
				bind:value={playground.theme}
			/>
			<SegmentedControl
				legend="Close button"
				name="close-button"
				choices={closeButtonChoices}
				bind:value={playground.closeButton}
			/>

			<div class="grid gap-3 sm:grid-cols-2">
				<ToggleControl
					label="Progress bar"
					hint="On expanded toasts"
					bind:checked={playground.showProgress}
				/>
				<ToggleControl
					label="Timestamp"
					hint="Creation time on each toast"
					bind:checked={playground.showTimestamp}
				/>
			</div>

			<div class="flex flex-wrap items-center gap-4">
				<p class="body-muted">
					<span class="swipe-hand" aria-hidden="true">👉</span>
					Swipe any toast sideways (mouse or touch) to dismiss it, or press Escape.
				</p>
				<span
					class="badge {playground.reducedMotion.current ? 'badge-on' : 'badge-off'}"
					role="status"
				>
					<span class="badge-dot" aria-hidden="true"></span>
					Reduced motion: {playground.reducedMotion.current ? 'on' : 'off'}
				</span>
			</div>
		</form>

		<div class="flex flex-col gap-6 lg:col-span-2">
			<CodeBlock caption="Toaster (in your layout)" code={playground.toasterSnippet} />
			<CodeBlock caption="Toast" code={playground.toastSnippet} />
			<CodeBlock caption="Promise" code={playground.promiseSnippet} />
		</div>
	</div>
</section>
