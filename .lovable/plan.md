## Goal

Add a public, bilingual **"Cómo funciona / Methodology"** page that explains exactly how EvalúaYa reaches a Green/Yellow/Red result and where its credibility comes from — so residents, journalists, and institutions can validate the tool before using or sharing it.

This is a transparency page. It states only what the app actually does (verified against the codebase) and the real public standards/data it builds on. No certification or accuracy guarantees.

## What the page will explain (all grounded in current code)

**1. The two-layer logic** (from `assessment.functions.ts` + `safety-rules.ts`)
- Layer A — **Deterministic life-safety rules** that run on every assessment and can *override* the AI:
  - Force **RED** (unsafe to enter): unreinforced masonry (URM), ground liquefaction signs, building-to-building pounding, severe plumbing/gas damage.
  - Force at least **YELLOW** (caution): estimated shaking intensity MMI ≥ VII, more than 7 floors, or vulnerable structural systems (CMF/CIW/PCF/RML).
  - The final risk is always the *more severe* of the rule result and the AI result (`maxRisk`), and rule-based findings are shown first.
- Layer B — **AI vision triage**: the resident's checklist answers + one key photo per item are sent to a vision model for an ATC-20-style rapid assessment, returning a level + plain-language findings and next steps.

**2. The inspection itself** — the 9 required structural checks + 4 optional utility checks, framed around recognized rapid-assessment concerns (foundation, walls, columns/beams, roof, stairs, liquefaction, pounding, utilities).

**3. Seismic context** — how location-based shaking intensity (MMI) is estimated by interpolating a USGS ShakeMap grid for the active event, and how that raises caution levels.

**4. Credibility & sources** — plain references to the public frameworks the logic is modeled on:
- ATC-20 rapid post-earthquake safety evaluation (the green/yellow/red placard concept).
- USGS ShakeMap / Modified Mercalli Intensity (MMI) as the shaking-intensity basis.
- General URM/soft-story seismic-vulnerability consensus.
- Lovable AI Gateway as the vision model provider (described factually, not as a certifier).

**5. Honest limitations & shared responsibility** (required for a trust page)
- A clear qualifier: this page is maintained by the EvalúaYa team to explain the tool.
- A prominent "**not a substitute for a licensed engineer or Civil Protection**" / "**not a certification**" notice — matching the disclaimer already in the AI prompt.
- What the tool does *not* do (no interior/hidden-element inspection, depends on resident-reported answers and photo quality, preliminary only).
- Privacy note consistent with the app: no login required, only coarse location (state/municipality) feeds the public map.

## Implementation

- **New route** `src/routes/metodologia.tsx` (URL `/metodologia`), wrapped in the existing `AppShell`, reusing current cards, risk-color tokens (`risk-green/yellow/red`), typography, and spacing — no new visual language.
- Add a route-specific `head()` with Spanish-first `title`, `description`, `og:title`, `og:description` for shareability (no `og:image` needed, or reuse an existing branded OG image).
- Structure: intro → "Las dos capas" → rule table (color-coded) → checklist overview → seismic intensity → sources/credibility → limitations/disclaimer. Content rendered as normal JSX (no raw HTML).
- **Bilingual copy**: add `methodology.*` keys to both `es` and `en` dictionaries in `src/lib/i18n.tsx` (ES primary).
- **Discoverability**: add a link to the page from the Home page (e.g. a "Cómo se calcula / How it's calculated" link near the result-related content) and from the `AppShell` footer/header area, plus a "Ver metodología" link on the result card context. Add the URL to `public/sitemap.xml`.

## Technical notes

- Static content page — no server functions, no DB, no loader. Safe to prerender.
- Keep all claims factual and verifiable from the codebase; avoid any "X% accurate", "certified", or "guaranteed safe" language.
