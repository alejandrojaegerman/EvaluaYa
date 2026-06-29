## Goal

Strip social-proof clutter from `/voluntarios` and keep the page laser-focused on converting potential volunteers. Remove the volunteer count chip under the hero and the full verified-engineers roster at the bottom.

## Changes — `src/routes/voluntarios.index.tsx`

- **Remove the top count chip**: delete the `<VerifiedCount engineers={engineers} />` render (line ~222) and delete the `VerifiedCount` component definition (lines ~601–618).
- **Remove the bottom roster**: delete the `<VerifiedEngineers engineers={engineers} />` render (line ~560) and delete the `VerifiedEngineers` component definition (lines ~620–717), plus the now-unused `initials`, `TIER_STYLE`, and `TierBadge` helpers.
- **Clean up the loader**: drop `getAllApprovedEngineers` from the loader so the page no longer fetches the engineer list; keep `getImpactRanking` (still used for the featured-states chips in the form). Loader returns just `{ ranking }`, and the component reads only `ranking`.
- **Prune imports** that become unused: `getAllApprovedEngineers`, `VerifiedEngineer`, `RecognitionTier`, `ShieldCheck`, `Award`, and any others left dangling after the deletions.

## Result

The page flow becomes: hero → sign-up form (with featured-state chips) → the recruit/validate/connect pillars and how-it-works steps → resident note. No volunteer counts or roster anywhere, putting full emphasis on the call to action.

## Notes

- The verified-engineers roster still exists in the admin panel (`/admin/voluntarios`) — this only removes it from the public recruiting page.
- Pure presentation change; no backend or i18n changes required (leftover `vol.verified*` keys can stay unused).
