## Goal
Bring the Ingenieros voluntarios page in line with the realistic, best-effort expectations used elsewhere in the app (matching the "no podemos garantizar respuesta ni tiempo" framing on the resident/help-request side).

## The problem
`src/lib/i18n.tsx` contains a hard guarantee in `vol.subtitle`:

- ES (line 924): "…Cada familia que pide ayuda tras su autoevaluación **siempre recibe la evaluación de un ingeniero voluntario**…"
- EN (line 2216): "…Every family that asks for help after their self-assessment **always gets** a volunteer engineer's assessment…"

This promises a guaranteed engineer evaluation for every request, which the volunteer network cannot ensure.

## Changes (copy only, no logic)

1. **`vol.subtitle` (ES, line 924)** — rewrite to community best-effort language, e.g.:
   "Iniciativa comunitaria. Cuando una familia pide ayuda tras su autoevaluación, compartimos su caso con la red de evaluadores voluntarios. Si hay un voluntario disponible en su zona, la orienta por videollamada y, si hace falta, con una visita presencial. Es un servicio gratuito y depende de la disponibilidad de la comunidad."

2. **`vol.subtitle` (EN, line 2216)** — matching translation with the same best-effort framing (no "always/guaranteed").

3. **Quick sweep of remaining `vol.*` keys** (`vol.how3`, `vol.residentNoteBody`) to confirm they stay descriptive/best-effort — no additional guarantee wording expected, adjust only if a hidden guarantee surfaces.

No changes to components, server functions, or methodology logic — this is a bilingual copy edit in `src/lib/i18n.tsx`.
