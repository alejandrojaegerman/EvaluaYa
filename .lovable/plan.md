# Fix missing translation keys (orange label + others)

## Problem
On the Mapa page the orange tier renders the raw key `map.urgent` instead of a label (visible in the screenshot: "map.urgent 49%"). A full scan of every `t("...")` call against the i18n dictionary found exactly two keys that are referenced in code but never defined in either language:

1. `map.urgent` — used in `src/components/DamageMap.tsx` and `src/components/RiskGauge.tsx` for the orange (moderate-to-serious) tier.
2. `result.genericError` — used in `src/routes/a/$publicId.tsx`, `src/routes/mapa.tsx`, and `src/routes/voluntarios.panel.$token.tsx` for error toasts.

Good news: ES/EN parity is otherwise perfect — all 634 existing keys are defined in both languages, so no other key falls back to its raw name.

## Changes (`src/lib/i18n.tsx` only)

Add to the Spanish block (near the other `map.*` keys ~line 489 and a `result.*` location):
- `"map.urgent": "Riesgo serio"` — keeps the same short pattern as `map.high` / `map.moderate` / `map.low`, and is consistent with the orange tier wording already used (`result.orange.tag` = "Riesgo moderado a serio", legend "daños moderados a serios").
- `"result.genericError": "Algo salió mal. Inténtalo de nuevo."`

Add the matching English entries in the EN block:
- `"map.urgent": "Serious risk"`
- `"result.genericError": "Something went wrong. Please try again."`

## Verification
- Re-run the missing-key scan (parse all `t("literal")` calls vs. defined keys) → expect 0 missing.
- Re-check ES/EN parity → every key defined exactly twice.
- Visually confirm the Mapa "Distribución de riesgo" legend now shows the orange label instead of `map.urgent`, in both ES and EN.

## Notes
This is a content/i18n-only fix — no logic, schema, or component structure changes. The scan only covers static string keys; dynamic keys (e.g. `result.${level}.tag`) were already confirmed to resolve because every risk level has its tag/action defined.