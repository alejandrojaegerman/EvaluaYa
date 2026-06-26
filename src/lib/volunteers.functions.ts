import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { ESTADO_NAMES } from "./venezuela";
import type { RiskLevel } from "./assessment-types";

// ---------------------------------------------------------------------------
// Public DTOs (safe to ship to the browser)
// ---------------------------------------------------------------------------

export type VolunteerType = "individual" | "organization";

export type PublicEngineer = {
  id: string;
  name: string;
  organization: string | null;
  /** digits-only phone for a wa.me link */
  whatsapp: string;
  states: string[];
  specialization: string | null;
  volunteerType: VolunteerType;
  coversState: boolean;
};

export type EngineerRequest = {
  id: string;
  publicId: string;
  assessmentPublicId: string | null;
  state: string | null;
  municipality: string | null;
  riskLevel: RiskLevel | null;
  residentWhatsapp: string;
  note: string | null;
  status: "open" | "claimed" | "closed";
  claimedByMe: boolean;
  createdAt: string;
};

export type EngineerPanel = {
  engineer: {
    name: string;
    organization: string | null;
    states: string[];
  };
  requests: EngineerRequest[];
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
};

export type AdminHelpRequest = {
  id: string;
  state: string | null;
  municipality: string | null;
  riskLevel: RiskLevel | null;
  status: "open" | "claimed" | "closed";
  note: string | null;
  createdAt: string;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Keep only digits — what wa.me expects (no +, spaces or punctuation). */
function normalizePhone(raw: string): string {
  return raw.replace(/[^\d]/g, "");
}

const RISK_ORDER: Record<string, number> = { red: 0, yellow: 1, green: 2 };

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
    email: z.string().trim().email().max(255).optional().or(z.literal("")),
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

export const submitEngineerSignup = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => signupSchema.parse(data))
  .handler(async ({ data }): Promise<{ ok: boolean }> => {
    try {
      const { supabaseAdmin } = await import(
        "@/integrations/supabase/client.server"
      );
      const { error } = await supabaseAdmin.from("volunteer_engineers").insert({
        volunteer_type: data.volunteerType,
        name: data.name,
        organization: data.organization || null,
        whatsapp: data.whatsapp,
        email: data.email || null,
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
        whatsapp: r.whatsapp,
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
// Resident callback request (public, insert-only)
// ---------------------------------------------------------------------------

const helpSchema = z.object({
  assessmentPublicId: z.string().trim().max(64).optional().default(""),
  state: z.string().trim().max(120).optional().default(""),
  municipality: z.string().trim().max(160).optional().default(""),
  riskLevel: z.enum(["green", "yellow", "red"]).optional(),
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
  .handler(async ({ data }): Promise<{ ok: boolean }> => {
    try {
      const { supabaseAdmin } = await import(
        "@/integrations/supabase/client.server"
      );
      const { error } = await supabaseAdmin.from("help_requests").insert({
        assessment_public_id: data.assessmentPublicId || null,
        state: data.state || null,
        municipality: data.municipality || null,
        risk_level: data.riskLevel ?? null,
        resident_whatsapp: data.whatsapp,
        note: data.note || null,
        status: "open",
      });
      if (error) {
        console.error("[volunteers] submitHelpRequest", error);
        return { ok: false };
      }
      return { ok: true };
    } catch (e) {
      console.error("[volunteers] submitHelpRequest failed", e);
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
    .select("id, name, organization, states, status, access_token")
    .eq("access_token", token)
    .eq("status", "approved")
    .maybeSingle();
  if (error || !data) return null;
  return data;
}

export const getEngineerPanel = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => tokenSchema.parse(data))
  .handler(async ({ data }): Promise<EngineerPanel | null> => {
    try {
      const { supabaseAdmin } = await import(
        "@/integrations/supabase/client.server"
      );
      const engineer = await loadEngineerByToken(data.token);
      if (!engineer) return null;

      const states = engineer.states ?? [];
      const { data: rows, error } = await supabaseAdmin
        .from("help_requests")
        .select(
          "id, public_id, assessment_public_id, state, municipality, risk_level, resident_whatsapp, note, status, claimed_by, created_at",
        )
        .in("status", ["open", "claimed"])
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) {
        console.error("[volunteers] getEngineerPanel", error);
        return { engineer: mapEng(engineer), requests: [] };
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
        const ra = RISK_ORDER[a.risk_level ?? "green"] ?? 3;
        const rb = RISK_ORDER[b.risk_level ?? "green"] ?? 3;
        if (ra !== rb) return ra - rb;
        return (b.created_at ?? "").localeCompare(a.created_at ?? "");
      });

      const requests: EngineerRequest[] = relevant.map((r) => ({
        id: r.id,
        publicId: r.public_id,
        assessmentPublicId: r.assessment_public_id,
        state: r.state,
        municipality: r.municipality,
        riskLevel: (r.risk_level as RiskLevel | null) ?? null,
        residentWhatsapp: r.resident_whatsapp,
        note: r.note,
        status: r.status as "open" | "claimed" | "closed",
        claimedByMe: r.claimed_by === engineer.id,
        createdAt: r.created_at,
      }));

      return { engineer: mapEng(engineer), requests };
    } catch (e) {
      console.error("[volunteers] getEngineerPanel failed", e);
      return null;
    }
  });

function mapEng(e: {
  name: string;
  organization: string | null;
  states: string[] | null;
}) {
  return {
    name: e.name,
    organization: e.organization,
    states: e.states ?? [],
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
      if (!engineer) return { ok: false };
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
      if (!engineer) return { ok: false };
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
// Admin (gated by VOLUNTEER_ADMIN_SECRET)
// ---------------------------------------------------------------------------

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
            "id, name, organization, whatsapp, email, states, specialization, note, status, access_token, created_at",
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
          .select("access_token")
          .eq("id", data.id)
          .maybeSingle();
        const token = existing?.access_token ?? crypto.randomUUID();
        const { error } = await supabaseAdmin
          .from("volunteer_engineers")
          .update({ status: "approved", access_token: token })
          .eq("id", data.id);
        if (error) return { ok: false };
        return { ok: true, accessToken: token };
      } catch (e) {
        console.error("[volunteers] adminReviewEngineer failed", e);
        return { ok: false };
      }
    },
  );

export const adminListHelpRequests = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => adminListSchema.parse(data))
  .handler(
    async ({
      data,
    }): Promise<{ ok: boolean; requests: AdminHelpRequest[] }> => {
      if (!adminOk(data.adminSecret)) return { ok: false, requests: [] };
      try {
        const { supabaseAdmin } = await import(
          "@/integrations/supabase/client.server"
        );
        const { data: rows, error } = await supabaseAdmin
          .from("help_requests")
          .select(
            "id, state, municipality, risk_level, status, note, created_at",
          )
          .order("created_at", { ascending: false })
          .limit(300);
        if (error || !rows) return { ok: true, requests: [] };
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
          })),
        };
      } catch (e) {
        console.error("[volunteers] adminListHelpRequests failed", e);
        return { ok: false, requests: [] };
      }
    },
  );
