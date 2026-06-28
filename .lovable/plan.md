# Add contacto@evaluaya.app contact email

Two parts: a one-time DNS setup you do at Cloudflare (I guide, you click), and the in-app changes (I build).

## Part 1 — Email forwarding (you do this, I guide)

Lovable only *sends* email (via `notify.evaluaya.app`). To *receive* mail at `contacto@evaluaya.app`, set up free forwarding with Cloudflare Email Routing. This touches the **root `evaluaya.app`** zone and does not conflict with Lovable's `notify.` subdomain.

Steps:
```text
1. Ensure evaluaya.app is on Cloudflare (domain added as a zone).
   - If your registrar manages DNS, you'd move DNS to Cloudflare (free)
     or instead use your registrar's own forwarding / ImprovMX.
2. Cloudflare dashboard → evaluaya.app → Email → Email Routing → Enable.
3. Cloudflare auto-adds the required MX + TXT (SPF) records. Approve them.
4. Under "Routing rules", add a custom address:
      contacto@evaluaya.app  →  Destination: your-personal@inbox.com
5. Cloudflare emails your personal inbox a verification link — click it.
6. Send a test from another account to contacto@evaluaya.app to confirm.
```
Notes:
- Keep Lovable's existing `notify.evaluaya.app` NS records untouched — Email Routing on the root zone is independent.
- Cloudflare Email Routing is receive/forward only (inbound). Outbound app mail keeps going through Lovable. Replies you send from your personal inbox will come from your personal address unless you also configure "Send as" in your mail client.

## Part 2 — Surface the address in the app (I build)

Present `contacto@evaluaya.app` as a clickable link that opens the user's mail app pre-addressed with a subject, in two places.

### Footer (site-wide)
Add a small "Contact" entry to the existing Legal column (or a short contact line in the bottom bar) in `src/components/Footer.tsx`:
```text
Legal
  Privacidad
  contacto@evaluaya.app   ← mailto with prefilled subject
```

### Help / Ayuda page
In the existing "still need help" section of `src/routes/ayuda.tsx`, add a direct email option alongside the feedback button:
```text
[ Enviar comentarios ]  (existing)
[ Escríbenos: contacto@evaluaya.app ]  ← new, mailto link
```

### Mailto format
```
mailto:contacto@evaluaya.app?subject=Consulta%20%E2%80%94%20Eval%C3%BAaYa
```
- ES subject: `Consulta — EvalúaYa`
- EN subject: `Inquiry — EvalúaYa`

### Bilingual strings
Add keys to `src/lib/i18n.tsx` (ES + EN), e.g.:
- `footer.contact` → "Contacto" / "Contact"
- `help.emailUs` → "Escríbenos por correo" / "Email us"
- `contact.subject` → "Consulta — EvalúaYa" / "Inquiry — EvalúaYa"

The existing Privacy page references stay as-is (already correct).

## Technical notes
- No backend or schema changes; pure presentation + i18n.
- A reusable subject-building helper keeps the mailto consistent across both spots.
- Address is rendered as a normal `<a href="mailto:...">`, styled to match existing footer/help links.
