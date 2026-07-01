# Exhaustive Pre-Publish Test Pass — EvalúaYa

Goal: verify the app is safe to publish by running every available automated check plus targeted live smoke tests, then report a clear go/no-go with any blockers.

## Baseline already confirmed (read-only, done in plan mode)
- Unit tests: **70/70 pass** (8 files).
- Typecheck (`tsgo --noEmit`): **clean**.
- Security scan: **no critical findings**. 3 `warn`-level items exist and were all previously reviewed as intentional/acceptable (service-role-only `api_usage_events`, private `engineer-credentials` bucket, private `funnel_events`). Publish is not blocked.
- Publish state: already published, public.

## What the test pass will run

### 1. Static / build integrity
- `bun run lint` — surface any lint errors.
- Full production build (`vite build`) — catches SSR-only breakage, unresolved imports, and Worker-incompat issues the dev server hides.
- Re-run `tsgo --noEmit` after any fix.

### 2. Unit tests (full)
- Re-run `vitest run` and confirm 70/70 still green, including the safety-rules / risk mapping tests that back the 4-level scale.

### 3. End-to-end journeys (Playwright, against local dev server)
- **Resident full journey** (`assessment.spec.ts`): property → checklist → real AI analysis → shareable `/a/:publicId` result with a risk badge.
- **Engineer panel journey** (`volunteer-panel.spec.ts`): seed volunteer → claim → progress (contacted → visited) → verdict, asserting DB state. Uses seed/teardown fixtures.
- Note: these hit the real AI + backend and seed/clean their own data.

### 4. Live smoke checks (headless browser on localhost) for surfaces not covered by e2e
- Homepage + TopNav "Más" menu and primary CTAs render.
- Key public routes load without console/runtime errors: `/`, `/voluntarios`, `/mapa`, `/guia` (+ a couple of encyclopedia leaves and breadcrumbs), `/temblo-en-venezuela-hoy`, `/zona/$estado` and a `/zona/$estado/$municipio` drilldown, `/contactos-oficiales`, `/mis-reportes`, `/metodologia`.
- Result-page consistency spot check: confirm an **orange** result renders orange styling/copy in `ConnectEngineers` + `TransparencyBanner` (the recent fix), and a **red** result still shows the SOS/severe path.
- Photo pipeline quick check on the checklist: upload validation (image-only), lightbox opens, damage-category dropdown works.
- Mobile viewport: BottomNav does not overlap the assessment Continue button.

### 5. Fix loop
- For any failure found, diagnose and apply the smallest fix in frontend/presentation or the relevant lib, then re-run the affected check. Repeat until green. No scope creep beyond making the checks pass.

## Deliverable
A concise go/no-go report: pass/fail per category, any fixes applied, and remaining known warnings (the 3 accepted security warns). If everything is green, offer to publish.

## Technical notes
- e2e and prod build are state-changing (DB seeding, build artifacts) so they run in build mode, not plan mode.
- e2e runs against `http://localhost:8080` (already running); real AI calls can take up to ~120s each.
- No functional/business-logic changes are planned — this is verification plus minimal fixes only.
