<script lang="ts">
	import { ANNOUNCER_CLEAR_MS } from './constants';
	import type { Politeness, ToastStore } from './toast-store.svelte';

	// Cada Toaster anuncia en su propia región solo los toasts de su store (TOASTER-5)
	let { store }: { store: ToastStore } = $props();

	// Vacía cada región tras ANNOUNCER_CLEAR_MS para no releer anuncios viejos
	function clearLater(politeness: Politeness) {
		if (!store.announcements[politeness]) return;
		const handle = setTimeout(() => {
			store.announcements[politeness] = '';
		}, ANNOUNCER_CLEAR_MS);
		return () => clearTimeout(handle);
	}

	$effect(() => clearLater('polite'));
	$effect(() => clearLater('assertive'));
</script>

<div
	class="cool-toast-sr-only"
	data-cool-toast-announcer="polite"
	role="status"
	aria-live="polite"
	aria-atomic="true"
>
	{store.announcements.polite}
</div>
<div
	class="cool-toast-sr-only"
	data-cool-toast-announcer="assertive"
	role="alert"
	aria-live="assertive"
	aria-atomic="true"
>
	{store.announcements.assertive}
</div>
