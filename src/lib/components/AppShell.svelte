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

<div class="shell-frame bg-(--surface)">
	<div class="shell-chrome">
		<header class="shell-header px-6 py-4 backdrop-blur-xl border-b border-white/5 bg-black/20">
			<div class="flex items-center justify-between gap-4">
				<div class="flex items-center gap-4">
					{#if currentMeta.backHref}
						<a
							class="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-all active:scale-95"
							href={currentMeta.backHref}
						>
							<ChevronLeft size={16} class="text-white/60" />
						</a>
					{/if}
					
					<div class="flex flex-col">
						<h1 class="text-[0.65rem] font-black uppercase tracking-[0.4em] text-white/40 leading-none">
							{currentMeta.title}
						</h1>
						{#if page.url.pathname === '/'}
							<p class="mt-1 text-[0.5rem] font-bold text-white/20 uppercase tracking-widest">SFMTA • BART • CALTRAIN</p>
						{/if}
					</div>
				</div>

				<div class="flex items-center gap-5">
					<div class="hidden sm:flex flex-col items-end">
						<p class="text-[0.5rem] font-black uppercase tracking-[0.3em] text-white/20">
							{$networkState.connected ? 'NETWORK: OK' : 'OFFLINE'}
						</p>
						<p class="mt-0.5 text-[0.6rem] font-bold text-white/40 tabular-nums">
							{$refreshMeta.lastSuccessAt ? formatTime($refreshMeta.lastSuccessAt) : 'SYNC'}
						</p>
					</div>
					<div class="relative flex h-2 w-2">
						<div class={`h-2 w-2 rounded-full ${$networkState.connected ? 'bg-(--signal-go) shadow-[0_0_8px_var(--signal-go)]' : 'bg-(--signal-now) shadow-[0_0_8px_var(--signal-now)]'}`}></div>
					</div>
				</div>
			</div>
		</header>

		<nav class="shell-nav p-1.5 bg-black/40 backdrop-blur-3xl border-t border-white/5">
			<div class="flex w-full gap-1">
				{#each tabs as tab (tab.href)}
					{@const active = isTabActive(tab.href, page.url.pathname)}
					<a
						aria-current={active ? 'page' : undefined}
						class={`flex-1 flex flex-col items-center justify-center gap-1.5 py-4 transition-all rounded-2xl ${active ? 'bg-white/5 text-white' : 'text-white/30 hover:text-white/50'}`}
						href={tab.href}
					>
						<tab.icon size={16} class={active ? 'scale-110' : ''} />
						<span class="text-[0.55rem] font-black uppercase tracking-[0.25em]">{tab.label}</span>
					</a>
				{/each}
			</div>
		</nav>
	</div>

	<main class="shell-main">
		<div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
			{@render children()}
		</div>
	</main>
</div>
