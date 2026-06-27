# Hide engineer directory — residents only file a request

## Goal
On the analysis result page, residents should **not** see a list of volunteer engineers or be able to WhatsApp them directly. They should only be able to **submit a help request**, with the message **pre-filled from their own AI analysis** so it's one tap to send. Engineers continue to get notified and **claim** open requests from their private panels — exactly the current claim flow, unchanged.

## What changes for the user
- The "verified engineers available" list with green WhatsApp buttons disappears from the result page.
- A single, clear "Request a verified engineer" card remains, with the message box already filled in from the analysis (risk level + key findings). The resident can edit it, adds their WhatsApp, and sends.
- After sending: same confirmation as today ("an engineer will contact you soon").
- Engineers see no change on their side — new requests still arrive by email/digest and are claimed from their dashboard.

## Implementation

### 1. `src/components/ConnectEngineers.tsx`
- Remove the engineer directory entirely: the `fetchEngineers`/`useEffect` load, the `engineers` state, the `hasEngineers` rendering block, and the `contactEngineer` / `revealEngineerContact` two-tap WhatsApp logic (`confirmingId`, `revealingId`).
- Drop the `getApprovedEngineersForState` and `revealEngineerContact` imports/usage from this component.
- Always render the request form (no more `hasEngineers` branching for title/body copy — use the single request-oriented copy).
- Pre-fill the `note` field on mount from the existing AI result (`record.aiResult`): a short resident-voice message combining risk level + the top 2–3 `findings` (e.g. "Mi evaluación salió en nivel ROJO. Hallazgos: grietas en columnas; …"). This reuses the analysis that already ran — no new AI call, instant, no extra credits. The field stays editable and capped at 600 chars.

### 2. Copy — `src/lib/i18n.tsx` (ES + EN)
- Reframe `connect.title` / `connect.subtitleRed` / `connect.subtitleYellow` from "talk to an engineer" to "request a verified engineer will review your case and contact you."
- Keep `connect.reassure`, the form labels, `requestCta`, `requestDone`, `privacy`, and `areEngineer`.
- Retire now-unused directory keys (`directTitle`, `coversYourState`, `whatsappEngineer`, `revealConsent`, `revealing`, `revealError`, `orgBadge`, and the `noneTitle`/`noneBody` empty-state pair) — or leave them in place unused. Recommend removing to keep the file clean.
- Add a prefill template string (e.g. `connect.notePrefill`) used to build the pre-filled message in both languages.

### 3. Server — no functional change required
- `submitHelpRequest` already inserts the request as `open`, notifies covering engineers by email, and alerts the admin. This stays as-is, so the "engineers claim as they get notified" behavior is already satisfied.
- `getApprovedEngineersForState` and `revealEngineerContact` server functions are left in place (still referenced by the engineer/admin side); they simply stop being called from the resident result page. No migration needed.

## Notes / decisions
- Pre-fill reuses the stored `aiResult` rather than making a fresh AI request, since the analysis output is already AI-generated and present on the record. If you'd prefer a freshly AI-composed message instead, that's a small add-on (a `createServerFn` calling Lovable AI), but it adds latency and credits for little gain.
- No database or RLS changes.
