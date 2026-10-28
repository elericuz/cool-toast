<script lang="ts">
	interface Props {
		caption: string;
		code: string;
	}

	let { caption, code }: Props = $props();
</script>

<figure>
	<figcaption class="code-caption">{caption}</figcaption>
	<pre class="code-block"><code>{code}</code></pre>
</figure>
