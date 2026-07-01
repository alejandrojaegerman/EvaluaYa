import type { SoilClass, SpectralBand } from "./shakemap";

export type RiskLevel = "green" | "yellow" | "orange" | "red";

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
  // 4+1 simplified flow (current)
  | "walls"
  | "columns"
  | "openings"
  | "tilt"
  // consolidated photo carriers (single photo section at the end)
  | "facade"
  | "damage_photos"
  // sub-signals captured by the "señales graves" multi-select
  | "foundation"
  | "liquefaction"
  | "pounding"
  | "plumbing"
  | "roof"
  | "stairs"
  // legacy-only ids (older records) — kept for back-compat display + scoring
  | "exterior_walls"
  | "interior_walls"
  | "flooring"
  | "electrical"
  | "fixtures"
  | "columns_beams"
  | "doors_windows";

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
  // 4+1 simplified flow — display/order for current records
  { id: "walls", icon: "Square", section: "structure" },
  { id: "columns", icon: "Columns3", section: "structure" },
  { id: "openings", icon: "DoorOpen", section: "structure" },
  { id: "tilt", icon: "Building2", section: "structure" },
  // consolidated photo carriers (single photo section)
  { id: "facade", icon: "Building", section: "structure" },
  { id: "damage_photos", icon: "Camera", section: "structure" },
  // severe-sign sub-items (recorded via the "señales graves" multi-select)
  { id: "foundation", icon: "Layers", section: "structure" },
  { id: "roof", icon: "Home", section: "structure" },
  { id: "stairs", icon: "Footprints", section: "structure" },
  { id: "liquefaction", icon: "Droplets", section: "structure" },
  { id: "pounding", icon: "Building", section: "structure" },
  { id: "plumbing", icon: "Wrench", section: "structure" },
  // legacy-only items (older records) — kept for back-compat ordering/display
  { id: "exterior_walls", icon: "Building2", section: "structure" },
  { id: "interior_walls", icon: "Square", section: "structure" },
  { id: "columns_beams", icon: "Columns3", section: "structure" },
  { id: "doors_windows", icon: "DoorOpen", section: "structure" },
  { id: "flooring", icon: "Grid3x3", section: "utilities", optional: true },
  { id: "electrical", icon: "Zap", section: "utilities", optional: true },
  { id: "fixtures", icon: "Lightbulb", section: "utilities", optional: true },
];

/** The four direct yes/no/unsure questions (each with photo upload). */
export const PRIMARY_QUESTION_IDS: ChecklistItemId[] = [
  "walls",
  "columns",
  "openings",
  "tilt",
];

/**
 * Sub-signals captured by the "señales graves" multi-select. Each maps to a
 * civil-engineer-validated deterministic rule. Stored as individual answers so
 * historical records and the data-room analytics keep working unchanged.
 *
 * NOTE: "foundation" intentionally NOT listed here — its signals (cracks +
 * sinking) are already covered by P1 walls and P4 tilt, so asking it again was
 * redundant. The id stays in the type + STRUCTURAL_DAMAGE_IDS so legacy records
 * keep displaying and scoring exactly as before.
 */
export const SEVERE_SIGN_IDS: ChecklistItemId[] = [
  "liquefaction",
  "pounding",
  "plumbing",
  "roof",
  "stairs",
];

/** Direct life-safety RED trigger (new in the 4+1 flow). */
export const TILT_ID: ChecklistItemId = "tilt";

/**
 * Checklist ids whose "yes" indicates observed STRUCTURAL damage (each counts
 * toward the ≥2-systems = red heuristic). Includes both the new 4+1 ids and the
 * legacy ids so old and new records both score correctly — no single record
 * ever contains both generations, so there is no double counting.
 * Note: liquefaction / pounding / plumbing are NOT here; they are their own
 * forced-red triggers.
 */
export const STRUCTURAL_DAMAGE_IDS: ChecklistItemId[] = [
  "walls",
  "columns",
  "openings",
  "foundation",
  "roof",
  "stairs",
  "exterior_walls",
  "interior_walls",
  "columns_beams",
  "doors_windows",
];

