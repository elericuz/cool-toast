<script lang="ts">
	interface Props {
		label: string;
		hint?: string;
		checked: boolean;
		disabled?: boolean;
	}

	let { label, hint, checked = $bindable(), disabled = false }: Props = $props();
</script>

<!-- Interruptor: checkbox nativo (accesible por teclado) con apariencia de switch -->
<label class="toggle">
	<span>
		<span class="toggle-label">{label}</span>
		{#if hint}
			<span class="toggle-hint">{hint}</span>
		{/if}
	</span>
	<input class="toggle-input peer sr-only" type="checkbox" role="switch" bind:checked {disabled} />
	<span class="toggle-track" aria-hidden="true">
		<span class="toggle-thumb"></span>
	</span>
</label>
