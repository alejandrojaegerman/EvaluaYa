import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { ESTADO_NAMES } from "./venezuela";
import { engineerPanelUrl } from "./volunteer-links";
import { toWhatsappNumber } from "./phone";
import type { RiskLevel } from "./assessment-types";
import type { TablesUpdate } from "@/integrations/supabase/types";

// ---------------------------------------------------------------------------
// Public DTOs (safe to ship to the browser)
// ---------------------------------------------------------------------------

export type VolunteerType = "individual" | "organization";

export type PublicEngineer = {
  id: string;
  name: string;
  organization: string | null;
  states: string[];
  specialization: string | null;
  volunteerType: VolunteerType;
  coversState: boolean;
};

export type ProgressStage = "claimed" | "contacted" | "visited" | "resolved";

export type EngineerRequest = {
  id: string;
  publicId: string;
  assessmentPublicId: string | null;
  state: string | null;
  municipality: string | null;
  riskLevel: RiskLevel | null;
  /** null until the request is claimed by the viewing engineer */
  residentWhatsapp: string | null;
  note: string | null;
  status: "open" | "claimed" | "closed";
  claimedByMe: boolean;
  createdAt: string;
  /** Progress reported by the engineer handling this request. */
  progressStage: ProgressStage | null;
  engineerNote: string | null;
  progressUpdatedAt: string | null;
  /** Linked assessment review state (null when no assessment is attached). */
  aiRiskLevel: RiskLevel | null;
  priorRiskLevel: RiskLevel | null;
  verified: boolean;
  engineerVerdict: "agree" | "adjust" | null;
};


export type RecognitionTier = "none" | "bronze" | "silver" | "gold";

/** Impact + recognition stats shown on the engineer panel. */
export type EngineerStats = {
  resolved: number;
  claimedActive: number;
  openInArea: number;
  avgResponseSeconds: number | null;
  tier: RecognitionTier;
};

export type EngineerPanel = {
  engineer: {
    name: string;
    organization: string | null;
    states: string[];
    specialization: string | null;
  };
  stats: EngineerStats;
  requests: EngineerRequest[];
};

/** Returned by getEngineerPanel when the access link has expired. */
export type EngineerPanelResult =
  | EngineerPanel
  | { expired: true }
  | null;

/** Public, non-sensitive view of a resident's own help request. */
export type ResidentRequestStatus = {
  state: string | null;
  municipality: string | null;
  riskLevel: RiskLevel | null;
  status: "open" | "claimed" | "closed";
  progressStage: ProgressStage | null;
  progressUpdatedAt: string | null;
  createdAt: string;
  claimedAt: string | null;
  engineerName: string | null;
  engineerNote: string | null;
  assessmentPublicId: string | null;
  residentConfirmedAt: string | null;
  aiRiskLevel: RiskLevel | null;
  priorRiskLevel: RiskLevel | null;
  reportType: string | null;
  engineerVerdict: "agree" | "adjust" | null;
};

export type AdminEngineer = {
  id: string;
  name: string;
  organization: string | null;
  whatsapp: string;
  email: string | null;
  states: string[];
  specialization: string | null;
  note: string | null;
  status: "pending" | "approved" | "rejected";
  accessToken: string | null;
  createdAt: string;
  /** Validation signals captured at signup. */
  licenseNumber: string | null;
  credentialPath: string | null;
  trustScore: number;
  trustFlags: string[];
};

export type AdminHelpRequest = {
  id: string;
  state: string | null;
  municipality: string | null;
  riskLevel: RiskLevel | null;
  status: "open" | "claimed" | "closed";
  note: string | null;
  createdAt: string;
  /** Real lifecycle the engineer reports (null = claimed baseline). */
  progressStage: ProgressStage | null;
  progressUpdatedAt: string | null;
  claimedAt: string | null;
  engineerName: string | null;
  engineerNote: string | null;
  /** Linked assessment review state. */
  assessmentPublicId: string | null;
  aiRiskLevel: RiskLevel | null;
  priorRiskLevel: RiskLevel | null;
  engineerVerdict: "agree" | "adjust" | null;
  reportType: string | null;
  /** Claimed >24h ago with no progress beyond "claimed". */
  stalled: boolean;
  /** How many times the request was auto-reclaimed by the completion engine. */
  reclaimCount: number;
  /** When the resident confirmed the issue was resolved (null = not confirmed). */
  residentConfirmedAt: string | null;
};

