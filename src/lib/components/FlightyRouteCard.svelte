<script lang="ts">
import { ChevronRight, Radio, MoveRight } from 'lucide-svelte';
import type { ArrivalWithContext } from '$lib/transit/utils';
import { formatDistance } from '$lib/transit/utils';

let { route, arrivalsByDirection, emphasis = false, compact = false } = $props<{
	route: any;
	arrivalsByDirection: Record<string, ArrivalWithContext[]>;
	emphasis?: boolean;
	compact?: boolean;
}>();

const directions = $derived(route.directionLabels || ['Inbound', 'Outbound']);

function getNext(dirIndex: number) {
	const dirName = directions[dirIndex];
	const arrivals = arrivalsByDirection[dirName] || [];
	return arrivals[0] || null;
}

const dirA = $derived(getNext(0));
const dirB = $derived(getNext(1));

const nearestArrival = $derived(
	[dirA, dirB].filter(Boolean).sort((a, b) => (a?.distanceMeters ?? 0) - (b?.distanceMeters ?? 0))[0]
);

let activeDirIdx = $state(0);
let touchStartX = 0;

function handleTouchStart(e: TouchEvent) {
	touchStartX = e.changedTouches[0].screenX;
}

function handleTouchEnd(e: TouchEvent) {
	const touchEndX = e.changedTouches[0].screenX;
	const diff = touchStartX - touchEndX;
	
	// Threshold for swipe
	if (Math.abs(diff) > 40) {
		activeDirIdx = activeDirIdx === 0 ? 1 : 0;
		if (typeof navigator !== 'undefined' && navigator.vibrate) {
			navigator.vibrate(10);
		}
	}
}

const activeArrival = $derived(getNext(activeDirIdx));

function getEtaDisplay(arrival: ArrivalWithContext | null) {
	if (!arrival) return '--';
	if (arrival.etaSeconds <= 45) return '0';
	return Math.ceil(arrival.etaSeconds / 60);
}
</script>

