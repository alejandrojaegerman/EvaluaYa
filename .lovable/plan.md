## Goal

On mobile, keep the homepage laser-focused on starting an evaluation. Move "warnings" and "official references" out of the primary mobile flow into the **Más** menu and **footer** (where they already partly live). Then declutter the **Más** menu by grouping less-visited items into collapsible sections.

Note: this slightly reverses an earlier request to keep "Contactos oficiales" above the fold on mobile. Per this new direction, that card gets tucked away on mobile but stays reachable via Más + footer (and remains on desktop). Flagging in case you want it kept above the fold.

---

## 1. Homepage — declutter the mobile flow (`src/routes/index.tsx`)

Two blocks are non-evaluation "official/warning" references. Hide them on mobile only (keep on `sm:`+ desktop, where space is not at a premium):

- **Official authority contacts card** (the `Phone` card, ~lines 191–209): add `hidden sm:flex` so it disappears on mobile. It is already in the Más menu (added in step 2) and footer.
- **Legal notice card** (the `Info`/"legalNotice" card, ~lines 419–427): add `hidden sm:flex`. Legal stays reachable via Más menu + footer.

Everything that drives evaluations stays untouched on mobile: hero + primary CTA, live trust counters, quake/map quick actions, pending-resume card, "explore your state", how-it-works, volunteer thread, share, recent assessments.

Result on mobile: Hero CTA → counters → quick actions → explore → how it works → … (no official/legal interruptions).

## 2. Add "Contactos oficiales" to the mobile Más menu (`src/components/BottomNav.tsx`)

The mobile Más sheet currently omits "Contactos oficiales" (it only exists in the desktop TopNav). Add it so tucking it off the homepage doesn't lose the entry point.

## 3. Reorganize the Más menu into grouped accordions (`src/components/BottomNav.tsx`)

Today the sheet is a flat list of 9 tiles. Restructure into a short always-visible set of high-use items plus two collapsible accordions for the less-visited categories, using the existing `Accordion` primitive (`src/components/ui/accordion.tsx`, `type="multiple"`).

Proposed structure:

```text
[ Always-visible tiles ]
  Mapa
  Datos
  Voluntarios
  Mis reportes            (only if hasReports)

[ Accordion: Recursos ]           ← footer.resources
  Guía
  Ayuda
  Enviar comentarios (Feedback)

[ Accordion: Oficial y legal ]    ← new key nav.officialLegal
  Contactos oficiales
  Aviso legal
  Privacidad

[ Language toggle + online status ]  (unchanged, stays at bottom)
```

- Accordion headers reuse existing i18n `footer.resources` ("Recursos"/"Resources") and a new key `nav.officialLegal`.
- Tiles keep the current card styling; inside accordions use the same row styling for visual consistency.
- Accordions start collapsed so the sheet opens compact and scannable.

## 4. i18n (`src/lib/i18n.tsx`)

Add one key in both `es` and `en`:
- `nav.officialLegal`: "Oficial y legal" / "Official & legal"

(All other labels — `nav.map`, `nav.data`, `nav.volunteers`, `nav.reports`, `nav.learn`, `nav.help`, `nav.feedback`, `nav.officialContacts`, `nav.legal`, `nav.privacy`, `footer.resources` — already exist.)

## 5. Footer safety check (`src/components/Footer.tsx`)

Confirm official/legal links are present so the tucked-away items remain footer-accessible. Legal + Privacy already live under "Legal". Add **Contactos oficiales** to the footer's "Recursos" (or "Legal") column so the official-contacts reference is linked in the footer as the directive requests.

---

## Technical notes

- Changes are frontend/presentation only — no scoring, data, or business-logic changes.
- Mobile-hiding uses Tailwind responsive utilities (`hidden sm:flex`), matching the app's mobile-first breakpoints; desktop keeps the cards.
- Reuse the existing `Accordion` shadcn component; no new dependencies.
- Desktop TopNav "Más" dropdown is left as-is (it's already compact and desktop is secondary); this change targets the mobile experience the user described.

## Verification

- Typecheck/build.
- Preview at 390px: homepage shows no official-contacts or legal cards; flow reads as evaluation-first.
- Open Más sheet on mobile: high-use tiles visible, "Recursos" and "Oficial y legal" collapse/expand, "Contactos oficiales" reachable.
- Confirm footer links to Contactos oficiales, Legal, Privacidad.
