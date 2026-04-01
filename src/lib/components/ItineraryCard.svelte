<script lang="ts">
import type { Itinerary } from '$lib/transit/types';
import { alphaFromRisk, formatTime } from '$lib/transit/utils';

let { plan, recommended = false } = $props<{
	plan: Itinerary;
	recommended?: boolean;
}>();
</script>

<div class={`rounded-[var(--radius-card)] border p-4 shadow-[var(--shadow-card)] ${
	recommended
		? 'border-[color:rgba(183,51,36,0.24)] bg-[linear-gradient(180deg,rgba(255,251,247,0.98),rgba(248,240,232,0.96))]'
		: 'border-[var(--stroke-soft)] bg-[var(--surface-panel-strong)]'
}`}>
	<div class="flex items-start justify-between gap-3">
		<div>
			{#if recommended}
				<p class="section-kicker text-[var(--signal-go)]">Recommended first</p>
			{/if}
			<p class="section-kicker">{plan.originLabel}</p>
			<h3 class="text-base font-semibold text-[var(--ink-strong)]">{plan.destinationLabel}</h3>
		</div>
		<div class="ds-stat text-right">
			<p class="signal-numeral text-2xl font-black leading-none">{plan.totalMinutes}</p>
			<p class="text-[0.62rem] uppercase tracking-[0.18em] text-[var(--ink-dim)]">minutes</p>
		</div>
	</div>

	<div class="mt-4 flex items-center justify-between text-xs text-[var(--ink-dim)]">
		<p>{formatTime(plan.leaveAt)} leave</p>
		<p>{formatTime(plan.arriveAt)} arrive</p>
		<p>{alphaFromRisk(plan.transferRisk)}</p>
	</div>
	<p class="mt-3 text-sm text-[var(--ink)]">
		{recommended
			? 'Best balance of total time, transfer simplicity, and leave-window confidence.'
			: 'Alternative route if your platform, transfer timing, or destination access changes.'}
	</p>

	<div class="mt-4 space-y-3">
		{#each plan.steps as step (step.id)}
			<div class="ds-tile flex gap-3 px-3 py-3">
				<div class="mt-1 h-2.5 w-2.5 rounded-full bg-[var(--signal-go)]"></div>
				<div>
					<p class="text-sm font-semibold text-[var(--ink-strong)]">{step.title}</p>
					<p class="text-sm text-[var(--ink)]">{step.description}</p>
				</div>
			</div>
		{/each}
	</div>
</div>
