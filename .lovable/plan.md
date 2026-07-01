## Objetivo
Quitar el acordeón "¿Qué fotos le sirven al ingeniero?" del flujo de evaluación (paso 2) y mostrarlo en el reporte, dentro del bloque donde el residente decide contactar a un ingeniero voluntario.

## Cambios

### 1. Extraer el componente a un archivo compartido
Crear `src/components/UsefulPhotosTip.tsx` con el mismo contenido de la función `UsefulPhotosTip` que hoy vive en `src/routes/assess/checklist.tsx` (líneas 315–367). Mantiene el acordeón con `PHOTO_GUIDE_EXAMPLES`, `Lightbulb`, `ChevronDown`, `cn` y las claves i18n `checklist.usefulToggle` / `usefulIntro` / `usefulEx.*` (sin cambios de copy).

### 2. Quitarlo del flujo de evaluación (`src/routes/assess/checklist.tsx`)
- Eliminar `<UsefulPhotosTip />` (línea 225) y el comentario asociado.
- Eliminar la definición local de la función `UsefulPhotosTip` (líneas ~312–367).
- Limpiar imports que quedan sin uso: `Lightbulb` y `PHOTO_GUIDE_EXAMPLES`. (Se conservan `ChevronDown` y `cn`, que siguen usándose en el resto del archivo.)

### 3. Mostrarlo en el reporte (`src/components/ConnectEngineers.tsx`)
- Importar el nuevo `UsefulPhotosTip`.
- Renderizarlo dentro del formulario de solicitud, justo debajo de `connect.requestBody` (después de la línea 157), para que cuando el residente elija contactar a un ingeniero vea qué fotos le sirven. Se muestra colapsado por defecto, igual que hoy.

## Notas técnicas
- No cambia lógica de scoring ni metodología; solo mueve un componente de guía visual.
- Verificar el build/typecheck tras mover el componente para confirmar que no queden imports huérfanos.
