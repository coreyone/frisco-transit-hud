<script lang="ts">
import type { Route } from '$lib/transit/types';

let { route } = $props<{ route: Route }>();
</script>

<span
	class="inline-flex items-center gap-2 rounded-(--radius-pill) border border-black/10 px-3 py-1.5 text-[0.65rem] font-extrabold uppercase tracking-[0.18em] shadow-sm transition-transform hover:scale-105 active:scale-95"
	style={`background:${route.color};color:${route.textColor};`}
>
	<span class="rounded-lg border border-black/10 bg-black/12 px-2 py-0.5 leading-none transition-colors group-hover:bg-black/20">{route.shortName}</span>
	<span class="leading-none opacity-90 font-black">{route.mode}</span>
</span>
