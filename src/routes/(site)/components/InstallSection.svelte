<script lang="ts">
	import { installCode, layoutCode, usageCode } from '../snippets';
	import CodeBlock from './CodeBlock.svelte';
</script>

<section class="section" aria-labelledby="install-title">
	<div class="grid gap-10 lg:grid-cols-5">
		<div class="flex flex-col gap-4 lg:col-span-2">
			<p class="eyebrow">Install</p>
			<h2 id="install-title" class="heading-section">Three steps, no config.</h2>
			<p class="body-lead">
				Svelte 5 is the only peer dependency. Import the stylesheet once, render one Toaster and
				call <code class="font-code text-ember-300">toast</code> from anywhere.
			</p>
		</div>
		<div class="flex flex-col gap-6 lg:col-span-3">
			<CodeBlock caption="1 · Install" code={installCode} />
			<CodeBlock caption="2 · Root layout" code={layoutCode} />
			<CodeBlock caption="3 · Anywhere" code={usageCode} />
		</div>
	</div>
</section>
