<script lang="ts">
let { eyebrow, title, detail } = $props<{
	eyebrow: string;
	title: string;
	detail?: string;
}>();
</script>

<div class="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
	<div class="space-y-1">
		<p class="section-kicker m-0!">{eyebrow}</p>
		<h2 class="text-xl font-black tracking-tight text-(--ink-strong) uppercase sm:text-2xl">{title}</h2>
	</div>
	{#if detail}
		<p class="max-w-[32ch] text-left text-xs font-medium leading-relaxed text-(--ink-dim) opacity-60 sm:text-right">{detail}</p>
	{/if}
</div>
