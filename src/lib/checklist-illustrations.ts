import type { ChecklistItemId } from "@/lib/assessment-types";

import foundation from "@/assets/checklist/foundation.jpg";
import liquefaction from "@/assets/checklist/liquefaction.jpg";
import exterior_walls from "@/assets/checklist/exterior_walls.jpg";
import pounding from "@/assets/checklist/pounding.jpg";
import interior_walls from "@/assets/checklist/interior_walls.jpg";
import columns_beams from "@/assets/checklist/columns_beams.jpg";
import doors_windows from "@/assets/checklist/doors_windows.jpg";
import roof from "@/assets/checklist/roof.jpg";
import stairs from "@/assets/checklist/stairs.jpg";
import flooring from "@/assets/checklist/flooring.jpg";
import plumbing from "@/assets/checklist/plumbing.jpg";
import electrical from "@/assets/checklist/electrical.jpg";
import fixtures from "@/assets/checklist/fixtures.jpg";

/**
 * Two-panel line illustrations (❌ damage vs ✅ healthy) for each checklist item.
 * Used inside the "¿Cómo se ve?" toggle to make the inspection accessible to
 * residents who may not know the technical terms.
 */
export const CHECKLIST_ILLUSTRATIONS: Record<ChecklistItemId, string> = {
  // 4+1 flow reuses the closest legacy illustration
  walls: interior_walls,
  columns: columns_beams,
  openings: doors_windows,
  tilt: foundation,
  foundation,
  liquefaction,
  exterior_walls,
  pounding,
  interior_walls,
  columns_beams,
  doors_windows,
  roof,
  stairs,
  flooring,
  plumbing,
  electrical,
  fixtures,
};
