# Organizar el contenido educativo en un Centro de aprendizaje + aligerar "¿Tembló hoy?"

## Diagnóstico

Hoy tenemos **muchísimo contenido educativo de altísima calidad**, pero está disperso y solo se llega a él por enlaces sueltos dentro de otras páginas. No existe un lugar único que lo agrupe. Contenido que ya existe:

- **Qué hacer después de un temblor** (`/guia/que-hacer-despues-de-un-temblor`) — pasos de seguridad + señales de peligro.
- **Grietas peligrosas** (`/guia/grietas-peligrosas-despues-de-un-sismo`) — con fotos, distingue grieta cosmética vs. estructural.
- **FUNVISIS: qué es y cómo leer sus reportes** (`/guia/funvisis-que-es-y-como-funciona`).
- **Falla de Boconó** (`/guia/falla-de-bocono`) — geología y estados afectados.
- La propia página **"¿Tembló hoy?"** (`/temblo-en-venezuela-hoy`) mezcla: respuesta rápida, estadísticas, lista de sismos, un bloque CTA con **4 botones apilados**, y un FAQ.

El problema que señalas se ve claro en la captura: el bloque CTA está **sobrecargado** (1 botón principal + 3 enlaces), y visualmente el título se solapa con el texto.

## Objetivo

1. **Crear un Centro de aprendizaje** (wiki interna) donde vive TODO el contenido educativo, organizado y fácil de recorrer.
2. **Aligerar la página "¿Tembló hoy?"**: dejar 1 acción principal + 1 enlace al Centro, en vez de 4 botones.
3. Que el Centro refuerce nuestro propósito: **educar sobre la realidad del sismo y qué debe hacer la persona**.

## Qué se construye

### 1. Nueva ruta `/guia` — "Aprende sobre sismos"
Página índice tipo wiki, agrupada en secciones temáticas (sin duplicar contenido — cada tarjeta enlaza a la guía existente):

```text
Aprende sobre sismos
─────────────────────────────
CTA compacto: Revisa tu vivienda  → /assess/property

1) Justo después de un temblor
   • Qué hacer después de un temblor
   • Grietas peligrosas: cómo identificarlas

2) Entender los sismos en Venezuela
   • FUNVISIS: qué es y cómo leer sus reportes
   • Falla de Boconó: qué es y qué estados cruza
   • ¿Tembló hoy? (sismos recientes en vivo)

3) Cómo funciona EvalúaYa
   • Cómo funciona la metodología
   • Ayuda y preguntas frecuentes
```

Cada tarjeta: ícono + título + una línea de descripción. Bilingüe (ES/EN) igual que el resto. Con `head()` propio (title, description, canonical, JSON-LD tipo `CollectionPage`/`ItemList`) para captar tráfico de búsqueda ("qué hacer temblor", "grietas sismo", etc.).

### 2. Aligerar el bloque CTA de "¿Tembló hoy?"
En `LiveQuakesPage.tsx`, el bloque CTA pasa de 4 botones a:
- **1 botón principal**: "Iniciar autoevaluación" → `/assess/property`.
- **1 enlace secundario**: "Aprende qué hacer y cómo revisar" → `/guia` (el nuevo centro), que reemplaza los 3 enlaces sueltos (FUNVISIS, qué hacer, mapa).

Además se corrige el defecto visual del encabezado del bloque (título que se solapa con el cuerpo).

### 3. Navegación
En el menú **"Más"** del `TopNav` y en el menú móvil, agregar **"Aprende sobre sismos"** → `/guia` (reemplaza el enlace suelto a "Metodología", que queda accesible desde dentro del Centro).

### 4. Enlaces cruzados
Los CTA de las guías individuales que hoy apuntan a otras guías sueltas pueden apuntar también a `/guia` para que la persona descubra todo el material.

## Detalles técnicos

- **Archivo nuevo**: `src/routes/guia.index.tsx` (ruta `/guia`), siguiendo el patrón de las guías existentes (`AppShell`, `useLang`, `head()` con canonical + JSON-LD, `absoluteUrl`).
- **i18n**: agregar claves en `src/lib/i18n.tsx` para los títulos/descripciones del Centro y el nuevo enlace de nav (`nav.learn`).
- **Editar** `src/components/LiveQuakesPage.tsx`: reducir el bloque CTA (quitar `funvisisLink`/`tremorLink`/`mapLink`, dejar un solo enlace a `/guia`) y arreglar el layout del encabezado.
- **Editar** `src/components/TopNav.tsx` y el nav móvil para incluir `/guia`.
- **Sitemap**: añadir `/guia` a `src/routes/sitemap[.]xml.ts`.
- **Bug aparte detectado**: hay un error de hidratación por el formato de fecha de la lista de sismos (SSR vs. cliente). Lo corrijo de paso para que la página no re-renderice en cliente.

## Fuera de alcance
- No se reescribe el contenido de las guías existentes (solo se agrupan y enlazan).
- No se toca la lógica de datos de sismos (USGS) ni el backend.

## Decisión pendiente (puedo asumir un valor por defecto)
- **Nombre/ruta del centro**: propongo `/guia` con el título **"Aprende sobre sismos"**. Alternativas: `/aprende` o "Centro de información". Si no indicas lo contrario, uso `/guia` + "Aprende sobre sismos".