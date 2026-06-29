## Goal

Swap the obscure **"Zonas con reportes"** counter on the home trust banner for a concrete, meaningful one: **"Casos urgentes detectados"** — the number of assessments flagged red or orange (homes needing urgent attention).

No backend changes needed — `getDamageTotals` already returns `red` and `orange` counts in the same payload the home page loads.

## Changes

**`src/lib/i18n.tsx`**
- Replace the `home.statAreas` strings with new urgent-cases labels (keep the key or rename to `home.statUrgent`):
  - ES: `"casos urgentes detectados"`
  - EN: `"urgent cases flagged"`

**`src/routes/index.tsx`** (home trust counters block)
- Change the second counter to show `totals.red + totals.orange` instead of `totals.areas`.
- Use the new label key.
- Style the urgent number with the risk-red token (e.g. `text-risk-red`) so it reads as a meaningful signal rather than a neutral stat, while keeping the first counter (evaluaciones realizadas) on the primary color.
- Leave the existing `hasTotals` gate (`totals.total > 0`) as-is. When zero homes are urgent, the counter shows `0`, which is accurate and reassuring.

## Notes / technical detail

- `DamageTotals` already includes `red`, `orange`, `yellow`, `green`, `verified`, `areas` — so this is a pure presentation change.
- The `areas` field stays in the type and is still used by the data room / map; only the home banner stops surfacing it.
