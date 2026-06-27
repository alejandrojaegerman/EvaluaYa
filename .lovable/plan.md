## Objetivo

El nivel naranja debe llamarse siempre **"Riesgo serio"** (no "Riesgo moderado a serio"), para que la escala quede coherente con amarillo = "Riesgo moderado":

```text
🟢 Riesgo bajo      (verde)
🟡 Riesgo moderado  (amarillo)
🟠 Riesgo serio     (naranja)  ← cambia
🔴 Riesgo alto      (rojo)
```

## Cambios (solo etiquetas / i18n)

Todas las superficies (tarjeta de resultado, mapa, gauge, tendencia, Data Room, PDF, imágenes para compartir) leen el nombre del nivel naranja desde dos claves de `src/lib/i18n.tsx`, así que el cambio se concentra ahí:

1. **`result.orange.tag`** (usada por `src/lib/risk.ts` → tarjeta de resultado, PDF, share images)
   - ES: "Riesgo moderado a serio" → **"Riesgo serio"**
   - EN: "Moderate-to-serious risk" → **"Serious risk"**

2. **`map.urgent`** (usada por mapa, `RiskGauge`, `TrendChart`, Data Room)
   - ES: "Riesgo moderado a serio" → **"Riesgo serio"**
   - EN: "Moderate-to-serious risk" → **"Serious risk"**

3. **Ajustes de coherencia en los textos del diccionario de datos** (paréntesis que repiten el nombre del nivel):
   - `data.dict.seriousOrHigh.def` (ES): "...nivel naranja (moderado a serio) y rojo (alto)..." → "...nivel naranja (serio) y rojo (alto)..."
   - `data.dict.seriousOrHigh.def` (EN): "...orange (moderate-to-serious) and red (high)..." → "...orange (serious) and red (high)..."

Se mantiene sin cambios:
- **`map.seriousOrHigh`** = "Riesgo serio o alto" (métrica combinada naranja + rojo en el Data Room): sigue siendo correcta y ahora encaja mejor ("serio o alto").
- Las **descripciones de severidad** ("Daños moderados a serios. Necesitas un ingeniero con urgencia") y el **prompt de la IA** quedan igual: describen el daño, no son el nombre de la etiqueta. La metodología (`methodology.orange.*`) tampoco cambia su explicación.

## Verificación

- Confirmar que tarjeta de resultado, `/mapa`, `/datos`, gauge y tendencia muestran "Riesgo serio" para naranja en ES e inglés.
- Revisar que no quede ningún "moderado a serio" como **nombre** de nivel (solo permitido en descripciones).
- Correr los tests unitarios existentes (`tests/unit`) por si alguno fija el texto de la etiqueta.
