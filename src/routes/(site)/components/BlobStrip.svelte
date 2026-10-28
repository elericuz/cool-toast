<script lang="ts">
	import { morphPath } from '../../../lib/morph-path.ts';
	import { revealOnScroll } from '../reveal';

	// Ancho de la píldora y lienzo de cada fotograma (mismas unidades que la librería)
	const PILL_WIDTH = 136;
	const FRAME_WIDTH = 320;
	const FRAME_HEIGHT = 112;

	const frames = [
		{ t: 0, name: 'Pill', caption: 'A 44 px pill holds the title.' },
		{ t: 0.35, name: 'Neck', caption: 'After a 330 ms delay, a neck grows out of the pill.' },
		{ t: 0.7, name: 'Body', caption: 'The body widens on a 900 ms spring.' },
		{ t: 1, name: 'Settled', caption: 'The spring settles at full size.' }
	];

	let track: HTMLElement;

	$effect(() => revealOnScroll(track));
</script>

<section class="blob-band section-space" aria-labelledby="blob-title">
	<div class="page-container flex flex-col gap-10">
		<div class="flex flex-col gap-3">
			<h2 id="blob-title" class="heading-section">One path, four frames.</h2>
			<p class="body-text">
				Each toast is a single SVG path. These frames come from the same function the library runs
				on every animation frame.
			</p>
		</div>

		<ol class="blob-track reveal-on-scroll" bind:this={track}>
			{#each frames as frame (frame.t)}
				<li class="blob-frame">
					<div class="blob-tile">
						<svg
							class="blob-figure"
							viewBox="0 0 {FRAME_WIDTH} {FRAME_HEIGHT}"
							role="img"
							aria-label="{frame.name} frame of the toast shape"
						>
							<path d={morphPath(PILL_WIDTH, FRAME_WIDTH, FRAME_HEIGHT, frame.t)} fill="white" />
						</svg>
					</div>
					<p class="blob-name">{frame.name}</p>
					<p class="blob-caption">{frame.caption}</p>
				</li>
			{/each}
		</ol>
	</div>
</section>
