<script lang="ts">
	import CopyIcon from 'phosphor-svelte/lib/CopyIcon';
	import { copyText } from '../playground.svelte';

	interface Props {
		code: string;
		lang: 'bash' | 'svelte' | 'ts';
		label?: string;
		/** Variante blanca para bloques dentro del panel tintado */
		onTint?: boolean;
	}

	let { code, lang, label, onTint = false }: Props = $props();

	const title = $derived(label ?? lang);
</script>

<!-- Etiqueta a la izquierda y botón de copiar arriba a la derecha, ambos dentro del bloque -->
<figure class={['code-block', onTint && 'code-block-on-tint']} data-lang={lang}>
	<figcaption class="code-head">
		<span class="code-label">{title}</span>
		<button
			class="code-copy"
			type="button"
			aria-label="Copy {title} code"
			onclick={() => copyText(code, 'Code copied')}
		>
			<CopyIcon size={20} weight="regular" aria-hidden="true" />
		</button>
	</figcaption>
	<pre class="code-body"><code>{code}</code></pre>
</figure>
