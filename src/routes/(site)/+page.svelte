<script lang="ts">
	import ApiReference from './components/ApiReference.svelte';
	import BlobStrip from './components/BlobStrip.svelte';
	import Hero from './components/Hero.svelte';
	import InstallSection from './components/InstallSection.svelte';
	import Playground from './components/Playground.svelte';
	import SiteFooter from './components/SiteFooter.svelte';
</script>

<svelte:head>
	<title>Cool-Toast: gooey toast notifications for Svelte</title>
	<meta
		name="description"
		content="Gooey, morphing toast notifications for Svelte 5: springs, swipe to dismiss, promises and accessible announcements."
	/>
</svelte:head>

<main>
	<Hero />
	<Playground />
	<BlobStrip />
	<InstallSection />
	<ApiReference />
</main>
<SiteFooter />
