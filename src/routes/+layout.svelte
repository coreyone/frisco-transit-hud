<script lang="ts">
import AppShell from '$lib/components/AppShell.svelte';
import './layout.css';
import favicon from '$lib/assets/favicon.svg';

let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<link rel="manifest" href="/manifest.webmanifest" />
	<meta name="theme-color" content="#b73324" />
	<meta name="apple-mobile-web-app-capable" content="yes" />
	<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
	<meta name="apple-mobile-web-app-title" content="Frisco Transit" />
</svelte:head>

<AppShell>{@render children()}</AppShell>
