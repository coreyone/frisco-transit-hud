<script lang="ts">
import type { Route, Stop } from '$lib/transit/types';
import type { Alert } from '$lib/transit/types';
import RouteChip from '$lib/components/RouteChip.svelte';
import { snapshot } from '$lib/transit/store';
import { formatTime, getRouteById } from '$lib/transit/utils';

let { alert } = $props<{ alert: Alert }>();

const tone = $derived(
	alert.severity === 'major'
		? 'border-[var(--signal-now)] bg-[linear-gradient(180deg,rgba(255,238,232,0.92),rgba(255,247,242,0.96))]'
		: alert.severity === 'warning'
			? 'border-[var(--signal-soon)] bg-[linear-gradient(180deg,rgba(255,247,220,0.92),rgba(255,251,238,0.96))]'
			: 'border-black/10 bg-[linear-gradient(180deg,rgba(250,248,243,0.94),rgba(244,240,233,0.96))]',
);

const affectedRoutes = $derived(
	alert.affectedRouteIds
		.map((routeId: string) => getRouteById($snapshot, routeId))
		.filter((route: Route | undefined): route is Route => Boolean(route)),
);

const affectedStops = $derived(
	alert.affectedStopIds
		.map((stopId: string) => $snapshot.stops.find((stop) => stop.id === stopId))
		.filter((stop: Stop | undefined): stop is Stop => Boolean(stop)),
);
</script>

<div class={`rounded-[var(--radius-card)] border p-4 shadow-[var(--shadow-card)] ${tone}`}>
	<div class="flex items-start justify-between gap-3">
		<div>
			<p class="section-kicker signal-rule">{alert.agencyId}</p>
			<h3 class="mt-1 text-sm font-semibold text-[var(--ink-strong)]">{alert.headline}</h3>
		</div>
		<div class="text-right">
			<p class="text-[0.62rem] font-bold uppercase tracking-[0.18em] text-[var(--ink-dim)]">
				{alert.severity}
			</p>
			<p class="mt-1 text-[0.68rem] uppercase tracking-[0.18em] text-[var(--ink-dim)]">
				{formatTime(alert.updatedAt)}
			</p>
		</div>
	</div>
	<p class="mt-2 text-sm text-[var(--ink)]">{alert.detail}</p>
	{#if affectedRoutes.length || affectedStops.length}
		<div class="mt-3 flex flex-wrap gap-2">
			{#each affectedRoutes as route (route.id)}
				<a href={`/route/${route.id}`}>
					<RouteChip {route} />
				</a>
			{/each}
			{#each affectedStops as stop (stop.id)}
				<a
					class="ds-chip ds-chip-secondary px-3 py-1.5 text-[0.7rem] tracking-[0.14em]"
					href={`/stop/${stop.id}`}
				>
					{stop.name}
				</a>
			{/each}
		</div>
	{/if}
</div>
