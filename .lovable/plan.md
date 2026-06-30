# Paso 2 del formulario: "Daños y fotos" (rediseño)

Alinea el paso 2 con lo acordado con Manuel y tus comentarios: simplificar, quitar lo técnico, y poner **todas las fotos en un solo lugar con fachada obligatoria**.

## Qué quitamos (lo que ves hoy y no sirve)

1. **Banner "Reporta solo daños NUEVOS"** → se elimina por completo. La gente reporta los daños que ve, punto.
2. **Bloque "Señales graves"** (licuefacción, golpeteo, plomería, etc.) → se mantiene. Son términos técnicos que el residente no entiende. Entonces hay que reescirbirlas para que se entienda y se utilicen imagenes, se retira el borde rojo para que no de mucha alarma pero que es importante para el algoritmo, esta parte tambien es importante y suma al algoritmo. Se mantiene opcional
3. **Barra de progreso "0 / 4 esenciales"** → se elimina ese stepper interno.
4. **Texto "Las fotos son opcionales..."** y el hint "puedes usar fotos que ya tengas / una foto mejora el análisis" → se elimina. Las fotos pasan a ser **obligatorias**. 
5. **Uploader de foto dentro de cada pregunta** → se quita. Ya no se sube foto pregunta por pregunta.

## Qué queda / se reordena

**A. Preguntas de daño (sí / no / no sé)** — arriba, simples, sin fotos:

- Paredes — *(se mantiene, lo aprobaste)*
- Columnas y vigas / estructura — *(se mantiene, lo aprobaste)*
- Puertas, ventanas y vías de escape
- ¿El edificio se ve inclinado o desplomado? *(disparador clave de seguridad)*

Cada una conserva su "¿Cómo se ve?" con ejemplo/ilustración (eso ayuda y no estorba).

**B. Sección única de Fotos (lo más importante)** — un solo lugar al final:

- **Foto de la fachada — OBLIGATORIA.** Slot propio y destacado, con texto corto explicando por qué ("permite ver si el edificio está inclinado sin entrar"). Sin foto de fachada no se puede continuar.
- **Fotos de los daños — OBLIGATORIAS.** Un solo campo donde la persona agrega todas las fotos posibles (cámara o galería), hasta **10 en total**. Se exige al menos 5.
- Miniaturas con botón de eliminar, como ahora.

**C. Comentarios adicionales (opcional)** — campo de texto corto al final, para que la persona aclare algo que la foto no muestra.

## Reglas para continuar (botón "Analizar / Enviar")

Se habilita solo cuando: las 4 preguntas están respondidas **+** hay foto de fachada **+** hay al menos 1 foto de daño. Si falta algo, se indica qué falta.

---

## Detalle técnico

- `**src/lib/assessment-types.ts**`: agregar dos ids reservados `facade` y `damage_photos` a `ChecklistItemId` y a `CHECKLIST_ITEMS` (solo para transportar las fotos consolidadas como respuestas). No entran en `PRIMARY_QUESTION_IDS` ni en `STRUCTURAL_DAMAGE_IDS`, así el algoritmo determinista no cambia. Subir el tope de fotos consolidadas a 10.
- `**src/routes/assess/checklist.tsx**`: reescribir el cuerpo del paso — quitar banner de daños nuevos, bloque de señales graves, barra de progreso y los uploaders por pregunta; dejar las 4 preguntas sin foto; agregar la sección única de Fotos (fachada obligatoria + galería hasta 10) y el campo de comentarios. Persistir `facade` y `damage_photos` como respuestas con `photoDataUrls`, y los comentarios en el draft.
- `**src/lib/assessment.functions.ts**`: subir el `max` de `answers` (de 13) para acomodar los nuevos ids; guardar el comentario en el registro. Las fotos siguen subiéndose a storage por el mismo flujo (iteración sobre `answers`), así que el panel del ingeniero ya las verá como miniaturas.
- `**src/lib/outbox-sync.ts` / `src/lib/draft-store.ts**`: incluir comentarios en el payload offline (las fotos ya viajan en `answers`).
- `**src/lib/i18n.tsx**`: nuevos textos ES/EN (fachada, "fotos obligatorias", galería, comentarios, validaciones) y retirar los textos de "opcional/daños nuevos/esenciales" del paso 2. Etiquetas `item.facade.*` e `item.damage_photos.*` para que el panel del ingeniero las muestre.

## Fuera de alcance (de la reunión, para otro turno)

Rediseño del panel del ingeniero (miniaturas expandibles, ubicación Google Maps, estados tipo "por revisar / en hold / descartado"), quitar veredicto automático y contexto sísmico de la vista del ingeniero, y verificación CIV en el onboarding. Lo abordamos después de cerrar el paso 2.