# EvalúaYa (AssessNow)

A mobile-first PWA for **post-earthquake structural damage self-assessment** in Venezuela. Bilingual UI — Spanish primary, English secondary.

Residents (or neighbors and relatives helping someone in a shelter) run a guided, room-by-room inspection checklist with optional photos. Submissions are analyzed to return a color-coded risk level (🟢 Green / 🟡 Yellow / 🟠 Orange / 🔴 Red) with plain-language findings and recommended next steps (stay / limit use / evacuate). No login is required, and the app works on low-bandwidth connections. Verified volunteer engineers and organizations can sign up and be connected with residents who request help.

## Features

- Property info + guided inspection checklist with optional photo upload
- AI-assisted structural triage combined with deterministic safety rules (ATC-20-style) and USGS ShakeMap seismic context
- Color-coded result card with key findings and next steps
- PDF summary to share with an engineer or authorities
- Interactive damage map by municipality
- Volunteer-engineer recruitment, validation, and matching
- Optional lightweight account (passwordless magic link) to revisit saved reports
- Offline-safe submission queue (IndexedDB outbox)

## Tech stack

- [TanStack Start](https://tanstack.com/start) (React 19, SSR) + Vite 7
- Tailwind CSS v4
- Lovable Cloud (Supabase) for database, storage, and auth
- Lovable AI Gateway for vision/triage analysis

## Local development

```bash
bun install
bun dev          # start the dev server
bun run build     # production build
bun run test      # unit tests (Vitest)
bun run test:e2e  # end-to-end tests (Playwright)
```

Environment variables for the backend (Supabase URL/keys, etc.) are provided by the hosting environment.

## License

Released under the [MIT License](./LICENSE).
