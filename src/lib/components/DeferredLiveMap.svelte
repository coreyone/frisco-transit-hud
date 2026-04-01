<script lang="ts">
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';
	import { createDeferredLoader } from './deferred-loader';
	import type { Route, Stop, Vehicle } from '$lib/transit/types';

	let {
		routes = [],
		stops = [],
		vehicles = [],
		heightClass = 'h-[21rem]',
		activeStopId = null,
		title = 'Street context',
		detail = 'The street map loads only when you are close to this section.',
	}: {
		routes?: Route[];
		stops?: Stop[];
		vehicles?: Vehicle[];
		heightClass?: string;
		activeStopId?: string | null;
		title?: string;
		detail?: string;
	} = $props();

	let host = $state<HTMLDivElement | null>(null);
	let LiveMap = $state<any>(null);
	const liveMapLoader = createDeferredLoader(() => import('./LiveMap.svelte'));

	async function loadLiveMap() {
		if (LiveMap || !browser) {
			return;
		}

		const module = await liveMapLoader.load();
		LiveMap = module.default;
	}

	onMount(() => {
		if (!browser || !host) {
			return;
		}

		if (typeof IntersectionObserver === 'undefined') {
			void loadLiveMap();
			return;
		}

		const observer = new IntersectionObserver(
			(entries) => {
				const entry = entries[0];

				if (entry?.isIntersecting) {
					void loadLiveMap();
					observer.disconnect();
				}
			},
			{
				rootMargin: '240px 0px',
			},
		);

		observer.observe(host);

		return () => {
			observer.disconnect();
		};
	});
</script>

<div bind:this={host} class={`map-panel relative overflow-hidden rounded-[var(--radius-panel)] border border-[var(--stroke-soft)] shadow-[var(--shadow-card)] ${heightClass}`}>
	{#if LiveMap}
		<LiveMap {routes} {stops} {vehicles} {heightClass} {activeStopId} />
	{:else}
		<div class="flex h-full items-end justify-start bg-[linear-gradient(180deg,rgba(249,247,241,0.82),rgba(216,224,219,0.9))] p-5">
			<div class="max-w-56 rounded-[var(--radius-card)] bg-[rgba(255,252,247,0.92)] p-4 shadow-[var(--shadow-card)]">
				<p class="section-kicker">Street context</p>
				<p class="mt-2 text-sm font-semibold text-[var(--ink-strong)]">{title}</p>
				<p class="mt-2 text-sm text-[var(--ink)]">{detail}</p>
			</div>
		</div>
	{/if}
</div>
