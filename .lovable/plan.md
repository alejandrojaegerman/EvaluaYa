# EvalúaYa — Feedback round (#1, #2, #3, #6, #5, #7, #8)

Built in phases by priority. Everything bilingual (ES primary / EN secondary).

## Phase 1 — Quick UX wins (#1, #2, #3, #7)

### #1 Map legend + per-pin meaning
- Add a permanent **legend** under the map in `mapa.tsx` and `zona.$estado.tsx`: one row per color with its meaning (🟢 Seguro / entrar · 🟡 Precaución, monitorea · 🟠 Necesitas un ingeniero pronto · 🔴 No entrar, evacúa).
- Repeat the color meaning inside each pin's info window in `DamageMap.tsx` (the dominant color gets a plain-language label, not just counts).

### #2 Plain language + visual ✅/❌ examples
- Rewrite the technical checklist wording in `i18n.tsx` to everyday Spanish (e.g. "cimientos" → "la base del edificio (lo que toca el suelo)"; "grietas diagonales respecto a edificios vecinos" → "el muro se está separando del edificio de al lado").
- Add an expandable **"Ver ejemplo / See example"** under each core structural question in `checklist.tsx` showing a side-by-side ✅ (sin daño) vs ❌ (con daño) illustration so the user can match what they see. Generate a compact set of labeled example images for the 7 core items (foundation, exterior walls, interior walls, columns/beams, doors/windows, roof, stairs).

### #3 Onboarding: someone can inspect on your behalf
- Add an onboarding note on `assess/property.tsx` (and the home CTA) clarifying: *you don't have to be the one inside — a relative or neighbor can do the inspection for you, and you can share the result from anywhere (a shelter, or outside the country).*
- Reinforce sharing affordance already present on the result page.

### #7 New damage vs. pre-existing damage
- Add a clear instruction at the start of the checklist: *only report NEW damage caused by the earthquake.*
- Add a third framing to the existing Yes/No/Unsure: keep the answers, but add a per-item helper "¿No sabes si es nuevo? Marca 'No estoy seguro'" so uncertainty is captured instead of contaminating "Sí".

## Phase 2 — Fourth risk level: Orange 🟠 (#6)

Split the overly broad yellow bucket into **🟡 Amarillo (monitorea, atiende X/Y/Z)** and **🟠 Naranja (necesitas un ingeniero urgente)** as a real fourth level: 🟢 → 🟡 → 🟠 → 🔴.

- AI triage prompt gains an explicit `orange` definition (moderate-to-serious damage that needs a professional inspection soon, but not obvious imminent collapse). Safety-rule severity ordering becomes green→yellow→orange→red; the strongest "force red" rules stay red, while several current "force red" or "high caution" cases land on orange.
- Recalibrate thresholds so a clean home (your Miami example) lands green, light cosmetic issues land yellow, and "get an engineer" cases land orange — reducing the yellow pile-up.
- New orange theme color, badge, gauge segment, map color, OG result image, and PDF color.
- All map/admin aggregates and drill-downs gain an orange count alongside green/yellow/red.

## Phase 3 — Resident vs. professional reports (#5)

Two report types, with **professional = an already-approved volunteer engineer** (reusing the existing approval + access-token system).

- Each assessment is tagged `resident` (default) or `professional`, and professional reports store which approved engineer verified them.
- From the engineer's private panel (`voluntarios.panel.$token.tsx`), an approved engineer can **create/verify a professional assessment**: same checklist questions plus their own professional risk call and notes. Their risk level is authoritative (not overridden by AI).
- On the **map and admin**, verified professional pins are visually distinguished from self-reports (e.g. a check-ring marker + "Verificado por ingeniero" label), and counts can be split resident vs. verified.
- Result page shows a "Verificado por un ingeniero voluntario" badge when applicable.

## Phase 4 — Distribution to shelters (#8)

The people who most need this (in a shelter, low digital context) won't find it alone → reach shelter coordinators directly.

- Add a lightweight **"Coordinadores de refugio / Para refugios"** page with: a printable one-page poster (QR to the app + 4-step plain instructions), a pre-filled WhatsApp message a coordinator can forward, and a short pitch for orgs to help residents on-site.
- Surface it from the "Más" nav and the community/invite section.

---

## Technical details

**Risk model (Phase 2) — `orange` touches:**
- `src/lib/assessment-types.ts`: `RiskLevel = "green" | "yellow" | "orange" | "red"`.
- `src/lib/risk.ts`: add `orange` to `RISK_THEME`, `RISK_HEX`, and `isRiskLevel`.
- `src/lib/safety-rules.ts`: `ORDER = ["green","yellow","orange","red"]`; add `fireOrange`; reassign rules (e.g. spalling+rebar, >7 floors + damage, severe shaking w/o collapse) to orange.
- `src/lib/assessment.functions.ts`: extend `SYSTEM_PROMPT` levels + JSON validation to accept `orange`.
- `src/styles.css`: `--risk-orange[-foreground|-soft]` tokens (light + dark) and `--color-risk-orange*` mappings.
- Components: `RiskBadge.tsx`, `RiskGauge.tsx`, `DamageMap.tsx`, `mapa.tsx` (`RiskKey`, `dominantRisk`), `zona.$estado.tsx`, `pdf.ts`.
- New OG image `public/og-result-orange.jpg` + map result lookup.

**DB migration (Phases 2 & 3):**
- `assessments`: add `report_type text NOT NULL DEFAULT 'resident'`, `verified_by_engineer uuid NULL` (references `volunteer_engineers.id`), `engineer_notes text NULL`. `risk_level` stays free text (no CHECK to alter); app + RPCs handle `orange`.
- Update RPCs to add an `orange int` column and (where useful) resident/professional split: `get_damage_aggregates`, `get_damage_totals`, `get_admin_assessment_stats`, `get_admin_top_states`, `get_admin_assessment_timeseries`, `get_risk_factors`, `get_building_peers`, `get_admin_building_clusters`, `get_admin_state_reports`. Re-pin `search_path` and keep current grants/security-definer hardening.
- New RPC/server fn for an approved engineer (validated by `access_token`) to insert a `professional` assessment and to verify/attach to an existing one.

**Stats/types:** extend `DamageTotals`, `AreaAggregate`, `RiskFactors` in `stats.functions.ts` and admin analytics types with `orange` (+ professional counts).

**Assets:** generate ✅/❌ example images for the 7 core checklist items (Phase 1 #2) and the shelter poster QR art (Phase 4).

**i18n:** new strings for legend, plain-language questions + examples, onboarding "alguien puede hacerlo por ti", new-damage instruction, the orange level (tag/action/findings), professional/verified labels, and the shelter page.

### Suggested build order
1. Phase 1 (no schema changes) — fastest visible impact.
2. Phase 2 migration + orange wiring.
3. Phase 3 migration + engineer panel pro flow + map differentiation.
4. Phase 4 shelter kit.
