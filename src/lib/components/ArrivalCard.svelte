<script lang="ts">
import type { ArrivalWithContext } from '$lib/transit/utils';
import { formatConfidence, formatEta, formatTime } from '$lib/transit/utils';
import RouteChip from './RouteChip.svelte';

let { arrival, emphasis = false, href = undefined } = $props<{
	arrival: ArrivalWithContext & { distanceMeters?: number };
	emphasis?: boolean;
	href?: string;
}>();

const etaTone = $derived(
	arrival.etaSeconds <= 180
		? 'bg-[var(--signal-now)] text-[var(--ink-strong)]'
		: arrival.etaSeconds <= 600
			? 'bg-[var(--signal-soon)] text-[var(--ink-strong)]'
			: 'bg-[var(--fog-200)] text-[var(--ink)]',
);
</script>

<a
	class={`flex flex-col gap-5 ds-panel p-5 transition-all hover:scale-[1.02] active:scale-[0.98] ${
		emphasis ? 'ring-2 ring-(--signal-now) shadow-elevated' : ''
	}`}
	href={href ?? `/stop/${arrival.stop.id}`}
>
	<div class="flex items-start justify-between gap-4">
		<div class="flex flex-col gap-3">
			<RouteChip route={arrival.route} />
			<div class="space-y-0.5">
				<p class="text-base font-bold tracking-tight text-(--ink-strong)">{arrival.stop.name}</p>
				<p class="text-[0.68rem] font-medium uppercase tracking-[0.2em] text-(--ink-dim) opacity-80">
					{arrival.headsign} • {arrival.direction}
				</p>
			</div>
		</div>
		<div class={`flex flex-col items-end justify-center min-w-29 rounded-(--radius-tile) border border-white/10 px-5 py-4 shadow-lg ${etaTone}`}>
			<p class="text-[0.6rem] font-extrabold uppercase tracking-[0.25em] opacity-60">
				Due in
			</p>
			<p class="signal-numeral text-[2.75rem] font-black leading-none tracking-tighter">
				{formatEta(arrival.etaSeconds).replace(' min', '')}
			</p>
			<p class="mt-1.5 text-[0.62rem] font-bold uppercase tracking-[0.22em] opacity-80">
				{arrival.isRealtime ? 'Realtime' : 'Scheduled'}
			</p>
		</div>
	</div>

	<div class="grid gap-3 sm:grid-cols-3">
		<div class="ds-tile flex flex-col gap-1 px-4 py-3 bg-white/5">
			<p class="section-kicker text-(--ink-dim)! m-0! text-[0.55rem]!">Platform</p>
			<p class="text-xs font-bold text-(--ink-strong)">{arrival.platform}</p>
		</div>
		<div class="ds-tile flex flex-col gap-1 px-4 py-3 bg-white/5">
			<p class="section-kicker text-(--ink-dim)! m-0! text-[0.55rem]!">Boarding</p>
			<p class="text-xs font-bold text-(--ink-strong)">{formatTime(arrival.realtimeTime)}</p>
		</div>
		<div class="ds-tile flex flex-col gap-1 px-4 py-3 bg-white/5">
			<p class="section-kicker text-(--ink-dim)! m-0! text-[0.55rem]!">Reliability</p>
			<p class="text-xs font-bold text-(--ink-strong)">{Math.round(arrival.confidence * 100)}%</p>
		</div>
	</div>
</a>
