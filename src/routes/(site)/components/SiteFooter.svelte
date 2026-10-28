<script lang="ts">
	import HeartIcon from 'phosphor-svelte/lib/HeartIcon';
</script>

<footer class="site-footer">
	<div class="page-container footer-row">
		<p class="caption">
			A Svelte 5 port of
			<a class="link" href="https://github.com/anl331/goey-toast" rel="noreferrer">goey-toast</a>,
			released under the MIT License.
		</p>
		<div class="footer-end">
			<!-- Autoría: el corazón lleva etiqueta accesible porque sustituye a una palabra -->
			<p class="footer-credit">
				Made with
				<HeartIcon size={20} weight="fill" class="text-brand-700" aria-label="love" />
				by
				<a class="link" href="https://github.com/elericuz" rel="noreferrer">elericuz</a>
			</p>
			<div class="flex gap-6">
				<a class="link" href="https://unpkg.com/@elericuz/cool-toast/LICENSE" rel="noreferrer">
					LICENSE
				</a>
				<a class="link" href="https://www.npmjs.com/package/@elericuz/cool-toast" rel="noreferrer">
					npm
				</a>
			</div>
		</div>
	</div>
</footer>
