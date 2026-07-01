# EvalúaYa — Consentimiento tardío + PII solo si piden ingeniero + guía de fotos

Optimizar el flujo para conversión. Los datos lo confirman: `/assess/property` 213 vistas → `/assess/checklist` 45 → `/assess/analyze` 26. El gate bloqueante al inicio del Paso 1 corta el embudo antes de que la persona empiece.

**Guardrail:** nada de esto toca el algoritmo de puntuación (Proceso 1) ni la página de Metodología. Solo confianza, orden y usabilidad alrededor del flujo existente.

---

## 1. Mover el consentimiento al final (lo más tarde posible)

Hoy `LegalConsentGate` es un overlay bloqueante en el Paso 1 (property). Se elimina de ahí y se convierte en **checkboxes en línea al final del Paso 2 (checklist), justo encima del botón "Analizar"** — el último campo antes de recibir el análisis.

### Cambios
- **`src/routes/assess/property.tsx`**: quitar el overlay `LegalConsentGate` y su estado (`showGate`, `getLegalConsent`/`hasLegalConsent`). El Paso 1 queda sin fricción (solo ubicación + tipo de edificio, todo anónimo). Se mantiene guardar el borrador igual; el `consent` ya no se captura aquí.
- **`src/routes/assess/checklist.tsx`**: agregar antes de `StepFooter` un bloque compacto de consentimiento:
  - Un resumen breve y claro de qué **es** EvalúaYa (iniciativa comunitaria independiente, no oficial), qué **no es** (no es FUNVISIS, Protección Civil, servicio del gobierno, ni certificación técnica) y qué pasa con la información — reusando el texto existente de `gate.c1/c2/c3`, presentado liviano.
  - Dos checkboxes: (1) aceptar aviso legal/descargo, (2) consentir el tratamiento de datos — reusando `gate.accept`, `gate.consent`, con enlace "Leer aviso completo" a `/legal` (`gate.readFull`).
  - El botón "Analizar" queda deshabilitado hasta que estén respondidas las preguntas estructurales **y** marcados ambos checkboxes. Si falta, mensaje inline (`gate.mustAccept`).
  - En `handleContinue`: llamar `setLegalConsent()` y guardar el registro en `draft.consent` antes de navegar a `/assess/analyze`.
- **`src/routes/assess/analyze.tsx`**: ya lee `draft.consent` y lo envía. Añadir una guarda: si por acceso directo a la URL el borrador no tiene `consent`, redirigir de vuelta a `/assess/checklist` (evita enviar sin consentimiento).
- **`src/components/LegalConsentGate.tsx`**: deja de usarse como overlay. Se extrae su contenido a un componente en línea (o se reemplaza por el bloque inline en checklist). Se conservan todas las claves i18n `gate.*`.

### Efectos
- **Per-evaluación** de forma natural: el consentimiento se captura fresco al final de cada evaluación, no una vez por dispositivo.
- **Prueba por reporte**: cada `assessment` ya guarda `legal_version` y `consent_version` (versión exacta aceptada) vía `draft.consent`; `assessments.created_at` sirve como marca temporal de la aceptación. No hace falta cambio de esquema.
- **Menos fricción arriba** = menos abandono entre property y checklist.

---

## 2. PII solo si la persona pide conectar con un ingeniero

Ya es así: el flujo principal es anónimo (property solo pide Estado/Municipio) y los datos personales (nombre, WhatsApp, dirección) solo se piden en el componente de solicitar ingeniero, **después** de ver el resultado. Acciones:
- Confirmar que ningún campo de PII es obligatorio en property/checklist (verificación, sin cambios esperados).
- Dejar un comentario `// TODO(legal)` donde los datos saldrían hacia un ingeniero nombrado, para el consentimiento aparte que se consultará con el asesor legal (decisión previa: se trabaja después).

---

## 3. Corregir el lenguaje de "ingenieros verificados"

Los ingenieros son **voluntarios registrados**, no verificados/certificados/avalados. Correcciones de copy público en `src/lib/i18n.tsx` (ES y EN) y `src/routes/index.tsx`:
- `engineers.connectDesc`, `engineers.mapNote`, `engineers.methodologyBody`, `privacy.use.b4`, y meta description en `index.tsx`: "ingeniero voluntario **verificado**" → "**registrado**".
- `engineers.validateDesc`: "marcarlos como **verificados**" → "sumarlos como **voluntarios registrados**".
- `legal.s3.body`: "**Verificamos** sus credenciales…" → "**Registramos** la información que nos suministran; no verificamos ni garantizamos sus credenciales ni sus recomendaciones."
- `vol.verifyTitle`/`vol.verifyHint`/`vol.verifiedSubtitle`: reformular hacia registro/aprobación, sin afirmar verificación completada (quitar "que ya revisamos").

**No se cambian** (son sobre reportes revisados, no sobre ingenieros, y son ciertos): `map.verified`, `data.dict.verified` ("revisado por evaluador") y métricas internas del admin.

---

## 4. Restaurar el acordeón de guía de fotos (borrado por el rollback)

Recuperar del commit `b7714a4`:
- `src/lib/photo-guide-examples.ts` y los assets `src/assets/photo-guide/{scale,rebar,joint,wide-close}.jpg`.
- El acordeón `UsefulPhotosTip` ("¿Qué fotos le sirven al ingeniero?"), colocado en el checklist actual cerca del área de captura.
- Claves i18n `checklist.usefulToggle`, `checklist.usefulIntro`, `checklist.usefulEx.*` (ES y EN).
- Reforzar que la **fachada** debe mostrar el **edificio completo desde lejos** (la foto más útil para el triaje).
- Se mantiene el marco "orientación preliminar": es guía ilustrativa, no diagnóstica.

Convive con el toggle "¿Cómo se ve?" (❌ daño / ✅ sano por item): ese explica *qué buscar*; el acordeón explica *cómo tomar* la foto.

---

## Detalles técnicos y verificación
- Sin cambios de base de datos (las columnas `legal_version`/`consent_version` ya existen).
- `tsgo` typecheck + build.
- Prueba manual: property sin gate → checklist con checkboxes al final → "Analizar" bloqueado hasta marcar ambos → resultado. Acceso directo a `/assess/analyze` sin consentimiento redirige a checklist.
- Confirmar que no queda copy público que diga "ingeniero verificado".
- Abrir el acordeón de fotos y verificar las 4 imágenes + tip de fachada.
