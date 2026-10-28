<script lang="ts">
	import { revealOnScroll } from '../reveal';
	import { apiTabs } from '../snippets';

	// Pestaña activa (patrón WAI-ARIA Tabs con activación automática)
	let selected = $state(apiTabs[0].id);
	let tabButtons: HTMLButtonElement[] = $state([]);
	let content: HTMLElement;

	const tabId = (id: string) => `api-tab-${id}`;
	const panelId = (id: string) => `api-panel-${id}`;

	// Flechas, Inicio y Fin mueven el foco y seleccionan la pestaña, con vuelta circular
	function onTabKeydown(event: KeyboardEvent, index: number) {
		const last = apiTabs.length - 1;
		const targets: Record<string, number> = {
			ArrowRight: index === last ? 0 : index + 1,
			ArrowLeft: index === 0 ? last : index - 1,
			Home: 0,
			End: last
		};
		const next = targets[event.key];
		if (next === undefined) return;
		event.preventDefault();
		selected = apiTabs[next].id;
		tabButtons[next]?.focus();
	}

	$effect(() => revealOnScroll(content));
</script>

<section id="api" class="section-space" aria-labelledby="api-title">
	<div class="page-container">
		<div class="section-head">
			<h2 id="api-title" class="heading-section">API</h2>
			<p class="body-text">
				One component, one function and a set of CSS variables. Everything below is exported from
				<code class="inline-code">@elericuz/cool-toast</code>.
			</p>
		</div>

		<div class="reveal-on-scroll flex flex-col gap-8" bind:this={content}>
			<div class="api-tablist" role="tablist" aria-label="API reference">
				{#each apiTabs as tab, index (tab.id)}
					<button
						bind:this={tabButtons[index]}
						id={tabId(tab.id)}
						class="api-tab"
						type="button"
						role="tab"
						aria-selected={selected === tab.id}
						aria-controls={panelId(tab.id)}
						tabindex={selected === tab.id ? 0 : -1}
						onclick={() => (selected = tab.id)}
						onkeydown={(event) => onTabKeydown(event, index)}
					>
						{tab.label}
					</button>
				{/each}
			</div>

			{#each apiTabs as tab (tab.id)}
				<div
					id={panelId(tab.id)}
					class="api-panel"
					role="tabpanel"
					aria-labelledby={tabId(tab.id)}
					tabindex="0"
					hidden={selected !== tab.id}
				>
					<p class="body-text">{tab.intro}</p>
					<div class="api-groups">
						{#each tab.groups as group (group.title)}
							<div class="api-group">
								<h3 class="api-group-title">{group.title}</h3>
								<dl class="api-list">
									{#each group.entries as entry (entry.name)}
										<div class="api-entry">
											<dt class="api-signature">{entry.name}</dt>
											<dd class="api-detail">
												{#if entry.type}
													<code class="api-type">{entry.type}</code>
												{/if}
												{#if entry.defaultValue}
													<span class="api-default">
														Default <code class="api-type">{entry.defaultValue}</code>
													</span>
												{/if}
												<span>{entry.description}</span>
											</dd>
										</div>
									{/each}
								</dl>
							</div>
						{/each}
					</div>
				</div>
			{/each}
		</div>
	</div>
</section>
