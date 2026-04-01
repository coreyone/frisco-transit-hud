<script lang="ts">
import { networkState, refreshMeta } from '$lib/transit/store';
import { formatTime } from '$lib/transit/utils';
</script>

<footer class="mt-12 p-6 rounded-2xl bg-black/20 border border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
    <div class="flex flex-col items-center sm:items-start">
        <p class="text-[0.65rem] font-black tracking-[0.4em] text-white/50 m-0! leading-none uppercase">LIVE</p>
        <p class="mt-2 text-[0.55rem] font-bold text-white/20 uppercase tracking-widest leading-none">
            SFMTA • BART • CALTRAIN
        </p>
    </div>

    <div class="flex items-center gap-5">
        <div class="flex flex-col items-center sm:items-end text-center sm:text-right">
            <p class="text-[0.55rem] font-black uppercase tracking-[0.2em] text-white/30 leading-none">
                {$networkState.connected ? 'NETWORK: OK' : 'OFFLINE'}
            </p>
            <p class="mt-1.5 text-[0.6rem] font-bold text-white/50 leading-none tabular-nums">
                {$refreshMeta.lastSuccessAt ? formatTime($refreshMeta.lastSuccessAt) : 'SYNC'}
            </p>
        </div>
        <div class="relative flex h-2 w-2">
            <div class={`h-full w-full rounded-full ${$networkState.connected ? 'bg-(--signal-go) shadow-[0_0_8px_var(--signal-go)]' : 'bg-(--signal-now) shadow-[0_0_8px_var(--signal-now)]'}`}></div>
        </div>
    </div>
</footer>
