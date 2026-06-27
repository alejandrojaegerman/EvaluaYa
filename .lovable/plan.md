## Goal
Stop promising residents an engineer "de su zona / in your area." The only promise we can keep today is that engineers are **verified** (matching may be remote in some cases). Reword resident-facing copy to lead with "verified" and drop the geographic-locality promise — without introducing copy that conflicts with the possibility of remote help.

## Scope: resident-facing copy only
All edits are string values in `src/lib/i18n.tsx` (ES + EN) plus one line in `public/llms.txt`. No component/logic changes.

### Spanish (`es`)
- `engineers.homeBody` (line 54): drop "de tu zona" → "…te conectamos con un ingeniero voluntario verificado."
- `engineers.connectDesc` (63): "…con un ingeniero de su zona, sin costo." → "…con un ingeniero voluntario verificado, sin costo."
- `engineers.mapNote` (66): drop "de su zona" → "…pedir apoyo de un ingeniero voluntario verificado."
- `engineers.methodologyBody` (70): drop "de su zona" → "…con un profesional verificado para confirmar o ajustar el resultado."
- `connect.directTitle` (853): "Ingenieros disponibles en tu zona" → "Ingenieros voluntarios verificados disponibles"
- `connect.noneBody` (863): "…en cuanto haya cobertura en tu zona." → "…en cuanto haya disponibilidad."

### English (`en`)
- `engineers.homeBody` (1163): drop "in your area"
- `engineers.connectDesc` (1172): "…with an engineer in their area, at no cost." → "…with a verified volunteer engineer, at no cost."
- `engineers.mapNote` (1175): drop "in their area"
- `engineers.methodologyBody` (1179): drop "in their area"
- `connect.directTitle` (1956): "Engineers available in your area" → "Verified volunteer engineers available"
- `connect.noneBody` (1966): "…as soon as there's coverage in your area." → "…as soon as one is available."

### llms.txt
- Line 5: "un profesional verificado de su zona" → "un profesional verificado".

## Intentionally left unchanged
- `connect.coversYourState` ("Cubre tu estado" / "Covers your state") — this is a factual badge derived from the states an engineer actually selected as coverage, not a locality promise; not in conflict.
- `result.viewMap` ("…mapa de daños de tu zona") — about the damage map, not engineer matching.
- Engineer-facing operational copy (volunteer signup steps, panel empty state, digest/notification emails referencing "tu zona") — internal to engineers, based on their own declared coverage states; describes how they receive requests, not a resident promise. No conflict, so left as-is to keep scope tight.

## Out of scope
No data model, matching logic, or component changes — copy only.