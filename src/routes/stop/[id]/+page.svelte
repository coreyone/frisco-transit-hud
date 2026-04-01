<script lang="ts">
import { page } from '$app/state';
import AlertBanner from '$lib/components/AlertBanner.svelte';
import ArrivalCard from '$lib/components/ArrivalCard.svelte';
import RouteChip from '$lib/components/RouteChip.svelte';
import SchematicMap from '$lib/components/SchematicMap.svelte';
import SectionHeader from '$lib/components/SectionHeader.svelte';
import type { Route } from '$lib/transit/types';
import { favorites, snapshot, toggleFavorite } from '$lib/transit/store';
import {
	getRouteById,
	getRouteStops,
	getRouteVehicles,
	getStopArrivals,
	groupArrivalsByDirection,
} from '$lib/transit/utils';

const stop = $derived(
	$snapshot.stops.find((candidate) => candidate.id === page.params.id),
);
const arrivals = $derived(stop ? getStopArrivals($snapshot, stop.id) : []);
const grouped = $derived(groupArrivalsByDirection(arrivals));
const alerts = $derived(
	stop
		? $snapshot.alerts.filter((alert) =>
				alert.affectedStopIds.includes(stop.id),
			)
		: [],
);
const stopRoutes = $derived(
	stop
		? stop.routes
				.map((routeId) => getRouteById($snapshot, routeId))
				.filter((route): route is Route => Boolean(route))
		: [],
);
const contextStops = $derived(
	Array.from(
		new Map(
			stopRoutes.flatMap((route) =>
				getRouteStops($snapshot, route.id).map((entry) => [entry.id, entry] as const),
			),
		).values(),
	),
);
const contextVehicles = $derived(
	stopRoutes.flatMap((route) => getRouteVehicles($snapshot, route.id)),
);
const isSaved = $derived(stop ? $favorites.includes(stop.id) : false);
</script>

{#if stop}
	<div class="space-y-8 lg:space-y-12 pb-12">
		<section class="ds-panel-strong motion-reveal flex flex-col items-start gap-4 p-8 sm:p-12 shadow-elevated" style="--motion-reveal-delay: 0">
			<div class="space-y-2">
				<p class="section-kicker m-0! opacity-60 tracking-widest uppercase">{stop.neighborhood}</p>
				<h1 class="text-4xl sm:text-5xl font-black tracking-tight text-(--ink-strong)">
					{stop.name}
				</h1>
			</div>
			
			<div class="flex flex-wrap items-center gap-6 mt-4 w-full">
				<div class="flex flex-wrap gap-2.5">
					{#each stopRoutes as route (route.id)}
						<a href={`/route/${route.id}`} class="hover:scale-110 transition-transform active:scale-95">
							<RouteChip {route} />
						</a>
					{/each}
				</div>
				<div class="h-px flex-1 bg-(--ink-dim)/10 hidden sm:block"></div>
				<button
					aria-pressed={isSaved}
					class="ds-chip ds-chip-primary px-6 py-3 text-xs font-bold uppercase tracking-widest active:scale-95 transition-all"
					type="button"
					onclick={() => toggleFavorite(stop.id)}
				>
					{isSaved ? 'Saved Stop' : 'Save Stop'}
				</button>
			</div>
		</section>

		<div class="grid gap-10 xl:grid-cols-[minmax(0,1.08fr)_minmax(18rem,0.92fr)] xl:items-start">
			<section class="motion-reveal space-y-6" style="--motion-reveal-delay: 1">
				<SectionHeader
					eyebrow="Real-time context"
					title="Nearby corridor view"
				/>
				<div class="ds-panel overflow-hidden border-none shadow-elevated">
					<SchematicMap routes={stopRoutes} stops={contextStops} vehicles={contextVehicles} activeStopId={stop.id} />
				</div>
			</section>

			<section class="motion-reveal space-y-6" style="--motion-reveal-delay: 2">
				<SectionHeader
					eyebrow="Direction clarity"
					title="By direction"
				/>
				{#if Object.entries(grouped).length}
					<div class="space-y-8">
						{#each Object.entries(grouped) as [direction, directionArrivals] (direction)}
							<div class="space-y-4">
								<div class="flex items-center justify-between px-2">
									<h3 class="text-[0.65rem] font-black uppercase tracking-[0.25em] text-(--ink-dim) opacity-70">
										{direction}
									</h3>
									<p class="text-[0.6rem] font-bold uppercase tracking-widest text-(--ink-dim) opacity-40">
										{directionArrivals[0]?.platform}
									</p>
								</div>
								<div class="space-y-4">
									{#each directionArrivals as arrival (arrival.id)}
										<ArrivalCard {arrival} href={`/route/${arrival.route.id}`} />
									{/each}
								</div>
							</div>
						{/each}
					</div>
				{:else}
					<div class="ds-empty flex flex-col items-center justify-center py-16 text-center opacity-40">
						<p class="section-kicker m-0!">No live departures</p>
					</div>
				{/if}
			</section>
		</div>

		{#if alerts.length}
			<section class="motion-reveal space-y-6" style="--motion-reveal-delay: 3">
				<SectionHeader eyebrow="Stop alerts" title="Active advisories" />
				<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
					{#each alerts as alert (alert.id)}
						<AlertBanner {alert} />
					{/each}
				</div>
			</section>
		{/if}
	</div>
{/if}
