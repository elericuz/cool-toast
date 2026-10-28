<script lang="ts" generics="T extends string">
	import type { Choice } from '../playground.svelte';

	interface Props {
		label: string;
		choices: Choice<T>[];
		value: T;
		onchange: (value: T) => void;
	}

	let { label, choices, value, onchange }: Props = $props();

	// Nombre único del grupo de radios para que el teclado navegue solo dentro de este control
	const name = $props.id();
</script>

<!-- Grupo de radios accesible: fieldset + legend, cada opción con su label -->
<fieldset class="control-group">
	<legend class="control-legend">{label}</legend>
	<div class="segment-list">
		{#each choices as choice (choice.value)}
			<label class="segment">
				<input
					class="peer sr-only"
					type="radio"
					{name}
					value={choice.value}
					checked={choice.value === value}
					onchange={() => onchange(choice.value)}
				/>
				<span class="segment-face">{choice.label}</span>
			</label>
		{/each}
	</div>
</fieldset>
