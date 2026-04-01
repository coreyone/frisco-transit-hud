# Frisco Transit Task

## Summary

Build a San Francisco-focused web/iOS transit app using SvelteKit and Capacitor, biased toward realtime trust instead of feature sprawl. This pass delivers the mobile shell, route/stop/planner/alerts/GO-mode flows, offline and native plugin primitives, and a mock-first transit engine that can be replaced by a live feed endpoint without rewriting the UI.

## Execution Order

1. Infrastructure baseline: scaffold SvelteKit, Tailwind, tests, static SPA output, and Capacitor.
2. Mechanism layer: define transit types, mock snapshot generator, refresh loop, local persistence, and native adapters.
3. Interface layer: ship Nearby, Stop, Route, Plan, Favorites, Alerts, and GO mode.
4. Hardening loop: typecheck, lint supported surfaces, unit test utilities, E2E test the home shell, visual mobile QA, and add/sync iOS.

## Ownership Map

- Product/UX decision owner: app shell + route hierarchy + trust-first prioritization
- Data/state owner: `src/lib/transit/*`
- Native/platform owner: `src/lib/native/*`, `capacitor.config.ts`, `ios/App`
- Verification owner: `vitest`, `playwright`, build artifacts, screenshot evidence

## Control Loops

- Checkpoint 1: `bun run check`
- Checkpoint 2: `bun run lint`
- Checkpoint 3: `bun run test:unit -- --run`
- Checkpoint 4: `bun run test:e2e`
- Checkpoint 5: `bun run build`
- Checkpoint 6: mobile screenshot review at `.artifacts/frisco-home.png`
- Checkpoint 7: `bunx cap add ios && bunx cap sync ios`

## Actions

- [done] Scaffold SvelteKit + Tailwind + Playwright + Vitest + static adapter + Capacitor
- [done] Implement transit domain types, mock provider, refresh loop, cache, favorites, and GO state
- [done] Build route shell and primary transit screens
- [done] Add service worker and Capacitor native wrappers
- [done] Validate build, tests, mobile screenshot, and iOS project generation

## Evidence

- Home screenshot: `.artifacts/frisco-home.png`
- iOS project: `ios/App`
- Unit tests: `src/lib/transit/utils.spec.ts`
- E2E test: `src/routes/home.e2e.ts`

