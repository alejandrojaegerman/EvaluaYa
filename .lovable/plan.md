## Objetivo

Que todo residente entienda que EvalúaYa es solo la **Fase 0 (verificación visual rápida, no oficial)** y sepa exactamente qué hacer después para conseguir la evaluación oficial. Documentar el proceso oficial dentro de la app, hacer descargables los documentos oficiales, y dejar los contactos verificados a un toque. Además, dejar por escrito qué mejoras del algoritmo son posibles con la metodología oficial — **sin tocar el scoring todavía**.

Regla legal transversal: **solo FUNVISIS y Protección Civil emiten certificados**. La app siempre remite al organismo oficial y nunca se presenta como inspección oficial.

---

## 1. Documentos oficiales dentro del repo (descarga + resumen visual)

- Subir los dos PDF oficiales al CDN de la app y guardarlos como assets del repo:
  - `Evaluación_de_Daños_BOLETIN_61_ANIH.pdf` → "Boletín 61 — Evaluación de Daños (ANIH)".
  - `Planilla_V22b.pdf` → "Planilla oficial V22b (FUNVISIS)".
- Enlazarlos como descarga desde la página del proceso oficial (botones "toca para descargar"), con etiqueta de fuente.

## 2. Página del proceso oficial (reemplaza el "Próximamente")

Convertir `src/routes/guia.proceso-oficial-funvisis.tsx` de placeholder a la **pieza central navegable** de la Enciclopedia, con breadcrumbs ya existentes. Contenido (ES primario, EN secundario):

- **Las 3 fases oficiales** (del boletín), como línea de tiempo visual mostrando dónde entra EvalúaYa:

```text
Fase 0  Verificación visual rápida     Comunidad + ing. voluntario   ← EvalúaYa (no oficial)
Fase 1  Evaluación Rápida (etiqueta)   Inspector certificado         El usuario debe solicitarla
Fase 2  Inspección Detallada           Ing. especializado            Si resulta Roja/Amarilla
Fase 3  Evaluación Detallada           Ing. estructural              Para reparar/reforzar
```

- **Qué significan las etiquetas oficiales**: Permitido (Verde) / Restringido (Amarillo) / No Permitido (Rojo), y cómo se relacionan con los niveles 🟢🟡🟠🔴 de EvalúaYa (mapeo aproximado, aclarando que el naranja es un matiz propio de la app).
- **Base legal**: la Planilla la llena personal con "Certificado de Inspector de Evaluación de Daños"; por eso la app remite siempre al organismo.
- **Qué tener listo** para agilizar la evaluación oficial (fotos, ubicación, Nº de pisos y sótanos — datos que la app ya recolecta).
- **Descargas** de Boletín 61 y Planilla V22b + enlace al directorio oficial.
- Aviso de que EvalúaYa no agenda ni realiza la inspección; el residente/ingeniero contacta a Protección Civil.

Actualizar la tarjeta "Featured" del hub `src/routes/guia.index.tsx`: quitar el badge "Próximamente" y describirla como guía activa.

## 3. Directorio oficial verificado (módulo dedicado + reutilizable)

Nuevo componente `src/components/OfficialDirectory.tsx` con botones **tel: "toca para llamar"** y etiqueta de fuente visible **"Fuente: MIPPCI, 28-jun-2026"**:

- **Evaluación de infraestructura (destacado):** Protección Civil Gobierno de Caracas — (0212) 575-1823.
- **Emergencia general / rescate:** VEN 9-1-1 · Protección Civil 0800-PCIVIL1 (0800-7248451).
- **Bomberos de Caracas:** (0212) 545-4545.
- **Cruz Roja:** (0422) 799-4880.
- **FUNVISIS:** 0-800-TEMBLOR (0-800-8362567), 24h; CEDI lun–vie 8–12 / 1–4.
- **Colegio de Ingenieros (CIV):** sin número (placeholder en su web) → dirigir a sede física (Av. Principal de Quebrada Honda, Los Caobos, Caracas) y su web, no a un número no verificado.
- Nota de no responsabilidad: la app publica números oficiales para marcado directo; no gestiona ni se responsabiliza por dichas comunicaciones; revalidar periódicamente (contexto de emergencia).

