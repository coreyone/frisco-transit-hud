# Decision Log

## Why static SPA + Capacitor

Capacitor works best when the web bundle is local, and current SvelteKit guidance recommends SPA mode for mobile wrappers. That drove:

- `adapter-static` with `fallback: '200.html'`
- `ssr = false`

This keeps the app deployable as a local static shell and avoids server dependencies in the first pass.

## Why mock-first transit data

The app needs to feel trustworthy immediately, but a static client and fragmented transit feeds create unresolved production choices:

- 511 and agency feeds vary in auth and payload formats
- GTFS-Realtime parsing and API-key handling are better done behind a proxy or edge function
- the UI should not be blocked on those backend choices

So the current seam is a `TransitSnapshot` contract plus `PUBLIC_TRANSIT_DATA_MODE` / `PUBLIC_TRANSIT_DATA_ENDPOINT`.

## Why split bundles won over a single bundle

The first mobile wrapper pass used SvelteKit's single-bundle mode because the docs note that local mobile shells can benefit from fewer requests. Once live street maps were added, that choice forced the full MapLibre payload into the startup bundle.

That was the wrong tradeoff here, so the build now uses split bundles:

- the default nearby shell stays lighter
- map code loads only when a map surface renders
- Capacitor still consumes the same static SPA build

## What was cut on purpose

- Crowding and occupancy prediction
- Payments and ticketing
- Multimodal rideshare/scooter blends
- Full production push pipeline

Local reminders and push bootstrap are in place, but production push delivery still needs native provider wiring.

## Visual direction

The app leans into a civic utility + fog-system hybrid:

- dark utility header
- fog-toned body surfaces
- cable-red urgency only where the rider should act
- large arrival numerals over ornamental detail

## IA pass on March 31, 2026

Applied checklist:

- every screen must answer where am I
- every detail screen must provide a clear way back
- every object shown should expose its related object path
- browse and search should both be first-class, not implied
- home should prioritize next action over secondary map context

Changes made:

- the app shell now exposes route-aware titles, return links, and stable utility actions
- the home screen now leads with next actions, then departures, then map context
- stop arrivals and alerts now link outward to related lines and stops instead of trapping the rider in place
- saved recent searches now reopen the planner as actionable links
- labels were aligned around `Nearby`, `Plan`, `GO`, `Alerts`, and `Saved`

Tradeoffs:

- the shell stays single-column and mobile-first, so deeper local navigation remains link-based instead of introducing a second persistent nav system
- the home screen keeps one live map, but the schematic home map was removed because it duplicated context before the rider had taken a primary action

## Design system pass on March 31, 2026

Applied checklist:

- shared roles need shared tokens
- interactive controls need consistent focus and motion rules
- cards, tiles, and list items should not reinvent radius and shadow values per screen
- empty states should use the same voice, structure, and surface treatment
- dark and light surfaces should come from the same token vocabulary

Changes made:

- added foundation tokens for surfaces, strokes, radii, spacing, focus rings, and motion
- introduced reusable CSS primitives for panels, tiles, chips, stats, list items, inputs, and empty states
- moved the main route screens and shared components onto those primitives
- added empty states to alerts, planner, favorites, route detail, stop detail, and home saved/alerts sections
- aligned dark header and GO mode surfaces to the same token family instead of one-off gradients

Tradeoffs:

- the app still uses CSS utility classes alongside the new primitives, because a full component extraction pass would be larger than this audit
- component coverage is better standardized now, but there is still no separate formal docs site or token JSON export; the source of truth is the shared CSS foundation

## Schematic map pass on March 31, 2026

Applied checklist:

- schematic clarity should beat street accuracy
- transfer decisions need to stay visible even inside a single line detail view
- route color must behave like system language, not decoration
- spacing and angles should simplify reading under motion and stress
- local context should survive through district labels, not geographic fidelity

Changes made:

- replaced the old lat/lng projection map with a fixed schematic grammar in `SchematicMap.svelte`
- introduced intentional bend points, even stop spacing, district labels, and stronger transfer-node treatment
- made the schematic map primary on home, route, and stop context sections
- updated route detail to render connector lines for intersecting services behind the primary line so transfer logic stays legible
- kept the street map as a secondary fallback instead of the default spatial model

Tradeoffs:

- the schematic currently covers the app's seeded transit graph rather than a full region-wide network, so expansion means adding more blueprint nodes instead of relying on freeform projection
- direct deep-link preview of static routes still returns 404 in `vite preview`; the rider flow works through in-app navigation, but production static fallback behavior should be tightened separately if direct entry is a requirement

## Responsive pass on March 31, 2026

Applied checklist:

