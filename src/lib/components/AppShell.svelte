<script lang="ts">
import { onMount } from 'svelte';
import { page } from '$app/state';
import {
	Bell,
	ChevronLeft,
	Compass,
	MapPinned,
	Navigation,
	Route,
	Star,
} from 'lucide-svelte';
import {
	activeGoPlan,
	initializeTransit,
	networkState,
	refreshMeta,
} from '$lib/transit/store';
import { formatTime } from '$lib/transit/utils';

let { children } = $props();

const tabs = [
	{ href: '/', label: 'Nearby', icon: Compass },
	{ href: '/plan', label: 'Plan', icon: Route },
	{ href: '/alerts', label: 'Alerts', icon: Bell },
	{ href: '/favorites', label: 'Saved', icon: Star },
];

type PageMeta = {
	title: string;
	backHref?: string;
	backLabel?: string;
};

function isTabActive(href: string, pathname: string) {
	if (href === '/') {
		return pathname === '/';
	}

	return pathname === href || pathname.startsWith(`${href}/`);
}

function getPageMeta(pathname: string): PageMeta {
	if (pathname.startsWith('/route/')) {
		return {
			title: 'Line',
			backHref: '/',
			backLabel: 'Nearby',
		};
	}

	if (pathname.startsWith('/stop/')) {
		return {
			title: 'Stop',
			backHref: '/',
			backLabel: 'Nearby',
		};
	}

	if (pathname.startsWith('/go/')) {
		return {
			title: 'GO',
			backHref: '/plan',
			backLabel: 'Plan',
		};
	}

	if (pathname === '/plan') {
		return {
			title: 'Plan',
		};
	}

	if (pathname === '/alerts') {
		return {
			title: 'Alerts',
		};
	}

	if (pathname === '/favorites') {
		return {
			title: 'Saved',
		};
	}

	return {
		title: 'LIVE',
	};
}

const currentMeta = $derived(getPageMeta(page.url.pathname));

onMount(() => {
	void initializeTransit();
});
</script>

<svelte:head>
	<title>{currentMeta.title} · Frisco Transit</title>
</svelte:head>

<div class="shell-frame bg-(--surface) flex flex-col h-screen overflow-hidden">
	<!-- Top Bar (Back Button only if needed) -->
	{#if currentMeta.backHref}
		<div class="absolute top-4 left-4 z-40">
			<a
				class="flex h-10 w-10 items-center justify-center rounded-full bg-black/40 backdrop-blur-xl border border-white/10 hover:bg-black/60 transition-all active:scale-95 shadow-xl"
				href={currentMeta.backHref}
			>
				<ChevronLeft size={20} class="text-white" />
			</a>
		</div>
	{/if}

	<main class="shell-main flex-1 overflow-y-auto scrollbar-hide">
		<div class="mx-auto max-w-7xl px-4 pt-4 pb-48 sm:px-6 lg:px-8">
			{@render children()}
		</div>
	</main>

	<!-- Persistent Control & Status Layer (CHROME) -->
	<div class="shell-chrome fixed bottom-0 left-0 right-0 z-50 flex flex-col pointer-events-none">
		<!-- TAB NAVIGATION -->
		<nav class="p-1.5 bg-black/60 backdrop-blur-3xl border-t border-white/5 pointer-events-auto">
			<div class="flex w-full gap-1">
				{#each tabs as tab (tab.href)}
					{@const active = isTabActive(tab.href, page.url.pathname)}
					<a
						aria-current={active ? 'page' : undefined}
						class={`flex-1 flex flex-col items-center justify-center gap-1 py-3 transition-all rounded-xl ${active ? 'bg-white/10 text-white shadow-inner' : 'text-white/30 hover:text-white/50'}`}
						href={tab.href}
					>
						<tab.icon size={18} class={active ? 'scale-110' : ''} />
						<span class="text-[0.5rem] font-black uppercase tracking-[0.25em]">{tab.label}</span>
					</a>
				{/each}
			</div>
		</nav>

		<!-- VECTOR NETWORK FOOTER (As requested) -->
		<footer class="p-3 pb-safe bg-[#050b14] border-t border-white/5 flex items-center justify-between pointer-events-auto">
			<div class="flex items-center gap-3">
				<div class="flex flex-col">
					<p class="text-[0.6rem] font-black tracking-[0.2em] text-white/50 m-0! leading-none">LIVE</p>
					<p class="mt-1 text-[0.45rem] font-bold text-white/20 uppercase tracking-widest leading-none">
						SFMTA • BART • CALTRAIN
					</p>
				</div>
			</div>

			<div class="flex items-center gap-4 text-right">
				<div class="flex flex-col items-end">
					<p class="text-[0.5rem] font-black uppercase tracking-[0.2em] text-white/30 leading-none">
						{$networkState.connected ? 'NETWORK: OK' : 'OFFLINE'}
					</p>
					<p class="mt-1 text-[0.55rem] font-bold text-white/50 leading-none tabular-nums">
						{$refreshMeta.lastSuccessAt ? formatTime($refreshMeta.lastSuccessAt) : 'SYNC'}
					</p>
				</div>
				<div class="relative flex h-1.5 w-1.5">
					<div class={`h-full w-full rounded-full ${$networkState.connected ? 'bg-(--signal-go) shadow-[0_0_8px_var(--signal-go)]' : 'bg-(--signal-now) shadow-[0_0_8px_var(--signal-now)]'}`}></div>
				</div>
			</div>
		</footer>
	</div>
</div>
