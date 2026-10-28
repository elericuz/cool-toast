<script lang="ts">
	import '../../app.css';
	import type { Snippet } from 'svelte';
	import { Toaster } from '#lib';
	import { playground } from './playground.svelte';

	let { children }: { children: Snippet } = $props();
</script>

<!-- Un único Toaster para toda la demo, enlazado al estado del playground -->
<Toaster {...playground.toasterProps} />

<div class="page-shell">
	{@render children()}
</div>