export type AdminMatchingProgress = {
  claimedOnly: number;
  contacted: number;
  visited: number;
  resolved: number;
  stalled: number;
  reclaimed: number;
  residentConfirmed: number;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Normalize a phone number to WhatsApp/E.164 digits (no +, spaces or
 * punctuation), defaulting to the Venezuela country code so local numbers like
 * "0414 123 4567" become valid wa.me targets ("584141234567").
 */
function normalizePhone(raw: string): string {
  return toWhatsappNumber(raw);
}

const RISK_ORDER: Record<string, number> = { red: 0, orange: 1, yellow: 2, green: 3 };

/** Constant-ish-time admin secret comparison. */
function adminOk(provided: string): boolean {
  const expected = process.env.VOLUNTEER_ADMIN_SECRET;
  if (!expected) return false;
  if (provided.length !== expected.length) return false;
  let mismatch = 0;
  for (let i = 0; i < expected.length; i++) {
    mismatch |= provided.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return mismatch === 0;
}

// ---------------------------------------------------------------------------
// Engineer signup (public, insert-only)
// ---------------------------------------------------------------------------

const signupSchema = z
  .object({
    volunteerType: z
      .enum(["individual", "organization"])
      .optional()
      .default("individual"),
    name: z.string().trim().min(2).max(120),
    organization: z.string().trim().max(160).optional().default(""),
    whatsapp: z
      .string()
      .trim()
      .max(40)
      .transform(normalizePhone)
      .refine((v) => v.length >= 7 && v.length <= 15, {
        message: "invalid_phone",
      }),
    email: z.string().trim().email().max(255),
    licenseNumber: z.string().trim().max(40).optional().default(""),
    credentialPath: z.string().trim().max(300).optional().default(""),
    states: z
      .array(z.string().trim())
      .min(1)
      .max(ESTADO_NAMES.length)
      .transform((arr) => arr.filter((s) => ESTADO_NAMES.includes(s)))
      .refine((arr) => arr.length >= 1, { message: "invalid_states" }),
    specialization: z.string().trim().max(160).optional().default(""),
    note: z.string().trim().max(1000).optional().default(""),
  })
  .refine(
    (d) => d.volunteerType !== "organization" || d.organization.length >= 2,
    { message: "organization_required", path: ["organization"] },
  );

/** Free webmail domains that don't add professional-identity signal. */
const FREE_EMAIL_DOMAINS = new Set([
  "gmail.com",
  "hotmail.com",
  "yahoo.com",
  "yahoo.es",
  "outlook.com",
  "outlook.es",
  "icloud.com",
  "live.com",
  "proton.me",
  "protonmail.com",
]);

/**
 * Deterministic, automated pre-checks run at signup. Produces a 0–100 trust
 * score and a list of human-readable flags the admin can review before
 * approving. No external registry exists for Venezuelan engineers (CIV), so we
 * score the signals we *can* verify: a plausible license number, an uploaded
 * credential document, and a non-free email domain.
 */
export function runValidationPrechecks(input: {
  licenseNumber: string;
  email: string;
  hasCredential: boolean;
  volunteerType: VolunteerType;
}): { score: number; flags: string[] } {
  const flags: string[] = [];
  let score = 0;

  const lic = input.licenseNumber.replace(/[^0-9a-zA-Z]/g, "");
  if (!lic) {
    flags.push("no_license");
  } else if (!/^[A-Za-z]{0,4}\d{3,8}$/.test(lic)) {
    flags.push("license_format");
    score += 10;
  } else {
    score += 35;
  }

  if (input.hasCredential) {
    score += 40;
  } else {
    flags.push("no_credential");
  }

  const domain = input.email.split("@")[1]?.toLowerCase() ?? "";
  if (domain && !FREE_EMAIL_DOMAINS.has(domain)) {
    score += 15;
  } else {
    flags.push("free_email");
  }

  if (input.volunteerType === "organization") score += 10;

  return { score: Math.min(100, score), flags };
}

const credentialUploadSchema = z.object({
  dataUrl: z.string().trim().min(16).max(8_000_000),
  filename: z.string().trim().max(160).optional().default(""),
});

/** Decode a data: URL into raw bytes + content type (credentials/images/PDF). */
function decodeDataUrl(
  dataUrl: string,
): { buffer: Uint8Array; contentType: string; ext: string } | null {
  const match = /^data:([^;]+);base64,(.*)$/s.exec(dataUrl);
  if (!match) return null;
  const contentType = match[1];
  const allowed: Record<string, string> = {
    "application/pdf": "pdf",
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/heic": "heic",
  };
  const ext = allowed[contentType];
  if (!ext) return null;
  try {
    const binary = atob(match[2]);
    const buffer = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) buffer[i] = binary.charCodeAt(i);
    return { buffer, contentType, ext };
  } catch {
    return null;
  }
}

/**
 * Upload a volunteer credential document to the private engineer-credentials
 * bucket BEFORE the signup row exists. Returns the storage path to attach to
 * the signup. Public (unauthenticated) but service-role gated and validated.
 */
export const uploadEngineerCredential = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => credentialUploadSchema.parse(data))
  .handler(
    async ({ data }): Promise<{ ok: boolean; path?: string; reason?: string }> => {
      const decoded = decodeDataUrl(data.dataUrl);
      if (!decoded) return { ok: false, reason: "invalid_file" };
      try {
        const { supabaseAdmin } = await import(
          "@/integrations/supabase/client.server"
        );
        const path = `signups/${crypto.randomUUID()}.${decoded.ext}`;
        const { error } = await supabaseAdmin.storage
          .from("engineer-credentials")
          .upload(path, decoded.buffer, {
            contentType: decoded.contentType,
            upsert: false,
          });
        if (error) {
          console.error("[volunteers] uploadEngineerCredential", error);
          return { ok: false, reason: "upload_failed" };
        }
        return { ok: true, path };
      } catch (e) {
        console.error("[volunteers] uploadEngineerCredential failed", e);
        return { ok: false, reason: "error" };
      }
    },
  );

export const submitEngineerSignup = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => signupSchema.parse(data))
  .handler(async ({ data }): Promise<{ ok: boolean }> => {
    try {
      const { supabaseAdmin } = await import(
        "@/integrations/supabase/client.server"
      );

      const checks = runValidationPrechecks({
        licenseNumber: data.licenseNumber,
        email: data.email,
        hasCredential: !!data.credentialPath,
        volunteerType: data.volunteerType,
      });

      const { error } = await supabaseAdmin.from("volunteer_engineers").insert({
        volunteer_type: data.volunteerType,
        name: data.name,
        organization: data.organization || null,
        whatsapp: data.whatsapp,
        email: data.email || null,
        license_number: data.licenseNumber || null,
        credential_path: data.credentialPath || null,
        trust_score: checks.score,
        trust_flags: checks.flags,
        states: data.states,
        specialization: data.specialization || null,
        note: data.note || null,
        status: "pending",
      });
      if (error) {
        console.error("[volunteers] submitEngineerSignup", error);
        return { ok: false };
      }

      // Notify the site owner (best-effort — never blocks the signup).
      try {
        const { sendSystemEmail } = await import("./notify-email.server");
        const stateNames = data.states
          .map((s) => ESTADO_NAMES.find((n) => n === s) ?? s)
          .join(", ");
        await sendSystemEmail({
          templateName: "volunteer-signup-notification",
          templateData: {
            volunteerType: data.volunteerType,
            name: data.name,
            organization: data.organization || "",
            contactName: data.name,
            whatsapp: data.whatsapp,
            email: data.email || "",
            license: data.licenseNumber || "",
            trustScore: String(checks.score),
            trustFlags: checks.flags.join(", "),
            hasCredential: data.credentialPath ? "Sí" : "No",
            states: stateNames || "—",
            specialization: data.specialization || "",
            note: data.note || "",
            adminUrl: "https://evaluaya.app/admin/voluntarios",
          },
        });
      } catch (notifyErr) {
        console.error("[volunteers] signup notification failed", notifyErr);
      }

      return { ok: true };

    } catch (e) {
      console.error("[volunteers] submitEngineerSignup failed", e);
      return { ok: false };
    }
  });


