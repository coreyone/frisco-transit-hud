<script lang="ts">
import RouteChip from '$lib/components/RouteChip.svelte';
import SectionHeader from '$lib/components/SectionHeader.svelte';
import { favoriteCollections, recentSearches } from '$lib/transit/store';

function buildRecentSearchHref(search: string) {
	const [from = '', to = ''] = search.split('→').map((value) => value.trim());
	const query = new URLSearchParams();

	if (from) {
		query.set('from', from);
	}

	if (to) {
		query.set('to', to);
	}

	return `/plan?${query.toString()}`;
}
</script>

<div class="space-y-6 lg:space-y-8">
	<section class="ds-panel motion-reveal p-5" style="--motion-reveal-delay: 0">
		<p class="section-kicker">Fast repeat behavior</p>
		<h2 class="mt-1 text-3xl font-black uppercase tracking-[0.08em] text-[var(--ink-strong)]">
			Your anchors
		</h2>
		<p class="mt-3 text-sm text-[var(--ink)]">
			Pinned lines and stops are one tap away when your routine matters more than exploration.
		</p>
	</section>

	<section class="motion-reveal space-y-4" style="--motion-reveal-delay: 1">
		<SectionHeader eyebrow="Pinned lines" title="Lines you trust" detail="Saved locally for instant access." />
		{#if $favoriteCollections.routes.length}
			<div class="flex flex-wrap gap-2">
				{#each $favoriteCollections.routes as route (route.id)}
					<a href={`/route/${route.id}`}>
						<RouteChip {route} />
					</a>
				{/each}
			</div>
		{:else}
			<div class="ds-empty">
				<p class="section-kicker">No saved lines</p>
				<p class="mt-2 text-sm text-[var(--ink)]">
					Save a route from Nearby or a line detail page to keep it close.
				</p>
			</div>
		{/if}
	</section>

	<div class="grid gap-6 xl:grid-cols-2 xl:items-start">
	<section class="motion-reveal space-y-4" style="--motion-reveal-delay: 2">
		<SectionHeader eyebrow="Pinned stops" title="Saved anchors" detail="Stops, platforms, and neighborhoods." />
		{#if $favoriteCollections.stops.length}
			<div class="space-y-3">
				{#each $favoriteCollections.stops as stop (stop.id)}
					<a
						class="ds-list-item flex items-center justify-between px-4 py-4"
						href={`/stop/${stop.id}`}
					>
						<div>
							<p class="text-sm font-semibold text-[var(--ink-strong)]">{stop.name}</p>
							<p class="text-xs uppercase tracking-[0.16em] text-[var(--ink-dim)]">{stop.neighborhood}</p>
						</div>
						<p class="text-xs text-[var(--ink-dim)]">{stop.platforms[0]}</p>
					</a>
				{/each}
			</div>
		{:else}
			<div class="ds-empty">
				<p class="section-kicker">No saved stops</p>
				<p class="mt-2 text-sm text-[var(--ink)]">
					Save a stop from Nearby or stop detail to build your commute shelf.
				</p>
			</div>
		{/if}
	</section>

	<section class="motion-reveal space-y-4" style="--motion-reveal-delay: 3">
		<SectionHeader eyebrow="Recent searches" title="Quick re-route" detail="Repeat intent should be almost free." />
		{#if $recentSearches.length}
			<div class="space-y-2">
				{#each $recentSearches as search (search)}
					<a
						class="ds-tile flex items-center justify-between px-4 py-3 text-sm text-[var(--ink)]"
						href={buildRecentSearchHref(search)}
					>
						<span>{search}</span>
						<span class="section-kicker">Reuse</span>
					</a>
				{/each}
			</div>
		{:else}
			<div class="ds-empty">
				<p class="section-kicker">No recent routes</p>
				<p class="mt-2 text-sm text-[var(--ink)]">
					Recent planner queries will show up here for one-tap reuse.
				</p>
			</div>
		{/if}
	</section>
	</div>
</div>
