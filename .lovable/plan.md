# Feedback & Help

Add two lightweight, mobile-first, bilingual (ES primary) features: a low-friction **feedback** form that saves to the database and emails you, and a **help center** with an FAQ and a quick-start how-to. Surfaced in the bottom-nav "Más" sheet and on the result page after an assessment. No login required, consistent with the rest of the app.

## 1. Feedback

**Form (minimal, low friction):**
- Single message box (required) + optional email (so you can reply).
- Submit with success confirmation; works without sign-in.
- Captures lightweight context automatically (current page/route, language) to help you triage — no PII beyond the optional email.

**Where it lives:**
- New route `/feedback` with its own page.
- Entry in the "Más" sheet ("Enviar comentarios" / "Send feedback").
- A compact "¿Cómo te fue? / Was this helpful?" prompt on the result card (`/a/$publicId`) that links to `/feedback`.

**What happens on submit:**
- Saved to a new `feedback` table.
- A best-effort notification email is sent to ajaegerman@thinkampersand.com (reusing the existing system-email pipeline). Email failure never blocks the save.

## 2. Help center

- New route `/ayuda` ("Help") page with:
  - **Quick start**: step-by-step how-to for running an assessment (property info → checklist → photos → AI result → share/save), reusing existing iconography.
  - **FAQ**: collapsible accordion covering the most common questions — is it free / no sign-up, does it work offline / low signal, what the Green/Yellow/Red results mean, privacy/anonymity, how to save & access reports later, photos optional, and that it's guidance not an official inspection.
  - Links out to the existing Methodology page and the volunteer-engineer help flow for deeper needs.
- Entry in the "Más" sheet ("Ayuda" / "Help").

## Placement summary

```text
Más sheet:  Voluntarios | Metodología | Ayuda | Enviar comentarios | Language | Status
Result card: small "¿Te resultó útil?" → Send feedback link
```

## Technical details

- **DB migration** — new `public.feedback` table:
  - `id uuid pk default gen_random_uuid()`, `message text not null`, `email text`, `page text`, `language text`, `created_at timestamptz default now()`.
  - GRANT `INSERT` to `anon` + `authenticated` (anonymous submissions, matching app's no-login model); GRANT `ALL` to `service_role`. Enable RLS; INSERT-only policy for anon/authenticated, no public SELECT (admin reads via service role).
- **Server function** `src/lib/feedback.functions.ts` — `submitFeedback` (`createServerFn`, validated with zod: message required ≤2000 chars, email optional/valid ≤255). Inserts via the server publishable (anon) client, then best-effort `sendSystemEmail` to you.
- **Email template** — new `feedback-notification.tsx` in `src/lib/email-templates/` registered in `registry.ts`, Spanish-first, branded teal, showing message + optional reply-to email + page context.
- **Routes** — `src/routes/feedback.tsx` and `src/routes/ayuda.tsx`, each wrapped in `AppShell` with proper `head()` meta (unique title/description, canonical).
- **Nav** — add "Ayuda" and "Enviar comentarios" links to `src/components/BottomNav.tsx` More sheet; add the feedback prompt to `src/routes/a/$publicId.tsx`.
- **i18n** — add bilingual keys (ES/EN) for nav labels, feedback form (heading, placeholder, email label, submit, success/error), and all FAQ/quick-start copy in `src/lib/i18n.tsx`.
- No changes to assessment business logic; FAQ/quick-start are presentation only.