- phones stay single-column and task-first
- no horizontal overflow at phone, tablet, or desktop widths
- navigation pattern can change by viewport, but content hierarchy should not
- desktop must use available width without becoming a blown-up phone mock
- tablet and desktop should surface context and secondary actions without burying the primary task

Changes made:

- rebuilt the shell so phones keep the fixed bottom tab bar while desktop gets a persistent left rail with header and navigation
- widened the outer frame and introduced desktop grid structure instead of capping the entire app at a narrow phone-width column
- split home into wider desktop groupings so quick actions, alerts, and departures can share the viewport instead of stacking forever
- moved planner input into a sticky sidebar on desktop so results stay visible while refining origin and destination
- spread favorites, route detail, and stop detail into wider layouts that preserve the phone flow but use larger viewports more efficiently

Tradeoffs:

- tablet intentionally stays closer to the mobile pattern than the desktop one, because the fixed bottom nav still works well there and keeps the cognitive model stable
- the responsive changes focus on shell and core screens first; some secondary components still rely on viewport utilities rather than container-query-specific behavior

## Pretext integration pass on March 31, 2026

Applied checklist:

- use `pretext` only where text length directly affects layout quality
- prefer constrained, high-value surfaces over broad decorative usage
- keep the integration invisible to the rider except where it improves reading

Changes made:

- added `@chenglou/pretext` as a dependency for client-side text measurement and layout
- integrated it into the schematic map stop-label renderer so long stop names are laid out with measured multiline SVG text rather than fixed single-line guesses
- tuned stop-specific label widths and added a white halo stroke so wrapped labels stay legible against route geometry

Tradeoffs:

- the measured label layout runs client-side after mount because `pretext` depends on browser text measurement primitives, so SSR falls back to the existing static label render until hydration
- the integration is intentionally limited to the schematic map for now; other UI copy still relies on standard CSS layout because those surfaces do not need manual line routing yet

## Usability pass on March 31, 2026

Applied checklist:

- every primary flow should make the next action obvious without requiring interpretation
- saved state, recommendation state, and recovery state should be explicit rather than inferred
- forms should confirm what happens after input, not leave riders guessing whether the screen reacted
- GO mode should always provide a visible way to back out or change course
- alternatives should stay available, but the interface should still recommend one best path

Changes made:

- changed stop and line save actions to reflect current state so riders see `Saved stop` and `Saved line` feedback immediately
- added planner status guidance and a post-field CTA so the planning surface explains that results update instantly and offers a direct jump to the best option
- reframed trip plans so the first itinerary is visually and verbally recommended, while fallback itineraries are grouped as alternatives
- added explicit recovery actions inside GO mode with `Back to plan options` and `End GO mode`

Tradeoffs:

- the planner still recalculates continuously instead of using a submit-driven search flow, because speed-to-answer matters more here than a traditional form model
- recommendation quality is only as strong as the current local heuristic score; once live agency data is integrated, that ranking should use realtime transfer risk and stop confidence instead of mock-only timing

## Aesthetic science pass on March 31, 2026

Applied checklist:

- visual hierarchy should behave like signal detection, not decoration
- background variance must stay below the reading layer so labels and numerals remain dominant
- high-chroma color should encode meaning, not fill space
- metrics and countdowns should read as the primary visual object on each transit card
- repeated structures should teach a stable mental model through shared grouping and consistent typography

Changes made:

- rebuilt the shared visual foundation around calmer neutrals, stronger figure-ground, and lower-noise panels in `layout.css`
- promoted transit numbers and timing into a clearer metric style using tabular numerals and stronger ETA containers in `ArrivalCard.svelte` and `ItineraryCard.svelte`
- sharpened section hierarchy and route chips so grouping explains more of the interface without extra copy
- tightened the shell and home screen so the brand, current context, trust layer, and next action feel like one coherent decision instrument rather than a stack of generic cards
- restyled alerts and planner support tiles so semantic color stays attached to meaning and not general background treatment

Tradeoffs:

- this pass focused on perceptual clarity and hierarchy rather than introducing more motion, because the product is used under stress and in motion already
- the app still mixes tokenized shared classes with some inline utility decisions, so the visual system is more coherent now but not yet fully extracted into dedicated primitives for every surface

## Code review pass on March 31, 2026

Issues fixed:

- removed a hard-coded reminder target from the home trust CTA so it now follows the current hero arrival and falls back to the matching itinerary in the snapshot
- reset planner origin and destination state from the current URL params instead of leaving stale values behind when query params are removed
- exposed pressed state on the home saved-stop toggle so it matches the route and stop detail controls

Tradeoffs:

