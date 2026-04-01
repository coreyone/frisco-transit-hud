<script lang="ts">
	import { onMount } from 'svelte';
	import type { Route, Stop, Vehicle, Coordinates } from '$lib/transit/types';

	type SchematicPoint = {
		x: number;
		y: number;
		labelDx?: number;
		labelDy?: number;
	};

	let {
		routes = [],
		stops = [],
		vehicles = [],
		activeStopId = null,
		primaryRouteId = null,
		heightClass = 'h-[24rem]',
		showLegend = true,
	}: {
		routes?: Route[];
		stops?: Stop[];
		vehicles?: Vehicle[];
		activeStopId?: string | null;
		primaryRouteId?: string | null;
		heightClass?: string;
		showLegend?: boolean;
	} = $props();

	let frame: HTMLDivElement | undefined;
	let frameWidth = $state(0);

	// Hardcoded SF Cache for consistency
	const schematicStops: Record<string, SchematicPoint> = {
		'judah-19th': { x: 12, y: 62 },
		duboce: { x: 34, y: 48 },
		powell: { x: 52, y: 30 },
		salesforce: { x: 84, y: 52 },
		'montgomery': { x: 60, y: 22 },
		embarcadero: { x: 72, y: 10 },
		'mission-16th': { x: 52, y: 58 },
		'24th-mission': { x: 52, y: 76 },
	};

	const schematicWaypoints: Record<string, SchematicPoint> = {
		'n-east': { x: 68, y: 46 },
		'rapid-east': { x: 76, y: 38 },
	};

	const routeBlueprints: Record<string, string[]> = {
		'muni-n': ['judah-19th', 'duboce', 'powell', 'n-east', 'salesforce'],
		'muni-38r': ['mission-16th', 'powell', 'montgomery', 'rapid-east', 'salesforce'],
		'bart-red': ['24th-mission', 'mission-16th', 'powell', 'montgomery', 'embarcadero'],
		'caltrain-local': ['salesforce', 'embarcadero'],
	};

	/**
	 * Compute dynamic projection with high-res stabilization.
	 */
	const bounds = $derived.by(() => {
		if (stops.length < 2) return null;
		let minLat = Infinity, maxLat = -Infinity, minLng = Infinity, maxLng = -Infinity;
		stops.forEach(s => {
			minLat = Math.min(minLat, s.lat);
			maxLat = Math.max(maxLat, s.lat);
			minLng = Math.min(minLng, s.lng);
			maxLng = Math.max(maxLng, s.lng);
		});
		
		const latRange = maxLat - minLat;
		const lngRange = maxLng - minLng;
		
		// Prevent division by zero and provide minimum zoom context
		const latPad = Math.max(latRange * 0.25, 0.005);
		const lngPad = Math.max(lngRange * 0.25, 0.005);
		
		return { 
			minLat: minLat - latPad, 
			maxLat: maxLat + latPad, 
			minLng: minLng - lngPad, 
			maxLng: maxLng + lngPad 
		};
	});

	function project(lat: number, lng: number): { x: number, y: number } {
		if (!bounds) return { x: 50, y: 50 };
		const x = ((lng - bounds.minLng) / (bounds.maxLng - bounds.minLng)) * 80 + 10;
		const y = 100 - (((lat - bounds.minLat) / (bounds.maxLat - bounds.minLat)) * 80 + 10);
		return { x, y };
	}

	function getPoint(id: string): SchematicPoint | null {
		// Priority 1: Hardcoded SF Schema
		const hardcoded = schematicStops[id] || schematicWaypoints[id];
		if (hardcoded) return hardcoded;
		
		// Priority 2: Dynamic Projection
		const stop = stops.find(s => s.id === id);
		if (stop) return project(stop.lat, stop.lng);
		
		return null;
	}

	const orderedRoutes = $derived(
		[...routes].sort((left, right) => {
			if (left.id === primaryRouteId) return 1;
			if (right.id === primaryRouteId) return -1;
			return left.shortName.localeCompare(right.shortName);
		}),
	);

	function buildRoutePath(route: Route) {
		const blueprint = routeBlueprints[route.id] ?? route.stopIds;
		return blueprint
			.map(id => getPoint(id))
			.filter((p): p is SchematicPoint => p !== null);
	}

	onMount(() => {
		if (!frame) return;
		frameWidth = frame.getBoundingClientRect().width;
	});
