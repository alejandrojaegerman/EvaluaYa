# World-class Data Room — `/datos`

Reorganize the existing data room from one ~6,500px scroll into a polished, tabbed experience led by a media/public-friendly executive summary. This is a **frontend reorganization only** — all data sources, server functions, filters, and widgets stay exactly as they are; we change layout, hierarchy, and add one narrative header.

## What changes

### 1. Executive summary header band (new)
A credibility-forward band directly under the page title:
- **Scope chip** — current selection ("Todo el país" or "Miranda · Sucre") with a small map-pin icon.
- **Last-updated timestamp** — derived from the most recent `lastReport` across areas, formatted in US Eastern (matches the app's existing standard), e.g. "Actualizado hace 2 h".
- **One-line auto narrative** — generated from the live totals for the active scope, media-friendly, e.g. *"De 142 evaluaciones, el 70% reporta daños que requieren atención de un ingeniero; Libertador es la zona más afectada."*
- **Primary actions** inline: "Compartir resumen" (the existing stat-card share) and "Descargar CSV".
- KPIs (Evaluaciones / Municipios / Riesgo serio o alto / Verificado) move into this band as a clean 4-up strip so the top of the page reads as an at-a-glance briefing.

### 2. Sticky filter + tab bar
- The existing `DataRoomFilters` (Estado / Municipio / Período) plus the active-scope label stay, made **sticky** to the top on desktop so filters persist while moving between tabs.
- Below it, a **sticky tab bar** (using the existing `Tabs` UI component) with horizontal scroll on mobile.

### 3. Tabbed sections (replaces the long stack)
Filters apply across all tabs (single shared state — switching tabs never refetches differently). Proposed tabs, ordered for a media/public audience:

```text
Resumen   Mapa   Zonas   Evidencia   Datos abiertos
```

- **Resumen** — the narrative recap, severity spotlight ("Qué tan serio es"), risk distribution gauge, and the trend-over-time chart. The shareable stat card lives here as the hero action.
- **Mapa** — the interactive `DamageMap` + color legend, full-width with more breathing room than today's half-column.
- **Zonas** — "Zonas con más reportes" list with the per-area "Ver por qué" drill-downs (unchanged behavior, more room).
- **Evidencia** — national "Por qué se ven así los datos" risk factors + the photo-documentation coverage panel together (both are "the evidence behind the numbers").
- **Datos abiertos** — data dictionary, CSV export + share, and the open-data API section, grouped as the rigor/credibility tab.

### 4. Visual polish (consistent "data room" system)
- Consistent **section eyebrows** (small uppercase label + title) on every panel.
- Uniform card treatment, spacing rhythm, and a subtle header gradient band so it reads as a designed product, not a stack of boxes.
- Empty/loading states preserved; the mobile "open map" nudge stays.

## Out of scope
- No changes to server functions, RPCs, filters logic, the database, or any data shown. The "Sucre" merge and all metrics behave identically.
- No new dependencies (reuses existing `Tabs`, icons, and components).

## Technical notes
- All work in `src/routes/datos.tsx`: extract the existing JSX blocks (KPIs, map, spotlight, gauge, trend, top areas, risk factors, photos, dictionary, export, API) into a `Tabs`/`TabsContent` structure and add the header band + sticky wrapper. The heavy logic (`useMemo`/`useEffect` data fetching) is untouched — only the render tree is reorganized.
- Add bilingual i18n keys (ES + EN) for the new tab labels, eyebrows, "Actualizado", and the narrative template strings in `src/lib/i18n.tsx`.
- New small presentational helpers (`SectionEyebrow`, narrative builder) kept local to the route file.
- Sticky bars use `position: sticky` with appropriate `top` offset and `z-index` below the global nav; verified on mobile (390px) and desktop.

## Verification
- Playwright screenshots at 390px and 1280px across each tab.
- Confirm filters update all tabs, last-updated/narrative reflect totals, share + CSV still work, and no console errors.