/** Core items that must be answered before analysis can run. */
export const REQUIRED_ITEM_IDS: ChecklistItemId[] = PRIMARY_QUESTION_IDS;

export type PropertyInfo = {
  address: string;
  /** Coarse location only — estado / municipio. Drives the public map. */
  state?: string;
  municipality?: string;
  /** Parroquia / parish — finer location below municipio (optional). */
  parroquia?: string;
  /**
   * Optional building / tower name (never the apartment number). Lets multiple
   * evaluations of the same structure be grouped in the community map.
   */
  buildingName?: string;
  buildingType: BuildingType;
  /** structural lateral system (drives deterministic safety rules) */
  structuralType?: StructuralType;
  floors: number;
  /** number of basement / below-grade levels (sótanos) */
  basements?: number;
  /** approximate building age — optional (resident may not know it) */
  age?: BuildingAge;
  /** whether the person submitting lives in the building */
  livesInBuilding?: boolean;
  /** whether the person submitting is part of the condo board (junta de condominio) */
  condoBoardMember?: boolean;
  /** free-text additional comments from the resident (step 2, optional) */
  comments?: string;
  /**
   * Extra context signals the resident checked off in step 2 ("Marca lo que
   * aplique"). Stored as stable keys (e.g. "aftershock", "noises"); resolved to
   * localized sentences when sent to the AI and rendered in the PDF.
   */
  contextTags?: string[];
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

/** Consolidated damage gallery limits (single photo section, step 2). */
export const MAX_DAMAGE_PHOTOS = 10;
export const MIN_DAMAGE_PHOTOS = 5;

/** Facade can carry up to 5 photos (different angles of the whole building). */
export const MAX_FACADE_PHOTOS = 5;

/**
 * Damage-photo classification. Lets the resident tag each photo so the
 * engineer knows what they're looking at. Maps to existing item area labels
 * for captions; "other" is the friction-free default.
 */
export type DamageCategory =
  | "walls"
  | "columns_beams"
  | "doors_windows"
  | "roof"
  | "stairs"
  | "foundation"
  | "plumbing"
  | "other";

export const DAMAGE_CATEGORIES: DamageCategory[] = [
  "walls",
  "columns_beams",
  "doors_windows",
  "roof",
  "stairs",
  "foundation",
  "plumbing",
  "other",
];

export const DEFAULT_DAMAGE_CATEGORY: DamageCategory = "other";

/**
 * Resolve a stored per-photo label (a damage category id) to an i18n key, so
 * captions render in the viewer's language. Returns null for unknown / empty
 * labels (callers should fall back to the item area label).
 */
export function damageCategoryKey(
  label: string | null | undefined,
): string | null {
  if (!label) return null;
  return (DAMAGE_CATEGORIES as string[]).includes(label)
    ? `checklist.cat.${label}`
    : null;
}

export type ChecklistAnswer = {
  id: ChecklistItemId;
  value: AnswerValue;
  /** stored storage paths once uploaded (server side) */
  photoPaths?: string[] | null;
  /** legacy single-photo field (older records) — read-only compat */
  photoPath?: string | null;
  /**
   * Per-photo human labels (category captions), aligned by index to
   * photoPaths. Additive — absent on legacy records. Surfaced to the engineer
   * as the photo caption.
   */
  photoLabels?: (string | null)[] | null;
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
  /** Original risk level before the 4-level retroactive reclassification, if changed. */
  priorRiskLevel?: RiskLevel | null;
  /** "resident" (self-reported) or "professional" (engineer-certified). */
  reportType?: "resident" | "professional";
  createdAt: string;
  /** signed urls per item id; may contain multiple photos per item */
  photoUrls: Record<string, string[]>;
  /** per-photo captions per item id, aligned by index to photoUrls */
  photoCaptions?: Record<string, (string | null)[]>;
  /**
   * Anonymized "same building" context — null when no building name was
   * detected. Counts only; never addresses, photos or report ids.
   */
  building?: {
    name: string;
    /** number of OTHER analyzed reports from the same building */
    others: number;
    peers: { total: number; green: number; yellow: number; orange: number; red: number };
  } | null;
};
