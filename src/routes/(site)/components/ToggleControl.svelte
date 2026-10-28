<script lang="ts">
	interface Props {
		label: string;
		checked: boolean;
		onchange: (checked: boolean) => void;
	}

	let { label, checked, onchange }: Props = $props();
</script>

<!-- Interruptor: checkbox nativo (accesible por teclado) con apariencia de switch -->
<label class="toggle">
	<span class="toggle-label">{label}</span>
	<input
		class="toggle-input peer sr-only"
		type="checkbox"
		role="switch"
		{checked}
		onchange={(event) => onchange(event.currentTarget.checked)}
	/>
	<span class="toggle-track" aria-hidden="true">
		<span class="toggle-thumb"></span>
	</span>
</label>
