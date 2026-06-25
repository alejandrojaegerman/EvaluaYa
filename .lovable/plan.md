## Goal

Get EvalúaYa ready for a sudden wave of real first users (and the inevitable bots/curious testers) without burning AI credits, leaking storage, or sharing a messy link. The app is feature-complete — this is hardening + launch, not new features.

## 1. Protect the AI endpoint (per-device/IP rate limit)

`analyzeAssessment` is a public, login-free endpoint that uploads a photo, calls the AI (costs credits), and writes to the DB. Under a viral spike or light abuse, this is the main cost/abuse risk.

Important tradeoff: the backend has no built-in rate-limiting primitive and workers are stateless, so an in-memory counter won't work. We'll implement an **ad-hoc, database-backed limiter** (you approved per-device/IP limiting).

- New migration: `public.analysis_rate_limits` table keyed by a hash of (client IP + device id) with a rolling time window and a counter. RLS enabled, **no anon/authenticated policies**, `GRANT` to `service_role` only (all access is server-side).
- In `analyzeAssessment.handler`:
  - Read the caller IP from request headers (`x-forwarded-for`) via `getRequestHeader`, combined with a client-generated device id sent in the payload.
  - Enforce a sane cap (default **6 analyses per hour** per key) using an atomic upsert/window check before any upload or AI call.
  - When exceeded, return a new typed result `{ ok: false, errorCode: "throttled" }` — no AI spend.
- Client (`draft-store` / analyze flow): generate a persistent device id in localStorage and include it in the request.
- `analyze.tsx` + i18n (`i18n.tsx`): add ES/EN copy for the throttled state ("Has alcanzado el límite de análisis por ahora, intenta más tarde") and surface it in the existing error UI.

## 2. Add a server-side payload guard

Client compresses photos, but a malicious caller can bypass that.

- In `analyzeAssessment`, reject any `photoDataUrl` larger than a hard cap (~2.5MB decoded) before uploading/sending to the AI. Tighten the Zod schema with a max length on the data URL.

## 3. Close the storage exposure finding

The scanner flags `assessment-photos` (private bucket) as having no storage policies. In this app every upload/download is brokered exclusively through `service_role` server functions (which bypass RLS), the bucket is private, and no client code ever touches the Storage API directly — so anon/authenticated are already default-denied.

- Re-verify the bucket is private and confirm no client path uses storage directly.
- Mark the finding resolved as not-applicable with that justification and update the security memory to document the access model (private bucket, service-role-only brokered access) so future scans don't re-flag it.

(We won't add policies directly on the managed `storage` schema; default-deny + private bucket already covers it.)

## 4. Credit safety (alerts only)

Per your choice, configure notification-only credit alerts (no auto-block) so a surge warns you before it drains the balance. I'll check existing limits and set/adjust an AI-gateway/workspace usage alert threshold; if no matching limit exists to update, I'll tell you so you can add one in Settings.

## 5. Clean up share metadata

`src/routes/__root.tsx` currently has duplicate/conflicting `description`, `og:description`, and `twitter:description` tags (the disclaimer text got pasted in twice and is truncated). For a link an influencer is spreading, this needs to be clean.

- Remove the duplicate/truncated meta entries; keep one concise, compelling Spanish `description`, `og:description`, and `twitter:description`.
- Keep the existing OG image, title, theme-color, and PWA tags.
- Switch `twitter:card` to `summary_large_image` so the OG image renders large in shares.

## 6. Publish

- Confirm publish visibility is **public** (so anyone with the link can open it — not workspace-only).
- Run a fresh security scan, then publish so the live site at evaluaya.app reflects all the above.

## Technical notes

- Rate-limit table is service-role-only; the limiter runs entirely inside the server function before any spend.
- Device id is a non-PII random token in localStorage; IP is only stored hashed.
- No changes to the assessment flow, UI design, or AI prompt logic beyond the throttle/guard error paths.

## Out of scope

- Login/accounts (app is intentionally anonymous).
- New product features or design changes.
