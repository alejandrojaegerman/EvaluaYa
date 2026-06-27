## Goal

Resolve the confusing duplicate "Sucre" on the map: keep **Sucre (Miranda / Petare)** as a real municipio, but stop treating **Sucre in Distrito Capital** as its own municipio. In Caracas, "Sucre" is a *parroquia* of the **Libertador** municipio — Distrito Capital officially has only Libertador.

All changes are confined to `src/lib/venezuela.ts` (presentation/lookup data). No DB writes, no flow changes.

## What changes

1. **Remove the bogus DC centroid**
   Delete the curated entry `{ state: "Distrito Capital", name: "Sucre", ... }` from the `MUNICIPIOS` list, so DC "Sucre" can no longer render as a standalone bubble that mimics Miranda's Sucre.

2. **Add a state-scoped alias so DC "Sucre" rolls into Libertador**
   A plain global alias can't be used here: many states have a *legitimate* Sucre municipio (Aragua, Falcón, Mérida, Monagas, Portuguesa, Táchira, Trujillo, Yaracuy, Zulia, and Miranda), so mapping the name "sucre" → "Libertador" everywhere would corrupt those.
   Instead, introduce a small **per-state alias table** and have `resolveMunicipio` consult it first:
   ```text
   MUNICIPIO_ALIASES_BY_STATE = {
     "Distrito Capital": { "sucre": "Libertador" }
   }
   ```
   `resolveMunicipio(state, municipality)` will check the state-scoped alias before the existing global alias map. For Distrito Capital + "Sucre"/"sucre", it resolves to **Libertador** (centroid lat 10.5, lng -66.92). Every other state keeps its real Sucre municipio untouched.

## Result

- Map / Data Room (`/mapa`, `/datos`) show a single **Sucre** bubble (Miranda/Petare) and fold DC "Sucre" records into **Libertador**.
- The 8 existing DC "Sucre"/"sucre" records (verified via live query) now aggregate under Libertador instead of a phantom DC Sucre municipio.
- No other state's Sucre is affected.

## Verification

- Run the existing `tests/unit/venezuela.test.ts` suite; add quick assertions that:
  - `resolveMunicipio("Distrito Capital", "Sucre")` → name `Libertador`, level `municipio`.
  - `resolveMunicipio("Miranda", "Sucre")` → name `Sucre` (unchanged).
  - `resolveMunicipio("Aragua", "Sucre")` is not remapped to Libertador.
