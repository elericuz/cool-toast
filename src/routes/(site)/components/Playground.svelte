<script lang="ts">
	import {
		closeButtonChoices,
		playground,
		positionChoices,
		presetChoices,
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

<section id="playground" class="section-space" aria-labelledby="playground-title">
	<div class="page-container">
		<div class="section-head">
			<h2 id="playground-title" class="heading-section">Tune it, fire it, copy it.</h2>
			<p class="body-text">
				Every control updates the live Toaster on this page and the code beside it.
			</p>
		</div>

		<div class="tint-panel">
			<form class="flex flex-col gap-8 lg:col-span-5" onsubmit={(event) => event.preventDefault()}>
				<SegmentedControl
					label="Type"
					choices={typeChoices}
					value={playground.type}
					onchange={(value) => (playground.type = value)}
				/>

				<div class="control-group" role="group" aria-labelledby="fire-label">
					<p id="fire-label" class="control-legend">Fire</p>
					<div class="flex flex-wrap gap-3">
						<button class="btn-primary-small" type="button" onclick={() => playground.fire()}>
							Show toast
						</button>
						<button
							class="btn-secondary-small"
							type="button"
							onclick={() => playground.promise('resolve')}
						>
							Promise that resolves
						</button>
						<button
							class="btn-secondary-small"
							type="button"
							onclick={() => playground.promise('reject')}
						>
							Promise that rejects
						</button>
						<button class="btn-secondary-small" type="button" onclick={() => playground.burst()}>
							Queue 6 toasts
						</button>
					</div>
					<p class="caption">Promises settle after 2.2 s.</p>
				</div>

				<SegmentedControl
					label="Position"
					choices={positionChoices}
					value={playground.position}
					onchange={(value) => (playground.position = value)}
				/>
				<SegmentedControl
					label="Preset"
					choices={presetChoices}
					value={playground.preset}
					onchange={(value) => (playground.preset = value)}
				/>
				<SegmentedControl
					label="Close button"
					choices={closeButtonChoices}
					value={playground.closeButton}
					onchange={(value) => (playground.closeButton = value)}
				/>

				<fieldset class="control-group">
					<legend class="control-legend">Content</legend>
					<div class="flex flex-col gap-1">
						<ToggleControl
							label="Description"
							checked={playground.withDescription}
							onchange={(checked) => (playground.withDescription = checked)}
						/>
						<ToggleControl
							label="Action button"
							checked={playground.withAction}
							onchange={(checked) => (playground.withAction = checked)}
						/>
						{#if playground.withAction}
							<ToggleControl
								label="Success label"
								checked={playground.withSuccessLabel}
								onchange={(checked) => (playground.withSuccessLabel = checked)}
							/>
						{/if}
						<ToggleControl
							label="Progress bar"
							checked={playground.showProgress}
							onchange={(checked) => (playground.showProgress = checked)}
						/>
						<ToggleControl
							label="Timestamp"
							checked={playground.showTimestamp}
							onchange={(checked) => (playground.showTimestamp = checked)}
						/>
					</div>
				</fieldset>

				<p class="caption" role="status">
					Swipe a toast sideways or press Escape to dismiss it. Reduced motion is
					{playground.reducedMotion.current ? 'on' : 'off'} on this device.
				</p>
			</form>

			<div class="flex min-w-0 flex-col gap-5 lg:col-span-7">
				<CodeBlock lang="svelte" label="+layout.svelte" code={playground.toasterSnippet} onTint />
				<CodeBlock lang="ts" label="Toast" code={playground.toastSnippet} onTint />
				<CodeBlock lang="ts" label="Promise" code={playground.promiseSnippet} onTint />
			</div>
		</div>
	</div>
</section>
