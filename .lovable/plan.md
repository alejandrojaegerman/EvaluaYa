# Slack alerts for EvalúaYa

Route loud, deep-linked Slack messages for every key event to a single channel, and move the internal/admin notifications off email and onto Slack. Resident- and engineer-facing emails stay exactly as they are.

## What you'll get

One Slack channel that lights up on:

- **New high-risk assessments** (Red/Orange) — a neighbor finished a self-evaluation that flagged danger. Red gets an `@channel` ping so it's impossible to miss. Links straight to the report.
- **Help requests** — a resident requested an engineer, and again when a request is marked resolved. Links to the admin triage panel.
- **Volunteers** — a new engineer/organization signed up, and when one is approved. Links to volunteer review.
- **Feedback + funnel alerts** — new feedback submissions, and the existing hourly conversion-drop watchdog. Links to the admin dashboard.

Every message is formatted with a colored risk tag, location, any note, and a button that opens the exact right page in the app.

## Channel & connection

```text
Event happens  ->  sendSlackNotification()  ->  Slack connector gateway  ->  #your-channel
                         |
                         +-- builds a Block Kit message with a deep-link button
```

- Connect the **Slack** connector (you'll pick which workspace/connection to use).
- You tell me the channel name (e.g. `#evaluaya-alertas`); I store it as config. The Slack bot is already present in all public channels, so no manual invite is needed for a public channel. (For a private channel, you'd invite the bot once.)

## Events → message → destination

| Event | Where it fires | Slack links to |
|---|---|---|
| High-risk assessment (Red/Orange) | `analyzeAssessment` (new hook) | `/a/{publicId}` (the report) |
| New help request | `createHelpRequest` (replaces admin email) | `/admin/voluntarios` |
| Help request resolved | `updateRequestProgress` (replaces admin email) | `/admin/voluntarios` |
| New volunteer signup | volunteer signup (replaces admin email) | `/admin/voluntarios` |
| Volunteer approved | approve flow (new FYI post) | `/admin/voluntarios` |
| New feedback | `submitFeedback` (replaces admin email) | `/admin` |
| Funnel/conversion drop | hourly funnel watchdog (replaces admin email) | `/admin` |

## Email behavior

- **Admin-only emails become Slack-only**: new help request, help resolved, volunteer signup, feedback, funnel alert, and the daily admin help digest.
- **Untouched (still email)**: resident magic links/reports, engineer request notifications, engineer approval email, engineer digests, and all auth emails.

This means the admin inbox goes quiet and Slack becomes the live ops feed, exactly as requested.

## Technical details

- New helper `src/lib/slack-notify.server.ts`:
  - `sendSlackNotification({ kind, title, fields, url, urgent })` posts via the Lovable connector gateway (`POST https://connector-gateway.lovable.dev/slack/api/chat.postMessage`) with `Authorization: Bearer ${LOVABLE_API_KEY}` and `X-Connection-Api-Key: ${SLACK_API_KEY}`.
  - Reads target channel from a `SLACK_NOTIFY_CHANNEL` config value.
  - Builds Block Kit blocks: header with emoji, a fields section (risk tag with 🟢🟡🟠🔴, location, note), and an actions block with a URL button. `urgent` (Red) prepends `<!channel>` and sets `link_names`.
  - Fully fail-safe: missing env or gateway errors are logged and swallowed, never blocking the user flow (mirrors the existing best-effort email pattern).
  - Links built from the existing `APP_ROOT`/`absoluteUrl` helpers with `utm_source=slack`.
- Wire-up points (all wrapped in try/catch, awaited best-effort):
  - `src/lib/assessment.functions.ts` — after a successful insert, if `finalRisk` is `red`/`orange`, post to Slack.
  - `src/lib/volunteers.functions.ts` — swap the three admin `sendSystemEmail` calls (`admin-help-new`, `admin-help-resolved`, `volunteer-signup-notification`) for `sendSlackNotification`; add an FYI post in the approve flow (keep the engineer-facing `volunteer-approved` email).
  - `src/lib/feedback.functions.ts` — swap `feedback-notification` admin email for Slack.
  - `src/lib/funnel-alert.server.ts` — swap `funnel-alert` admin email for Slack.
  - `src/lib/admin-help-digest.server.ts` — post the daily digest summary to Slack instead of email.
- No new tables, no schema changes, no client-side code. All work runs in existing server functions / cron-driven server helpers, so it's same-origin and low-bandwidth-safe.
- Build verified with a typecheck.

## Open item I'll confirm during build

The exact channel name to post to (e.g. `#evaluaya-alertas`). I'll connect Slack first, then wire the channel in.