- the planner still uses an effect to sync URL-backed inputs with local editing state, because that keeps deep links and manual typing compatible without introducing a heavier form state abstraction
- the hero reminder CTA is still heuristic-based because the snapshot does not carry a first-class relationship between arrival cards and itinerary reminders

## Web performance pass on March 31, 2026

Applied checklist:

- keep the first paint useful without requiring heavy client code
- defer expensive map code until there is clear user intent or viewport proximity
- preserve progressive enhancement so the page still degrades to readable HTML
- avoid blank content regions when JavaScript is unavailable or delayed

Changes made:

- introduced `DeferredLiveMap.svelte` to lazy-load the interactive map only when its container approaches the viewport
- replaced the eager home and route-detail live map mounts with the deferred wrapper
- added a visible static placeholder for the map region so the page still communicates context before the map code loads
- kept the schematic map as the immediate low-cost decision layer

Tradeoffs:

- the full interactive street map still weighs the same once loaded, but it no longer competes with the initial render path
- the lazy map wrapper adds a small amount of intersection-observer and dynamic-import plumbing, which is worth it for the reduced startup cost
- if we want to remove the large map chunk entirely, the next step would be a deeper split of the map runtime and style assets, but this pass kept the risk low and scoped to the current bottleneck

## TDD pass on March 31, 2026

Applied checklist:

- write a failing test before changing the performance seam
- keep the behavior under test small, deterministic, and close to the code path we care about
- prefer a pure helper over brittle component internals when that produces a cleaner long-term seam
- validate the refactor with unit coverage and the existing production build

Changes made:

- added `createDeferredLoader` in `src/lib/components/deferred-loader.ts` so lazy imports share one promise and cache the loaded module
- added `src/lib/components/deferred-loader.spec.ts` to cover deferred execution, concurrent call deduping, and cached reuse
- refactored `DeferredLiveMap.svelte` to use the shared loader helper instead of managing its own cached import promise

Tradeoffs:

- this pass focused on a small, testable seam instead of trying to unit-test browser intersection behavior directly
- the large `maplibre-gl` chunk still exists, but the load is now clearly deferred and covered by a regression test

## Design animation pass on March 31, 2026

Applied checklist:

- keep motion functional: feedback, orientation, and state change only
- use one consistent duration and easing palette across the shell
- add a single, subtle reveal pattern to major page sections instead of scattered flourish
- make reduced-motion and motion-off behavior first-class

Changes made:

- added standardized motion tokens and easing variables to `src/routes/layout.css`
- introduced a reusable `motion-reveal` class for staged section entry on the primary app pages
- applied the reveal pattern to the main screens: Nearby, Plan, Saved, Alerts, Route detail, Stop detail, and GO mode
- extended reduced-motion handling to disable the refresh spinner and page reveal animation

Tradeoffs:

- the motion system stays intentionally quiet; it improves orientation without trying to turn the app into a spectacle
- the new entry animation is limited to high-level sections, so repeated card-level interactions stay fast and predictable
- the large map chunk and lazy loader remain outside this pass; this work focused on perceived motion quality rather than bundle shape

## Web security pass on March 31, 2026

Applied checklist:

- validate every browser storage payload before hydrating app state
- restrict remote feed loading to safe, fetch-only endpoints
- avoid credential and referrer leakage on remote snapshot requests
- add browser policy metadata in the static HTML shell

Changes made:

- added `src/lib/transit/validation.ts` and tests to sanitize persisted string arrays and scalar IDs
- hardened `persistentStore` in `src/lib/transit/store.ts` so malformed `localStorage` values fall back instead of poisoning state
- validated cached snapshots before rehydrating the app from `localStorage`
- restricted remote transit snapshots in `src/lib/transit/provider.ts` to safe HTTPS/relative endpoints and used credential-less, no-referrer fetches
- added CSP, referrer policy, and permissions policy metadata in `src/app.html`

Tradeoffs:

- the CSP keeps the existing Google Fonts dependency, so the policy is restrictive but not fully self-hosted
- the app is still a client-side transit shell, so this pass hardened browser-facing trust boundaries rather than adding server-side auth or WAF controls

## CSP regression fix on March 31, 2026

Issue fixed:

- the page rendered blank because the CSP blocked SvelteKit’s inline bootstrap script, so hydration never started

Changes made:

- relaxed `script-src` in `src/app.html` to allow the framework bootstrap script (`'unsafe-inline'`) while keeping the rest of the policy intact
- removed the unsupported `frame-ancestors` meta directive from the static HTML shell

Tradeoff:

- this keeps the app usable on a static host; a stricter hash-based CSP would require build-time injection of a dynamic script hash and is not worth the complexity for this client shell
