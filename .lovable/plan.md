# EvalúaYa: drop X, double down on resilience + matching

## Part 1 — Remove the X/Twitter integration (surgical)

The X work is fully isolated — no routes, nav links, or admin panel are wired to it yet, so removal is clean and won't touch anything else built since.

Remove:
- `src/lib/social.functions.ts`, `src/lib/social-generate.server.ts`, `src/lib/x-post.server.ts`
- The `social_posts` table and the `get_weekly_insight()` database function (migration)
- Any unused `X_API_*` / `X_ACCESS_*` secrets (left in place if you prefer; they're inert once the code is gone)

Everything else stays: WhatsApp/OG social *previews* and the `og-*.jpg` share images are unrelated and keep working.

---

## Part 2 — Offline-first reliability (the killer feature for crisis use)

Today there's a guarded service worker (app shell caches) and a single in-progress draft saved to the device. The real gap: **the moment a resident finishes their checklist, submitting + AI analysis requires a live connection.** In a post-quake low-bandwidth context that's exactly when it fails.

What we'll build:

1. **Provisional result with zero network.** The deterministic safety rules (`safety-rules.ts`) already encode the hard "Red" triggers (e.g. exposed rebar, severe cracks). We surface a **provisional color-coded result immediately, offline** — so a resident always gets a safety recommendation (stay / limit use / evacuate) even with no signal. A clear banner notes "Preliminary — full analysis pending connection."

2. **Outbox queue for submissions.** When a resident finishes offline (or the submit fails), the full assessment + compressed photos are stored in an IndexedDB **outbox**. They see "Saved on your device — we'll complete the analysis automatically when you're back online." No data loss, no dead-end.

3. **Auto-sync on reconnect.** A background sync flushes the outbox when connectivity returns (using the existing online detection), uploads photos, runs AI analysis, and upgrades the provisional result to the full AI result. The user gets a non-intrusive "Your report is ready" update.

4. **Multiple saved assessments.** Move from the single-draft model to a small list so someone can assess more than one structure (their home, a relative's, a neighbor's) back-to-back without losing earlier work.

5. **Connection-aware UI.** A persistent, calm offline indicator and a "pending sync" badge so people always know the state of their reports. Bilingual (ES primary).

```text
finish checklist ──(online)──► submit + AI ──► full result
        │
        └──(offline / fails)──► provisional result (safety rules)
                                  + saved to outbox
                                       │
                              reconnect ▼
                          auto-sync ► AI ► full result ("ready")
```

---

## Part 3 — Deeper volunteer matching (closing the loop for residents)

Matching today is state-level with claim/close and contact-reveal-on-claim. We make it sharper and give residents visibility:

1. **Smarter prioritization in the engineer panel.** Order open requests **Red first**, then by municipality proximity (same municipality as the engineer's coverage ranks above same-state-only), then oldest-waiting. So the most dangerous, closest cases surface at the top.

2. **Resident-facing request status.** On the resident's saved report, show a simple status timeline: *Recibido → Un ingeniero está revisando → Atendido*. Right now a resident who asks for help has no idea anything happened. This is the single biggest trust gap.

3. **Engineer availability.** A simple available / unavailable toggle (and optional capacity) so alerts and matches only go to engineers currently able to help — fewer dead requests.

4. **Loop closure.** When an engineer closes a request, capture a lightweight outcome and reflect "Atendido" to the resident, feeding cleaner numbers into the `/mapa` and admin analytics already in place.

---

## Technical notes

- **X removal**: delete the three `*.server.ts`/`*.functions.ts` files; run one migration to `DROP TABLE public.social_posts` and `DROP FUNCTION public.get_weekly_insight()`. Types regenerate after the migration.
- **Offline**: extend `src/lib/draft-store.ts` into a drafts + outbox store (idb-keyval is already a dependency); add an outbox-flush module triggered by the `online` event and on app load; keep all heavy AI calls in existing server functions. No changes to the service-worker strategy (NetworkFirst navigations stay).
- **Photos offline**: store already-compressed blobs (the app compresses via `image-utils.ts`) in IndexedDB; upload during sync.
- **Matching**: add an `is_available` flag (+ optional capacity) and an outcome field to `volunteer_engineers` / `help_requests`; do Red-first + municipality-proximity ordering in `getEngineerPanel`; add a public-safe status read for the resident's report. All RLS-scoped; no contact info exposed pre-claim.
- Everything stays bilingual (ES primary, EN secondary) and low-bandwidth.

---

## Suggested sequencing

1. Remove X (fast, frees the surface).
2. Offline-first reliability (highest impact for residents in crisis).
3. Volunteer matching depth (prioritization + resident status first, availability + loop closure second).

I can start with Part 1 + Part 2 in the first build pass, then do Part 3.