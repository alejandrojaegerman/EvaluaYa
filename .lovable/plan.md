## Objetivo

Hacer la Enciclopedia completamente navegable con **breadcrumbs (migas de pan)** en cada página, y agregar la sección más importante — **el proceso oficial de FUNVISIS** — como una página nueva marcada "Próximamente", reutilizable como referencia desde otras secciones.

## Contexto: ya son URLs

Cada guía ya vive en su propia URL bajo `/guia/...` (FUNVISIS, Falla de Boconó, grietas peligrosas, qué hacer después de un temblor), más `/metodologia` y `/ayuda`. No hay que "convertirlas". El problema real es que dentro de cada página **no hay forma de volver** a la Enciclopedia o al inicio sin usar el menú. Eso se resuelve con breadcrumbs.

## Parte 1 — Breadcrumbs en toda la Enciclopedia

Crear un componente reutilizable `EncyclopediaBreadcrumb` (usando el componente `breadcrumb` de shadcn que ya existe) y colocarlo arriba de cada página de la Enciclopedia, justo antes del encabezado.

Estructura de las migas:

```text
Inicio  ›  Enciclopedia  ›  FUNVISIS: qué es y cómo funciona
```

- **Inicio** → enlace a `/`
- **Enciclopedia** → enlace a `/guia`
- **Título de la página actual** → texto sin enlace (página activa)
- Bilingüe (ES/EN) usando `useLang`, igual que el resto.
- En la página raíz `/guia` la miga es solo `Inicio › Enciclopedia` (activo).

Páginas que reciben el breadcrumb:
- `/guia` (hub)
- `/guia/que-hacer-despues-de-un-temblor`
- `/guia/grietas-peligrosas-despues-de-un-sismo`
- `/guia/funvisis-que-es-y-como-funciona`
- `/guia/falla-de-bocono`
- `/metodologia`
- La nueva página del proceso oficial de FUNVISIS (Parte 2)

Esto le da al usuario un salto de un toque de vuelta a la Enciclopedia o al inicio desde cualquier guía. También se agrega `BreadcrumbList` en JSON-LD (schema.org) en cada página para reforzar el SEO y que Google muestre la ruta en los resultados.

## Parte 2 — Sección "Proceso oficial de FUNVISIS" (Próximamente)

Crear una página nueva `/guia/proceso-oficial-funvisis` con:

- Encabezado y breadcrumb (`Inicio › Enciclopedia › Proceso oficial de FUNVISIS`).
- Un bloque visible de **"Próximamente"** (badge + texto corto explicando que aquí documentaremos el procedimiento oficial paso a paso; el contenido lo llenamos mañana).
- Estructura lista para rellenar: secciones vacías con títulos tentativos (p. ej. "Cuándo contactar a FUNVISIS / Protección Civil", "Qué hacer mientras llega la evaluación oficial", "Documentos y evidencia que conviene tener") para que mañana solo sea pegar el contenido.
- Metadata (`head`) y JSON-LD como las demás guías.

Presentación en el hub `/guia`:
- Mostrarla **destacada de primera**, arriba de todo (antes del CTA de autoevaluación o justo debajo del intro), con un estilo diferenciado que comunique que es la pieza central de la Enciclopedia, e indicando "Próximamente".
- Se puede seguir tocando para entrar a la página (que muestra el estado "Próximamente").

Reutilización como referencia:
- Dejar el enlace listo para insertarlo en otras secciones (FUNVISIS, qué hacer después de un temblor, metodología, resultado de la evaluación). En este paso agrego el enlace de referencia al menos en la guía de FUNVISIS y en "qué hacer después de un temblor"; el resto queda fácil de enganchar cuando el contenido esté.

## Detalles técnicos

- Nuevo componente: `src/components/EncyclopediaBreadcrumb.tsx` — recibe `items: { label: string; to?: string }[]` y arma la ruta. Usa `Link` de `@tanstack/react-router` con `params` cuando aplique (aquí todas son rutas estáticas).
- Nueva ruta: `src/routes/guia.proceso-oficial-funvisis.tsx` con `createFileRoute("/guia/proceso-oficial-funvisis")`.
- Editar el hub `src/routes/guia.index.tsx` para destacar la nueva tarjeta y agregarla al `ItemList` JSON-LD.
- Agregar breadcrumb a cada archivo de guía listado arriba (import + render antes del `<header>`).
- Cadenas ES/EN nuevas para "Inicio", "Próximamente" y títulos, agregadas donde corresponda (i18n o inline por página siguiendo el patrón existente de `COPY`).
- Sin cambios de backend ni de lógica de negocio; todo es frontend/presentación y contenido.

## Verificación

- Playwright: abrir `/guia`, entrar a una guía, confirmar que el breadcrumb aparece y que tocar "Enciclopedia" regresa a `/guia` e "Inicio" a `/`. Screenshot móvil (897px) y desktop.
- Confirmar que la tarjeta del proceso oficial de FUNVISIS aparece destacada y que su página muestra "Próximamente".
- Revisar build/typecheck.