// ---------------------------------------------------------------------------
// Approved engineer directory for a given estado (public read, brokered)
// ---------------------------------------------------------------------------

const stateSchema = z.object({
  state: z.string().trim().max(120).optional().default(""),
});

export const getApprovedEngineersForState = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => stateSchema.parse(data))
  .handler(async ({ data }): Promise<PublicEngineer[]> => {
    try {
      const { supabaseAdmin } = await import(
        "@/integrations/supabase/client.server"
      );
      const { data: rows, error } = await supabaseAdmin.rpc(
        "get_approved_engineers",
        { _state: data.state || "" },
      );
      if (error || !rows) {
        if (error) console.error("[volunteers] getApprovedEngineers", error);
        return [];
      }
      return rows.map((r) => ({
        id: r.id,
        name: r.name,
        organization: r.organization,
        states: r.states ?? [],
        specialization: r.specialization,
        volunteerType:
          (r.volunteer_type as VolunteerType | null) ?? "individual",
        coversState: r.covers_state ?? false,
      }));
    } catch (e) {
      console.error("[volunteers] getApprovedEngineers failed", e);
      return [];
    }
  });

// ---------------------------------------------------------------------------
// Public roster of every verified (approved) volunteer — names + org only.
// No contact details ship to the browser. Used by the /voluntarios showcase
// to provide social proof without exposing a way to reach engineers directly
// (residents request a connection only after completing an evaluation).
// ---------------------------------------------------------------------------

export type VerifiedEngineer = {
  id: string;
  name: string;
  organization: string | null;
  states: string[];
  volunteerType: VolunteerType;
};

export const getAllApprovedEngineers = createServerFn({ method: "GET" })
  .handler(async (): Promise<VerifiedEngineer[]> => {
    try {
      const { supabaseAdmin } = await import(
        "@/integrations/supabase/client.server"
      );
      const { data: rows, error } = await supabaseAdmin
        .from("volunteer_engineers")
        .select("id, name, organization, states, volunteer_type")
        .eq("status", "approved")
        .order("created_at", { ascending: true });
      if (error || !rows) {
        if (error) console.error("[volunteers] getAllApprovedEngineers", error);
        return [];
      }
      return rows.map((r) => ({
        id: r.id,
        name: r.name,
        organization: r.organization,
        states: r.states ?? [],
        volunteerType:
          (r.volunteer_type as VolunteerType | null) ?? "individual",
      }));
    } catch (e) {
      console.error("[volunteers] getAllApprovedEngineers failed", e);
      return [];
    }
  });


// ---------------------------------------------------------------------------
// Reveal a single engineer's WhatsApp — only after the resident taps to
// connect. Keeping numbers out of the directory payload prevents bulk scraping.
// ---------------------------------------------------------------------------

const revealSchema = z.object({
  engineerId: z.string().trim().uuid(),
});

export const revealEngineerContact = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => revealSchema.parse(data))
  .handler(async ({ data }): Promise<{ whatsapp: string | null }> => {
    try {
      const { supabaseAdmin } = await import(
        "@/integrations/supabase/client.server"
      );
      const { data: row, error } = await supabaseAdmin
        .from("volunteer_engineers")
        .select("whatsapp, status")
        .eq("id", data.engineerId)
        .eq("status", "approved")
        .maybeSingle();
      if (error || !row || !row.whatsapp) return { whatsapp: null };
      return { whatsapp: row.whatsapp };
    } catch (e) {
      console.error("[volunteers] revealEngineerContact failed", e);
      return { whatsapp: null };
    }
  });

// ---------------------------------------------------------------------------
// Resident callback request (public, insert-only)
// ---------------------------------------------------------------------------

const helpSchema = z.object({
  assessmentPublicId: z.string().trim().max(64).optional().default(""),
  state: z.string().trim().max(120).optional().default(""),
  municipality: z.string().trim().max(160).optional().default(""),
  riskLevel: z.enum(["green", "yellow", "orange", "red"]).optional(),
  whatsapp: z
    .string()
    .trim()
    .max(40)
    .transform(normalizePhone)
    .refine((v) => v.length >= 7 && v.length <= 15, {
      message: "invalid_phone",
    }),
  note: z.string().trim().max(600).optional().default(""),
});

