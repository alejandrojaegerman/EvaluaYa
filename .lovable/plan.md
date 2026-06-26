## Two changes

### A. Distinct social preview image for `/voluntarios`

Today the volunteers page overrides title/description/URL but inherits the **general** site image from `__root.tsx`'s `og:image`. We'll give it its own.

1. **Generate** a branded volunteers preview image (1200×630, `public/og-voluntarios.jpg`) — on-brand teal (`#0f3443`), themed around volunteer engineers/organizations helping families assess post-earthquake damage, with the EvalúaYa wordmark and a short Spanish headline (e.g. "Ingenieros y organizaciones voluntarias").
2. **Add leaf-level tags** to `head()` in `src/routes/voluntarios.index.tsx`: `og:image`, `twitter:image` (absolute URL via the existing `absoluteUrl()` helper), and `twitter:card: summary_large_image`. Because TanStack merges `meta` by `property`/`name`, these override the root image for this route only — every other route keeps the general image.

### B. Let organizations/companies join (not just individual engineers)

Per your choices: a **type toggle at the top** of the form, and orgs live in the **same matching pool with their org name shown**.

**Data model** (migration on `public.volunteer_engineers`):
- Add `volunteer_type text NOT NULL DEFAULT 'individual'` with a check constraint allowing `'individual'` / `'organization'`. Existing rows default to `individual`.

**Signup form** (`src/routes/voluntarios.index.tsx`):
- Add a segmented toggle at the top: **"Ingeniero individual" / "Organización"**.
- Individual (unchanged): Name (engineer) required, Organization optional, Specialization, WhatsApp, Email, States, Note.
- Organization: **Organization name required**, **Contact person** required, fields relabeled (e.g. Specialization → "Áreas de especialización / servicios"); same WhatsApp/Email/States/Note.
- Field validation adapts to the selected type before submit.

**Server function** (`src/lib/volunteers.functions.ts`):
- Extend `signupSchema` with `volunteerType: 'individual' | 'organization'` and make `organization` required when type is `organization`.
- Persist `volunteer_type` on insert (status stays `pending` → admin review unchanged).

**Matching / display** (same pool, show org name):
- Include `volunteer_type` in the `get_approved_engineers` RPC and the `PublicEngineer` DTO so orgs can show an "Organización" badge.
- In the resident-facing match UI (`ConnectEngineers`) and the admin/panel views, surface the organization name prominently and tag organizations with a small badge. Individuals render as today.

**i18n** (`src/lib/i18n.tsx`): add ES + EN keys for the toggle labels, the organization-specific field labels/placeholders, and the "Organización" badge.

## Technical notes
- Updating the RPC's return signature requires `CREATE OR REPLACE FUNCTION` in the migration (it already has `SET search_path` and is service-role only — keep that).
- After deploy, social platforms cache previews; the new volunteers image won't show on already-scraped links until each platform re-fetches (forceable via their link-preview debuggers).

## Out of scope
- No changes to other routes' preview images.
- No auth/login changes; signups remain public + admin-approved.
