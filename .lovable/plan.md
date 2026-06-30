## Objetivo

Hacer la sección de fotos del Paso 2 ("Observa y reporta") súper usable: poder ver la foto completa, clasificar cada foto de daño, permitir varias fotos de fachada, instruir explícitamente qué necesita ver el ingeniero, y bloquear archivos que no sean imágenes válidas. Todo lo que el residente sube se sigue guardando y mostrando al ingeniero.

Solo se toca la capa de fotos (UI + el transporte de datos de las fotos). No se toca el algoritmo (`safety-rules.ts`), ni las preguntas, ni las ilustraciones.

---

## 1. Fachada: hasta 5 fotos

Hoy la fachada es **una sola** foto. La cambiamos a una mini-galería:
- Mínimo 1 (sigue siendo obligatoria), máximo 5 (`MAX_FACADE_PHOTOS = 5`).
- Mismo patrón de grilla + botones "Tomar foto / Desde la galería" que la galería de daños.
- El carrier `facade` ya guarda un arreglo (`photoDataUrls`), así que el reporte del ingeniero (`/a/$publicId`) y el PDF ya las muestran todas sin cambios.
- Copy: "Agrega 1 a 5 fotos del edificio completo desde afuera, desde distintos ángulos si no entra en una sola toma."

## 2. Ver la foto completa (lightbox para el residente)

Reutilizamos el componente existente `PhotoLightbox` (el mismo que usa el ingeniero) dentro del checklist:
- Tocar cualquier miniatura (fachada o daño) abre la foto a pantalla completa con zoom/swipe.
- Botón ✕ para cerrar y botón de eliminar separado en la miniatura.

## 3. Clasificar cada foto de daño (dropdown)

Cada foto de la galería de daños tendrá un **selector de categoría** debajo de la miniatura:
`Paredes · Columnas y vigas · Puertas y ventanas · Techo · Escaleras · Cimientos · Plomería/Gas · Otro`.
- La categoría es opcional (default "Otro / General") para no agregar fricción ni drop-off.
- La etiqueta elegida se guarda junto a la foto y se convierte en el **caption** que ve el ingeniero en el reporte y en el lightbox, y aparece en el PDF.

## 4. Comentarios adicionales con ejemplos útiles

Cambiamos el placeholder para que oriente al residente con ejemplos que ayudan al ingeniero, por ejemplo:
"Ej.: ¿Cuándo aparecieron las grietas? ¿Crecieron tras una réplica? ¿En qué piso vives? ¿La estructura es de concreto o de bloque? ¿Hay daños en áreas comunes (escaleras, estacionamiento)? ¿Sentiste que la edificación se movió raro?"

## 5. Copy explícito de qué fotos son útiles

- Reforzar `photosIntro`, `facadeHelp`, `damageHelp` para instruir: enfoque nítido, buena luz, una toma del elemento completo + un acercamiento, incluir algo de referencia de tamaño (mano, regla), varios ángulos.
- Agregar un bloque desplegable "¿Qué fotos le sirven al ingeniero?" con viñetas concretas reutilizando lo que ya describe el código (los textos `item.*.example.yes` describen exactamente las señales: grietas en X, concreto descascarado con cabillas expuestas, separación de juntas, etc.).

## 6. Gates visuales (validación de imagen)

En el manejador de archivos (fachada y daños):
- Aceptar **solo** imágenes: si `file.type` no empieza con `image/` → toast "Solo se permiten imágenes (JPG, PNG)" y se ignora.
- Verificar que la imagen **realmente cargue**: tras comprimir, se decodifica el resultado en un `Image`; si falla `onerror` o queda vacía → toast "No pudimos leer esa imagen, intenta con otra" y no se agrega.
- Las miniaturas muestran un estado de carga y, si una falla al renderizar, un aviso para reemplazarla.

---

## Detalles técnicos

**Estado y persistencia**
- `checklist.tsx`: `facadePhoto: string|null` → `facadePhotos: string[]`; `damagePhotos: string[]` → `damagePhotos: { url: string; category: DamageCategory }[]`.
- Nueva constante `MAX_FACADE_PHOTOS = 5` y lista `DAMAGE_CATEGORIES` en `assessment-types.ts`.
- `DraftAnswer` (en `assessment-types.ts`) y el carrier `damage_photos` ganan un campo aditivo opcional `photoLabels?: string[]` alineado a `photoDataUrls`.

**Transporte hasta el ingeniero**
- `answerSchema` en `assessment.functions.ts`: agregar `photoLabels: z.array(z.string().max(60)).max(10).optional()`.
- En el handler `analyzeAssessment`, al subir fotos se copian los `photoLabels` correspondientes a `storedAnswers` (campo aditivo, no afecta scoring; `damage_photos` no está en ninguna lista de puntaje).
- `analyze.tsx`: pasar `photoLabels` en el `map` del payload.
- `getAssessment` + `a/$publicId.tsx`: cuando un photo carrier tenga `photoLabels`, usar la etiqueta como `caption` por foto (fallback al `item.{id}.area` actual). El PDF (`pdf.ts`) usa el mismo caption.

**i18n** (`i18n.tsx`, ES + EN): nuevas/ajustadas claves para `facadeHelp` (multi), `damageHelp`, `photosIntro`, `commentsPlaceholder`, nombres de categorías, bloque "fotos útiles", y mensajes de error de validación de imagen.

**Sin cambios** en: `safety-rules.ts`, `provisional.ts`, las 13 ilustraciones, el set de preguntas, ni el costo de IA (la IA sigue recibiendo solo la primera foto de cada carrier).

---

## Verificación
- Probar en preview (móvil): subir varias fotos de fachada, clasificar fotos de daño, abrir el lightbox, intentar subir un PDF/archivo no-imagen (debe rechazarse), y completar hasta `/assess/analyze`.
- Confirmar que el reporte `/a/$publicId` muestra las categorías como captions y que el PDF las incluye.
- Correr `tests/unit/safety-rules.test.ts` para confirmar que el algoritmo quedó intacto.
