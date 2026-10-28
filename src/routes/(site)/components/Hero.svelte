<script lang="ts">
	import { playground } from '../playground.svelte';
</script>

<header class="section grain pt-28 pb-24 lg:pt-36">
	<div class="blob blob-ember" aria-hidden="true"></div>
	<div class="blob blob-lagoon" aria-hidden="true"></div>

	<div class="relative flex flex-col gap-8">
		<p class="eyebrow reveal">Svelte 5 · @elericuz/cool-toast</p>
		<h1 class="heading-hero reveal reveal-delay-1">
			Toasts that <span class="accent-word">melt</span><br />into place.
		</h1>
		<p class="body-lead reveal reveal-delay-2">
			A compact pill that morphs into a full card when there is more to say. Springs, swipe to
			dismiss, promises and accessible announcements, with zero framework lock-in.
		</p>
		<div class="reveal reveal-delay-3 flex flex-wrap gap-4">
			<button class="btn-primary" type="button" onclick={() => playground.fire()}>
				Fire a toast
			</button>
			<a class="btn-ghost" href="#playground">Open the playground</a>
		</div>
	</div>
</header>
