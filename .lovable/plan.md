# Recruit volunteer engineers — neutral, founder-invisible

Goal: a LinkedIn post that recruits **engineers in Venezuela** to help families after an earthquake, without it reading as self-promotion. Reinforce the same "volunteer collective / community project" voice inside the app so the post, link preview, and `/voluntarios` page all feel like a shared initiative — not one person's project.

How the help actually works (corrected): after a resident finishes their self-evaluation and **requests help**, they're matched with a verified engineer. The engineer can help **remotely first — typically a video call** — and **optionally** follow up with an in-person visit when feasible. The messaging leads with remote/tele-help, not the physical visit.

The app already helps: there is **no personal name** anywhere (license, contact, and copy use "EvalúaYa"), and the footer already says "Community-built open-source project." We lean into that.

## Part 1 — LinkedIn post (the deliverable, no code)

Two ready-to-paste drafts in a neutral "the project / families need" voice — no "I built this." You post it as a share, not as the creator.

**Draft A — Spanish primary (recommended, short EN tail)**

```text
🇻🇪 Ingenieros en Venezuela: se buscan voluntarios.

Tras un sismo, miles de familias no saben si es seguro quedarse en casa.
EvalúaYa es una herramienta comunitaria y gratuita que las guía en una
autoevaluación inicial. Cuando una familia lo solicita, se conecta con un
ingeniero voluntario que la orienta — primero de forma remota, por
videollamada, y si hace falta, con una visita presencial.

El proyecto busca ingenieros y organizaciones en Venezuela dispuestos a
dedicar un poco de tiempo para acompañar a sus vecinos.

Lo que implica:
• Registro en minutos, sin costo
• Validación de credenciales (CIV / título)
• Recibes solicitudes de tu propio estado
• Orientas por videollamada o WhatsApp; visita presencial si es posible

Si eres ingeniero(a) estructural o civil en Venezuela —o conoces a
alguien— súmate o comparte:
👉 https://evaluaya.app/voluntarios

Es un esfuerzo voluntario, abierto y sin fines de lucro. Cada ingeniero
que se suma es una familia más que duerme tranquila. 🧡

#Venezuela #IngenieríaCivil #IngenieríaEstructural #Voluntariado #Sismo
```

**Draft B — Shorter / bilingual**

```text
Se buscan ingenieros voluntarios en Venezuela 🇻🇪

EvalúaYa ayuda a familias a autoevaluar el daño estructural de su casa
tras un sismo. Cuando lo piden, las conectamos con un ingeniero que las
orienta por videollamada — y, si es necesario, con una visita presencial.
Gratis, validado y por tu propio estado.

Súmate o comparte 👉 https://evaluaya.app/voluntarios

—

Volunteer structural/civil engineers wanted in Venezuela. After a family
asks for help, guide them remotely over a video call — and visit in person
if needed. A free, open, nonprofit effort.
```

Tips to keep distance from you personally: open with the need (not "I made"), use "el proyecto / EvalúaYa busca" instead of "busco," optionally add a one-line comment like "Comparto esta iniciativa comunitaria," and avoid first-person ownership in the caption.

## Part 2 — In-app copy tweaks (reinforce collective voice + remote-first help)

Small, presentation-only string edits in `src/lib/i18n.tsx` (ES + EN) so anyone arriving from the post sees a matching, founder-invisible, remote-first message.

1. **`vol.subtitle`**: collective framing + correct flow. ES e.g. "Iniciativa comunitaria. Cuando una familia lo solicita tras su autoevaluación, la orientas — primero por videollamada y, si hace falta, con una visita presencial."
2. **`vol.how3`**: clarify that requests come from residents after they ask for help, and that help starts remotely (video call/WhatsApp) with an optional in-person visit.
3. **`engineers.recruitDesc`** (and connect/validate descriptions if needed): phrase around "este esfuerzo voluntario / el proyecto," never an individual.
4. **OG description for `/voluntarios`** (`src/routes/voluntarios.index.tsx` `head()`): update to the same remote-first, nonprofit-collective wording so the LinkedIn link preview reinforces it.
5. **Footer note** (`footer.note`): already "Community-built open-source project / Proyecto comunitario" — keep as-is.

No changes to logic, schema, server functions, or attribution — there is no personal name to remove. Purely copy.

## What we deliberately do NOT do
- No new "About me / founder" page.
- No fabricated org names or fake team claims (keep it honestly "a volunteer/community effort").
- No over-emphasis on physical visits — remote/video help leads.
- No backend, auth, or data changes.

## Technical notes
- Files touched: `src/lib/i18n.tsx` (4–5 string pairs, ES + EN) and `src/routes/voluntarios.index.tsx` (`head()` description only).
- All strings flow through the existing `t()` i18n system, so both languages stay in sync.
