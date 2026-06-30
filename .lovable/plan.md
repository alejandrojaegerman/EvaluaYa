## Objetivo

Simplificar el formulario a 4+1 preguntas (estilo Doc #2) **sin perder ni un disparador del algoritmo validado por ingenieros**. La clave: las nuevas preguntas alimentan exactamente las mismas reglas determinísticas de `safety-rules.ts`; solo cambia *de dónde* leen cada bandera.

Decisiones confirmadas:
- Q5 "señales graves" = **multi-select con tooltips** (cada opción mapea a una regla validada).
- **Compatibilidad total** con los 13 IDs antiguos (reportes ya guardados siguen calculando y mostrándose bien).
- Peso por "zona más impactada" en el panel → **después** (no en este rework).

---

## Estructura nueva del formulario

**Página 1 — Ubicación + edificación** (sin cambios de algoritmo)
Ubicación corta obligatoria + pin Google Maps + tipo/pisos/edad.

**Página 2 — 4 preguntas + 1 multi-select**

| ID nuevo | Pregunta (vecino) | Reglas que alimenta |
|---|---|---|
| `walls` | ¿Grietas en paredes o muros? | daño estructural (combo/orange) |
| `columns` | ¿Columnas/vigas con concreto roto o cabilla expuesta? | daño estructural |
| `openings` | ¿Puertas/ventanas que ya no abren o cierran? | daño estructural |
| `tilt` | ¿El edificio se ve inclinado o ladeado? | **🔴 directo (nuevo)** |
| `severe_signs` (multi-select obligatorio, tooltips) | señales graves ↓ | ver abajo |

Sub-señales de `severe_signs` (cada checkbox = un ID validado):
- "El terreno se hundió / el piso se separó" → `liquefaction` → 🔴
- "El edificio choca o se separó del vecino" → `pounding` → 🔴
- "Olor a gas o tubería rota" → `plumbing` → 🔴
- "Techo deformado o colapsado" → `roof` → daño estructural
- "Escaleras agrietadas o separadas del muro" → `stairs` → daño estructural
- "Grietas en la fundación / base" → `foundation` → daño estructural
- "Ninguna de las anteriores" (excluyente)

**+1 (avanzado, colapsado, opcional):** sistema estructural (URM, etc.) → conserva regla URM 🔴/🟠.

Se eliminan del formulario (no estructurales, hoy ya opcionales, no disparan reglas): `flooring`, `electrical`, `fixtures`.

---

## Cómo se preserva el algoritmo

Las 3 capas (IA → reglas determinísticas → provisional offline) y `maxRisk` **no cambian**. Lo único que cambia es el mapeo de entrada.

1. **`safety-rules.ts`**: introducir una función `normalizeSignals(answers)` que traduzca las respuestas (nuevas o viejas) a las mismas banderas internas que hoy usa el cuerpo de reglas (`liquefaction`, `pounding`, `plumbing`, `STRUCTURAL_DAMAGE_IDS`, etc.). El cuerpo de reglas queda **idéntico** → criterio civil intacto. Se agrega `tilt = sí ⇒ fireRed`.
2. **`assessment-types.ts`**: nuevos IDs + tipado del multi-select de `severe_signs`. `STRUCTURAL_DAMAGE_IDS` y `REQUIRED_ITEM_IDS` apuntan a los nuevos.
3. **`provisional.ts`**: reusa `normalizeSignals` para el conteo offline (≥2 daños=🔴, 1=🟠).
4. **Prompt de IA** (`assessment.functions.ts`): ajustar el bloque de respuestas que se le pasa para que describa las 4+1 preguntas en lenguaje claro; las bandas 🟢🟡🟠🔴 no cambian.
5. **Compatibilidad**: `normalizeSignals` detecta el shape viejo (13 IDs) y lo mapea a las mismas banderas, así reportes históricos y la data room (`get_risk_factors`, `get_admin_*`) siguen funcionando sin migración de datos.

---

## Vista del ingeniero

El `risk_level` se sigue calculando igual de bien (mejor, porque `severe_signs` es obligatoria), así que la priorización actual (severidad DESC → más antiguo) sigue confiable. Las miniaturas + lightbox ya están listas. El peso por zona se evalúa en un turno posterior.

---

## Detalles técnicos

- Archivos: `assessment-types.ts`, `safety-rules.ts`, `provisional.ts`, `assessment.functions.ts`, `routes/assess/checklist.tsx`, `routes/assess/property.tsx`, `i18n.tsx` (nuevas keys ES/EN + tooltips), y el componente de tooltip del multi-select.
- Sin migración de base de datos (compatibilidad por código). Las RPC siguen leyendo los IDs viejos; añadiré lectura de los nuevos donde la data room los necesite.
- Validación: `tsgo --noEmit` + pruebas manuales de los disparadores 🔴 (tilt, gas, golpeteo, liquefacción, combo sacudida+daño, URM) con casos sintéticos.

---

## Fuera de alcance (este turno)

- Peso por zona en el panel.
- Carrusel acumulado estilo WhatsApp (Fase 1A) — se hace por separado para no mezclar con el cambio de algoritmo.