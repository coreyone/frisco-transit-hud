<script lang="ts">
import AlertBanner from '$lib/components/AlertBanner.svelte';
import SectionHeader from '$lib/components/SectionHeader.svelte';
import { snapshot } from '$lib/transit/store';
</script>

<div class="space-y-6">
	<section class="ds-panel motion-reveal p-5" style="--motion-reveal-delay: 0">
		<p class="section-kicker">Interrupt-driven UX</p>
		<h2 class="mt-1 text-3xl font-black uppercase tracking-[0.08em] text-[var(--ink-strong)]">
			Service alerts
		</h2>
		<p class="mt-3 text-sm text-[var(--ink)]">
			Alerts stay concise, timestamped, and directly tied to routes or stops you can act on.
		</p>
	</section>

	<section class="motion-reveal space-y-4" style="--motion-reveal-delay: 1">
		<SectionHeader eyebrow="Current advisories" title="What changed" detail="A calm layer over fragmented agency feeds." />
		{#if $snapshot.alerts.length}
			<div class="space-y-3">
				{#each $snapshot.alerts as alert (alert.id)}
					<AlertBanner {alert} />
				{/each}
			</div>
		{:else}
			<div class="ds-empty">
				<p class="section-kicker">No active alerts</p>
				<p class="mt-2 text-sm font-semibold text-[var(--ink-strong)]">
					The network is calm right now.
				</p>
				<p class="mt-2 text-sm text-[var(--ink)]">
					Check back here when service changes need action.
				</p>
			</div>
		{/if}
	</section>
</div>
