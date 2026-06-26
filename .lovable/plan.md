# Fix: "Escribir al residente" WhatsApp link fails

## What's happening
Daniel (an approved volunteer) taps **Escribir al residente** in his engineer panel and WhatsApp shows *"This link couldn't be opened. Check the link and try again."*

## Root cause
Residents type their number in local Venezuelan format. The field placeholder literally says `Ej.: 0414 123 4567`. We store it as digits-only (`normalizePhone` just strips non-digits), so it becomes `04141234567`. WhatsApp links (`https://wa.me/<number>`) require the **full international number with country code and no leading zero** — `584141234567`. A leading-zero local number is invalid, which is exactly the error Daniel sees.

This affects every `wa.me` link built from a resident number (engineer panel and any resident-facing flow), and the same weakness exists for engineer numbers entered locally.

## The fix

Introduce one robust phone normalizer that converts a number to WhatsApp/E.164 form, defaulting to Venezuela (country code `58`) since residents are in-country:

```text
- strip everything but digits
- if it already starts with 58 and is long enough  -> keep as-is
- if it starts with 0 (local)                      -> drop the 0, prepend 58
- if it's a 10-digit local mobile (starts with 4)  -> prepend 58
- otherwise (already has another country code)      -> keep as-is
```

Engineers abroad (like Daniel) who enter a full international number are preserved, while Venezuelan locals get the `58` prefix.

### Where it's applied

1. **Storage (server) — `src/lib/volunteers.functions.ts`**
   - Replace the digits-only transform on the resident `whatsapp` field (`submitHelpRequest`) with the new normalizer, so new requests are stored in correct international form.
   - Apply the same normalizer to the engineer `whatsapp` field (`submitEngineerSignup`) for consistency.

2. **Link build sites (defensive) — so already-saved bad rows also work**
   - `src/routes/voluntarios.panel.$token.tsx` `contactResident()` — normalize before building the `wa.me` URL.
   - `src/components/ConnectEngineers.tsx` `contactEngineer()` — normalize the revealed engineer number before building the `wa.me` URL.

3. **Backfill existing data**
   - Run a one-time update on `help_requests.resident_whatsapp` (and `volunteer_engineers.whatsapp`) to convert already-stored local numbers (leading `0` / 10-digit) to the `58…` form, so historical requests like Daniel's open instead of erroring.

4. **Clarify the input UX (small copy tweak)**
   - Update the Spanish/English placeholders and helper text so residents understand a country code is handled automatically (e.g. show `+58` context), reducing future malformed entries. No layout change.

## Technical notes
- The normalizer lives in `volunteers.functions.ts` (server) and a tiny shared client copy used at the two link sites — or a single exported helper imported by both. Keep it dependency-free (no libphonenumber) to stay edge/Worker-safe.
- Validation still enforces a 7–15 digit length after normalization.
- No schema changes; only a data backfill + code.

## Verification
- Submit a help request with `0414 1234567`; confirm it stores as `584141234567`.
- Open the engineer panel and confirm **Escribir al residente** launches WhatsApp to the correct chat.
- Confirm an engineer-entered international number (e.g. Argentine `+54 9 11…`) is left untouched.