Nueva ruta dedicada `src/routes/contactos-oficiales.tsx` que renderiza el directorio como pantalla completa, enlazada desde la Enciclopedia y el menú "Más".

## 4. Banner de transparencia post-evaluación (result card)

En `src/routes/a/$publicId.tsx`, tras los hallazgos, insertar un banner obligatorio (nuevo bloque, sin tocar el scoring):

> "Esto es solo una verificación visual rápida, no la inspección oficial. Para la evaluación oficial de tu edificio, contacta a Protección Civil del Gobierno de Caracas: (0212) 575-1823. En emergencia: VEN 9-1-1 o 0800-PCIVIL1. La etiqueta oficial solo la coloca personal certificado por la autoridad."
>
> Colocar tambien los números de cotacto a nivel nacional. 

- Incluir el matiz del propio instrumento oficial: la inspección no garantiza seguridad ante eventos futuros; pueden existir situaciones fuera de su alcance y las condiciones pueden cambiar.
- Debajo, embeber `OfficialDirectory` (o un resumen con enlace a `/contactos-oficiales`).
- **Módulo SOS (botón rojo)** para peligro inminente con `tel:` directo a VEN 9-1-1 / 0800-PCIVIL1, mostrado con prioridad cuando el resultado es 🔴 Rojo / 🟠 Naranja.
- Reflejar el mismo bloque de contactos en el PDF (`src/lib/pdf.ts`) para que el residente lo tenga offline.

## 5. Documento de propuestas de mejora del algoritmo (solo documentar)

Crear `docs/mejoras-algoritmo-oficial.md` en el repo (referencia interna), alineando `safety-rules.ts` con Boletín 61 / Planilla V22b. **Sin cambiar código de scoring.** Propuestas a evaluar:

- **Mapear hallazgos a la escala oficial de daño (I Sin daño → V Completo)** y a las etiquetas A/B/C, para hablar el idioma del inspector oficial en el reporte.
- **Elementos no-estructurales de la Planilla** (fachada, tanques/balcones, parapetos) como señales adicionales de precaución — hoy no se capturan explícitamente.
- **Conteo por elemento** (columnas/vigas/nodos/losas/mampostería dañados) como refuerzo de la heurística "≥2 sistemas = rojo".
- **Nodos viga-columna** como señal crítica que hoy no se pregunta directamente.
- Reconciliar el mapeo naranja ↔ etiqueta oficial Restringida/No Permitida.

Este documento queda como insumo para una ronda futura y para revalidar con Manuel.

---

## Detalles técnicos

- **Assets:** subir los PDF con `lovable-assets create` y referenciar el `.asset.json` (patrón ya usado en el repo). Los `evaluaya-spec-*.pdf` existentes en `public/` se mantienen.
- **i18n:** todas las cadenas nuevas en `src/lib/i18n.tsx` (ES + EN): banner, directorio, fases, etiquetas oficiales, SOS.
- **Navegación:** añadir "Contactos oficiales" al hub `/guia` (grupo "Cómo funciona / Después de la evaluación") y al menú "Más" de `TopNav.tsx`.
- **SEO:** `head()` propio en `/contactos-oficiales` y en la página de proceso oficial; conservar breadcrumbs + JSON-LD ya existentes.
- **tel: links:** normalizar a formato marcable (ej. `tel:+582125751823`, `tel:9-1-1` según convención local) mostrando el número legible en pantalla.
- **Sin cambios de backend ni de lógica de riesgo** en esta ronda: solo presentación, contenido, documentación y assets.

## Verificación

- Playwright: capturas de `/guia/proceso-oficial-funvisis`, `/contactos-oficiales` y de un result card 🔴 para confirmar banner + SOS + directorio en móvil.
- Confirmar que los `tel:` abren el marcador y que las descargas de PDF resuelven.
- Revisar que los tests de seguridad/idioma existentes sigan verdes.