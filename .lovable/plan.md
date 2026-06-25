# Logic Validation Document for the Expert (English PDF)

## Goal
Give your expert a short, plain-English PDF that answers one question: **"Exactly when does the app say Green, Yellow, or Red?"** — with every statement traced to the actual code, but written so someone with limited coding ability can read and validate it. No code excerpts, no GitHub, no verbose prompt dumps. This replaces the broad spec PDF with a tight, decision-focused document.

## What the document will say (this IS the logic, pulled from the code)

The app decides risk in two layers, then takes the **more severe** of the two — rules can only push the level *up*, never down (`finalRisk = maxRisk(ai, rules)`).

**Layer 1 — Hard safety rules (deterministic, in `safety-rules.ts`)**

Force **RED** (unsafe to enter) if ANY of these are true:
- Structural system is **unreinforced masonry (URM)**
- Resident answered **YES** to ground **liquefaction** signs
- Resident answered **YES** to **pounding** with a neighboring building
- Resident answered **YES** to severe **plumbing / gas** damage

Force **at least YELLOW** (extra caution) if ANY of these are true:
- ShakeMap shaking **intensity (MMI) ≥ 7** at the building's location
- Building has **more than 7 floors**
- Structural system is **CMF, CIW, PCF, or RML**

If no rule fires, Layer 1 contributes **Green** (no floor raised).

**Layer 2 — AI visual triage (the model, guided by `SYSTEM_PROMPT`)**
- **Green** — no significant structural damage; appears safe to occupy
- **Yellow** — possible/moderate damage; limited use only
- **Red** — serious damage or collapse signs; evacuate
- Plain-language summary of the AI's decision cues (foundation shifts, diagonal exterior cracks/separation, spalling concrete with exposed rebar, roof deformation/collapse, stairs separating from walls → Yellow/Red; damaged flooring, electrical, hanging fixtures → at least Yellow), and the explicit instruction to "be conservative — never choose Green when life-safety is uncertain."

**Final decision — `maxRisk()`**
- A small worked table: e.g. AI says Green but URM is selected → final **RED**; AI says Yellow but liquefaction = YES → final **RED**; AI says Green, 9 floors → final **YELLOW**; AI says Yellow, no rules fire → final **YELLOW**. Shows rules override upward only.

**Inputs that feed the decision**
- The 13 checklist questions (exact wording), which are structural vs. optional utilities, and the property inputs (building type, structural system, floors, age, auto-detected MMI). Only the items that actually drive a rule are flagged so the expert sees which answers matter.

**Limits / disclaimers**
- Self-report + surface photos only, preliminary, not a certification, licensed-engineer confirmation required.

## Format & structure
- One clean **English PDF**, ~3–5 pages, generated with Python + ReportLab.
- Layout for a non-coder: short sections, a **decision table** for the hard rules (Condition → Forced level → Why), the AI's three-level definitions, the merge table, and a checklist-questions appendix.
- Each rule line carries a quiet source tag (e.g. *source: safety-rules.ts*) so it's auditable without being code.
- Branded lightly to match the app (EvalúaYa name, risk colors Green/Yellow/Red used as accents).

## Delivery
- Saved to `/mnt/documents/evaluaya-logic-validation.pdf` and surfaced as a downloadable artifact in chat so you can forward it directly to the expert.
- After generating, every page is rendered to images and visually QA'd (no clipped text, correct colors, tables aligned) before delivery.

## Technical notes
- Content is transcribed faithfully from `safety-rules.ts` (rule conditions + thresholds), `assessment.functions.ts` (`SYSTEM_PROMPT` levels and `maxRisk` merge), `assessment-types.ts` (checklist + property schema), and `shakemap.ts` (MMI source). If the code changes later, the doc must be regenerated.
- This is a standalone document only — no changes to the app, the methodology page, or the assessment logic itself.

## Out of scope
- No edits to app code or the existing `/metodologia` page (can add a download link later if you want).
- No changes to the assessment algorithm.
