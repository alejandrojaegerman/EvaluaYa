import type { ChecklistItemId } from "@/lib/assessment-types";

/**
 * Glossary terms (tap-to-define) shown alongside each checklist item. Keys map
 * to i18n entries `glossary.<term>.term` and `glossary.<term>.def`.
 */
export const CHECKLIST_GLOSSARY: Partial<Record<ChecklistItemId, string[]>> = {
  foundation: ["cimientos"],
  liquefaction: ["licuefaccion"],
  exterior_walls: ["grieta_diagonal"],
  pounding: ["golpeteo"],
  columns_beams: ["columna", "viga", "cabilla"],
  roof: ["pandeo"],
  flooring: ["rodapie", "pandeo"],
  electrical: ["breaker", "tomacorriente"],
};