export const submitHelpRequest = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => helpSchema.parse(data))
  .handler(
    async ({ data }): Promise<{ ok: boolean; residentToken?: string }> => {
    try {
      const { supabaseAdmin } = await import(
        "@/integrations/supabase/client.server"
      );
      const { data: inserted, error } = await supabaseAdmin
        .from("help_requests")
        .insert({
          assessment_public_id: data.assessmentPublicId || null,
          state: data.state || null,
          municipality: data.municipality || null,
          risk_level: data.riskLevel ?? null,
          resident_whatsapp: data.whatsapp,
          note: data.note || null,
          status: "open",
        })
        .select("resident_token")
        .maybeSingle();
      if (error) {
        console.error("[volunteers] submitHelpRequest", error);
        return { ok: false };
      }
      const residentToken =
        (inserted?.resident_token as string | null) ?? undefined;

      // Notify approved engineers covering this estado (best-effort).
      try {
        const { data: engineers } = await supabaseAdmin.rpc(
          "get_engineers_to_notify",
          { _state: data.state || "" },
        );
        if (engineers && engineers.length > 0) {
          const { sendSystemEmail } = await import("./notify-email.server");
          const location =
            [data.municipality, data.state].filter(Boolean).join(", ") || "—";
          await Promise.all(
            engineers.map((eng) =>
              sendSystemEmail({
                templateName: "help-request-notification",
                recipientEmail: eng.email ?? undefined,
                templateData: {
                  engineerName: eng.name ?? "",
                  riskLevel: data.riskLevel ?? "",
                  location,
                  note: data.note || "",
                  panelUrl: eng.access_token
                    ? `https://evaluaya.app/voluntarios/panel/${eng.access_token}?utm_source=email&utm_medium=email&utm_campaign=help_request`
                    : "https://evaluaya.app/voluntarios?utm_source=email&utm_medium=email&utm_campaign=help_request",
                },
              }).catch((err) =>
                console.error("[volunteers] notify engineer failed", err),
              ),
            ),
          );
        }
      } catch (notifyErr) {
        console.error("[volunteers] request notification failed", notifyErr);
      }

      // Notify the site admin of every new help request (best-effort).
      try {
        const { sendSystemEmail } = await import("./notify-email.server");
        const location =
          [data.municipality, data.state].filter(Boolean).join(", ") || "—";
        await sendSystemEmail({
          templateName: "admin-help-new",
          templateData: {
            riskLevel: data.riskLevel ?? "",
            location,
            note: data.note || "",
            adminUrl:
              "https://evaluaya.app/admin/voluntarios?utm_source=email&utm_medium=email&utm_campaign=admin_help_new",
          },
        }).catch((err) =>
          console.error("[volunteers] admin new-request notify failed", err),
        );
      } catch (notifyErr) {
        console.error("[volunteers] admin new-request notify failed", notifyErr);
      }

      return { ok: true, residentToken };
    } catch (e) {
      console.error("[volunteers] submitHelpRequest failed", e);
      return { ok: false };
    }
  });

// ---------------------------------------------------------------------------
// Resident self-service request tracking (public, token-gated, non-sensitive)
// ---------------------------------------------------------------------------

const residentTokenSchema = z.object({
  token: z.string().trim().uuid(),
});

export const getResidentRequestStatus = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => residentTokenSchema.parse(data))
  .handler(async ({ data }): Promise<ResidentRequestStatus | null> => {
    try {
      const { supabaseAdmin } = await import(
        "@/integrations/supabase/client.server"
      );
      const { data: rows, error } = await supabaseAdmin.rpc(
        "get_resident_request",
        { _token: data.token },
      );
      if (error) {
        console.error("[volunteers] getResidentRequestStatus", error);
        return null;
      }
      const r = Array.isArray(rows) ? rows[0] : rows;
      if (!r) return null;
      return {
        state: r.state ?? null,
        municipality: r.municipality ?? null,
        riskLevel: (r.risk_level as RiskLevel | null) ?? null,
        status: (r.status as "open" | "claimed" | "closed") ?? "open",
        progressStage: (r.progress_stage as ProgressStage | null) ?? null,
        progressUpdatedAt: r.progress_updated_at ?? null,
        createdAt: r.created_at,
        claimedAt: r.claimed_at ?? null,
        engineerName: r.engineer_name ?? null,
        engineerNote: r.engineer_note ?? null,
        assessmentPublicId: r.assessment_public_id ?? null,
        residentConfirmedAt: r.resident_confirmed_at ?? null,
        aiRiskLevel: (r.ai_risk_level as RiskLevel | null) ?? null,
        priorRiskLevel: (r.prior_risk_level as RiskLevel | null) ?? null,
        reportType: r.report_type ?? null,
        engineerVerdict:
          (r.engineer_verdict as "agree" | "adjust" | null) ?? null,
      };
    } catch (e) {
      console.error("[volunteers] getResidentRequestStatus failed", e);
      return null;
    }
  });

const residentConfirmSchema = z.object({
  token: z.string().trim().uuid(),
  resolved: z.boolean(),
  note: z.string().trim().max(600).optional().default(""),
});

export const residentConfirmRequest = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => residentConfirmSchema.parse(data))
  .handler(async ({ data }): Promise<{ ok: boolean }> => {
    try {
      const { supabaseAdmin } = await import(
        "@/integrations/supabase/client.server"
      );
      const { error } = await supabaseAdmin.rpc("resident_update_request", {
        _token: data.token,
        _resolved: data.resolved,
        _note: data.note || null,
      });
      if (error) {
        console.error("[volunteers] residentConfirmRequest", error);
        return { ok: false };
      }
      return { ok: true };
    } catch (e) {
      console.error("[volunteers] residentConfirmRequest failed", e);
      return { ok: false };
    }
  });


// ---------------------------------------------------------------------------
// Engineer panel (gated by per-row access token)
// ---------------------------------------------------------------------------

const tokenSchema = z.object({
  token: z.string().trim().uuid(),
});

async function loadEngineerByToken(token: string) {
  const { supabaseAdmin } = await import(
    "@/integrations/supabase/client.server"
  );
  const { data, error } = await supabaseAdmin
    .from("volunteer_engineers")
    .select(
      "id, name, organization, states, specialization, status, access_token, token_expires_at",
    )
    .eq("access_token", token)
    .eq("status", "approved")
    .maybeSingle();
  if (error || !data) return null;
  return data;
}

