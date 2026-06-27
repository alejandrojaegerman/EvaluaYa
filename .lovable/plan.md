# Optimize completion, data quality & help requests

Goal: get more Venezuelan visitors through the existing 3-step assessment, collect better data, generate more help requests, and put photos into the downloadable report — **without changing the flow or the assessment/AI/safety logic**. All work stays in presentation, copy, and the client-side PDF generator.

## 1. Property screen — reduce visual load (biggest drop-off)

The property step currently shows ~8 stacked fields at full weight, which feels heavy on mobile (86% of traffic). Same fields, same data, lighter presentation:

- Group the page into clear blocks: **Location** (state*, municipality, address) and **Building** (type, floors, age), with the structural-system selector collapsed as it already is.
- Move the two optional free-text fields (address, building name) into a single collapsible "Add more detail (optional)" disclosure so the required path is visually shorter. They stay editable and saved exactly as today.
- Tighten spacing (the form uses `space-y-7`; reduce to a calmer rhythm) and make the one required field (Estado) visually obvious so people know what's actually needed.
- Keep the geo auto-detect, ShakeMap intensity card, and all existing behavior intact.

## 2. Data-quality nudges (no new required fields, no flow change)

- **Building name nudge**: inside the optional-detail disclosure, a one-line hint explaining that the tower/building name lets neighbors' reports group together (improves same-building clustering). Wording only — field stays optional.
- **Location nudge**: a soft helper line under municipality/address explaining it powers the public damage map, encouraging (not forcing) entry.
- **Photo-on-"Yes" nudge (checklist)**: when a structural item is answered **Yes** (damage present) and has no photo yet, show a gentle inline prompt on that card ("A photo helps an engineer understand this") with the existing camera/gallery buttons. Purely a prompt; photos remain optional and submission is never blocked.

## 3. Help requests — make the engineer card more prominent (Yellow/Orange/Red)

Keep current eligibility (Green excluded). Increase conversions on the existing `ConnectEngineers` card:

- Move the "request a callback / contact an engineer" card higher on the result page, directly under the risk hero + findings, before the seismic/photos/inspection detail sections.
- Stronger headline and a clear single primary action; keep the two-tap WhatsApp consent flow and the callback form unchanged.
- Add a short reassurance line ("Free, volunteer engineers — no cost") to lower hesitation.
- No backend/logic changes to `submitHelpRequest` or eligibility rules.

## 4. Photos in the downloadable PDF

Today photos appear on the web result page but not in `downloadAssessmentPdf`. Add a photo section so the PDF a user shows an engineer/authority is complete:

- After the inspection answers, add a **"Photos / Fotos"** section that embeds the assessment photos (from `record.photoUrls`), labeled by checklist item area.
- Lay them out as a compact grid of thumbnails, adding pages as needed (`doc.addPage()` with page-break handling) so it never overflows.
- Fetch each signed URL, draw via `doc.addImage`; skip any image that fails to load so the PDF always generates. Keep everything client-side (jsPDF) as it is now.

## 5. Copy / i18n

Add the new ES (primary) + EN strings for the nudges, reassurance line, collapsible label, and PDF "Photos" heading in `src/lib/i18n.tsx`.

---

## Technical notes

- **Files touched**: `src/routes/assess/property.tsx` (grouping + collapsible optional detail), `src/routes/assess/checklist.tsx` (photo-on-Yes prompt), `src/components/ConnectEngineers.tsx` + `src/routes/a/$publicId.tsx` (reorder/emphasis), `src/lib/pdf.ts` (photo embedding), `src/lib/i18n.tsx` (strings).
- **No changes** to: draft schema, `assessment.functions.ts`, `analyzeAssessment`, safety rules, ShakeMap logic, DB schema, or the 3-step navigation.
- PDF images: jsPDF `addImage` needs raster data; fetch each signed URL to a data URL client-side before drawing, with a try/catch per image and automatic page breaks.
- The Dashlane-extension hydration warning on `/mapa` is environmental (browser extension), not addressed here.
