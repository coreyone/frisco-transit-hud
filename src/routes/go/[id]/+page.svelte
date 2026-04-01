<script lang="ts">
import { page } from '$app/state';
import SectionHeader from '$lib/components/SectionHeader.svelte';
import {
	activeGoPlanId,
	clearActiveGoPlan,
	clock,
	schedulePlanReminder,
	setActiveGoPlan,
	snapshot,
} from '$lib/transit/store';
import {
	alphaFromRisk,
	computeGoState,
	formatTime,
	getCurrentStep,
} from '$lib/transit/utils';

const plan = $derived(
	$snapshot.itineraries.find((candidate) => candidate.id === page.params.id),
);
const goState = $derived(
	plan ? computeGoState(plan, new Date($clock).getTime()) : null,
);

$effect(() => {
	if (plan && $activeGoPlanId !== plan.id) {
		setActiveGoPlan(plan.id);
	}
});

const currentStep = $derived(
	plan && goState ? getCurrentStep(plan, goState.currentStepIndex) : null,
);
</script>

{#if plan && goState}
	<div class="space-y-6">
		<section class="ds-panel-dark motion-reveal p-5" style="--motion-reveal-delay: 0">
			<p class="section-kicker on-dark-kicker">Active trip tracking</p>
			<h2 class="mt-1 text-3xl font-black uppercase tracking-[0.08em]">{plan.destinationLabel}</h2>
			<div class="mt-5 grid gap-3 sm:grid-cols-3">
				<div class="ds-stat-dark">
					<p class="section-kicker on-dark-kicker">State</p>
					<p class="mt-1 text-base font-semibold">{goState.label}</p>
				</div>
				<div class="ds-stat-dark">
					<p class="section-kicker on-dark-kicker">Leave</p>
					<p class="mt-1 text-base font-semibold">{formatTime(plan.leaveAt)}</p>
				</div>
				<div class="ds-stat-dark">
					<p class="section-kicker on-dark-kicker">Risk</p>
					<p class="mt-1 text-base font-semibold">{alphaFromRisk(plan.transferRisk)}</p>
				</div>
			</div>

			{#if currentStep}
				<div class="ds-stat-dark mt-5">
					<p class="section-kicker on-dark-kicker">Current step</p>
					<h3 class="mt-1 text-lg font-semibold">{currentStep.title}</h3>
					<p class="mt-2 text-sm text-[var(--fog-100)]">{currentStep.description}</p>
				</div>
			{/if}

			<button
				class="ds-chip ds-chip-dark mt-5 px-4 py-2 text-xs"
				type="button"
				onclick={() => schedulePlanReminder(plan.id)}
			>
				Notify me again
			</button>
			<div class="mt-3 flex flex-wrap gap-2">
				<a
					class="ds-chip ds-chip-dark px-4 py-2 text-xs"
					href="/plan"
				>
					Back to plan options
				</a>
				<button
					class="ds-chip ds-chip-dark px-4 py-2 text-xs"
					type="button"
					onclick={clearActiveGoPlan}
				>
					End GO mode
				</button>
			</div>
		</section>

		<section class="motion-reveal space-y-4" style="--motion-reveal-delay: 1">
			<SectionHeader
				eyebrow="Step-by-step state machine"
				title="Trip timeline"
				detail="Each phase should answer what to do next."
			/>
			<div class="space-y-3">
				{#each plan.steps as step, index (step.id)}
					<div
						aria-current={index === goState.currentStepIndex ? 'step' : undefined}
						class={`rounded-[var(--radius-card)] border px-4 py-4 shadow-[var(--shadow-card)] ${
							index === goState.currentStepIndex
								? 'border-[var(--signal-now)] bg-[var(--surface-panel-strong)]'
								: 'border-[var(--stroke-soft)] bg-[var(--surface-panel)]'
						}`}
					>
						<div class="flex items-start justify-between gap-3">
							<div>
								<p class="section-kicker">{step.kind}</p>
								<h3 class="mt-1 text-sm font-semibold text-[var(--ink-strong)]">{step.title}</h3>
							</div>
							<p class="text-xs uppercase tracking-[0.16em] text-[var(--ink-dim)]">
								{formatTime(step.startTime)} → {formatTime(step.endTime)}
							</p>
						</div>
						<p class="mt-2 text-sm text-[var(--ink)]">{step.description}</p>
					</div>
				{/each}
			</div>
		</section>
	</div>
{/if}