/** True when an access link has a past expiry timestamp. */
function tokenExpired(row: { token_expires_at?: string | null }): boolean {
  return (
    !!row.token_expires_at &&
    new Date(row.token_expires_at).getTime() < Date.now()
  );
}

/** Access links live for 90 days; rotation/approval refreshes this. */
const TOKEN_TTL_MS = 90 * 24 * 60 * 60 * 1000;
function tokenExpiryFromNow(): string {
  return new Date(Date.now() + TOKEN_TTL_MS).toISOString();
}

/**
 * Best-effort send of the "you're validated, here's your panel link" email.
 * Returns true when the email was enqueued. No-op (returns false) when the
 * volunteer has no email on file.
 */
async function sendAccessEmail(params: {
  email?: string | null;
  name?: string | null;
  states: string[];
  token: string;
  idempotencyKey: string;
}): Promise<boolean> {
  const email = params.email?.trim();
  if (!email) return false;
  try {
    const { sendSystemEmail } = await import("./notify-email.server");
    const stateNames = (params.states ?? [])
      .map((s: string) => ESTADO_NAMES.find((n) => n === s) ?? s)
      .join(", ");
    const res = await sendSystemEmail({
      templateName: "volunteer-approved",
      recipientEmail: email,
      idempotencyKey: params.idempotencyKey,
      templateData: {
        name: params.name ?? "",
        states: stateNames,
        panelUrl: engineerPanelUrl(params.token, "volunteer_panel"),
      },
    });
    return res.ok;
  } catch (e) {
    console.error("[volunteers] sendAccessEmail failed", e);
    return false;
  }
}

export const getEngineerPanel = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => tokenSchema.parse(data))
  .handler(async ({ data }): Promise<EngineerPanelResult> => {
    try {
      const { supabaseAdmin } = await import(
        "@/integrations/supabase/client.server"
      );
      const engineer = await loadEngineerByToken(data.token);
      if (!engineer) return null;
      if (tokenExpired(engineer)) return { expired: true };

      const states = engineer.states ?? [];
      const { data: rows, error } = await supabaseAdmin
        .from("help_requests")
        .select(
          "id, public_id, assessment_public_id, state, municipality, risk_level, resident_whatsapp, note, status, claimed_by, created_at, progress_stage, engineer_note, progress_updated_at",
        )
        .in("status", ["open", "claimed"])
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) {
        console.error("[volunteers] getEngineerPanel", error);
        return {
          engineer: mapEng(engineer),
          stats: emptyEngineerStats(),
          requests: [],
        };
      }

      const relevant = (rows ?? []).filter((r) => {
        const inArea =
          !r.state || r.state.trim() === "" || states.includes(r.state);
        // Hide requests claimed by someone else; keep my own claims visible.
        const mineOrOpen =
          r.status === "open" || r.claimed_by === engineer.id;
        return inArea && mineOrOpen;
      });

      relevant.sort((a, b) => {
        // Actionable (open) requests first.
        const oa = a.status === "open" ? 0 : 1;
        const ob = b.status === "open" ? 0 : 1;
        if (oa !== ob) return oa - ob;
        // Then by severity: red → yellow → green.
        const ra = RISK_ORDER[a.risk_level ?? "green"] ?? 3;
        const rb = RISK_ORDER[b.risk_level ?? "green"] ?? 3;
        if (ra !== rb) return ra - rb;
        // Then oldest first, so the longest-waiting resident rises to the top.
        return (a.created_at ?? "").localeCompare(b.created_at ?? "");
      });

      // Fetch linked assessments so the engineer can validate the AI result.
      const assessmentIds = Array.from(
        new Set(
          relevant
            .map((r) => r.assessment_public_id)
            .filter((id): id is string => !!id),
        ),
      );
      const assessmentMap = new Map<
        string,
        {
          risk_level: string | null;
          prior_risk_level: string | null;
          report_type: string | null;
          engineer_verdict: string | null;
        }
      >();
      if (assessmentIds.length > 0) {
        const { data: aRows } = await supabaseAdmin
          .from("assessments")
          .select(
            "public_id, risk_level, prior_risk_level, report_type, engineer_verdict",
          )
          .in("public_id", assessmentIds);
        for (const a of aRows ?? []) assessmentMap.set(a.public_id, a);
      }

      const requests: EngineerRequest[] = relevant.map((r) => {
        const mine = r.claimed_by === engineer.id;
        const a = r.assessment_public_id
          ? assessmentMap.get(r.assessment_public_id)
          : undefined;
        return {
          id: r.id,
          publicId: r.public_id,
          assessmentPublicId: r.assessment_public_id,
          state: r.state,
          municipality: r.municipality,
          riskLevel: (r.risk_level as RiskLevel | null) ?? null,
          // Resident contact is only revealed after this engineer claims it.
          residentWhatsapp: mine ? r.resident_whatsapp : null,
          note: r.note,
          status: r.status as "open" | "claimed" | "closed",
          claimedByMe: mine,
          createdAt: r.created_at,
          progressStage: (r.progress_stage as ProgressStage | null) ?? null,
          engineerNote: r.engineer_note ?? null,
          progressUpdatedAt: r.progress_updated_at ?? null,
          aiRiskLevel: a ? ((a.risk_level as RiskLevel | null) ?? null) : null,
          priorRiskLevel: a
            ? ((a.prior_risk_level as RiskLevel | null) ?? null)
            : null,
          verified: a ? a.report_type === "professional" : false,
          engineerVerdict:
            (a?.engineer_verdict as "agree" | "adjust" | null) ?? null,
        };
      });


      // Recognition + impact stats. Resolved/response data lives on closed
      // rows we didn't fetch above, so query the engineer's full history.
      const { data: mineRows } = await supabaseAdmin
        .from("help_requests")
        .select("status, progress_stage, claimed_at, progress_updated_at")
        .eq("claimed_by", engineer.id)
        .limit(1000);

      let resolved = 0;
      const responseSpans: number[] = [];
      for (const r of mineRows ?? []) {
        const isResolved =
          r.status === "closed" || r.progress_stage === "resolved";
        if (isResolved) resolved += 1;
        if (r.claimed_at && r.progress_updated_at) {
          const span =
            (new Date(r.progress_updated_at).getTime() -
              new Date(r.claimed_at).getTime()) /
            1000;
          if (span > 0) responseSpans.push(span);
        }
      }
      const avgResponseSeconds =
        responseSpans.length > 0
          ? Math.round(
              responseSpans.reduce((s, v) => s + v, 0) / responseSpans.length,
            )
          : null;

      const stats: EngineerStats = {
        resolved,
        claimedActive: requests.filter(
          (r) => r.claimedByMe && r.status === "claimed",
        ).length,
        openInArea: requests.filter((r) => r.status === "open").length,
        avgResponseSeconds,
        tier: recognitionTier(resolved),
      };

      return { engineer: mapEng(engineer), stats, requests };
    } catch (e) {
      console.error("[volunteers] getEngineerPanel failed", e);
      return null;
    }
  });

