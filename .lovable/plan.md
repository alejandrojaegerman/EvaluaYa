## Goal
Replace the single combined "casos urgentes" home counter with a category breakdown showing the **orange** and **red** counts separately, each labeled with the app's standard risk terminology.

## Universal terminology (reused from result cards)
- Red → `result.red.tag` = "Riesgo alto" / "High risk"
- Orange → `result.orange.tag` = "Riesgo serio" / "Serious risk"

No new strings invented — we reuse the same labels the result screen and PDF already use, so wording stays consistent app-wide.

## Layout
Keep the existing two-card trust row. The right-hand card changes from one big number to a compact two-row breakdown:

```text
┌────────────────────┐  ┌────────────────────┐
│       1,234        │  │  ● Riesgo serio  18 │   (orange dot + count)
│ evaluaciones       │  │  ● Riesgo alto   42 │   (red dot + count)
│ realizadas         │  └────────────────────┘
└────────────────────┘
```

- Orange row: `text-risk-orange` count + `result.orange.tag` label, small color dot.
- Red row: `text-risk-red` count + `result.red.tag` label, small color dot.
- Numbers come from existing `totals.orange` and `totals.red` (no backend change).

## Changes
- `src/routes/index.tsx` (lines ~209-216): swap the single `home.statUrgent` card for the two-row orange/red breakdown using `result.orange.tag` and `result.red.tag`.
- `src/lib/i18n.tsx`: remove the now-unused `home.statUrgent` key in both ES and EN (or leave it — harmless; I'll remove it to keep things clean).

## Notes
- Frontend/copy only; the `get_damage_totals` RPC and `totals` shape are unchanged.
- This drops the alarmist "casos urgentes" framing entirely in favor of the neutral, consistent risk-tier labels.