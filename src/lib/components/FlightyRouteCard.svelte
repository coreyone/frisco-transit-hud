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

function getEtaDisplay(arrival: ArrivalWithContext | null) {
	if (!arrival) return '--';
	if (arrival.etaSeconds <= 45) return '0';
	return Math.ceil(arrival.etaSeconds / 60);
}
</script>

{#if compact}
	<!-- RAPID SCAN MOBILE HUD (As requested by user screenshot) -->
	<div class="group relative flex items-center justify-between gap-4 bg-[#0a1b2b] p-6 border-b border-[#1a2b3b]/50 hover:bg-[#0d2236] transition-all">
		<!-- Left: Route Identity -->
		<div class="flex flex-col min-w-0">
			<span class="text-[3.25rem] font-black leading-none tracking-tighter text-[#00aaff]">
				{route.shortName}
			</span>
			<div class="mt-2 flex items-center gap-2 text-[#00aaff] font-bold text-lg leading-tight">
				<MoveRight size={18} class="shrink-0" />
				<span class="truncate">{dirA?.headsign || 'Mission District'}</span>
			</div>
			<span class="mt-1 text-[0.65rem] font-bold uppercase tracking-widest text-[#00aaff]/40 truncate">
				{nearestArrival?.stop.name || 'Nearby Stop'}
			</span>
		</div>

		<!-- Center: Contextual Status (Simulated) -->
		<div class="absolute left-1/2 top-6 -translate-x-1/2 flex gap-1 items-center opacity-40">
			<div class="h-1.5 w-1.5 rounded-full bg-[#00aaff]"></div>
			<div class="h-1.5 w-1.5 rounded-full bg-[#1a2b3b]"></div>
		</div>

		<!-- Right: Critical Telemetry (ETA) -->
		<div class="flex flex-col items-end gap-0">
			<div class="relative">
				<span class="text-[3.25rem] font-black leading-none tracking-tighter text-[#00aaff]">
					{getEtaDisplay(dirA)}
				</span>
				<Radio size={14} class="absolute -top-1 -right-4 text-[#00aaff] animate-pulse" />
			</div>
			<span class="text-[0.6rem] font-black uppercase tracking-widest text-[#00aaff]/60 mt-1">minutes</span>
		</div>
	</div>
{:else}
	<!-- Standard 'Flighty' Panel Card -->
	<div class={`group relative flex flex-col overflow-hidden transition-all duration-300 ${emphasis ? 'ds-panel-strong bg-[#0a1b2b] shadow-elevated scale-[1.01] z-10' : 'ds-panel bg-[#0a1b2b]/80 shadow-lg'}`}>
		<!-- High-Contrast Accent Bar -->
		<div 
			class="absolute top-0 left-0 h-full w-[0.4rem]" 
			style="background: {route.color || '#00aaff'}"
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
							<span class="max-w-[20ch] truncate">{nearestArrival?.stop.name || 'Nearby'}</span>
							<span class="opacity-30">•</span>
							<span>{formatDistance(nearestArrival?.distanceMeters ?? 0)}</span>
						</div>
					</div>
				</div>
				
				<Radio size={14} class="text-[#00aaff]/40 animate-pulse" />
			</div>

			<div class={`grid grid-cols-2 gap-3 ${emphasis ? 'mt-6' : 'mt-5'}`}>
				<!-- Direction A -->
				<div class="flex items-center justify-between rounded-xl bg-white/2 p-4 border border-white/5">
					<div class="space-y-0.5">
						<p class="text-[0.5rem] font-black uppercase tracking-[0.25em] text-[#00aaff]/50 truncate max-w-[10ch]">
							{directions[0]}
						</p>
						<div class="h-1 w-12 bg-[#00aaff]/10 rounded-full overflow-hidden">
							<div 
								class="h-full bg-[#00aaff]"
								style="width: {dirA ? Math.max(10, 100 - (dirA.etaSeconds / 900) * 100) : 0}%"
							></div>
						</div>
					</div>
					<div class="flex flex-col items-end">
						<span class={`font-black leading-none ${emphasis ? 'text-4xl' : 'text-3xl'} text-[#00aaff]`}>
							{getEtaDisplay(dirA)}
						</span>
						<span class="text-[0.45rem] font-black uppercase text-[#00aaff]/40 tracking-widest">Min</span>
					</div>
				</div>

				<!-- Direction B -->
				<div class="flex items-center justify-between rounded-xl bg-white/2 p-4 border border-white/5">
					<div class="space-y-0.5">
						<p class="text-[0.5rem] font-black uppercase tracking-[0.25em] text-[#00aaff]/50 truncate max-w-[10ch]">
							{directions[1]}
						</p>
						<div class="h-1 w-12 bg-[#00aaff]/10 rounded-full overflow-hidden">
							<div 
								class="h-full bg-[#00aaff]"
								style="width: {dirB ? Math.max(10, 100 - (dirB.etaSeconds / 900) * 100) : 0}%"
							></div>
						</div>
					</div>
					<div class="flex flex-col items-end">
						<span class={`font-black leading-none ${emphasis ? 'text-4xl' : 'text-3xl'} text-[#00aaff]`}>
							{getEtaDisplay(dirB)}
						</span>
						<span class="text-[0.45rem] font-black uppercase text-[#00aaff]/40 tracking-widest">Min</span>
					</div>
				</div>
			</div>

			<div class="flex items-center justify-between border-t border-[#00aaff]/10 pt-4 mt-4">
				<div class="flex items-center gap-2 text-[0.55rem] font-black uppercase tracking-[0.2em] text-[#00aaff]/30">
					Vektor Telemetry
				</div>
				<span class="text-[0.5rem] font-bold text-[#00aaff]/20">{route.agencyId.toUpperCase()}</span>
			</div>
		</div>
	</div>
{/if}
