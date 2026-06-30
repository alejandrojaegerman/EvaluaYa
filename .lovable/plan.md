## Ajustes finales — Paso 1 de 2 (datos de la propiedad)

Con base en tus respuestas y la reunión con Manuel, estos son los cambios que faltan. El **sistema estructural se queda como está** (opcional, colapsado) y el **orden del paso 1 no se toca** (el comentario de "contacto primero" se refiere a lo que el ingeniero debe ver en su vista, no al formulario del residente — eso lo abordamos cuando trabajemos la vista del ingeniero).

### 1. Código de país: mostrar también el indicativo
Hoy el selector solo muestra la bandera. Pasará a mostrar **bandera + indicativo** (ej. `🇻🇪 +58`, `🇨🇴 +57`) para que se vea claro qué código se está usando. Venezuela queda primero y por defecto en `+58`.

### 2. Edad de la edificación → opcional
Manuel pidió que la antigüedad no sea obligatoria. El campo se queda visible pero:
- Se marca como **"(opcional)"**.
- Deja de bloquear el botón Continuar (se puede avanzar sin elegir edad).

### 3. Datos del solicitante: dos preguntas nuevas (Sí/No)
En la sección de contacto se agregan dos preguntas rápidas de un toque:
- **¿Vives en el edificio?** (Sí / No)
- **¿Eres parte de la junta de condominio?** (Sí / No)

Ambas se guardan con la evaluación para que el evaluador entienda el acceso y la autoridad del contacto. Serán obligatorias (un solo toque cada una).

### 4. Verificación final antes de pasar al Paso 2
Reviso en pantalla que el Paso 1 quede así:
- Ubicación: estado, municipio, dirección (obligatoria), nombre del edificio (obligatorio en apto/comercial), parroquia (obligatoria).
- Contacto: nombre, teléfono con `🇻🇪 +58`, ¿vive en el edificio?, ¿junta de condominio?
- Edificación: tipo, sistema estructural (opcional colapsado), pisos sobre nivel de tierra, sótanos, edad (opcional).
- Que no quede ningún texto engañoso tipo "gratis / dos minutos / sin registro" ni "(opcional)" donde el campo es obligatorio.

---

### Detalles técnicos
- **`src/routes/assess/property.tsx`**
  - Selector de país: `option` mostrará `{c.flag} {c.code}`; ensanchar el `select` (de `w-20` a ~`w-28`) y alinear a la izquierda para que entre el indicativo.
  - Edad: quitar `age !== null` de `valid` y la entrada de `age` en `missing`; agregar etiqueta "(opcional)" en el encabezado de la sección.
  - Nuevos estados `livesInBuilding` y `condoBoard` (Sí/No), con UI de botones pareados en la sección de contacto; incluidos en validación (obligatorios) y persistidos en `saveDraft`/`loadDraft`.
- **`src/lib/assessment-types.ts`**: agregar `livesInBuilding?: boolean` y `condoBoardMember?: boolean` (y `age` opcional) en la interfaz `Property`.
- **`src/lib/outbox-sync.ts`**: incluir ambos campos en el payload cuando estén definidos.
- **`src/lib/assessment.functions.ts`**: agregar los dos booleanos opcionales al esquema Zod del `property`.
- **`src/lib/i18n.tsx`**: nuevas llaves ES/EN (`property.livesInBuilding`, `property.condoBoard`, sus opciones Sí/No, `property.miss.*` correspondientes, y "(opcional)" para edad).
- Verificación con captura (Playwright) del Paso 1 renderizado.
