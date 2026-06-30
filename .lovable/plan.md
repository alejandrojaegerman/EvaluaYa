## Objetivo
Eliminar el lenguaje de "inspección" en el Paso 2 para que el residente no parezca estar haciendo una inspección profesional (motivo legal). Todo el cambio es de copy en `src/lib/i18n.tsx` (ES + EN). No se toca lógica ni el algoritmo.

## Cambios de texto

**1. Título del Paso 2 → "Observa y reporta"**
- `checklist.title`: "Inspección guiada" → **"Observa y reporta"**
- EN `checklist.title`: "Guided inspection" → **"Observe and report"**

**2. Subtítulo de sección → "Qué revisar en la estructura"**
- `checklist.sectionStructure`: "Revisión estructural" → **"Qué revisar en la estructura"**
- EN `checklist.sectionStructure`: "Structural checks" → **"What to look at in the structure"**

**3. Consistencia en otras pantallas que repiten "Inspección guiada"**
- `home.how2Title` (tarjeta "Cómo funciona"): "Inspección guiada" → **"Observa y reporta"**
- `help.step2Title` (centro de ayuda): "2. Inspección guiada" → **"2. Observa y reporta"**
- EN equivalentes de ambos a **"Observe and report"** / **"2. Observe and report"**

**4. Subtítulos que aún dicen "inspeccionar/inspect"**
- `checklist.subtitle`: "Revisa cada área con cuidado." → **"Revisa cada señal con cuidado."** (se evita reforzar "inspección")
- EN `checklist.subtitle`: "Inspect each area carefully." → **"Review each sign carefully."**

## Fuera de alcance
- No se cambia el algoritmo, las preguntas, ni las ilustraciones.
- No se renombra `methodology.checklistTitle` ni `panel.stage.visited` (no son visibles para el residente en este flujo); se pueden revisar después si lo deseas.

## Detalles técnicos
Todas las claves viven en el diccionario ES (≈líneas 41, 202, 203, 216, 731) y su espejo EN (≈líneas 1743, 1744, 1757, y los equivalentes de `home.how2Title` / `help.step2Title`). Edición directa de strings, sin cambios de componentes.