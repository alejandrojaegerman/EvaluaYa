# Optimize the Volunteers page for sign-ups

## The problem

Right now `/voluntarios` makes people scroll through a lot before they can act. The current order is:

```text
1. Hero
2. Full verified-engineer roster (cards w/ initials, tiers, states)  ← big block, top of page
3. Three pillars (recruit → validate → connect)
4. Three "how it works" steps
5. Resident note ("connect after your evaluation")
6. Sign-up form  ← the actual goal, all the way at the bottom
```

The roster is the most "convoluted" piece — it's detailed social proof aimed at *residents*, but this page's job is to convert *engineers* into signing up. Pushing the form down and leading with a directory buries the call to action.

## Recommendation: keep it, but demote it

Don't delete the roster entirely — a visible community of verified engineers is real trust ("others like me already joined"). Instead:

- Replace the big top block with a **single compact trust line** near the hero (e.g. "🛡️ 12 ingenieros y organizaciones ya verificados / 12 verified engineers & organizations already onboard"). One sentence, no cards.
- Move the **full roster to the very bottom** of the page, after the form, as a showcase for anyone who scrolls.
- When there are zero approved engineers, show nothing up top (no empty-state block) so a new community doesn't look empty — the bottom section keeps its existing empty state or is hidden.

## New page order

```text
1. Hero
2. Compact trust line (count only; hidden when count = 0)
3. Sign-up form  ← now high, right after the hero
4. Three pillars (recruit → validate → connect)
5. Three "how it works" steps
6. Resident note ("connect after your evaluation")
7. Full verified-engineer roster (social proof, at the bottom)
```

This puts the form in the first screen or two, keeps the explanatory context for people who want it, and preserves the roster as closing reassurance.

## Implementation notes (technical)

- File: `src/routes/voluntarios.index.tsx` only. No backend, schema, or server-fn changes — `getAllApprovedEngineers` / `getImpactRanking` loader stays the same.
- Split the existing `VerifiedEngineers` component into two pieces:
  - A small `VerifiedCount` inline element (icon + localized count) rendered right under the hero, returning `null` when `engineers.length === 0`.
  - The existing roster grid (`<ul>` of cards) kept as `VerifiedEngineers`, rendered once at the bottom after the `</form>`.
- Reorder the JSX in `VolunteersPage`: move the `<form>` block up to immediately follow the hero/trust line, and move `<VerifiedEngineers …>` to the end.
- Reuse existing i18n keys (`vol.verifiedCountOne` / `vol.verifiedCountMany`, `vol.verifiedTitle`, `vol.verifiedSubtitle`). Add at most one new key pair if a distinct short trust-line label is needed (`vol.trustLine` ES/EN); otherwise reuse the count strings.
- Keep all `TierBadge` / `initials` helpers; nothing about an individual card changes.
- Verify with a typecheck and a quick mobile-viewport screenshot that the form now sits near the top and the roster renders at the bottom.

## Open choice

I recommend **demote + move to bottom** (above). If you'd rather **remove the roster entirely**, I'll drop both the top block and the bottom section and keep only the compact count line — say the word and I'll adjust the plan.