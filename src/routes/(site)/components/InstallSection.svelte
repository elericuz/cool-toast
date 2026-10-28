<script lang="ts">
	import { installCode, layoutCode, usageCode } from '../snippets';
	import { revealOnScroll } from '../reveal';
	import CodeBlock from './CodeBlock.svelte';

	let content: HTMLElement;

	$effect(() => revealOnScroll(content));
</script>

<section id="install" class="section-space" aria-labelledby="install-title">
	<div class="page-container">
		<div class="section-head">
			<h2 id="install-title" class="heading-section">Three steps, no config.</h2>
			<p class="body-text">
				Svelte 5 is the only peer dependency. Import the stylesheet once, render one Toaster and
				call <code class="inline-code">toast</code> from anywhere.
			</p>
		</div>

		<!-- Orden 1, 2, 3 en móvil; en lg el layout raíz ocupa la columna derecha en dos filas -->
		<div class="reveal-on-scroll install-grid" bind:this={content}>
			<div class="min-w-0">
				<CodeBlock lang="bash" label="1. Install" code={installCode} />
			</div>
			<div class="min-w-0 lg:col-start-2 lg:row-span-2 lg:row-start-1">
				<CodeBlock lang="svelte" label="2. Root layout" code={layoutCode} />
			</div>
			<div class="min-w-0">
				<CodeBlock lang="ts" label="3. Anywhere" code={usageCode} />
			</div>
		</div>
	</div>
</section>
