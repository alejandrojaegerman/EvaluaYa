# EvalúaYa — Boost completions & traffic

## What the analytics tell us (last 7 days)

286 visitors, 87% mobile, 64% bounce. Top sources: Direct (170) + Instagram (91 — the influencer). Top country: Venezuela (133).

Funnel by pageviews:

```text
Home /            259  ┐
Property          91   │  −65%  ← biggest leak: most visitors never start
Checklist         49   │  −46%  ← property form is too heavy
Analyze           27   │  −45%  ← 13-question checklist is long
Result /a/...     ~9   ┘        ← AI itself works fine (calls succeed in 1.5–3.5s)
```

The AI triage is healthy — the losses are UX friction, not failures. Two-thirds of people who land never tap "Start," and each step after sheds ~half the remainder.

## Goal 1 — Make it easier, lift completions

### A. Home: convert browsers into starters (target the −65%)
- Tighten the hero: lead with the outcome ("Know in 2 minutes if your home is safe to enter"), keep one primary CTA above the fold, move "How it works" + map + share below.
- Add a one-line trust strip near the CTA (e.g. "Free · No sign-up · Works offline") and surface the live building count higher when available.
- Add a lightweight "see a sample result" link so hesitant users understand the payoff before committing.

### B. Property step: cut the scariest friction (target the −46%)
The structural-system selector forces non-experts to pick between 5 engineering acronyms (URM/CMF/CIW/PCF/RML). That's intimidating and likely a top abandonment cause.
- Replace acronyms with plain-language, picture-style choices ("Brick/block walls without columns", "Concrete columns & beams", "Not sure") mapped to the same internal `StructuralType` codes — no backend change.
- Default the structural question to "Not sure" so it's never a hard blocker, and make GPS detection clearly skippable (it already is, but reassure with copy).
- Reorder so the fastest, least-scary inputs come first; keep only Estado as required.

### C. Checklist: shorten the perceived effort (target the −45%)
13 required questions on one long scroll with all-required-to-continue is heavy on mobile.
- Add a sticky progress bar (e.g. "5 / 13") and a "the more you answer, the better" framing instead of a hard wall.
- Allow submission with the core structural items answered; treat the utility/secondary items (flooring, electrical, fixtures, plumbing) as optional so users aren't blocked — safety rules and AI already handle missing answers.
- Group items into short collapsible sections (Structure / Utilities) so the list feels shorter.
- Keep photos optional and make that explicit per card.

### D. Reassure on the Analyze screen
- Add copy that their answers are saved and it's safe to wait on a slow connection (retry/offline logic already exists), reducing mid-analysis bailouts.

## Goal 2 — Generate more traffic & awareness

The flywheel is already Instagram-driven; lean into share + discoverability.

### A. Frictionless sharing at the moment of value
- On the Result screen, make "Share on WhatsApp" + "Share image card" the primary actions (stat-card generation already exists) with Spanish-first copy and the `EvaluaYa.app` URL.
- Add a post-result nudge: "Help a neighbor — share EvalúaYa" pointing to the app (not just the report).

### B. Make the public map a shareable, embeddable asset
- Add per-state and per-result share buttons on `/mapa` plus a short headline stat ("X buildings assessed in [estado]") that's worth reposting.
- Ensure `/mapa` has its own strong Spanish OG title/description/image so map links preview well on WhatsApp/Instagram/X.

### C. SEO & link previews (currently minimal)
- Give Home, `/mapa`, and result routes distinct Spanish `<title>` / meta description / canonical / OG + Twitter tags.
- Add `public/robots.txt` + `public/sitemap.xml` for the public routes (home, mapa) using `https://evaluaya.app`.
- Add JSON-LD (WebApplication / civic-service) on Home for richer results.
- After deploy, verify the domain in Search Console and submit the sitemap so Google indexes it.

### D. Measure what we improve
- We'll re-read analytics after shipping to confirm step-by-step conversion lifts; the funnel above is the baseline.

## Suggested sequencing
1. **Quick wins (highest ROI):** plain-language structural selector + optional secondary checklist items + checklist progress framing + home hero tighten.
2. **Share/traffic:** result-screen share emphasis, map share + OG metadata, SEO meta/sitemap/robots.
3. **Polish:** sample-result preview, analyze reassurance copy, JSON-LD, Search Console submission.

## Technical notes
- All Goal 1 changes are frontend/i18n only (`src/routes/index.tsx`, `assess/property.tsx`, `assess/checklist.tsx`, `assess/analyze.tsx`, `src/lib/i18n.tsx`). Mapping friendly labels → existing `StructuralType` codes keeps `safety-rules.ts` and the AI prompt untouched.
- Making secondary checklist items optional is a client validation change; server `analyzeSchema` already accepts 1–13 answers, so no migration.
- SEO work is per-route `head()` + two static files in `public/`; share work reuses existing `ShareApp`, `share-card.ts`, and `SITE_URL`.
- No database or AI-pipeline changes required.
