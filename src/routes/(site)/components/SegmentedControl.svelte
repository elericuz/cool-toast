<script lang="ts" generics="T extends string">
	import type { Choice } from '../playground.svelte';

	interface Props {
		legend: string;
		name: string;
		choices: Choice<T>[];
		value: T;
	}

	let { legend, name, choices, value = $bindable() }: Props = $props();
</script>

<!-- Grupo de radios accesible: fieldset + legend, cada opción con su label -->
<fieldset class="control-group">
	<legend class="control-legend">{legend}</legend>
	<div class="segment-list">
		{#each choices as choice (choice.value)}
			<label class="segment">
				<input class="peer sr-only" type="radio" {name} value={choice.value} bind:group={value} />
				<span class="segment-face">{choice.label}</span>
			</label>
		{/each}
	</div>
</fieldset>
