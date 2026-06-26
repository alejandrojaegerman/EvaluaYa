export type RiskLevel = "green" | "yellow" | "red";

export type AnswerValue = "yes" | "no" | "unsure";

export type BuildingType = "house" | "apartment" | "commercial";

export type BuildingAge = "pre1970" | "1970to2000" | "post2000";

/**
 * Structural (lateral-force-resisting) system classification.
 * URM is inherently unsafe after strong shaking; CMF/CIW/PCF/RML warrant
 * extra caution. "unknown" applies no deterministic rule.
 */
export type StructuralType =
  | "URM"
  | "CMF"
  | "CIW"
  | "PCF"
  | "RML"
  | "unknown";

export type ChecklistItemId =
  | "foundation"
  | "liquefaction"
  | "exterior_walls"
  | "pounding"
  | "interior_walls"
  | "flooring"
  | "plumbing"
  | "electrical"
  | "fixtures"
  | "columns_beams"
  | "doors_windows"
  | "roof"
  | "stairs";

/** Inspection groups: core structural checks vs. optional utility checks. */
export type ChecklistSection = "structure" | "utilities";

export type ChecklistItemDef = {
  id: ChecklistItemId;
  /** lucide-react icon name reference handled in the component */
  icon: string;
  /** which group the item belongs to */
  section: ChecklistSection;
  /**
   * Optional items can be skipped without blocking submission. They still feed
   * the AI / safety rules when answered, but don't gate "Analyze".
   */
  optional?: boolean;
};

export const CHECKLIST_ITEMS: ChecklistItemDef[] = [
  { id: "foundation", icon: "Layers", section: "structure" },
  { id: "liquefaction", icon: "Droplets", section: "structure" },
  { id: "exterior_walls", icon: "Building2", section: "structure" },
  { id: "pounding", icon: "Building", section: "structure" },
  { id: "interior_walls", icon: "Square", section: "structure" },
  { id: "columns_beams", icon: "Columns3", section: "structure" },
  { id: "doors_windows", icon: "DoorOpen", section: "structure" },
  { id: "roof", icon: "Home", section: "structure" },
  { id: "stairs", icon: "Footprints", section: "structure" },
  { id: "flooring", icon: "Grid3x3", section: "utilities", optional: true },
  { id: "plumbing", icon: "Wrench", section: "utilities", optional: true },
  { id: "electrical", icon: "Zap", section: "utilities", optional: true },
  { id: "fixtures", icon: "Lightbulb", section: "utilities", optional: true },
];

/** Core items that must be answered before analysis can run. */
export const REQUIRED_ITEM_IDS: ChecklistItemId[] = CHECKLIST_ITEMS.filter(
  (i) => !i.optional,
).map((i) => i.id);

export type PropertyInfo = {
  address: string;
  /** Coarse location only — estado / municipio. Drives the public map. */
  state?: string;
  municipality?: string;
  buildingType: BuildingType;
  /** structural lateral system (drives deterministic safety rules) */
  structuralType?: StructuralType;
  floors: number;
  age: BuildingAge;
  /** auto-detected ShakeMap MMI value at the building's location */
  seismicIntensity?: number;
  /** Roman-numeral label for the MMI (e.g. "VII") */
  seismicIntensityRoman?: string;
  /** peak ground acceleration at the location (g) */
  pga?: number;
  /** peak ground velocity at the location (cm/s) */
  pgv?: number;
  /** site shear-wave velocity vs30 (m/s) */
  vs30?: number;
  /** coarse NEHRP-style soil class derived from vs30 */
  soilClass?: SoilClass;
  /** estimated fundamental period of the building (s) */
  buildingPeriod?: number;
  /** spectral acceleration at the building's period (g) — demand it "felt" */
  spectralDemand?: number;
  /** which spectral band matched the building's period */
  spectralBand?: SpectralBand;
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
