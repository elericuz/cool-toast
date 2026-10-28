<script lang="ts">
	import PackageIcon from 'phosphor-svelte/lib/PackageIcon';
	import { playground } from '../playground.svelte';
</script>

<header class="site-nav">
	<nav class="page-container site-nav-inner" aria-label="Main">
		<a class="wordmark" href="#top">Cool-Toast</a>
		<div class="flex items-center gap-2 sm:gap-4">
			<a class="nav-link" href="#playground">Playground</a>
			<a class="nav-link" href="#install">Install</a>
			<a class="nav-link" href="#api">API</a>
			<a
				class="nav-icon-link"
				href="https://www.npmjs.com/package/@elericuz/cool-toast"
				rel="noreferrer"
				target="_blank"
				aria-label="Cool-Toast on npm (opens in a new tab)"
			>
				<PackageIcon size={20} weight="regular" aria-hidden="true" />
			</a>
			<button class="btn-primary-small" type="button" onclick={() => playground.showcase()}>
				Fire a toast
			</button>
		</div>
	</nav>
</header>