/** Recognition tier thresholds based on lifetime resolved requests. */
export function recognitionTier(resolved: number): RecognitionTier {
  if (resolved >= 15) return "gold";
  if (resolved >= 5) return "silver";
  if (resolved >= 1) return "bronze";
  return "none";
}

function emptyEngineerStats(): EngineerStats {
  return {
    resolved: 0,
    claimedActive: 0,
    openInArea: 0,
    avgResponseSeconds: null,
    tier: "none",
  };
}



function mapEng(e: {
  name: string;
  organization: string | null;
  states: string[] | null;
  specialization?: string | null;
}) {
  return {
    name: e.name,
    organization: e.organization,
    states: e.states ?? [],
    specialization: e.specialization ?? null,
  };
}

const actionSchema = z.object({
  token: z.string().trim().uuid(),
  requestId: z.string().trim().uuid(),
});

export const claimHelpRequest = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => actionSchema.parse(data))
  .handler(async ({ data }): Promise<{ ok: boolean }> => {
    try {
      const { supabaseAdmin } = await import(
        "@/integrations/supabase/client.server"
      );
      const engineer = await loadEngineerByToken(data.token);
      if (!engineer || tokenExpired(engineer)) return { ok: false };

      const { error } = await supabaseAdmin
        .from("help_requests")
        .update({
          status: "claimed",
          claimed_by: engineer.id,
          claimed_at: new Date().toISOString(),
        })
        .eq("id", data.requestId)
        .eq("status", "open");
      if (error) {
        console.error("[volunteers] claimHelpRequest", error);
        return { ok: false };
      }
      return { ok: true };
    } catch (e) {
      console.error("[volunteers] claimHelpRequest failed", e);
      return { ok: false };
    }
  });

export const closeHelpRequest = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => actionSchema.parse(data))
  .handler(async ({ data }): Promise<{ ok: boolean }> => {
    try {
      const { supabaseAdmin } = await import(
        "@/integrations/supabase/client.server"
      );
      const engineer = await loadEngineerByToken(data.token);
      if (!engineer || tokenExpired(engineer)) return { ok: false };
      const { error } = await supabaseAdmin
        .from("help_requests")
        .update({ status: "closed" })
        .eq("id", data.requestId)
        .eq("claimed_by", engineer.id);
      if (error) {
        console.error("[volunteers] closeHelpRequest", error);
        return { ok: false };
      }
      return { ok: true };
    } catch (e) {
      console.error("[volunteers] closeHelpRequest failed", e);
      return { ok: false };
    }
  });

// ---------------------------------------------------------------------------
// Report progress on a claimed request
// ---------------------------------------------------------------------------

export const progressSchema = z.object({
  token: z.string().trim().uuid(),
  requestId: z.string().trim().uuid(),
  stage: z.enum(["contacted", "visited", "resolved"]),
  note: z.string().trim().max(600).optional().default(""),
});

export const updateRequestProgress = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => progressSchema.parse(data))
  .handler(async ({ data }): Promise<{ ok: boolean }> => {
    try {
      const { supabaseAdmin } = await import(
        "@/integrations/supabase/client.server"
      );
      const engineer = await loadEngineerByToken(data.token);
      if (!engineer || tokenExpired(engineer)) return { ok: false };

      const patch: TablesUpdate<"help_requests"> = {
        progress_stage: data.stage,
        progress_updated_at: new Date().toISOString(),
      };
      if (data.note) patch.engineer_note = data.note;
      // Resolving a request also closes it for matching/visibility.
      if (data.stage === "resolved") patch.status = "closed";

      const { error } = await supabaseAdmin
        .from("help_requests")
        .update(patch)
        .eq("id", data.requestId)
        .eq("claimed_by", engineer.id);
      if (error) {
        console.error("[volunteers] updateRequestProgress", error);
        return { ok: false };
      }

      // Notify the site admin when a request is marked resolved (best-effort).
      if (data.stage === "resolved") {
        try {
          const { data: row } = await supabaseAdmin
            .from("help_requests")
            .select("state, municipality, risk_level")
            .eq("id", data.requestId)
            .maybeSingle();
          const { sendSystemEmail } = await import("./notify-email.server");
          const location =
            [row?.municipality, row?.state].filter(Boolean).join(", ") || "—";
          await sendSystemEmail({
            templateName: "admin-help-resolved",
            templateData: {
              engineerName: engineer.name ?? "",
              riskLevel: row?.risk_level ?? "",
              location,
              note: data.note || "",
              adminUrl:
                "https://evaluaya.app/admin/voluntarios?utm_source=email&utm_medium=email&utm_campaign=admin_help_resolved",
            },
          }).catch((err) =>
            console.error("[volunteers] admin resolved notify failed", err),
          );
        } catch (notifyErr) {
          console.error("[volunteers] admin resolved notify failed", notifyErr);
        }
      }

      return { ok: true };
    } catch (e) {
      console.error("[volunteers] updateRequestProgress failed", e);
      return { ok: false };
    }
  });

