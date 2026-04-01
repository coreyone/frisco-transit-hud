<script lang="ts">
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';
	import type {
		GeoJSONSource,
		LngLatBoundsLike,
		Map,
		Marker,
	} from 'maplibre-gl';
	import 'maplibre-gl/dist/maplibre-gl.css';
	import type { Route, Stop, Vehicle } from '$lib/transit/types';

	type MapLibreFactory = {
		Map: typeof import('maplibre-gl').Map;
		Marker: typeof import('maplibre-gl').Marker;
		NavigationControl: typeof import('maplibre-gl').NavigationControl;
	};

	let {
		routes = [],
		stops = [],
		vehicles = [],
		heightClass = 'h-[21rem]',
		activeStopId = null,
	}: {
		routes?: Route[];
		stops?: Stop[];
		vehicles?: Vehicle[];
		heightClass?: string;
		activeStopId?: string | null;
	} = $props();

	let mapElement = $state<HTMLDivElement | null>(null);
	let map: Map | null = null;
	let maplibre: MapLibreFactory | null = null;
	let mapFailed = $state(false);
	let mapReady = $state(false);
	let stopMarkers: Marker[] = [];
	let vehicleMarkers: Marker[] = [];

	const primaryRoute = $derived(routes[0]);

	const lineGeojson = $derived({
		type: 'FeatureCollection' as const,
		features: routes
			.map((route) => {
				const routeStops = route.stopIds
					.map((stopId) => stops.find((stop) => stop.id === stopId))
					.filter((stop): stop is Stop => Boolean(stop));

				if (routeStops.length < 2) {
					return null;
				}

				return {
					type: 'Feature' as const,
					properties: {
						routeId: route.id,
						color: route.color,
						mode: route.mode,
					},
					geometry: {
						type: 'LineString' as const,
						coordinates: routeStops.map((stop) => [stop.lng, stop.lat]),
					},
				};
			})
			.filter((feature) => feature !== null),
	});

	function buildBounds(): LngLatBoundsLike | null {
		const points = [
			...stops.map((stop) => [stop.lng, stop.lat] as [number, number]),
			...vehicles.map((vehicle) => [vehicle.lng, vehicle.lat] as [number, number]),
		];

		if (!points.length) {
			return null;
		}

		const lngs = points.map(([lng]) => lng);
		const lats = points.map(([, lat]) => lat);

		return [
			[Math.min(...lngs), Math.min(...lats)],
			[Math.max(...lngs), Math.max(...lats)],
		];
	}

	function clearMarkers(markers: Marker[]) {
		for (const marker of markers) {
			marker.remove();
		}
	}

	function makeStopElement(stop: Stop) {
		const element = document.createElement('button');
		element.className =
			'frisco-stop-marker rounded-full border border-[rgba(12,28,40,0.25)] bg-[rgba(255,255,255,0.88)] text-[var(--ink-strong)] shadow';
		element.setAttribute('aria-label', stop.name);
		element.style.width = activeStopId === stop.id ? '16px' : '12px';
		element.style.height = activeStopId === stop.id ? '16px' : '12px';
		element.style.boxShadow =
			activeStopId === stop.id
				? '0 0 0 4px rgba(255,122,89,0.18)'
				: '0 8px 18px rgba(12, 28, 40, 0.16)';
		element.style.background =
			activeStopId === stop.id ? 'var(--signal-now)' : 'rgba(255,255,255,0.92)';
		return element;
	}

	function makeVehicleElement(vehicle: Vehicle) {
		const element = document.createElement('div');
		element.className = 'frisco-vehicle-marker';
		element.style.width = '14px';
		element.style.height = '14px';
		element.style.borderRadius = '999px';
		element.style.background = primaryRoute?.color ?? 'var(--signal-go)';
		element.style.border = '2px solid rgba(255,255,255,0.95)';
		element.style.boxShadow = '0 10px 24px rgba(12, 28, 40, 0.18)';
		return element;
	}

	function updateMap() {
		if (!map || !maplibre) {
			return;
		}

		const source = map.getSource('routes') as GeoJSONSource | undefined;
		if (source) {
			source.setData(lineGeojson);
		}

		const liveMap = map;
		const liveMaplibre = maplibre;

		clearMarkers(stopMarkers);
		clearMarkers(vehicleMarkers);

		stopMarkers = stops.map((stop) =>
			new liveMaplibre.Marker({ element: makeStopElement(stop), anchor: 'center' })
				.setLngLat([stop.lng, stop.lat])
				.addTo(liveMap),
		);

		vehicleMarkers = vehicles.map((vehicle) =>
			new liveMaplibre.Marker({ element: makeVehicleElement(vehicle), anchor: 'center' })
				.setLngLat([vehicle.lng, vehicle.lat])
				.addTo(liveMap),
		);

		const bounds = buildBounds();
		if (bounds) {
			map.fitBounds(bounds, {
				padding: 48,
				duration: 800,
				maxZoom: stops.length <= 2 ? 14.8 : 13.8,
			});
		}
	}

	onMount(() => {
		if (!browser || !mapElement) {
			return;
		}

		let cancelled = false;

		void (async () => {
			const module = await import('maplibre-gl');
			const maplibregl = module.default as unknown as MapLibreFactory;

			if (cancelled || !mapElement) {
				return;
			}

			try {
				maplibre = maplibregl;
					map = new maplibregl.Map({
						container: mapElement,
					style: {
						version: 8,
						sources: {
							base: {
								type: 'raster',
								tiles: [
									'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
									'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
									'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png',
								],
								tileSize: 256,
								attribution: 'OpenStreetMap',
							},
							routes: {
								type: 'geojson',
								data: lineGeojson,
							},
						},
						layers: [
							{
								id: 'base',
								type: 'raster',
								source: 'base',
							},
							{
								id: 'route-casing',
								type: 'line',
								source: 'routes',
								paint: {
									'line-color': 'rgba(12, 28, 40, 0.18)',
									'line-width': 8,
								},
							},
							{
								id: 'route-line',
								type: 'line',
								source: 'routes',
								paint: {
									'line-color': ['get', 'color'],
									'line-width': 5.5,
								},
							},
						],
					},
						interactive: true,
						attributionControl: false,
					});

				map.addControl(
					new maplibregl.NavigationControl({
						showCompass: false,
						visualizePitch: false,
					}),
					'top-right',
				);

					map.on('load', () => {
						mapReady = true;
						updateMap();
					});
				} catch (error) {
					mapFailed = true;
					console.warn('Live map unavailable, falling back gracefully', error);
				}
		})();

		return () => {
			cancelled = true;
			clearMarkers(stopMarkers);
			clearMarkers(vehicleMarkers);
			map?.remove();
		};
	});

	$effect(() => {
		if (!mapReady || !map || !maplibre) {
			return;
		}

		updateMap();
	});
</script>

<div class={`map-panel relative overflow-hidden rounded-[var(--radius-panel)] border border-[var(--stroke-soft)] shadow-[var(--shadow-card)] ${heightClass}`}>
	{#if mapFailed}
		<div class="flex h-full items-end justify-start bg-[linear-gradient(180deg,rgba(255,255,255,0.72),rgba(210,221,215,0.8))] p-5">
			<div class="max-w-56 rounded-[var(--radius-card)] bg-white/88 p-4 shadow-[var(--shadow-card)]">
				<p class="section-kicker">Map fallback</p>
				<p class="mt-2 text-sm font-semibold text-[var(--ink-strong)]">
					Street map unavailable on this device context.
				</p>
				<p class="mt-2 text-sm text-[var(--ink)]">
					The schematic view below still keeps stops, vehicles, and route shape visible.
				</p>
			</div>
		</div>
	{:else}
		<div bind:this={mapElement} class="h-full w-full"></div>
		<div class="pointer-events-none absolute left-4 top-4 rounded-[var(--radius-pill)] bg-white/88 px-3 py-2 text-[0.62rem] font-bold uppercase tracking-[0.18em] text-[var(--ink-dim)] shadow-[var(--shadow-card)]">
			Street context
		</div>
	{/if}
</div>
