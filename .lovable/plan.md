# Home refinements + consistent "most-affected first" pickers

## 1. Reframe the engineer connection (not a promise)
Remove the "y conéctate con un ingeniero civil voluntario" clause from the hero subtitle so it reads as a self-assessment tool, not a guaranteed service. The volunteer-engineer path stays available as a secondary option (the existing "Ingenieros voluntarios" home section and the post-report `ConnectEngineers` card).

- `src/lib/i18n.tsx`
  - ES `home.heroSubtitle` → "Revisa los daños de tu casa en minutos con una guía paso a paso." (drop the "y conéctate…" clause)
  - EN `home.heroSubtitle` → "Review your home's damage in minutes with a step-by-step guide." (drop the "and connect…" clause)

## 2. Stats block first, above Contactos oficiales (mobile)
Reorder the home layout so the live stats counters render right under the hero CTA, with the Contactos oficiales card staying where it currently is (below the stats). Contactos oficiales is not moved down further — the stats simply come first.

- `src/routes/index.tsx`: move the `hasTotals` stats `<section>` to render immediately after the hero CTA and before the Contactos oficiales link card. New above-the-fold order: Hero → Stats → Contactos oficiales → Quick actions.

## 3. Drop "alerta" from the severe-findings label
- `src/lib/i18n.tsx`
  - ES `result.red.tag`: "Hallazgos severos · alerta" → "Hallazgos severos"
  - EN `result.red.tag`: "Severe findings · alert" → "Severe findings"

This label is shared by the result card and the home stats counter, so both update together.

## 4. Most-affected areas first, everywhere a state/zone is picked
The assessment form, volunteer signup, and data room already surface most-affected areas first via impact ranking. Extend the same treatment to the two remaining state selectors that still list states plainly:

- `src/routes/index.tsx` — "Explora tu estado" Select: load impact ranking (via existing `getImpactRanking` server fn in a route loader) and render a "Zonas más afectadas" group first, then "Todas las zonas" alphabetically, using shadcn `SelectGroup`/`SelectLabel` + `splitFeatured`.
- `src/routes/mapa.tsx` — state list/select (line ~600): order featured states first using the same ranking, keeping the full inclusive list below.

Reuse existing helpers (`splitFeatured`, `getImpactRanking`, `picker.mostAffected` / `picker.allAreas` i18n keys) so behavior matches the assessment picker exactly.

## Technical notes
- `getImpactRanking` is an existing `createServerFn` (`src/lib/stats.functions.ts`) returning `{ featuredStates, featuredMunicipios }`; it's already used by `assess/property.tsx` and `voluntarios.index.tsx`.
- For `index.tsx`, add a route `loader` returning the ranking (public, anonymized) and read it with `Route.useLoaderData()`, mirroring `assess/property.tsx`. This keeps SSR-safe (no protected middleware).
- No database or business-logic changes; all edits are copy, layout, and picker ordering. Risk-level computation is untouched.

## Verification
- Typecheck + unit tests (`tests/unit/impact.test.ts` already covers ranking).
- Visual check on 390px mobile: hero subtitle shortened, stats above Contactos oficiales, severe tag reads "Hallazgos severos", and both index + mapa state pickers show the most-affected group first.
