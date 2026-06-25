# Plan: Documento en español + mapa con forma real de Venezuela

Two independent deliverables.

## 1. Validation document in Spanish

The current artifact (`evaluaya-logic-validation.pdf`) is English-only. I'll produce a Spanish edition that mirrors it 1:1, keeping the strict mapping to the code logic so the expert can validate when each result is **VERDE / AMARILLO / ROJO**.

- Generate `/mnt/documents/evaluaya-validacion-logica.pdf` (new file, original kept).
- Same 3-section structure, translated to plain Spanish:
  - **Flujo de dos capas:** `finalRisk = maxRisk(ai, reglas)` — las reglas deterministas solo pueden subir el nivel sugerido por la IA, nunca bajarlo.
  - **Reglas deterministas (`safety-rules.ts`):** condiciones que fuerzan **ROJO** (mampostería no reforzada, licuefacción, golpeteo entre edificios, daño grave de plomería/gas) y condiciones que fuerzan **≥ AMARILLO** (intensidad MMI ≥ 7, edificios de >7 pisos, sistemas estructurales CMF/CIW/PCF/RML).
  - **Triaje IA (`assessment.functions.ts`):** resumen de la lógica del `SYSTEM_PROMPT` (modelo `gemini-2.5-flash`), señales visuales y sesgo conservador "la seguridad primero".
  - **Entradas y trazabilidad:** las 13 preguntas del checklist y los metadatos (edad, altura, sistema) mapeados a cada regla, con la etiqueta del archivo fuente al pie de cada sección.
- Keep the branded risk colors (verde/amarillo/rojo) and the *source: archivo.ts* trace tags.
- QA: render every page to images and inspect for clipping/overflow before delivering.

## 2. Map that looks like the actual country

Today `src/lib/venezuela.ts` holds `VE_OUTLINE` — a ~30-point hand-traced border that reads as a blob, not Venezuela. I'll replace it with a higher-resolution, simplified national border so the silhouette is recognizable, with no new dependencies.

- Replace `VE_OUTLINE` with a denser `[lat, lng]` polygon (≈120–200 points) derived from a simplified Venezuela GeoJSON border, including the main north coastline indentations and the southern/eastern borders. Still hard-coded so it stays offline and tiny.
- Re-check `VE_BOUNDS` so the denser outline fits the SVG viewBox without clipping; adjust min/max lat-lng if needed.
- `outlinePath()` and `projectToSvg()` stay as-is (the path builder already consumes the array), so `src/routes/mapa.tsx` needs no logic change — the bubbles and state dots keep projecting onto the new shape.
- Verify in the live preview that the outline renders as Venezuela and the state bubbles still land in the right places.

## Technical notes

- The PDF is generated with a Python + `reportlab` script under `/tmp`, same approach as the English version; output goes to `/mnt/documents`.
- The map change is data-only inside `src/lib/venezuela.ts`; no component or server changes.
- I'll also quietly confirm the existing `/mapa` hydration warning is only from browser extensions (Dashlane/Kaspersky injecting attributes), not our code.

## Open question

The doc: Spanish-only is my default here. If you'd rather have a single **bilingual** file (Spanish + English) instead of a separate Spanish PDF, tell me and I'll merge them.
