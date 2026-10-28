<script lang="ts">
	import type { ToastPhase } from './types';

	let { phase }: { phase: ToastPhase } = $props();
</script>

<!-- Iconos integrados: 18×18, trazo de 2 px con extremos redondeados; puramente decorativos -->
<svg
	class={phase === 'loading' ? 'cool-toast-spin' : undefined}
	width="18"
	height="18"
	viewBox="0 0 24 24"
	fill="none"
	stroke="currentColor"
	stroke-width="2"
	stroke-linecap="round"
	stroke-linejoin="round"
	aria-hidden="true"
>
	{#if phase === 'loading'}
		<path d="M21 12a9 9 0 1 1-6.219-8.56" />
	{:else if phase === 'default'}
		<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
		<path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
	{:else}
		<circle cx="12" cy="12" r="10" />
		{#if phase === 'success'}
			<path d="m9 12 2 2 4-4" />
		{:else if phase === 'error'}
			<path d="m15 9-6 6" />
			<path d="m9 9 6 6" />
		{:else if phase === 'warning'}
			<path d="M12 8v4" />
			<path d="M12 16h.01" />
		{:else}
			<path d="M12 16v-4" />
			<path d="M12 8h.01" />
		{/if}
	{/if}
</svg>
