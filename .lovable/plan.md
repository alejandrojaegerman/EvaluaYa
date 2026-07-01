## Problem

The published methodology uses a **4-level severity scale**, each with its own label and recommended action (`src/lib/i18n.tsx:404-411`):

- 🟢 **green** — "Hallazgos leves" → mantén observación
- 🟡 **yellow** — "Hallazgos moderados" → solicita inspección técnica
- 🟠 **orange** — "Hallazgos serios" → solicita pronto una inspección técnica
- 🔴 **red** — "Hallazgos severos · alerta" → evita ingresar y reporta a cuerpos oficiales

But some result-screen components collapse this into a binary (red = orange), so an **orange** report gets shown with **red** copy and red styling. That is exactly what the user saw: an orange assessment whose "contact a volunteer engineer" block said its findings were severe (red).

### Root causes found

1. **`src/components/ConnectEngineers.tsx:28`** — `const urgent = record.riskLevel === "red" || record.riskLevel === "orange"`. When `urgent`, it renders red border/background (line 91), a red icon (line 100), and the copy `connect.subtitleRed` = *"Tus hallazgos son severos…"* (line 109). So orange is visually and textually presented as red/severe. This is the direct source of the reported mismatch.

2. **`src/components/TransparencyBanner.tsx:15`** — same `urgent = red || orange`, which shows the emergency `SosCard` (911 / "avoid entering") on orange too. Per the methodology, the "avoid entering, report to official agencies / call emergency" response belongs to **red** only; orange is "get an engineer soon", not evacuate. So orange is again escalated to red-level messaging.

Components that already handle all 4 levels correctly (no change needed): `RiskBadge`, `RiskGauge`, `RiskTag`/`AdminRequestCards`, `EngineerRequestCard`, `TrendChart`, `DamageMap`, `SeguimientoPanel` (uses graded 400/300/100 scoring), and `RISK_THEME`/`RISK_HEX` in `src/lib/risk.ts`.

Operational notifications that key off `red` only (Slack `@channel`, `volunteers.functions.ts:652`, `assessment.functions.ts:516`) are intentional alert-routing, not resident-facing labels — left unchanged so the methodology labels stay separate from paging urgency.

## Changes

### 1. `src/components/ConnectEngineers.tsx` — respect the 4-level scale
Replace the binary `urgent` flag with a per-level treatment driven by `record.riskLevel`:
- Styling (border/background/icon color) uses `RISK_THEME[record.riskLevel]` (`soft`, `text`, `ring`) so red→red, orange→orange, yellow→yellow. No more red styling on orange results.
- Subtitle copy selected by exact level:
  - red → `connect.subtitleRed` (severe)
  - orange → new `connect.subtitleOrange` (serious — get a volunteer's help soon, no "severos")
  - yellow → `connect.subtitleYellow` (moderate)
- The pre-filled note already uses `t(result.${riskLevel}.tag)`, so it will now correctly say "Hallazgos serios" for orange — no change needed there.

### 2. `src/lib/i18n.tsx` — add the missing orange copy
Add `connect.subtitleOrange` in both the Spanish and English blocks (next to `connect.subtitleRed`/`connect.subtitleYellow` at ~862 and ~2119), wording it as "serious" (aligned with `result.orange.tag` = "Hallazgos serios"), not "severe".

### 3. `src/components/TransparencyBanner.tsx` — reserve the emergency SOS for red
Change `const urgent = riskLevel === "red" || riskLevel === "orange"` so the `SosCard` (911 / avoid-entering) shows for **red only**, matching `result.red.action`. The rest of the transparency/official-directory block continues to show for all levels. Orange results keep the standard official-channels guidance without the emergency-evacuation framing.

## Verification

- Render the result page (`/a/$publicId`) for an orange record via Playwright and screenshot the "Pide ayuda de un evaluador voluntario" block — confirm orange styling + "serios" copy, and that no red SOS/911 card appears.
- Repeat for a red record — confirm red styling, "severos" copy, and the SOS card present.
- Repeat for yellow — unchanged.
- Run the existing unit test suite (safety/severity tests) to confirm no regressions.

## Technical notes

- No database, server-function, scoring, or safety-rule changes. `src/lib/safety-rules.ts` and `src/lib/assessment.functions.ts` already emit the correct 4-level `riskLevel`; this work only fixes presentation layers that were flattening it.
- All colors continue to come from the existing semantic `risk-*` tokens via `RISK_THEME`; no hardcoded colors introduced.
