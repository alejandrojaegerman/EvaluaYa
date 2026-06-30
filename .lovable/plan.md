# Limpieza de preguntas + imagen de Plomería

Objetivo: reducir preguntas repetidas sin tocar el algoritmo, y arreglar la ilustración de Plomería/gas. Después analizamos el documento oficial venezolano para sumar más imágenes.

## 1. Quitar la pregunta de "Cimientos"

La pregunta de cimientos ya está cubierta por **P1 Paredes** (grietas) y **P4 Inclinación/desplome** (hundimientos). Se deja de mostrar.

- En `src/lib/assessment-types.ts`: sacar `"foundation"` de `SEVERE_SIGN_IDS`. Queda: licuefacción, golpeteo, plomería, techo, escaleras.
- **No se toca** `STRUCTURAL_DAMAGE_IDS` (mantiene `foundation` para que reportes viejos sigan puntuando igual).
- El algoritmo (`safety-rules.ts` / `provisional.ts`) queda **idéntico**: cimientos solo sumaba dentro de daños estructurales, y eso ya lo aportan Paredes + Inclinación.

## 2. Afinar el texto de "Licuefacción"

Hoy su texto también menciona "estructuras hundidas o inclinadas", que pisa la P4. Se recorta para que hable solo de la señal única (agua/arena del suelo).

- En `src/lib/i18n.tsx` (ES y EN): ajustar `item.liquefaction.q` para enfocarlo en agua/arena brotando del suelo, charcos nuevos y grietas en el terreno; quitar la parte de estructuras hundidas/inclinadas (eso ya es P4).
- `item.liquefaction.example.yes/no` se mantienen (ya hablan de agua/arena/terreno).

## 3. Regenerar la ilustración de Plomería/gas

La actual (tubo caricaturesco) no comunica bien. Se reemplaza con una escena más representativa, en el **mismo estilo de dos paneles** que el resto.

- Panel ❌ (daño): tubería con filtración + mancha de agua en la pared/techo, y una señal de olor a gas (ondas).
- Panel ✅ (sano): tubería seca, pared limpia.
- Estilo idéntico a las demás: fondo crema, trazo de línea verde/teal, círculo rojo ❌ arriba-izquierda, círculo verde ✅ arriba-derecha, divisor punteado vertical, 1024×512.
- Se sobrescribe `src/assets/checklist/plumbing.jpg` (mismo nombre/import, sin cambios en código). `checklist-illustrations.ts` no cambia.

## 4. Verificación

- Confirmar que el checklist muestra 4 preguntas principales + 5 "otras señales" (sin Cimientos).
- Confirmar que el algoritmo de riesgo da los mismos resultados en los casos de prueba existentes (`tests/unit/safety-rules.test.ts`).
- Revisar la nueva imagen en el toggle "¿Cómo se ve?".

## Siguiente paso (después de aprobar)

Una vez hechos estos cambios con lo que ya tenemos, trabajamos el documento oficial venezolano que compartirás para evaluar qué imágenes adicionales incorporar (techo y escaleras quedaron señaladas como mejorables, pero las dejamos para esa fase con tus referencias).

---

### Detalles técnicos
- `SEVERE_SIGN_IDS` se usa directamente como `SEVERE_ITEMS` para renderizar el multi-select en `checklist.tsx`; quitar el id basta para ocultar la fila.
- `foundation` permanece en el type `ChecklistItemId` y en `CHECKLIST_ILLUSTRATIONS` (back-compat de registros antiguos).
- La imagen se genera con la herramienta de imágenes a `src/assets/checklist/plumbing.jpg`; al ser import estático de Vite, no requiere cambios de código.
