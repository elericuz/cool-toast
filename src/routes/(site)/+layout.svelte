<script lang="ts">
	import '../../app.css';
	import type { Snippet } from 'svelte';
	import { Toaster, toast } from '#lib';
	import { playground } from './playground.svelte';
	import SiteNav from './components/SiteNav.svelte';

	let { children }: { children: Snippet } = $props();

	const WELCOME_DELAY_MS = 700;

	// Un único toast de bienvenida tras montar la página; se cancela si el layout se destruye antes
	$effect(() => {
		const timer = setTimeout(() => toast('Welcome to Cool-Toast'), WELCOME_DELAY_MS);
		return () => clearTimeout(timer);
	});
</script>

<!-- Un único Toaster para toda la demo, siempre en modo claro y enlazado al playground -->
<Toaster {...playground.toasterProps} theme="light" />

<SiteNav />
{@render children()}
