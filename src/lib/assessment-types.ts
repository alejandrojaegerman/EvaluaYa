export type RiskLevel = "green" | "yellow" | "red";

export type AnswerValue = "yes" | "no" | "unsure";

export type BuildingType = "house" | "apartment" | "commercial";

export type BuildingAge = "pre1970" | "1970to2000" | "post2000";

export type ChecklistItemId =
  | "foundation"
  | "exterior_walls"
  | "interior_walls"
  | "columns_beams"
  | "doors_windows"
  | "roof"
  | "stairs";

export type ChecklistItemDef = {
  id: ChecklistItemId;
  /** lucide-react icon name reference handled in the component */
  icon: string;
};

export const CHECKLIST_ITEMS: ChecklistItemDef[] = [
  { id: "foundation", icon: "Layers" },
  { id: "exterior_walls", icon: "Building2" },
  { id: "interior_walls", icon: "Square" },
  { id: "columns_beams", icon: "Columns3" },
  { id: "doors_windows", icon: "DoorOpen" },
  { id: "roof", icon: "Home" },
  { id: "stairs", icon: "Footprints" },
];

export type PropertyInfo = {
  address: string;
  /** Coarse location only — estado / municipio. Drives the public map. */
  state?: string;
  municipality?: string;
  buildingType: BuildingType;
  floors: number;
  age: BuildingAge;
};

/** Max photos a resident can attach per checklist item. */
export const MAX_PHOTOS_PER_ITEM = 3;

export type ChecklistAnswer = {
  id: ChecklistItemId;
  value: AnswerValue;
  /** stored storage paths once uploaded (server side) */
  photoPaths?: string[] | null;
  /** legacy single-photo field (older records) — read-only compat */
  photoPath?: string | null;
};

/** Answer enriched with the in-browser photo data urls (draft only) */
export type DraftAnswer = ChecklistAnswer & {
  photoDataUrls?: string[];
  /** legacy single-photo draft field — read-only compat */
  photoDataUrl?: string | null;
};

export type AiResult = {
  risk_level: RiskLevel;
  summary: string;
  findings: string[];
  next_steps: string[];
};

export type AssessmentRecord = {
  publicId: string;
  language: "es" | "en";
  property: PropertyInfo;
  answers: ChecklistAnswer[];
  aiResult: AiResult;
  riskLevel: RiskLevel;
  createdAt: string;
  /** signed urls per item id; may contain multiple photos per item */
  photoUrls: Record<string, string[]>;
};
