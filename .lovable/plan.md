## Objetivo

Mejorar la sección de fotos del Paso 2 ("Observa y reporta") en tres frentes que pediste, sin tocar el algoritmo, las preguntas ni el transporte de datos al ingeniero:

1. La guía "¿Qué fotos le sirven al ingeniero?" pasa de **texto** a **fotos de ejemplo** con descripciones cortas.
2. Los ejemplos de "Comentarios adicionales" dejan de repetir lo que ya se preguntó (ej. concreto vs. bloque) y pasan a sugerir cosas **nuevas y útiles** que el residente no ha visto ni se le ha preguntado.
3. La etiqueta de categoría de cada foto de daño ("¿qué muestra esta foto?") se ve **más clara y resalta un poco más**, manteniéndolo sencillo y minimalista.

Todo sigue siendo bilingüe (ES primario, EN secundario).

---

## 1. Guía visual "¿Qué fotos le sirven al ingeniero?"

Hoy es una lista de viñetas de texto dentro del desplegable `UsefulPhotosTip`. La convertimos en una **mini-galería de ejemplos**: cada ejemplo es una imagen + un título corto + 1 línea de descripción.

Ejemplos (4 tarjetas):
- **Grieta con referencia de tamaño** — una mano o moneda al lado para ver el ancho.
- **Columna/viga dañada** — concreto desprendido y cabilla (acero) a la vista.
- **Unión o esquina** — donde se juntan pared, columna y techo.
- **De lejos y de cerca** — una toma general para ubicar y una cercana del detalle.

Se generan 4 ilustraciones nuevas en el mismo estilo limpio que las ilustraciones actuales del checklist (`src/assets/checklist/*.jpg`), guardadas en `src/assets/photo-guide/`. La guía sigue siendo desplegable (colapsada por defecto) para no alargar la página; al abrir, muestra una grilla de 2 columnas con las imágenes y los textos cortos.

```text
┌──────────────────────────────────────────┐
│ 💡 ¿Qué fotos le sirven al ingeniero?   ⌄│
├──────────────────────────────────────────┤
│ ┌────────┐ Grieta con      ┌────────┐    │
│ │ [img]  │ referencia       │ [img]  │    │
│ └────────┘ Pon una mano…   └────────┘ …  │
└──────────────────────────────────────────┘
```

## 2. Comentarios adicionales con sugerencias nuevas y útiles

El placeholder actual repite datos ya capturados (piso, concreto/bloque). Lo reemplazamos por ejemplos que **aportan contexto nuevo** que el ingeniero valora y que no se pregunta en ningún otro lado, por ejemplo:
- ¿Las grietas crecieron tras una réplica? ¿Escuchas ruidos o crujidos nuevos?
- ¿Hay áreas comunes afectadas (escaleras, estacionamiento, ascensor, tanque de agua)?
- ¿Alguien resultó herido o hay personas mayores, niños o con movilidad reducida en la edificación?
- ¿Han dejado de dormir ahí por temor? ¿La edificación ya fue evacuada o señalizada por las autoridades?
- ¿Notaste puertas/ventanas que antes cerraban y ahora no?

Implementación: además de mejorar el `placeholder`, agregamos debajo del textarea unas **sugerencias tocables (chips)** cortas ("Réplicas", "Áreas comunes", "Personas vulnerables", "Ruidos nuevos", "Ya evacuada"). Al tocar una, se inserta una pregunta-guía en el textarea para que el residente la responda. Son opcionales y no bloquean nada.

## 3. Etiqueta de categoría más visible (minimalista)

Hoy cada foto de daño tiene un `<select>` pequeño y gris debajo. Lo hacemos más claro sin recargar:
- Un **encabezado corto** "Etiqueta para el ingeniero" sobre el selector, para que se entienda que esa clasificación viaja al profesional.
- El selector se estiliza un poco más (icono de etiqueta + texto en color/peso primario cuando ya tiene categoría distinta de "Otro / general"), para que resalte la selección activa.
- En la miniatura, un **badge discreto en la esquina** con la categoría elegida (solo cuando no es "Otro / general"), para que de un vistazo se vea qué está asignado a cada foto.

Todo manteniéndolo simple: un selector por foto, sin pasos extra.

---

## Detalles técnicos

- **Imágenes**: 4 nuevos `.jpg` en `src/assets/photo-guide/` + un módulo `src/lib/photo-guide-examples.ts` que los exporta como lista `{ img, titleKey, descKey }`. Estilo consistente con `checklist-illustrations.ts`.
- **`src/routes/assess/checklist.tsx`**:
  - `UsefulPhotosTip`: reemplazar la lista de viñetas por la grilla de ejemplos (imágenes + textos cortos).
  - Sección de comentarios: agregar las chips de sugerencias que insertan texto en `comments` (respetando el límite de 1000 caracteres ya existente).
  - `DamageGallery`: añadir el encabezado "Etiqueta para el ingeniero", estilizar el `<select>` activo y mostrar el badge de categoría en `PhotoThumb` (prop opcional `badge`).
- **`src/lib/i18n.tsx`** (ES + EN): reemplazar `checklist.useful.1..5` por claves de ejemplos visuales (`checklist.usefulEx.*.title` / `.desc`), reescribir `checklist.commentsPlaceholder`, añadir claves para las chips de sugerencias y para el rótulo "Etiqueta para el ingeniero".
- **Sin cambios** en: `safety-rules.ts`, `assessment.functions.ts`, `analyze.tsx`, `pdf.ts`, el esquema de transporte de `photoLabels`, las preguntas ni las 13 ilustraciones del checklist. El caption que ve el ingeniero sigue derivándose de la categoría como hoy.

## Verificación
- Preview móvil: abrir la guía y ver las 4 fotos de ejemplo con sus textos; tocar las chips de comentarios y confirmar que insertan texto; clasificar fotos de daño y ver el badge en la miniatura y el selector resaltado.
- Confirmar que el reporte `/a/$publicId` y el PDF siguen mostrando las categorías como captions.
- Correr `tests/unit/safety-rules.test.ts` para confirmar que el algoritmo quedó intacto.
