# Make the 4-level risk scale retroactive + everywhere

Today the 🟢🟡🟠🔴 scale exists in code but **0 of 111 saved reports use Orange** — 13 are green, 24 red, 74 yellow (the old catch-all). Several screens also still speak the old 3-level language. This plan reclassifies the existing records and makes every surface 4-level aware.

## Part A — Reclassify the 111 existing records (Hybrid)

A one-time, admin-only backfill run in two passes. It is **monotonic**: a report's level can go up (e.g. yellow→orange) but is never silently downgraded (an existing 🔴 stays 🔴), because downgrading a life-safety placard on an already-shared report is unsafe.

**Pass 1 — Deterministic (all 111, free, instant)**
For every analyzed record, recompute the updated safety rules against its saved property + answers, then:
- `newLevel = mostSevere(oldStoredLevel, newRuleLevel)` — picks up cases the new rules now call Orange (e.g. unreinforced masonry on its own, severe shaking, high spectral demand, very-soft soil).
- Structural-damage heuristic mirroring the AI rule: if a record is still Yellow but any core structural item (foundation, walls, columns/beams, doors/windows, roof, stairs) was answered "yes", bump it to Orange — these are exactly the "a real structural element is affected" cases.
- When a record is bumped, append a short localized note to its summary ("Updated to Orange under the new 4-level scale — reported structural items need an engineer's inspection") so the wording matches the new badge.

**Pass 2 — AI re-analysis (borderline only)**
Records that are *still* Yellow after Pass 1 **and have at least one saved photo** get re-sent to the AI under the current 4-level prompt (saved answers + stored photos pulled from private storage). Their `ai_result` (summary/findings/next steps) and level are fully regenerated, then clamped monotonically against the old level. This is the accuracy boost where it matters, while keeping AI spend small.

**Safety / auditability**
- Add a nullable `prior_risk_level` column to `assessments` so each change is reversible and we can later show "previously Yellow".
- The backfill is an admin-gated server function (reusing an existing admin secret) and is idempotent (records already carrying `prior_risk_level` are skipped), so it can be re-run safely.
- I'll report the before/after distribution after it runs.

## Part B — Close every remaining 3-level content gap

Audited the codebase; these still ignore Orange and will be updated:

- **Methodology page** (`metodologia.tsx` + i18n) — add an Orange section and move the rules that now produce Orange (URM-alone, severe shaking, high spectral demand, soft soil) into it, so the public "how it works" page matches the engine.
- **Risk-factor bars** (`RiskFactorsPanel.tsx`) — add the Orange segment/count (the data already includes it).
- **Same-building card** (`SameBuildingCard.tsx`, its `building.peers` type, and the peers mapping in `assessment.functions.ts`) — surface the Orange peer count that the database already returns but the app currently drops.
- **Engineer / help-request flow** (`volunteers.functions.ts`) — add Orange to the submission schema and to the severity sort order (so Orange ranks between Red and Yellow in the engineer panel).
- **Notification email** (`help-request-notification.tsx`) — add the Orange label + color.
- **Offline provisional result** (`provisional.ts`) — a single structural-damage "yes" now yields Orange (not Yellow), matching the online logic so offline and online agree.
- **Orange share/OG image** — generate `public/og-result-orange.jpg` (only green/yellow/red exist today) and confirm it's wired into the result page's OG lookup and the share card.

Already verified as 4-level-complete (no change needed): `RiskBadge`, `RiskGauge`, `DamageMap` legend, `risk.ts`, `pdf.ts`, `share-card.ts`, the map/zona legends, and the admin/stats RPCs.

All new copy is added in Spanish (primary) and English (secondary).

## Technical details

- **Migration:** `ALTER TABLE public.assessments ADD COLUMN prior_risk_level text;` (keep existing grants/RLS).
- **Backfill server fn** (`src/lib/admin-reclassify.functions.ts`, admin-secret gated): loads analyzed rows via `supabaseAdmin`, runs Pass 1 in-process using `evaluateSafetyRules` + `maxRisk`, runs Pass 2 only for still-yellow rows with photoPaths (download from `assessment-photos`, base64, call the gateway with the existing `SYSTEM_PROMPT`), writes `risk_level`, `ai_result`, and `prior_risk_level`. Reuses helpers already in `assessment.functions.ts`/`safety-rules.ts`.
- No public RPC needs new columns — `get_*` aggregates already return `orange`; once records carry `risk_level='orange'`, the map/admin charts populate automatically.
- `building.peers` type gains `orange: number`; mapping and `SameBuildingCard` segments/legend updated to 4 colors.
- New i18n keys: `methodology.orange.*`, `building.legend.orange`, and the reclassification summary note.

### Build order
1. Migration (`prior_risk_level`).
2. Part B content/type updates (so the app renders Orange correctly).
3. Generate `og-result-orange.jpg`.
4. Run the backfill, then report the new distribution.