// ---------------------------------------------------------------------------
// Validate / compare the AI evaluation on the linked assessment
// ---------------------------------------------------------------------------

export const verdictSchema = z
  .object({
    token: z.string().trim().uuid(),
    requestId: z.string().trim().uuid(),
    verdict: z.enum(["agree", "adjust"]),
    level: z.enum(["green", "yellow", "orange", "red"]).optional(),
    notes: z.string().trim().max(1000).optional().default(""),
  })
  .refine((d) => d.verdict !== "adjust" || !!d.level, {
    message: "level_required",
    path: ["level"],
  });

export const submitEngineerVerdict = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => verdictSchema.parse(data))
  .handler(async ({ data }): Promise<{ ok: boolean; reason?: string }> => {
    try {
      const { supabaseAdmin } = await import(
        "@/integrations/supabase/client.server"
      );
      const engineer = await loadEngineerByToken(data.token);
      if (!engineer || tokenExpired(engineer)) return { ok: false };

      // Resolve the assessment linked to this request, in the engineer's area.
      const { data: req } = await supabaseAdmin
        .from("help_requests")
        .select("assessment_public_id, state")
        .eq("id", data.requestId)
        .maybeSingle();
      if (!req || !req.assessment_public_id) {
        return { ok: false, reason: "no_assessment" };
      }
      const states = engineer.states ?? [];
      const inArea =
        !req.state || req.state.trim() === "" || states.includes(req.state);
      if (!inArea) return { ok: false, reason: "out_of_area" };

      const { data: assessment } = await supabaseAdmin
        .from("assessments")
        .select("id, risk_level, prior_risk_level")
        .eq("public_id", req.assessment_public_id)
        .maybeSingle();
      if (!assessment) return { ok: false, reason: "no_assessment" };

      const patch: TablesUpdate<"assessments"> = {
        report_type: "professional",
        verified_by_engineer: engineer.id,
        engineer_notes: data.notes || null,
        engineer_verdict: data.verdict,
        engineer_verified_at: new Date().toISOString(),
      };
      if (data.verdict === "adjust" && data.level) {
        // Preserve the original AI level the first time we override it.
        if (!assessment.prior_risk_level) {
          patch.prior_risk_level = assessment.risk_level;
        }
        patch.risk_level = data.level;
      }

      const { error } = await supabaseAdmin
        .from("assessments")
        .update(patch)
        .eq("id", assessment.id);
      if (error) {
        console.error("[volunteers] submitEngineerVerdict", error);
        return { ok: false };
      }
      return { ok: true };
    } catch (e) {
      console.error("[volunteers] submitEngineerVerdict failed", e);
      return { ok: false };
    }
  });



const adminListSchema = z.object({
  adminSecret: z.string().min(1).max(256),
});

export const adminListEngineers = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => adminListSchema.parse(data))
  .handler(
    async ({
      data,
    }): Promise<{ ok: boolean; engineers: AdminEngineer[] }> => {
      if (!adminOk(data.adminSecret)) return { ok: false, engineers: [] };
      try {
        const { supabaseAdmin } = await import(
          "@/integrations/supabase/client.server"
        );
        const { data: rows, error } = await supabaseAdmin
          .from("volunteer_engineers")
          .select(
            "id, name, organization, whatsapp, email, states, specialization, note, status, access_token, created_at, license_number, credential_path, trust_score, trust_flags",
          )
          .order("created_at", { ascending: false });
        if (error || !rows) return { ok: true, engineers: [] };
        return {
          ok: true,
          engineers: rows.map((r) => ({
            id: r.id,
            name: r.name,
            organization: r.organization,
            whatsapp: r.whatsapp,
            email: r.email,
            states: r.states ?? [],
            specialization: r.specialization,
            note: r.note,
            status: r.status as AdminEngineer["status"],
            accessToken: r.access_token,
            createdAt: r.created_at,
            licenseNumber: r.license_number ?? null,
            credentialPath: r.credential_path ?? null,
            trustScore: r.trust_score ?? 0,
            trustFlags: (r.trust_flags as string[] | null) ?? [],
          })),
        };
      } catch (e) {
        console.error("[volunteers] adminListEngineers failed", e);
        return { ok: false, engineers: [] };
      }
    },
  );

const reviewSchema = z.object({
  adminSecret: z.string().min(1).max(256),
  id: z.string().trim().uuid(),
  action: z.enum(["approve", "reject"]),
});

export const adminReviewEngineer = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => reviewSchema.parse(data))
  .handler(
    async ({
      data,
    }): Promise<{ ok: boolean; accessToken?: string | null }> => {
      if (!adminOk(data.adminSecret)) return { ok: false };
      try {
        const { supabaseAdmin } = await import(
          "@/integrations/supabase/client.server"
        );
        if (data.action === "reject") {
          const { error } = await supabaseAdmin
            .from("volunteer_engineers")
            .update({ status: "rejected", access_token: null })
            .eq("id", data.id);
          if (error) return { ok: false };
          return { ok: true, accessToken: null };
        }
        // approve: generate a stable access token if not already present
        const { data: existing } = await supabaseAdmin
          .from("volunteer_engineers")
          .select("access_token, name, email, states")
          .eq("id", data.id)
          .maybeSingle();
        const token = existing?.access_token ?? crypto.randomUUID();
        const { error } = await supabaseAdmin
          .from("volunteer_engineers")
          .update({
            status: "approved",
            access_token: token,
            token_expires_at: tokenExpiryFromNow(),
          })
          .eq("id", data.id);
        if (error) return { ok: false };

        // Notify the volunteer they were approved (best-effort, email only).
        await sendAccessEmail({
          email: existing?.email,
          name: existing?.name,
          states: existing?.states ?? [],
          token,
          idempotencyKey: `volunteer-approved-${data.id}`,
        });

        return { ok: true, accessToken: token };
      } catch (e) {
        console.error("[volunteers] adminReviewEngineer failed", e);
        return { ok: false };
      }
    },
  );

