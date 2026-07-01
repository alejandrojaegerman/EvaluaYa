## Objetivo

1. Renombrar el centro de aprendizaje a **"Enciclopedia"** (solo el texto visible; la URL sigue siendo `/guia`).
2. Dejar el acceso a **Metodología solo dentro de la Enciclopedia** (quitarlo de los menús "Más" y del footer).
3. **Actualizar todo el contenido de Metodología** para alinearlo con el flujo nuevo (2 pasos, fotos obligatorias, "Observa y reporta", 4 niveles 🟢🟡🟠🔴) y el replanteo legal (IA como apoyo, no veredicto; "hallazgos visuales preliminares").

## Diagnóstico

- `/metodologia` es una ruta independiente. Hoy tiene acceso suelto en 4 lugares: menú "Más" de `TopNav`, menú "Más" de `BottomNav`, `Footer`, y como tarjeta dentro de `/guia`. Además la enlazan otras guías.
- El contenido está desactualizado: menciona "9 puntos obligatorios + 4 opcionales" y "una foto clave por área", cuando el flujo real es **4 preguntas principales** (paredes, columnas/vigas, puertas/ventanas, inclinación) + un multiselect de **señales graves** (licuación, golpeteo, plomería, techo, escaleras) + **fotos obligatorias** (fachada hasta 5, daños 5–10). El intro habla de "verde, amarillo o rojo" sin el naranja, y presenta la IA como si emitiera un veredicto.

## Cambios

### 1. Renombrar a "Enciclopedia" (solo texto)
- `src/lib/i18n.tsx`: cambiar `nav.learn` a **"Enciclopedia"** / **"Encyclopedia"**.
- `src/routes/guia.index.tsx`: actualizar `COPY` (kicker, `h1`, `intro`) para reflejar que es una enciclopedia sobre sismos **y cómo funciona la app**, no solo sismos. Mantener `PATH = "/guia"` y todos los enlaces hijos sin cambios.
- No se toca ninguna URL ni el sitemap (cero impacto SEO de rutas).

### 2. Metodología accesible solo desde la Enciclopedia
- `src/components/TopNav.tsx`: quitar el `DropdownMenuItem` de `/metodologia` del menú "Más".
- `src/components/BottomNav.tsx`: quitar el enlace de `/metodologia` del sheet "Más".
- `src/components/Footer.tsx`: quitar la entrada `/metodologia`.
- Se conserva: la tarjeta de metodología dentro de `/guia` (bloque "Cómo funciona EvalúaYa") y los enlaces cruzados existentes desde otras guías. La ruta `/metodologia` sigue viva y en el sitemap.
- Limpiar imports de íconos que queden sin uso (p. ej. `GraduationCap`) en esos archivos.

### 3. Actualizar el contenido de Metodología
En `src/lib/i18n.tsx` (bloques ES y EN), reescribir para que coincida con la realidad actual:
- **`methodology.intro`**: incluir los **4 niveles** (🟢🟡🟠🔴) y encuadrar el resultado como **orientación / hallazgos visuales preliminares**, no un dictamen.
- **`methodology.checklistBody`**: reemplazar "9 obligatorios + 4 opcionales" por la descripción real: 4 preguntas principales + señales graves + fotos obligatorias (fachada y daños), con opcionales de servicios.
- **`methodology.layerB.body`**: aclarar que la IA es una **capa de apoyo** que resume hallazgos y sugiere próximos pasos, **conservadora**, y **no reemplaza a un ingeniero** (coherente con el replanteo legal).
- **`methodology.source.ai`** y **`methodology.limit.*`**: reforzar el lenguaje de "no es certificación / hallazgos preliminares".
- Revisar `methodology.title/subtitle` para tono consistente ("Cómo funciona EvalúaYa").
- El componente `src/routes/metodologia.tsx` ya renderiza desde estas claves; no requiere cambios estructurales salvo que alguna sección cambie de forma.

### 4. Arreglo menor (aparte)
- Corregir el error de hidratación en la lista de sismos (`"hace 1 min"` vs `"hace instantes"`): el tiempo relativo se calcula en SSR y difiere en cliente. Se estabiliza el formateo relativo (`src/lib/datetime.ts` / `LiveQuakesPage.tsx`) para que no haya mismatch.

## Fuera de alcance
- No se cambia la URL `/guia` ni las URLs de las guías hijas.
- No se modifica la lógica de riesgo, el backend ni el flujo de evaluación.

## Verificación
- Build/typecheck limpio (imports de íconos sin usar removidos).
- Revisar en preview: menús "Más" (web y móvil) y footer ya **no** muestran Metodología; la Enciclopedia (`/guia`) sí la lista.
- Leer `/metodologia` y confirmar que el texto refleja 4 niveles, fotos obligatorias y el encuadre legal.
