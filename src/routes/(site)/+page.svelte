<script lang="ts">
	import Hero from './components/Hero.svelte';
	import InstallSection from './components/InstallSection.svelte';
	import Playground from './components/Playground.svelte';
	import SiteFooter from './components/SiteFooter.svelte';
</script>

<svelte:head>
	<title>Cool-Toast · Gooey toast notifications for Svelte</title>
	<meta
		name="description"
		content="Gooey, morphing toast notifications for Svelte 5: springs, swipe to dismiss, promises and accessible announcements."
	/>
</svelte:head>

<Hero />
<main>
	<Playground />
	<InstallSection />
</main>
<SiteFooter />
