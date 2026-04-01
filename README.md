# Frisco Transit

SvelteKit + Capacitor transit app for San Francisco, built around one core question: can the rider trust the arrival time fast enough to act?

## Stack

- SvelteKit 2 + Svelte 5 + TypeScript
- Tailwind CSS 4 for utility styling
- Capacitor 8 with iOS platform added
- Static SPA build via `@sveltejs/adapter-static`
- Bun for package management and scripts

## What ships in this pass

- Mobile-first nearby departures with large realtime countdowns
- Stop detail and route detail screens
- GO mode trip-state view
- Favorites and recent searches persisted locally
- Offline-capable app shell with cached last-known snapshot
- Capacitor wrappers for geolocation, haptics, network, local notifications, and push registration bootstrap
- Mock-first transit provider with a clean seam for live feed injection

## Commands

```sh
bun install
bun run dev
bun run check
bun run lint
bun run test
bun run build
```

## iOS

The Capacitor iOS project already exists in [`ios/App`](./ios/App).

```sh
bunx cap sync ios
bunx cap open ios
```

## Live feed handoff

This build defaults to mock data because a static Capacitor-friendly SPA and safe API-key handling are in tension. The current seam is:

- `PUBLIC_TRANSIT_DATA_MODE=mock|live`
- `PUBLIC_TRANSIT_DATA_ENDPOINT=https://...`

When `live` is enabled, the app expects the endpoint to return the `TransitSnapshot` shape defined in [`src/lib/transit/types.ts`](./src/lib/transit/types.ts). That keeps the UI stable while you decide whether to proxy 511/BART feeds through an edge function or expose public client-safe tokens.

## Core paths

- App shell: [`src/lib/components/AppShell.svelte`](./src/lib/components/AppShell.svelte)
- Home screen: [`src/routes/+page.svelte`](./src/routes/+page.svelte)
- Transit state: [`src/lib/transit/store.ts`](./src/lib/transit/store.ts)
- Mock provider: [`src/lib/transit/data.ts`](./src/lib/transit/data.ts)
- Capacitor config: [`capacitor.config.ts`](./capacitor.config.ts)