</script>

<div class="map-panel relative flex flex-col overflow-hidden rounded-2xl bg-black/60 border border-white/5 shadow-elevated p-6 min-h-[480px]">
	<div class="relative z-10 flex items-center justify-between gap-4 mb-4">
		<p class="section-kicker text-white/40!">SCHEMATIC NETWORK HUD</p>
		
		{#if showLegend}
			<div class="flex flex-wrap gap-1.5 justify-end">
				{#each orderedRoutes as route (route.id)}
					<div 
						class="px-2 py-0.5 rounded text-[0.5rem] font-black tracking-widest border border-white/10"
						style={`background: ${route.color}22; color: ${route.color}; border-color: ${route.color}44;`}
					>
						{route.shortName}
					</div>
				{/each}
			</div>
		{/if}
	</div>

	<div bind:this={frame} class="relative flex-1 rounded-xl bg-black/40 border border-white/5 overflow-hidden">
		<!-- Tactical Grid Overlay -->
		<div class="absolute inset-0 opacity-10 pointer-events-none" style="background-image: linear-gradient(rgba(255,255,255,.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.05) 1px, transparent 1px); background-size: 25px 25px;"></div>

		{#if stops.length > 0}
			<svg viewBox="0 0 100 100" class="w-full h-full p-6">
				<!-- Route Lines -->
				{#each orderedRoutes as route (route.id)}
					{@const points = buildRoutePath(route)}
					{#if points.length > 1}
						<polyline
							points={points.map(p => `${p.x},${p.y}`).join(' ')}
							fill="none"
							stroke={route.color}
							stroke-width="2.5"
							stroke-linecap="round"
							stroke-linejoin="round"
							opacity={primaryRouteId && route.id !== primaryRouteId ? '0.15' : '0.85'}
						/>
					{/if}
				{/each}

				<!-- Stop Markers -->
				{#each stops as stop (stop.id)}
					{@const point = getPoint(stop.id)}
					{#if point}
						<g transform={`translate(${point.x} ${point.y})`}>
							<circle
								r={activeStopId === stop.id ? '2.8' : '1.8'}
								fill={activeStopId === stop.id ? 'var(--signal-now)' : '#ffffff'}
								class={activeStopId === stop.id ? 'animate-pulse' : ''}
							/>
							<text
								x="4"
								y="1"
								font-size="2.6"
								font-weight="900"
								fill="#ffffff"
								opacity="0.6"
								class="uppercase tracking-tighter select-none pointer-events-none"
								style="text-shadow: 0 0 4px black;"
							>
								{stop.name}
							</text>
						</g>
					{/if}
				{/each}

				<!-- Live Telemetry (Vehicles) -->
				{#each vehicles as vehicle (vehicle.id)}
					{@const point = getPoint(vehicle.nextStopId)}
					{#if point}
						<circle
							cx={point.x}
							cy={point.y - 4}
							r="1.2"
							fill="var(--signal-go)"
							class="animate-ping"
						/>
					{/if}
				{/each}
			</svg>
		{:else}
			<div class="absolute inset-0 flex items-center justify-center">
				<p class="section-kicker text-white/10!">AWAITING DATA VECTOR</p>
			</div>
		{/if}
	</div>

	<div class="mt-4 flex items-center gap-6 text-[0.6rem] font-bold uppercase tracking-[0.2em] text-white/20">
		<div class="flex items-center gap-2">
			<div class="h-1.5 w-1.5 rounded-full bg-white"></div>
			<span>Node</span>
		</div>
		<div class="flex items-center gap-2">
			<div class="h-1.5 w-1.5 rounded-full bg-(--signal-now)"></div>
			<span>Target</span>
		</div>
		<div class="flex items-center gap-2">
			<div class="h-1.5 w-1.5 rounded-full bg-(--signal-go)"></div>
			<span>Active Stream</span>
		</div>
	</div>
</div>
