<script lang="ts">
import { BellRing, ChevronRight, Compass, RefreshCw, TimerReset } from 'lucide-svelte';
import AlertBanner from '$lib/components/AlertBanner.svelte';
import DeferredLiveMap from '$lib/components/DeferredLiveMap.svelte';
import FlightyRouteCard from '$lib/components/FlightyRouteCard.svelte';
import RouteChip from '$lib/components/RouteChip.svelte';
import SchematicMap from '$lib/components/SchematicMap.svelte';
import SectionHeader from '$lib/components/SectionHeader.svelte';
import {
	activeGoPlan,
	favorites,
	favoriteCollections,
	nearbyArrivals,
	refreshMeta,
	snapshot,
	toggleFavorite,
} from '$lib/transit/store';
import {
	formatDistance,
	formatTime,
	getGroupedNearbyArrivals,
	getRouteStops,
	getRouteVehicles,
	groupArrivalsByDirection,
} from '$lib/transit/utils';

const groupedNearbyRoutes = $derived(getGroupedNearbyArrivals($nearbyArrivals));

const heroRoute = $derived(groupedNearbyRoutes[0]);
const secondaryRoutes = $derived(groupedNearbyRoutes.slice(1));

const focusRouteIds = $derived(
	Array.from(
		new Set($nearbyArrivals.slice(0, 8).map((arrival) => arrival.route.id)),
	),
);
const focusRoutes = $derived(
	$snapshot.routes.filter((route) => focusRouteIds.includes(route.id)),
);
const focusStops = $derived(
	Array.from(
		new Map(
			focusRoutes.flatMap((route) =>
				getRouteStops($snapshot, route.id).map(
					(stop) => [stop.id, stop] as const,
				),
			),
		).values(),
	),
);
const focusVehicles = $derived(
	focusRoutes.flatMap((route) => getRouteVehicles($snapshot, route.id)),
);
</script>

<div class="flex flex-col gap-4 lg:gap-6 pb-40">
	<!-- HIGH-DENSITY NETWORK BOARD (PRIMARY HUD) -->
	<section class="ds-panel bg-[#0a1b2b] border-[#1a2b3b] shadow-2xl overflow-visible">
		<div class="flex items-center justify-between px-6 py-4 border-b border-[#1a2b3b]">
			<div class="flex items-center gap-3">
				<div class="h-2 w-2 rounded-full bg-(--signal-go) shadow-[0_0_8px_var(--signal-go)]"></div>
				<p class="section-kicker m-0! text-[#00aaff]! tracking-[0.4em]">LIVE NEARBY VECTOR</p>
			</div>
			<div class="flex items-center gap-4 text-[0.55rem] font-black text-[#00aaff]/20 uppercase tracking-widest whitespace-nowrap">
				<span>Sync: {$refreshMeta.lastSuccessAt ? formatTime($refreshMeta.lastSuccessAt) : '--'}</span>
			</div>
		</div>

		<div class="grid">
			{#each groupedNearbyRoutes as group, i (group.route.id)}
				<div class="motion-reveal" style="--motion-reveal-delay: {i * 0.04}">
					<FlightyRouteCard 
						route={group.route} 
						arrivalsByDirection={group.arrivalsByDirection} 
						compact
						emphasis={i === 0}
					/>
				</div>
			{/each}
			
			{#if groupedNearbyRoutes.length === 0}
				<div class="p-12 flex flex-col items-center justify-center text-center opacity-30">
					<Compass size={40} class="mb-4 animate-pulse" />
					<p class="section-kicker">Searching for nearest vector...</p>
				</div>
			{/if}
		</div>
	</section>

	<!-- Infrastructure & Peripheral Context -->
	<div class="grid gap-4 lg:grid-cols-[1fr_320px] lg:items-start motion-reveal" style="--motion-reveal-delay: 0.5">
		<div class="ds-panel overflow-hidden border-none shadow-elevated bg-white/5 min-h-[440px]">
			<SchematicMap routes={focusRoutes} stops={focusStops} vehicles={focusVehicles} activeStopId={focusStops[0]?.id ?? null} />
		</div>
		
		<div class="space-y-4">
			{#if $snapshot.alerts.length}
				<div class="space-y-4">
					{#each $snapshot.alerts as alert (alert.id)}
						<AlertBanner {alert} />
					{/each}
				</div>
			{/if}

			{#if $activeGoPlan}
				<a 
					href={`/go/${$activeGoPlan.plan.id}`}
					class="ds-panel p-6 flex items-center justify-between bg-(--signal-now)/10 border-(--signal-now)/20 hover:bg-(--signal-now)/20 transition-all shadow-lg active:scale-95"
				>
					<div class="space-y-1">
						<p class="section-kicker text-(--signal-now)! m-0!">ACTIVE TRIP</p>
						<p class="text-lg font-black text-white">{$activeGoPlan.plan.destinationLabel}</p>
					</div>
					<div class="h-10 w-10 rounded-full bg-(--signal-now) flex items-center justify-center text-white shadow-lg">
						<BellRing size={20} class="animate-pulse" />
					</div>
				</a>
			{/if}

			<a 
				href="/plan"
				class="ds-panel p-6 bg-white/5 border-white/5 hover:bg-white/10 transition-all flex items-center justify-between group"
			>
				<div>
					<p class="section-kicker opacity-40">Routing</p>
					<p class="text-base font-black text-white">Trip Planner</p>
				</div>
				<ChevronRight size={18} class="text-white/20 group-hover:text-white group-hover:translate-x-1 transition-all" />
			</a>

			<div class="ds-panel p-4 bg-black/20 border-white/5 flex items-center justify-between">
				<p class="section-kicker opacity-30">Uplink: {$refreshMeta.lastSuccessAt ? formatTime($refreshMeta.lastSuccessAt) : 'Sync'}</p>
				<div class="flex h-1.5 w-1.5 rounded-full bg-(--signal-go) shadow-[0_0_8px_var(--signal-go)]"></div>
			</div>
		</div>
	</div>
</div>
