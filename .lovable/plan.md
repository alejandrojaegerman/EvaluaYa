## Goal

Keep self-evaluation as the clear hero everywhere, but make sure the app consistently communicates the secondary truth: **we recruit, validate, and connect volunteer engineers to residents who request help.** Today that story only lives on the result page and the volunteers page, so other surfaces feel silent or slightly contradictory. This adds a short, repeated supporting thread — qualitative copy only, no live numbers — across mobile and desktop.

## The consistent message (one phrasing, reused)

A single three-beat idea used everywhere, lightly adapted per surface:
- **Reclutamos** ingenieros voluntarios y organizaciones.
- **Validamos** su experiencia antes de aprobarlos (insignia "verificado").
- **Conectamos** a residentes que lo piden con un ingeniero de su zona.

Always framed as *optional support after your self-evaluation* — never as a replacement for it.

## Surfaces to update

1. **Home (`src/routes/index.tsx`)**
   - Add one compact secondary card below the existing "How it works" / Share section: "Después de tu evaluación, puedes pedir ayuda de un ingeniero voluntario verificado" with a quiet link to `/voluntarios` (and the existing request flow on the result page). No new CTA competing with the hero "Empezar".
   - Tweak the home meta description to mention the engineer network in one clause.

2. **Methodology (`src/routes/metodologia.tsx`)**
   - Add a short "Red de ingenieros" subsection explaining recruit → validate → connect, reinforcing credibility (validation is part of why results are trustworthy). Update its meta description with one clause.

3. **Map (`src/routes/mapa.tsx`) & Data room (`src/routes/datos.tsx`)**
   - Add one short qualitative line near the existing engineer/CTA area: reports can connect residents to verified volunteer engineers in their area. Mobile shows the short line; desktop can show the slightly fuller sentence. No counts.

4. **Result / Connect (`src/components/ConnectEngineers.tsx`)**
   - Light copy alignment so the "verified / validated" language matches the rest of the app (it already connects — just harmonize wording with the new thread).

5. **Volunteers page (`src/routes/voluntarios.index.tsx`)**
   - Add an intro strip stating the three pillars (recruit/validate/connect) so the page that owns this story states it explicitly and nothing elsewhere contradicts it.

6. **Footer (`src/components/Footer.tsx`) + nav**
   - Footer "Participar" column already links Voluntarios; add a one-line descriptor under it. No structural nav change — Voluntarios already appears in desktop `TopNav` and mobile "Más", so device coverage is intact.

7. **Discovery surfaces**
   - `public/llms.txt`: add a sentence noting EvalúaYa recruits, validates and connects volunteer engineers.

## Copy / i18n

All new strings added to `src/lib/i18n.tsx` in **ES (primary)** and **EN**, reusing a small shared key group (e.g. `engineers.recruit`, `engineers.validate`, `engineers.connect`, `engineers.tagline`, plus per-surface short/long variants) so wording stays identical across screens.

## Out of scope

- No live counts or new database queries (qualitative copy only, per your choice).
- No change to the assessment flow, risk logic, or the primary self-eval CTA.
- No new routes or nav restructure.

## Technical notes

- Pure frontend + i18n work: edits to the route/component files listed above and `src/lib/i18n.tsx`, plus `public/llms.txt`.
- Responsive handling via existing Tailwind breakpoints (short line on mobile, fuller sentence on `md+`) so the thread reads well on every device.
- Typecheck after edits; no migrations, no server changes.
