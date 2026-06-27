import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";

/**
 * Service-role seeding/teardown for the engineer-panel E2E.
 *
 * Creates a self-contained, clearly-tagged dataset (one approved engineer with
 * an access token, plus one open help request linked to an analyzed assessment)
 * so the spec can drive the real panel UI without touching production records.
 * Everything is namespaced with an `e2e:` marker and removed in teardown.
 */

const MARKER = "E2E-VOLUNTEER";

export type VolunteerSeed = {
  token: string;
  engineerId: string;
  requestId: string;
  assessmentPublicId: string;
  state: string;
  municipality: string;
};

function admin(): SupabaseClient {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY for E2E seeding",
    );
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function seedVolunteer(): Promise<VolunteerSeed> {
  const db = admin();
  const token = randomUUID();
  const state = "Miranda";
  const municipality = "Baruta";
  const assessmentPublicId = `e2e_${randomUUID().replace(/-/g, "").slice(0, 16)}`;
  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  // 1) Approved engineer covering Miranda, with a live access token.
  const { data: eng, error: engErr } = await db
    .from("volunteer_engineers")
    .insert({
      name: `${MARKER} Engineer`,
      whatsapp: "+584140000000",
      email: "e2e-volunteer@example.com",
      states: [state],
      specialization: "Structural",
      status: "approved",
      access_token: token,
      token_expires_at: expires,
      note: MARKER,
    })
    .select("id")
    .single();
  if (engErr || !eng) throw new Error(`seed engineer failed: ${engErr?.message}`);

  // 2) Analyzed assessment the engineer can later validate.
  const { error: aErr } = await db.from("assessments").insert({
    public_id: assessmentPublicId,
    language: "es",
    property: { buildingType: "apartment", floors: 3, age: "post2000" },
    answers: [],
    ai_result: { riskLevel: "yellow", summary: `${MARKER} seed` },
    risk_level: "yellow",
    status: "analyzed",
    state,
    municipality,
    report_type: "resident",
  });
  if (aErr) throw new Error(`seed assessment failed: ${aErr.message}`);

  // 3) Open help request linked to that assessment.
  const { data: req, error: rErr } = await db
    .from("help_requests")
    .insert({
      assessment_public_id: assessmentPublicId,
      state,
      municipality,
      risk_level: "yellow",
      resident_whatsapp: "+584149999999",
      note: `${MARKER} please help`,
      status: "open",
    })
    .select("id")
    .single();
  if (rErr || !req) throw new Error(`seed request failed: ${rErr?.message}`);

  return {
    token,
    engineerId: eng.id,
    requestId: req.id,
    assessmentPublicId,
    state,
    municipality,
  };
}

export async function readAssessment(publicId: string) {
  const db = admin();
  const { data } = await db
    .from("assessments")
    .select("report_type, risk_level, prior_risk_level, engineer_verdict")
    .eq("public_id", publicId)
    .maybeSingle();
  return data;
}

export async function readRequest(requestId: string) {
  const db = admin();
  const { data } = await db
    .from("help_requests")
    .select("status, claimed_by, progress_stage, engineer_note")
    .eq("id", requestId)
    .maybeSingle();
  return data;
}

export async function teardownVolunteer(seed: VolunteerSeed): Promise<void> {
  const db = admin();
  await db.from("help_requests").delete().eq("id", seed.requestId);
  await db
    .from("assessments")
    .delete()
    .eq("public_id", seed.assessmentPublicId);
  await db.from("volunteer_engineers").delete().eq("id", seed.engineerId);
}