{#if compact}
	<!-- RAPID SCAN MOBILE HUD (As requested by user screenshot) -->
	<div 
		class="group relative flex items-center justify-between gap-4 bg-[#0a1b2b] p-6 border-b border-[#1a2b3b]/50 hover:bg-[#0d2236] transition-all overflow-hidden cursor-pointer select-none"
		role="button"
		tabindex="0"
		ontouchstart={handleTouchStart}
		ontouchend={handleTouchEnd}
		onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') activeDirIdx = activeDirIdx === 0 ? 1 : 0; }}
	>
		<!-- Left: Route Identity -->
		<div class="flex flex-col min-w-0 transition-all duration-300">
			<span class="text-[3.25rem] font-black leading-none tracking-tighter text-[#00aaff]">
				{route.shortName}
			</span>
			<div class="mt-2 flex items-center gap-2 text-[#00aaff] font-bold text-lg leading-tight">
				<MoveRight size={18} class="shrink-0" />
				<span class="truncate">{activeArrival?.headsign || directions[activeDirIdx]}</span>
			</div>
			<span class="mt-1 text-[0.65rem] font-bold uppercase tracking-widest text-[#00aaff]/40 truncate">
				{activeArrival?.stop.name || 'Nearby Stop'}
			</span>
		</div>

		<!-- Center: Contextual Status (Pagination Indicators) -->
		<div class="absolute left-1/2 bottom-4 -translate-x-1/2 flex gap-1.5 items-center">
			{#each directions as _, i}
				<div class={`h-1.5 w-1.5 rounded-full transition-all duration-300 ${activeDirIdx === i ? 'bg-[#00aaff] scale-125' : 'bg-[#1a2b3b]'}`}></div>
			{/each}
		</div>

		<!-- Right: Critical Telemetry (ETA) -->
		<div class="flex flex-col items-end gap-0 transition-all duration-300">
			<div class="relative">
				<span class="text-[3.25rem] font-black leading-none tracking-tighter text-[#00aaff]">
					{getEtaDisplay(activeArrival)}
				</span>
				<Radio size={14} class="absolute -top-1 -right-4 text-[#00aaff] animate-pulse" />
			</div>
			<span class="text-[0.6rem] font-black uppercase tracking-widest text-[#00aaff]/60 mt-1">minutes</span>
		</div>
	</div>
{:else}
	<!-- Standard 'Flighty' Panel Card -->
	<div 
		class={`group relative flex flex-col overflow-hidden transition-all duration-300 cursor-pointer select-none touch-pan-y ${emphasis ? 'ds-panel-strong bg-[#0a1b2b] shadow-elevated scale-[1.01] z-10' : 'ds-panel bg-[#0a1b2b]/80 shadow-lg'}`}
		role="button"
		tabindex="0"
		ontouchstart={handleTouchStart}
		ontouchend={handleTouchEnd}
		onclick={() => { activeDirIdx = activeDirIdx === 0 ? 1 : 0; }}
		onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') activeDirIdx = activeDirIdx === 0 ? 1 : 0; }}
	>
		<!-- High-Contrast Accent Bar -->
		<div 
			class="absolute top-0 left-0 h-full w-[0.4rem] transition-all duration-500" 
			style="background: {route.color || '#00aaff'}; opacity: {activeArrival ? 1 : 0.3}"
		></div>

		<div class={`flex flex-col ${emphasis ? 'p-8 pt-10' : 'p-6'}`}>
			<div class="flex items-start justify-between gap-4">
				<div class="flex items-center gap-5">
					<div 
						class={`flex items-center justify-center font-black shadow-2xl transition-all ${emphasis ? 'h-20 w-20 rounded-2xl text-3xl' : 'h-14 w-14 rounded-xl text-xl'}`}
						style="background: {route.color || '#00aaff'}; color: {route.textColor || '#000000'}"
					>
						{route.shortName}
					</div>
					<div class="space-y-1">
						<h3 class={`font-black tracking-tight text-[#00aaff] line-clamp-1 ${emphasis ? 'text-xl' : 'text-lg'}`}>
							{route.longName.split(' - ')[0]}
						</h3>
						<div class="flex items-center gap-2 text-[0.55rem] font-bold uppercase tracking-[0.2em] text-[#00aaff]/40">
							<span class="max-w-[20ch] truncate">{activeArrival?.stop.name || 'Nearby'}</span>
							<span class="opacity-30">•</span>
							<span>{formatDistance(activeArrival?.distanceMeters ?? 0)}</span>
						</div>
					</div>
				</div>
				
				<div class="flex flex-col items-end gap-1">
					<Radio size={14} class="text-[#00aaff]/40 animate-pulse" />
					<div class="flex gap-1.5">
						{#each directions as _, i}
							<div class={`h-1 w-2 rounded-full transition-all duration-300 ${activeDirIdx === i ? 'bg-[#00aaff] w-4 opacity-100' : 'bg-white/10 opacity-30'}`}></div>
						{/each}
					</div>
				</div>
			</div>

			<!-- Regional Vector Grid (Side-by-side on desktop, Single focus with swipe on mobile) -->
			<div class="mt-6 space-y-4 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-4">
				<!-- Direction A (Mobile: Focus 0, Desktop: Always visible) -->
				<div class={`relative flex items-center justify-between rounded-2xl bg-white/5 p-5 border border-white/5 transition-all duration-300 ${activeDirIdx === 0 ? 'opacity-100 scale-100' : 'opacity-40 scale-95 sm:opacity-100 sm:scale-100'}`}>
					<div class="space-y-1 flex-1 min-w-0">
						<p class="text-[0.55rem] font-black uppercase tracking-[0.3em] text-[#00aaff]/60 flex items-center gap-2">
							<MoveRight size={9} />
							{directions[0]}
						</p>
						<h4 class="text-base font-black text-white truncate pr-4">
							{arrivalsByDirection[directions[0]]?.[0]?.headsign || 'Seeking...'}
						</h4>
						<div class="h-1 w-16 bg-[#00aaff]/10 rounded-full overflow-hidden mt-3">
							<div 
								class="h-full bg-[#00aaff] transition-all duration-1000"
								style="width: {arrivalsByDirection[directions[0]]?.[0] ? Math.min(100, Math.max(10, 100 - (arrivalsByDirection[directions[0]][0].etaSeconds / 1800) * 100)) : 0}%"
							></div>
						</div>
					</div>
					<div class="flex flex-col items-end">
						<span class={`font-black leading-none ${emphasis ? 'text-4xl' : 'text-3xl'} text-[#00aaff] tracking-tighter tabular-nums`}>
							{getEtaDisplay(arrivalsByDirection[directions[0]]?.[0] || null)}
						</span>
						<span class="text-[0.5rem] font-black uppercase text-[#00aaff]/40 tracking-widest mt-1">Min</span>
					</div>
				</div>

				<!-- Direction B (Mobile: Focus 1, Desktop: Always visible) -->
				<div class={`relative flex items-center justify-between rounded-2xl bg-white/5 p-5 border border-white/5 transition-all duration-300 ${activeDirIdx === 1 ? 'opacity-100 scale-100' : 'opacity-40 scale-95 sm:opacity-100 sm:scale-100'}`}>
					<div class="space-y-1 flex-1 min-w-0">
						<p class="text-[0.55rem] font-black uppercase tracking-[0.3em] text-[#00aaff]/60 flex items-center gap-2">
							<MoveRight size={9} />
							{directions[1]}
						</p>
						<h4 class="text-base font-black text-white truncate pr-4">
							{arrivalsByDirection[directions[1]]?.[0]?.headsign || 'Seeking...'}
						</h4>
						<div class="h-1 w-16 bg-[#00aaff]/10 rounded-full overflow-hidden mt-3">
							<div 
								class="h-full bg-[#00aaff] transition-all duration-1000"
								style="width: {arrivalsByDirection[directions[1]]?.[0] ? Math.min(100, Math.max(10, 100 - (arrivalsByDirection[directions[1]][0].etaSeconds / 1800) * 100)) : 0}%"
							></div>
						</div>
					</div>
					<div class="flex flex-col items-end">
						<span class={`font-black leading-none ${emphasis ? 'text-4xl' : 'text-3xl'} text-[#00aaff] tracking-tighter tabular-nums`}>
							{getEtaDisplay(arrivalsByDirection[directions[1]]?.[0] || null)}
						</span>
						<span class="text-[0.5rem] font-black uppercase text-[#00aaff]/40 tracking-widest mt-1">Min</span>
					</div>
				</div>
			</div>

			<div class="flex items-center justify-between border-t border-[#00aaff]/10 pt-4 mt-6">
				<div class="flex items-center gap-2 text-[0.55rem] font-black uppercase tracking-[0.2em] text-[#00aaff]/30">
					Vektor Telemetry: <span class="text-white/20 uppercase">{activeArrival ? 'Live' : 'Seek'}</span>
				</div>
				<span class="text-[0.5rem] font-bold text-[#00aaff]/20 uppercase tracking-widest">{route.agencyId}</span>
			</div>
		</div>
	</div>
{/if}
