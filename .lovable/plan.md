# Municipio drill-down pages

Let visitors drill from a state page (`/zona/anzoategui`) into a specific municipio (`/zona/anzoategui/simon-bolivar`) when that municipio has enough completed evaluations. Reuses the existing name-normalization logic, so no database changes are needed.

## How it behaves

- A new route `/zona/{estado}/{municipio}` shows the same kind of content as a state page, scoped to one municipio: report count, risk distribution (Green/Yellow/Orange/Red), last report date, and a prefilled "evaluate your home" CTA.
- The state page gains a **"Municipios with reports"** section listing qualifying municipios as tappable cards, ordered most-affected first. The existing bare "municipios" count stays.
- Only municipios with **3+ completed evaluations** that resolve to an official municipio name get a page and a link. Everything below the threshold (or that can't be cleanly identified) keeps rolling up into the state page, exactly as today.
- Messy entries are cleaned before counting: `baruta`→Baruta, `petarr`/`Petare`→Sucre, `Caroni`→Caroní, Distrito Capital parroquias (`El paraíso`, `23 de Enero`, `Sucre`)→Libertador, etc. Counts for variants merge into one canonical municipio.
- Municipio pages are added to the sitemap and carry their own SEO title/description/canonical + breadcrumb structured data.

## Scope decision

The deep "why behind the results" drill-down panel stays on the **state** page only. The municipio risk-factor data is keyed on exact free-text names, so a municipio-level "why" would undercount the normalized variants. The municipio page instead links up to the state page for the full analysis. This keeps municipio numbers honest without a schema change.

## Technical changes

````text
src/lib/venezuela.ts
  + municipioSlug(name)                     // same slugify as estadoSlug
  + getMunicipioBySlug(stateName, slug)     // -> canonical Municipio | undefined
                                            //    (searches curated MUNICIPIOS for the state)

src/lib/stats.functions.ts
  + type MunicipioStats { state, municipality, total, green, yellow, orange, red, verified, lastReport }
  + getStateMunicipios({ state })           // -> MunicipioStats[] for one state:
                                            //    fetch get_damage_aggregates, run each row through
                                            //    resolveMunicipio(state, muni), keep level==="municipio",
                                            //    group by canonical name, sum, filter total>=3,
                                            //    sort by impact (rankMunicipios / severity weight)
  + getMunicipioStats({ state, municipality })  // single canonical municipio, same normalization;
                                            //    returns zeros if below threshold / not found
  + getMunicipioSitemapEntries()            // -> { stateSlug, muniSlug }[] across all states (total>=3)

src/routes/zona.$estado.$municipio.tsx      // NEW
  - loader: resolve estado slug + municipio slug; notFound() on unknown;
    call getMunicipioStats; if total < 3 -> show "not enough reports yet" empty state
  - head(): unique title/description/canonical + WebPage & BreadcrumbList JSON-LD
  - component: breadcrumb (Inicio > Mapa > {Estado} > {Municipio}),
    hero, prefilled CTA to /assess/property (estado prefilled),
    Stat (total reports), RiskGauge distribution, last-report line,
    "Ver análisis completo de {estado}" link back to state page, ShareApp
  - notFoundComponent + errorComponent (mirror zona.$estado.tsx)

src/routes/zona.$estado.tsx                 // EDIT
  - loader also calls getStateMunicipios({ state })
  - add a "Municipios con reportes" section: impact-ordered Link cards to
    /zona/$estado/$municipio (only when list non-empty)

src/routes/sitemap[.]xml.ts                 // EDIT
  - make buildSitemap async; append municipio URLs from getMunicipioSitemapEntries()

src/lib/i18n.tsx                            // EDIT (ES + EN)
  - municipio.eyebrow, .h1Prefix, .intro, .breadcrumb, .totalReports,
    .lastReport, .notEnough, .backToState, and zona.municipiosWithReports
````

## Notes / trade-offs

- No migration: all normalization runs in TypeScript over the existing service-role-brokered `get_damage_aggregates` RPC, consistent with the location pickers.
- Privacy: the 3-report minimum prevents thin, near-identifying pages; sub-threshold data is never exposed at municipio granularity.
- Performance: state and municipio loaders each make one RPC round-trip (same call, filtered/grouped in TS), matching the current state-page cost.
