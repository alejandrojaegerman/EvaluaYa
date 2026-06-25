# EvalúaYa — Post-Earthquake Structural Self-Assessment PWA

A mobile-first, installable bilingual (Spanish-primary / English-secondary) app that walks a resident through a guided structural inspection after an earthquake, runs an AI photo triage, and produces a color-coded risk result with a shareable link and downloadable PDF. Works on low-bandwidth connections by capturing everything offline and syncing when back online.

## Core decisions (from your answers)
- **AI:** Lovable AI (built-in, vision model) — no API key or account needed.
- **Offline:** Full capture (property info + checklist + photos) works offline; AI analysis and save run automatically once a connection returns.
- **Records:** Each assessment gets a unique shareable link; recent ones are also kept in device history. No login.
- **Photos:** One key photo per checklist item (7 items), compressed before upload.

## User flow
```
Home (ES default, EN toggle)
  → 1. Property Info
  → 2. Guided Inspection Checklist (7 items, Yes/No/Unsure + 1 photo each)
  → 3. AI Analysis (uploads + Lovable AI triage)
  → 4. Result Card (Green / Yellow / Red + findings + next steps)
  → 5. Save & Share (shareable link, local history, PDF download)
```

## Screens

**Home** — App name, one-line purpose, a clear "Start assessment" CTA, an entry to recent local assessments, and prominent ES/EN language toggle. A short safety disclaimer (this is guidance, not an official engineering certification).

**1. Property Info** — Fields: address/neighborhood (text), building type (house / apartment / commercial), number of floors (numeric stepper), approximate age (pre-1970 / 1970–2000 / post-2000). Validated with zod, all stored on the assessment draft.

**2. Guided Inspection Checklist** — One card per item, progress indicator, each with a Yes/No/Unsure control and a single photo capture/upload (camera on mobile). Items:
1. Foundation — visible cracks or shifts?
2. Exterior walls — diagonal cracks, separation from neighbors?
3. Interior walls — cracks wider than 1cm?
4. Columns/beams — spalling concrete, exposed rebar?
5. Doors/windows — no longer open or close?
6. Roof — visible deformation or collapse?
7. Stairs — cracked or separated from walls?

Photos are compressed client-side (resize to ~1024px, JPEG quality ~0.6) before upload to keep bandwidth low. Photo is optional per item but encouraged.

**3. AI Analysis** — A progress screen that uploads photos to storage, then calls a server function which sends the answers + photo URLs to Lovable AI with a structural-triage system prompt. The model returns a structured result: overall risk (green/yellow/red), per-item findings, and recommended action. Handles rate-limit (429) and credit (402) errors with clear retry messaging.

**4. Result Card** — Large color-coded tag (🟢 Green: stay / 🟡 Yellow: limit use / 🔴 Red: evacuate immediately), plain-language summary, key findings list, and recommended next steps. Includes a reminder to contact a licensed engineer / Protección Civil for confirmation.

**5. Save & Share** — Shows the unique link (copy button + Web Share API), saves a pointer in device local history, and a "Download PDF" button that generates a one-page summary (property info, answers, risk level, findings, next steps, timestamp) suitable for showing an engineer or authorities.

## Technical implementation

**Stack:** existing TanStack Start template + Lovable Cloud (Supabase) + Lovable AI Gateway.

**Backend (enable Lovable Cloud):**
- Table `assessments` (public schema, with GRANTs):
  - `id uuid pk`, `public_id text unique` (short slug for share link), `created_at`,
  - `property` jsonb (address, building_type, floors, age),
  - `answers` jsonb (per-item yes/no/unsure + photo path),
  - `ai_result` jsonb (risk_level, summary, findings[], next_steps), `risk_level text`,
  - `status text` (draft / analyzed).
- No login: RLS with a narrow `TO anon` policy allowing INSERT and SELECT (reads scoped to lookups by `public_id`; no listing of all rows). Writes go through a server function using the publishable client so we control the shape.
- Storage bucket `assessment-photos` (public-read) for compressed photos.

**AI server function** (`src/lib/assessment.functions.ts`, `createServerFn`):
- Reads `LOVABLE_API_KEY` server-side, builds the Lovable AI Gateway provider (gemini vision model), sends photos as `image_url` blocks + the checklist answers, requests structured JSON output (risk level, findings, next steps) in the selected language.
- Persists `ai_result` to the assessment row.

**Offline / low-bandwidth (PWA, capture-then-sync):**
- Installable PWA via `vite-plugin-pwa` (`generateSW`, guarded registration wrapper — never registers in Lovable preview/iframe/dev, supports `?sw=off` kill switch) with manifest + icons.
- Draft assessment (property + answers + photos as blobs) persisted locally (IndexedDB) so the flow survives offline and reloads.
- A sync step uploads photos and runs analysis automatically once online; UI shows "waiting for connection" state when offline at the analysis step.

**Internationalization:**
- Lightweight i18n dictionary (ES + EN), Spanish default, persisted toggle. All screen copy, checklist questions, and result wording localized. AI prompt instructs the model to respond in the active language.

**PDF generation:** client-side (pdf-lib or jsPDF) one-page summary, generated on-device so it works without re-contacting the server.

**Routes:**
- `/` home, `/assess/property`, `/assess/checklist`, `/assess/analyze`, `/a/$publicId` (result + share view, public).

**Design:** mobile-first, high-contrast, large touch targets suited to a stressful post-disaster context; clear green/yellow/red semantic tokens defined in `src/styles.css`. Calm, trustworthy, utilitarian — not alarming. (I'll commit to a specific palette/type during build; say if you want to pick the look first.)

## Out of scope (can add later)
- User accounts / authenticated dashboards.
- Multi-photo per item, video, or geolocation tagging.
- Official integration with Venezuelan authorities' systems.

## Notes
- The app clearly states it provides preliminary guidance only and is not a substitute for inspection by a licensed structural engineer.