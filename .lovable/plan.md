# Refresh the Volunteers page + remove the data-access form

## 1. Remove the "request access to the data" form

The institutional lead form ("¿Eres autoridad u organización? / How would you use the data?") is now redundant — the open data API and Data Room are already public. Remove it from the two pages where it appears:

- `/datos` (Data Room) — drop the `<InstitutionLeadForm />` and its import; the closing band becomes a single-column Share + "Start evaluation" CTA.
- `/mapa` (Map) — same removal.
- Delete the now-unused `src/components/InstitutionLeadForm.tsx`.

The backend table and server function stay in place (harmless, no longer surfaced), so no data is lost and nothing else breaks.

## 2. List verified engineers at the top of `/voluntarios`

A new "Ingenieros verificados / Verified engineers" showcase becomes the first thing visitors see — social proof that real people and organizations have joined.

- **What shows:** each approved volunteer's **name**, plus their **organization name whenever one is on file** — for organization volunteers and for individuals who listed an organization. Optional small detail: the states they cover as subtle chips, and an individual/organization icon. A heading with a live count ("12 ingenieros y organizaciones verificadas").
- **What never shows:** WhatsApp, email, or any contact detail — there is no way to reach an engineer from this page.
- **Empty state:** if no one is approved yet, show an encouraging "Sé el primero / Be the first" card instead of an empty list.

```text
┌─────────────────────────────────────┐
│  🛡  12 ingenieros verificados        │
│  ┌────────┐ ┌────────┐ ┌────────┐   │
│  │  JL    │ │  Org.  │ │  MR    │ …  │
│  │ J. Lee │ │ Fundac.│ │M. Rivas│   │
│  │ Acme S.│ │ Caracas│ │ Zulia  │   │
│  └────────┘ └────────┘ └────────┘   │
└─────────────────────────────────────┘
```

## 3. Connections happen only after an evaluation

To reinforce the rule that residents formally request a connection **only upon completing their evaluation**, the volunteers page itself offers no connect/contact action. It adds one clear line for residents: "¿Necesitas un ingeniero? Completa tu evaluación y podrás solicitar una conexión al final," linking to start an evaluation. The actual request form stays where it already lives — on the results screen after the assessment (`ConnectEngineers`).

## 4. Refreshed layout & polish for `/voluntarios`

Reorder and restyle the page with clear intent:
1. Hero (kept, lightly refined).
2. **Verified engineers showcase** (new, section 2).
3. "How it works" pillars (recruit → validate → connect) + step list.
4. Resident note linking to the evaluation flow (section 3).
5. Signup form (kept as-is functionally).

Consistent card styling, spacing, and section headings using existing design tokens — no new colors.

## Technical notes

- **New data source:** add a public `getAllApprovedEngineers` server function in `src/lib/volunteers.functions.ts` returning only `name`, `organization`, `states`, `volunteerType` for `status = 'approved'` (no phone/email in the payload). The existing per-state RPC can't return all engineers (its empty-state branch only matches engineers with no states), so this dedicated read is cleaner and keeps contact data server-side. The `organization` field is included for every volunteer that has one, regardless of individual/organization type.
- Fetch it in the `/voluntarios` route loader (public, no auth) so the list is SSR-rendered.
- Add bilingual i18n keys (`vol.verifiedTitle`, count label, empty state, resident note) to both the `es` and `en` dictionaries in `src/lib/i18n.tsx`.
- While in these files, quietly fix the unrelated Leaflet `_leaflet_pos` runtime error surfaced in the preview if it stems from the map components touched.
