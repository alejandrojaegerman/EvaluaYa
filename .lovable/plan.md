
## Goal
Four focused changes: bring back the bottom-of-home disclaimer on mobile, stop promoting "you can do this even if you're not at your property," make the "Más" menu items uniform (no descriptions), and turn **Metodología** into a top-level nav/footer page with the **Enciclopedia** now hanging off the bottom of it.

## 1. Restore the home page disclaimer (all screens)
`src/routes/index.tsx` — the legal-notice link at the bottom (uses `home.legalNotice`) is currently `hidden sm:flex` (mobile-hidden from an earlier change). Remove the `hidden sm:flex` so it shows on every viewport again, matching the original "disclaimer near the bottom." No copy change — `home.legalNotice` stays.

## 2. Remove "even if you're not at your property" references (without forbidding it)
Remove the promotional framing that says you don't need to be present, while keeping the neutral capability intact so we don't contradict that it's still possible:
- `src/routes/assess/property.tsx` — remove the in-flow "behalf" hint card (`property.behalfHint`) shown on Step 1 (the `Users` icon block in the non-engineer branch).
- `src/lib/i18n.tsx` — remove the now-unused `home.behalfTitle` / `home.behalfBody` keys (es + en); they aren't rendered anywhere.
- Keep the Help FAQ "¿Puedo evaluar por otra persona?" (`help.faq.behalfQ/A`). It answers a direct user question and preserves the possibility rather than promoting it — this is the "without contradicting the possibility otherwise" part.

## 3. Uniform "Más" menu — no item descriptions
`src/components/BottomNav.tsx` — the `/datos` entry is the only one carrying a `desc`. Remove `desc: t("nav.dataDesc")` from that `primaryLinks` entry so every row is a plain label + icon. (The `MenuRow` `desc` support can stay in place, just unused.)

## 4. Extract Metodología from Enciclopedia; nest Enciclopedia under Metodología
Metodología becomes a first-class page linked from nav + footer; Enciclopedia is reachable only from the bottom of the Metodología page.

- `src/components/TopNav.tsx` (desktop "Más" dropdown): replace the Enciclopedia item (`nav.learn` → `/guia`) with a Metodología item (`nav.methodology` → `/metodologia`, `BookOpen` or `Radar` icon).
- `src/components/BottomNav.tsx` (Recursos accordion): same swap — Enciclopedia → Metodología.
- `src/components/Footer.tsx` (Resources column): same swap — Enciclopedia → Metodología.
- `src/routes/guia.index.tsx`: remove the `/metodologia` item from the "Cómo funciona EvalúaYa" group (es + en); that group keeps Contactos oficiales + Ayuda.
- `src/routes/metodologia.tsx`:
  - Drop the `EncyclopediaBreadcrumb` (it no longer lives under Enciclopedia). Replace with a simple `Inicio › Metodología` trail (build a local crumb array) and matching BreadcrumbList JSON-LD, or remove the breadcrumb entirely.
  - Add a link at the bottom (near the existing CTA section) pointing to `/guia` — e.g. an "Explora la Enciclopedia / Explore the Encyclopedia" card — so the encyclopedia is discoverable only from here.

The `nav.methodology` i18n key already exists (es "Metodología" / en "Methodology"), so no new nav string is needed. A short i18n key pair will be added for the "Explore the Encyclopedia" link at the bottom of the methodology page.

## Technical notes
- `home.legalNotice`, `nav.methodology`, and the `/metodologia` route all already exist — this is mostly link rewiring plus one visibility toggle and one deletion.
- After edits: run `tsgo` typecheck and verify on the 390px preview that (a) the disclaimer shows at the bottom of home, (b) the Más menu rows are description-free, and (c) nav/footer point to Metodología while Enciclopedia is only linked from the methodology page bottom.

## Out of scope
No scoring/methodology logic changes, no changes to the assessment flow beyond removing the one hint card, and no changes to the Help FAQ content.
