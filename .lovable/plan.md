# Add the footer to mobile pages

Right now the site footer (brand, link columns, tagline, language toggle) only appears on desktop — it's hidden on mobile so it never overlaps the bottom navigation bar. This makes it visible on mobile too, everywhere **except** the evaluation flow, which we keep stripped down for fast completion.

## What changes

**1. `src/components/Footer.tsx` — make it responsive (mobile + desktop)**
- Remove the `hidden md:block` desktop-only restriction so it renders on mobile.
- Stack the layout gracefully on small screens: brand block on top, link groups in a single column on phones, two columns on larger phones/tablets, and the existing 4-column layout on desktop.
- Add extra bottom padding on mobile so the footer content clears the fixed bottom nav bar (and the phone's home-indicator safe area). No visual change on desktop.

**2. `src/components/AppShell.tsx` — add a `hideFooter` option**
- New optional `hideFooter` prop (defaults to showing the footer).
- When set, the footer is not rendered — used by the evaluation flow.

**3. Hide the footer in the evaluation flow only**
Pass `hideFooter` on the three assessment-step pages so they stay uncluttered:
- `src/routes/assess/property.tsx`
- `src/routes/assess/checklist.tsx`
- `src/routes/assess/analyze.tsx`

## Result
- Mobile pages like Home, Mapa, Voluntarios, Metodología, Ayuda, Feedback, Datos, Mis reportes get the footer (links + language toggle), improving navigation and trust.
- The evaluation flow (property → checklist → analyze) stays minimal with no footer.
- Desktop is unchanged.

No logic, data, or copy changes — purely presentation.
