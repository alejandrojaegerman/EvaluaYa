# Make EvalúaYa MIT open source (repo-only)

Goal: license the codebase under MIT so anyone can reuse it, with **no visible change** to the running app or its UI.

## Changes

1. **Add `LICENSE`** — Standard MIT license text in the project root, copyright `2026 EvalúaYa`. (No repo URL was provided, so the license stays generic; we can add the GitHub URL later once a repo exists.)

2. **Add `README.md`** — Concise project README: what EvalúaYa is (post-earthquake structural self-assessment PWA for Venezuela, bilingual ES/EN), tech stack (TanStack Start, Tailwind v4, Lovable Cloud/Supabase), local dev commands, and an MIT license note. This is the standard place a license is surfaced for open source — it does not touch the app UI.

3. **Update `package.json`** — Set `"license": "MIT"`. Leave `"private": true` as-is unless you intend to publish the package to npm (open source ≠ npm-published; the GitHub repo being public is what makes it open source). I'll note this but not flip it without your say.

4. **Update `public/llms.txt`** — Add a one-line note that the project is MIT-licensed (machine-readable surface only, not user-facing UI).

## Explicitly NOT changed
- No footer link, badge, banner, or any other on-screen UI element.
- No changes to routes, components, styles, or copy in `src/lib/i18n.tsx`.
- No new dependencies.

## Notes
- Making the code "open source" in practice also requires the **GitHub repo to be public** (Plus menu → GitHub). The files above make the license intent explicit; repo visibility is a separate toggle on GitHub you control.
- If you later want the standard subtle "MIT" link in the footer, that's a one-line follow-up.