const idSchema = z.object({
  adminSecret: z.string().min(1).max(256),
  id: z.string().trim().uuid(),
});

/** Resend the access-link email to an already-approved volunteer (admin). */
export const adminResendAccessLink = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => idSchema.parse(data))
  .handler(async ({ data }): Promise<{ ok: boolean; reason?: string }> => {
    if (!adminOk(data.adminSecret)) return { ok: false };
    try {
      const { supabaseAdmin } = await import(
        "@/integrations/supabase/client.server"
      );
      const { data: row } = await supabaseAdmin
        .from("volunteer_engineers")
        .select("access_token, name, email, states, status")
        .eq("id", data.id)
        .maybeSingle();
      if (!row || row.status !== "approved" || !row.access_token) {
        return { ok: false, reason: "not_approved" };
      }
      if (!row.email?.trim()) return { ok: false, reason: "no_email" };

      const sent = await sendAccessEmail({
        email: row.email,
        name: row.name,
        states: row.states ?? [],
        token: row.access_token,
        // unique key per resend so the queue never dedupes it
        idempotencyKey: `volunteer-resend-${data.id}-${Date.now()}`,
      });
      return sent ? { ok: true } : { ok: false, reason: "send_failed" };
    } catch (e) {
      console.error("[volunteers] adminResendAccessLink failed", e);
      return { ok: false };
    }
  });

/** Rotate a volunteer's access link (new token + fresh expiry), re-email it. */
export const adminRotateAccessLink = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => idSchema.parse(data))
  .handler(
    async ({
      data,
    }): Promise<{ ok: boolean; accessToken?: string | null; reason?: string }> => {
      if (!adminOk(data.adminSecret)) return { ok: false };
      try {
        const { supabaseAdmin } = await import(
          "@/integrations/supabase/client.server"
        );
        const { data: row } = await supabaseAdmin
          .from("volunteer_engineers")
          .select("name, email, states, status")
          .eq("id", data.id)
          .maybeSingle();
        if (!row || row.status !== "approved") {
          return { ok: false, reason: "not_approved" };
        }
        const token = crypto.randomUUID();
        const { error } = await supabaseAdmin
          .from("volunteer_engineers")
          .update({ access_token: token, token_expires_at: tokenExpiryFromNow() })
          .eq("id", data.id);
        if (error) return { ok: false };

        await sendAccessEmail({
          email: row.email,
          name: row.name,
          states: row.states ?? [],
          token,
          idempotencyKey: `volunteer-rotate-${data.id}-${Date.now()}`,
        });
        return { ok: true, accessToken: token };
      } catch (e) {
        console.error("[volunteers] adminRotateAccessLink failed", e);
        return { ok: false };
      }
    },
  );


export const adminListHelpRequests = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => adminListSchema.parse(data))
  .handler(
    async ({
      data,
    }): Promise<{
      ok: boolean;
      requests: AdminHelpRequest[];
      progress: AdminMatchingProgress | null;
    }> => {
      if (!adminOk(data.adminSecret))
        return { ok: false, requests: [], progress: null };
      try {
        const { supabaseAdmin } = await import(
          "@/integrations/supabase/client.server"
        );
        const [{ data: rows, error }, { data: prog }] = await Promise.all([
          supabaseAdmin.rpc("get_admin_help_requests", { _limit: 300 }),
          supabaseAdmin.rpc("get_admin_matching_progress"),
        ]);
        if (error || !rows) return { ok: true, requests: [], progress: null };
        const p = Array.isArray(prog) ? prog[0] : null;
        return {
          ok: true,
          requests: rows.map((r) => ({
            id: r.id,
            state: r.state,
            municipality: r.municipality,
            riskLevel: (r.risk_level as RiskLevel | null) ?? null,
            status: r.status as AdminHelpRequest["status"],
            note: r.note,
            createdAt: r.created_at,
            progressStage: (r.progress_stage as ProgressStage | null) ?? null,
            progressUpdatedAt: r.progress_updated_at ?? null,
            claimedAt: r.claimed_at ?? null,
            engineerName: r.engineer_name ?? null,
            engineerNote: r.engineer_note ?? null,
            assessmentPublicId: r.assessment_public_id ?? null,
            aiRiskLevel: (r.ai_risk_level as RiskLevel | null) ?? null,
            priorRiskLevel: (r.prior_risk_level as RiskLevel | null) ?? null,
            engineerVerdict:
              (r.engineer_verdict as "agree" | "adjust" | null) ?? null,
            reportType: r.report_type ?? null,
            stalled: Boolean(r.stalled),
            reclaimCount: r.reclaim_count ?? 0,
            residentConfirmedAt: r.resident_confirmed_at ?? null,
          })),
          progress: p
            ? {
                claimedOnly: p.claimed_only ?? 0,
                contacted: p.contacted ?? 0,
                visited: p.visited ?? 0,
                resolved: p.resolved ?? 0,
                stalled: p.stalled ?? 0,
                reclaimed: p.reclaimed ?? 0,
                residentConfirmed: p.resident_confirmed ?? 0,
              }
            : null,
        };
      } catch (e) {
        console.error("[volunteers] adminListHelpRequests failed", e);
        return { ok: false, requests: [], progress: null };
      }
    },
  );

