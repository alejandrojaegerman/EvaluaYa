# Aviso legal y responsabilidad — EvalúaYa

Goal: bulletproof the app legally by adding a complete legal/liability section and surfacing short, non-intrusive versions of it where users actually make decisions — without adding friction that causes drop-off.

## What exists today

- No dedicated legal/terms route. The footer "Legal" column only has **Privacidad** + **Contacto**.
- Scattered disclaimers already exist: `disclaimer.body` (home), `result.disclaimerShort` (saved report + PDF), `help.faq.officialQ/A`, `methodology.limitsTitle` ("Límites y responsabilidad compartida"), `privacy.disclaimer`.
- Nothing currently states that volunteer engineers are **verified volunteers, unpaid, and that EvalúaYa is not responsible for their recommendations.**

## 1. New `/legal` page (`src/routes/legal.tsx`)

A bilingual "Aviso legal y responsabilidad" route (ES primary / EN secondary), styled like `privacidad.tsx` / `metodologia.tsx` (AppShell, sectioned cards, lucide icons, JSON-LD, canonical + OG meta). Sections:

1. **No reemplaza una visita oficial** — this tool and any volunteer contact do **not** replace inspection by a licensed/colegiado structural engineer, FUNVISIS, or Protección Civil.
2. **Visita técnica preliminar** — any volunteer assessment is a *preliminary, informational orientation*, not a structural certification or official report.
3. **Ingenieros voluntarios** — engineers/organizations are **verified volunteers** who participate freely; EvalúaYa **does not pay them** and they act in a personal/voluntary capacity.
4. **Limitación de responsabilidad** — EvalúaYa and its volunteers are **not liable** for recommendations given, decisions taken, or damages; the final decision and responsibility rest with the property owner/occupant and the official authorities.
5. **Emergencias** — imminent danger → evacuate and call emergency services.
6. **Contacto** — `contacto@evaluaya.app` + link to Privacidad.

## 2. Footer

Add **Aviso legal** (`/legal`) link to the footer "Legal" column (`src/components/Footer.tsx`), next to Privacidad and Contacto.

## 3. Brief disclaimers at decision points

- **Result screen** (`src/routes/assess/analyze.tsx` provisional card + `src/routes/a/$publicId.tsx` saved report): show `result.disclaimerShort` with a short "Leer aviso legal" link to `/legal`. (`/a/$publicId` already shows the short line — add the legal link.)
- **Volunteers page** (`src/routes/voluntarios.index.tsx`): add a concise note that engineers are verified, unpaid volunteers and that contact is a preliminary orientation, with a link to `/legal`.
- **Engineer connection point** (`src/components/ConnectEngineers.tsx`): brief inline note before/at the point a resident connects with a volunteer — "preliminary technical visit, not an official inspection; volunteers are unpaid and not liable" + link to `/legal`.
- **PDF export** (`src/lib/pdf.ts`): append the volunteer/liability line under the existing `result.disclaimerShort` footer so the printed summary an engineer or authority sees carries the disclaimer.

## 4. One-time acknowledgement

A lightweight, low-friction acknowledgement shown **once** (persisted in `localStorage`, following the existing device-id/draft-store pattern):

- Trigger point: at the **start of an assessment** (`assess/property`) OR at the **engineer connection point** — shown as a small inline checkbox/confirm ("Entiendo que esto es una orientación preliminar y no reemplaza una inspección oficial"), with the link to `/legal`.
- Once acknowledged, it does not reappear (no repeated interruptions → avoids drop-off).
- Recommendation: place the acknowledgement at the engineer connection step (highest legal exposure) and keep the assessment-start version purely passive. Final placement can be tuned during build.

## 5. i18n

Add new keys under both `es` and `en` blocks in `src/lib/i18n.tsx`:
- `legal.*` (title, subtitle, updated, intro, the 6 section titles/bodies, contact).
- `legal.short` (one-line volunteer/liability summary reused in result, volunteers, connect, PDF).
- `legal.ack` (acknowledgement label) + `nav.legal` / `footer.legal` link label ("Aviso legal" / "Legal notice").

## 6. SEO

Add `/legal` to `src/routes/sitemap[.]xml.ts` with appropriate priority.

---

### Technical notes

- New route follows TanStack file-based routing: `src/routes/legal.tsx` → `createFileRoute("/legal")`, with `head()` for meta/canonical/JSON-LD (Article or WebPage schema), mirroring `privacidad.tsx`.
- All copy lives in `src/lib/i18n.tsx` (ES + EN) and is read via `t()` — no hardcoded strings in components.
- Acknowledgement state stored client-side only (`localStorage`), no schema/backend changes.
- Pure frontend/presentation + content. No database, RLS, or server-function changes.
- Files touched: `src/routes/legal.tsx` (new), `src/components/Footer.tsx`, `src/routes/assess/analyze.tsx`, `src/routes/a/$publicId.tsx`, `src/routes/voluntarios.index.tsx`, `src/components/ConnectEngineers.tsx`, `src/lib/pdf.ts`, `src/lib/i18n.tsx`, `src/routes/sitemap[.]xml.ts`.

> Note: this is app-owner legal copy, not legal advice or independent certification. The wording is drafted to be informative and protective, but you should have it reviewed by a Venezuelan attorney before relying on it.