# Separar la evaluación de la solicitud de ingeniero

Hoy los "Datos de contacto" son obligatorios en el **Paso 1** (antes de evaluar). Los movemos: la evaluación se hace sin pedir contacto, y **solo si el residente decide contactar a un ingeniero** exigimos los datos que ese ingeniero necesita para revisar/verificar o visitar la vivienda.

## Comportamiento final

```text
PROCESO 1 — Evaluar (sin contacto)
  Paso 1: Ubicación (Estado + Municipio obligatorios) + Edificación
        → Paso 2: Fotos → Resultado

PROCESO 2 — (opcional) Contactar un ingeniero  [desde el resultado]
  Formulario obligatorio:
    • Nombre y apellido *
    • WhatsApp / teléfono *
    • Dirección exacta para visita *
    • Nota (opcional, ya existe)
```

## Cambios

### 1. Formulario de evaluación (Paso 1) — `src/routes/assess/property.tsx`
- **Eliminar** por completo la sección "Datos de contacto" (nombre, tipo de contacto, número). Se quitan los estados asociados y el guardado de `resident` en el borrador.
- **Estado y Municipio siguen obligatorios** (sin cambios en esa validación). Solo se quita el contacto.
- El campo de dirección detallada sigue existiendo como opcional (no se pide a la fuerza aquí).

### 2. Bloque "Solicitar un ingeniero" — `src/components/ConnectEngineers.tsx`
- Añadir dos campos **obligatorios**: **Nombre y apellido** y **Dirección exacta para visita** (calle, número, piso/apto). El WhatsApp/teléfono ya existe y sigue obligatorio.
- Copy explicando que estos datos son necesarios para que el ingeniero pueda **revisar, verificar o visitar** la vivienda, y que no se publican.
- Validación en cliente: los tres campos no vacíos + el acuse legal ya existente antes de habilitar el botón.

### 3. Guardado de la solicitud — `src/lib/volunteers.functions.ts`
- Ampliar `helpSchema` con `residentName` (2–160, requerido) y `address` (requerido, máx. 300), validados con Zod.
- Insertar `resident_name` y `resident_address` en `help_requests`.

### 4. Panel del ingeniero — `src/components/EngineerRequestCard.tsx` + consulta
- Mostrar **Nombre** y **Dirección exacta** del residente, revelados **solo tras reclamar** la solicitud (igual que hoy con el WhatsApp), para que el ingeniero pueda coordinar la visita.

### 5. Textos — `src/lib/i18n.tsx`
- Nuevas claves ES/EN para los campos y ayudas del bloque de contacto del ingeniero.

## Detalles técnicos

- **Base de datos**: migración `ALTER TABLE public.help_requests ADD COLUMN resident_name text, ADD COLUMN resident_address text;`. Son PII: se insertan con service-role (ya es el caso) y se exponen al ingeniero solo cuando `claimed_by = ese ingeniero` (misma compuerta que `resident_whatsapp`, ~línea 935 de `volunteers.functions.ts`).
- El `EngineerRequest` DTO gana `residentName` y `residentAddress` (`null` hasta reclamar).
- `assessments.resident_name/contact` deja de poblarse desde el Paso 1 (queda `null`); no se borra la columna para no romper reportes antiguos. `analyze.tsx` ya envía `resident` solo si existe, así que no requiere cambios.
- Sin cambios en el motor de reglas ni en el flujo de análisis/IA; es reordenamiento de recolección de datos + un par de columnas.

## Verificación
- Typecheck limpio.
- Playwright: (a) completar una evaluación (con Estado/Municipio) sin datos de contacto llega al resultado; (b) el bloque de ingeniero exige nombre + WhatsApp + dirección antes de enviar; (c) el panel del ingeniero muestra nombre y dirección tras reclamar.
