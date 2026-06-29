# Photo Evidence Tracking & Analytics

## Goal
Reliably quantify the inspection photos we've collected — overall, per checklist question, per area, and over time — and surface those counts (never the actual images) in the admin Datos tab and the public data room.

## The problem today
- Photos live only inside the `assessments.answers` JSONB, in two shapes: the current `photoPaths` (array) and a legacy `photoPath` (single string from older records).
- The only place that counts "images" reads just `photoPaths`, so legacy photos are **undercounted**.
- Nothing tracks how many photos came in **per question** (foundation, walls, columns, roof…) or **per area**, so we can't report evidence depth.
- Current data: 142 analyzed reports, 116 with photos, 164 files in storage.

## Approach
Denormalize photo counts onto each assessment so analytics are clean, fast, and shape-agnostic, then build aggregation functions and UI on top.

```text
answers JSONB (source of truth)
   │  normalize photoPaths[] + legacy photoPath
   ▼
photo_count (int)  +  photo_counts (jsonb: { foundation: 2, roof: 1, ... })
   │
   ▼
analytics RPCs ──► Admin Datos tab  +  Public /datos page
```

## 1. Schema enhancement (migration)
Add two denormalized columns to `public.assessments`:
- `photo_count` (integer, default 0) — total photos across all items.
- `photo_counts` (jsonb, default `{}`) — per checklist-item-id counts.

Backfill both from existing `answers`, counting **both** `photoPaths` entries and legacy `photoPath`, so historical records are accurate. No new table is needed; the JSONB stays the source of truth and these columns are a maintained projection.

## 2. Keep counts in sync on write
In `src/lib/assessment.functions.ts` (submit handler), after building `storedAnswers`, compute the per-item map and total and persist them to the new columns alongside the assessment. This means every new report self-maintains its counts.

## 3. Analytics functions (SECURITY DEFINER, locked down)
New/updated RPCs, all anonymized (counts only, no paths/addresses/report ids):
- `get_photo_coverage_filtered(state, municipality, from, to)` — per checklist item: total photos, # reports with a photo for that item, # reports total, coverage %.
- `get_photo_aggregates_filtered(state, municipality, from, to)` — per state/municipio: total photos, reports with photos, total reports.
- `get_photo_timeseries_filtered(state, municipality, from, to)` — photos submitted per day.
- Fix existing `get_damage_totals` / `get_damage_totals_filtered` `images` to use the accurate `photo_count` column, and add `reports_with_photos` + average photos/report.

Grants/security follow the existing pattern (public read-only aggregates exposed to the same role the other `get_damage_*` functions use; admin-only ones restricted to service_role), consistent with how the data room and admin already call these.

## 4. UI — counts only, never images
**Public data room (`/datos`):** new "Documentación fotográfica / Photo documentation" section:
- Headline cards: total photos, % of reports with at least one photo, avg photos per report.
- Per-question coverage bars (which structural elements are best documented).
- Photos-over-time mini chart, honoring the page's existing state/municipio/date filters.

**Admin Datos tab (`admin.index.tsx` / `QualityWatchdog`):** add per-question photo coverage and per-area photo totals to the quality view, so low-evidence areas/questions are visible for follow-up.

**Map/state pages:** keep using the corrected total (accurate `images`/photo count) — no new surface, just correct numbers.

## 5. Bilingual copy
Add Spanish-primary / English i18n keys for all new labels (e.g. "Fotos recibidas", "Cobertura por elemento", "Reportes con foto", "Fotos por día").

## Technical notes
- `photo_counts` keys are checklist item ids already defined in `assessment-types.ts`, so the UI can label them via existing translations.
- Backfill runs once in the migration; the write-path change keeps it current. A guard handles malformed/empty `answers`.
- No actual photos, signed URLs, or storage paths are ever returned by the analytics functions or shown in any of these surfaces.

## Out of scope
- Viewing or browsing the actual photos in analytics.
- Changing how photos are uploaded, rationed, or sent to the AI.
