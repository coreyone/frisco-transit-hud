<script lang="ts">
import { page } from '$app/state';
import ItineraryCard from '$lib/components/ItineraryCard.svelte';
import SectionHeader from '$lib/components/SectionHeader.svelte';
import {
	recentSearches,
	recordRecentSearch,
	schedulePlanReminder,
	setActiveGoPlan,
	snapshot,
} from '$lib/transit/store';

let origin = $state(page.url.searchParams.get('from') ?? 'Powell St Station');
let destination = $state(
	page.url.searchParams.get('to') ?? 'Dolores Park',
);

$effect(() => {
	const from = page.url.searchParams.get('from');
	const to = page.url.searchParams.get('to');

	origin = from ?? 'Powell St Station';
	destination = to ?? 'Dolores Park';
});

const visiblePlans = $derived.by(() => {
	const from = origin.trim().toLowerCase();
	const to = destination.trim().toLowerCase();

	return $snapshot.itineraries.filter((plan) => {
		const matchesOrigin =
			!from || plan.originLabel.toLowerCase().includes(from);
		const matchesDestination =
			!to || plan.destinationLabel.toLowerCase().includes(to);
		return matchesOrigin && matchesDestination;
	});
});

const recommendedPlan = $derived(visiblePlans[0] ?? null);
const alternatePlans = $derived(visiblePlans.slice(1));

function activateGoMode(planId: string) {
	recordRecentSearch(`${origin} → ${destination}`);
	setActiveGoPlan(planId);
}

function swapEndpoints() {
	[origin, destination] = [destination, origin];
}
</script>

<div class="space-y-6 lg:space-y-8 xl:grid xl:grid-cols-[minmax(18rem,26rem)_minmax(0,1fr)] xl:items-start xl:gap-10 xl:space-y-0 pb-12">
	<section class="ds-panel-strong motion-reveal flex flex-col gap-6 p-8 shadow-elevated xl:sticky xl:top-6 bg-black/5 border-white/5" style="--motion-reveal-delay: 0">
		<div class="space-y-1">
			<p class="section-kicker m-0! opacity-40 uppercase tracking-[0.4em]">ROUTING ENGINE</p>
		</div>

		<div class="space-y-6">
			<div class="grid gap-4">
				<label class="grid gap-2">
					<span class="section-kicker m-0! opacity-30">ORIGIN</span>
					<input bind:value={origin} class="ds-input bg-black/20 border-white/10" />
				</label>
				<label class="grid gap-2">
					<span class="section-kicker m-0! opacity-30">DESTINATION</span>
					<input bind:value={destination} class="ds-input bg-black/20 border-white/10" />
				</label>
			</div>
			
			<div class="flex flex-wrap gap-2">
				<button
					class="ds-chip ds-chip-secondary px-8 py-3 bg-white/5 border-white/10 active:scale-95"
					type="button"
					onclick={swapEndpoints}
				>
					SWAP TRIP
				</button>
			</div>
		</div>

		{#if $recentSearches.length}
			<div class="space-y-4">
				<p class="section-kicker m-0! opacity-30">RECENTS</p>
				<div class="flex flex-wrap gap-2 text-white">
					{#each $recentSearches as search (search)}
						{@const [from = '', to = ''] = search.split('→').map((value) => value.trim())}
						<a
							class="ds-chip ds-chip-secondary px-4 py-2 text-[0.62rem] font-bold bg-white/5 border-white/5 hover:bg-white/10"
							href={`/plan?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`}
						>
							{search}
						</a>
					{/each}
				</div>
			</div>
		{/if}

		<div class="grid gap-1">
			<div class="flex items-center justify-between px-2 text-[0.55rem] font-black uppercase text-white/30 tracking-[0.3em]">
				<span>Heuristic</span>
				<span class="text-white/60">Risk Weighted</span>
			</div>
			<div class="flex items-center justify-between px-2 text-[0.55rem] font-black uppercase text-white/30 tracking-[0.3em]">
				<span>Walk Time</span>
				<span class="text-white/60">Included</span>
			</div>
		</div>
	</section>

	<section id="plan-results" class="motion-reveal space-y-6" style="--motion-reveal-delay: 1">
		{#if recommendedPlan}
			<div class="space-y-12">
				<div class="space-y-6">
					<p class="section-kicker opacity-40 ml-2">PRIMARY ITINERARY</p>
					<ItineraryCard plan={recommendedPlan} recommended />
					<div class="flex flex-wrap gap-4 px-1">
						<a
							class="ds-chip ds-chip-primary px-10 py-5 shadow-lg active:scale-95"
							href={`/go/${recommendedPlan.id}`}
							onclick={() => activateGoMode(recommendedPlan.id)}
						>
							LAUNCH GO
						</a>
						<button
							class="ds-chip ds-chip-secondary px-8 py-5 border-white/10 active:scale-95"
							type="button"
							onclick={() => schedulePlanReminder(recommendedPlan.id)}
						>
							REMIND
						</button>
					</div>
				</div>

				{#if alternatePlans.length}
					<div class="space-y-8">
						<p class="section-kicker opacity-30 ml-2">ALTERNATIVES</p>
						<div class="grid gap-12">
							{#each alternatePlans as plan (plan.id)}
								<div class="space-y-6">
									<ItineraryCard {plan} />
									<div class="flex flex-wrap gap-3 px-1">
										<a
											class="ds-chip ds-chip-primary px-8 py-4 shadow-lg active:scale-95"
											href={`/go/${plan.id}`}
											onclick={() => activateGoMode(plan.id)}
										>
											LAUNCH GO
										</a>
										<button
											class="ds-chip ds-chip-secondary px-6 py-4 border-white/10 active:scale-95"
											type="button"
											onclick={() => schedulePlanReminder(plan.id)}
										>
											REMIND
										</button>
									</div>
								</div>
							{/each}
						</div>
					</div>
				{/if}
			</div>
		{:else}
			<div class="ds-empty py-40 border-dashed opacity-40">
				<p class="section-kicker m-0!">NO MATCHING PATHS</p>
			</div>
		{/if}
	</section>
</div>
