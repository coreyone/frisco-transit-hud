<script lang="ts">
import { page } from '$app/state';
import DeferredLiveMap from '$lib/components/DeferredLiveMap.svelte';
import RouteChip from '$lib/components/RouteChip.svelte';
import SchematicMap from '$lib/components/SchematicMap.svelte';
import SectionHeader from '$lib/components/SectionHeader.svelte';
import { favorites, snapshot, toggleFavorite } from '$lib/transit/store';
import { getRouteStops, getRouteVehicles } from '$lib/transit/utils';

const route = $derived(
	$snapshot.routes.find((candidate) => candidate.id === page.params.id),
);
const contextRoutes = $derived(
	route
		? $snapshot.routes.filter(
				(candidate) =>
					candidate.id === route.id ||
					candidate.stopIds.some((stopId) => route.stopIds.includes(stopId)),
			)
		: [],
);
const stops = $derived(route ? getRouteStops($snapshot, route.id) : []);
const contextStops = $derived(
	Array.from(
		new Map(
			contextRoutes.flatMap((candidate) =>
				getRouteStops($snapshot, candidate.id).map((stop) => [stop.id, stop] as const),
			),
		).values(),
	),
);
const vehicles = $derived(route ? getRouteVehicles($snapshot, route.id) : []);
const contextVehicles = $derived(
	contextRoutes.flatMap((candidate) => getRouteVehicles($snapshot, candidate.id)),
);
const routeAlerts = $derived(
	route
		? $snapshot.alerts.filter((alert) => alert.affectedRouteIds.includes(route.id))
		: [],
);
const isSaved = $derived(route ? $favorites.includes(route.id) : false);
</script>

{#if route}
	<div class="space-y-6 lg:space-y-8">
		<section class="ds-panel motion-reveal p-5" style="--motion-reveal-delay: 0">
			<RouteChip {route} />
			<h2 class="mt-4 text-3xl font-black uppercase tracking-[0.08em] text-[var(--ink-strong)]">
				{route.longName}
			</h2>
			<p class="mt-2 text-sm text-[var(--ink)]">{route.pattern}</p>
			<div class="mt-4 grid gap-3 sm:grid-cols-3">
				<div class="ds-stat">
					<p class="section-kicker">Headway</p>
					<p class="mt-1 text-base font-semibold text-[var(--ink-strong)]">{route.headwayLabel}</p>
				</div>
				<div class="ds-stat">
					<p class="section-kicker">Service</p>
					<p class="mt-1 text-base font-semibold text-[var(--ink-strong)]">{route.serviceWindow}</p>
				</div>
				<div class="ds-stat">
					<p class="section-kicker">Vehicles</p>
					<p class="mt-1 text-base font-semibold text-[var(--ink-strong)]">{vehicles.length} live</p>
				</div>
			</div>
			<div class="mt-4 flex flex-wrap gap-2">
				<button
					aria-pressed={isSaved}
					class="ds-chip ds-chip-secondary px-4 py-2 text-xs"
					type="button"
					onclick={() => toggleFavorite(route.id)}
				>
					{isSaved ? 'Saved line' : 'Save line'}
				</button>
				{#if stops[0]}
					<a
						class="ds-chip ds-chip-secondary px-4 py-2 text-xs"
						href={`/stop/${stops[0].id}`}
					>
						Open first stop
					</a>
				{/if}
				{#if routeAlerts.length}
					<a
						class="ds-chip ds-chip-secondary px-4 py-2 text-xs"
						href="/alerts"
					>
						{routeAlerts.length} active alert{routeAlerts.length > 1 ? 's' : ''}
					</a>
				{/if}
			</div>
		</section>

		<div class="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(18rem,0.9fr)] xl:items-start">
		<section class="motion-reveal space-y-4" style="--motion-reveal-delay: 1">
			<SectionHeader
				eyebrow="Decision interface"
				title="Line map and vehicles"
			/>
			<SchematicMap
				routes={contextRoutes}
				stops={contextStops}
				vehicles={contextVehicles}
				primaryRouteId={route.id}
			/>
			<DeferredLiveMap routes={[route]} {stops} {vehicles} activeStopId={stops[0]?.id ?? null} heightClass="h-[15rem]" />
		</section>

		<section class="motion-reveal space-y-4 xl:sticky xl:top-6" style="--motion-reveal-delay: 2">
			<SectionHeader
				eyebrow="Service pattern"
				title="Stop sequence"
			/>
			{#if stops.length}
				<div class="space-y-3">
					{#each stops as stop, index (stop.id)}
						<a
							class="ds-list-item flex items-center gap-3 px-4 py-4"
							href={`/stop/${stop.id}`}
						>
							<div class="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold" style={`background:${route.color};color:${route.textColor};`}>
								{index + 1}
							</div>
							<div>
								<p class="text-sm font-semibold text-[var(--ink-strong)]">{stop.name}</p>
								<p class="text-xs uppercase tracking-[0.16em] text-[var(--ink-dim)]">{stop.neighborhood}</p>
							</div>
						</a>
					{/each}
				</div>
			{:else}
				<div class="ds-empty">
					<p class="section-kicker">Stop data unavailable</p>
					<p class="mt-2 text-sm text-[var(--ink)]">
						This line is present in the snapshot but its stop sequence is missing.
					</p>
				</div>
			{/if}
		</section>
		</div>
	</div>
{/if}
