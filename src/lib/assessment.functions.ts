import { createServerFn } from "@tanstack/react-start";
import { getRequestIP } from "@tanstack/react-start/server";
import { generateText } from "ai";
import { z } from "zod";

import { createLovableAiGatewayProvider } from "./ai-gateway.server";
import { extractBuilding, buildingKey } from "./building";
import {
  CHECKLIST_ITEMS,
  type AiResult,
  type AssessmentRecord,
  type RiskLevel,
} from "./assessment-types";
import { translate, type Lang } from "./i18n";
import { evaluateSafetyRules, maxRisk } from "./safety-rules";
import { resolveMunicipio } from "./venezuela";

/**
 * Normalize a free-text municipality to its canonical casing/spelling when it
 * matches a known Venezuelan municipio, so case/typo variants (e.g. "sucre" vs
 * "Sucre") don't fragment analytics. Falls back to the trimmed input.
 */
function canonicalMunicipality(
  state: string | null | undefined,
  municipality: string | null | undefined,
): string | null {
  const trimmed = municipality?.trim() || "";
  if (!trimmed) return null;
  const resolved = resolveMunicipio(state, trimmed);
  if (resolved && resolved.level === "municipio") return resolved.name;
  return trimmed;
}

const BUCKET = "assessment-photos";
const SIGNED_URL_TTL = 60 * 60 * 24 * 7; // 7 days

const answerSchema = z.object({
  id: z.enum([
    "foundation",
    "liquefaction",
    "exterior_walls",
    "pounding",
    "interior_walls",
    "flooring",
    "plumbing",
    "electrical",
    "fixtures",
    "columns_beams",
    "doors_windows",
    "roof",
    "stairs",
  ]),
  value: z.enum(["yes", "no", "unsure"]),
  // ~2.5MB decoded ≈ 3.4M base64 chars per photo; up to 3 photos per item.
  photoDataUrls: z
    .array(z.string().max(3_600_000))
    .max(3)
    .optional()
    .default([]),
});

const analyzeSchema = z.object({
  language: z.enum(["es", "en"]),
  deviceId: z.string().min(1).max(64).optional().default(""),
  property: z.object({
    address: z.string().max(300).optional().default(""),
    state: z.string().max(120).optional().default(""),
    municipality: z.string().max(120).optional().default(""),
    parroquia: z.string().max(120).optional().default(""),
    buildingName: z.string().max(160).optional().default(""),
    buildingType: z.enum(["house", "apartment", "commercial"]),
    structuralType: z
      .enum(["URM", "CMF", "CIW", "PCF", "RML", "unknown"])
      .optional()
      .default("unknown"),
    floors: z.number().int().min(1).max(200),
    age: z.enum(["pre1970", "1970to2000", "post2000"]),
    seismicIntensity: z.number().min(0).max(12).optional(),
    seismicIntensityRoman: z.string().max(8).optional(),
    pga: z.number().min(0).max(10).optional(),
    pgv: z.number().min(0).max(1000).optional(),
    vs30: z.number().min(0).max(3000).optional(),
    soilClass: z.enum(["rock", "stiff", "soft", "very_soft"]).optional(),
    buildingPeriod: z.number().min(0).max(10).optional(),
    spectralDemand: z.number().min(0).max(10).optional(),
    spectralBand: z.enum(["0.3", "0.6", "1.0", "3.0"]).optional(),
  }),
  answers: z.array(answerSchema).min(1).max(13),
  /** Engineer panel access token — when valid, the report is certified. */
  engineerToken: z.string().uuid().optional(),
  /** Minimal resident contact so a volunteer evaluator can reach them. PII. */
  resident: z
    .object({
      name: z.string().max(160).optional().default(""),
      contact: z.string().max(200).optional().default(""),
      contactType: z.enum(["whatsapp", "phone", "email"]).optional(),
    })
    .optional(),
  /** Accepted legal notice + data-consent versions (blocking gate, Doc #1). */
  consent: z
    .object({
      legalVersion: z.string().max(40),
      consentVersion: z.string().max(40),
      at: z.string().max(40).optional(),
    })
    .optional(),
});

type AnalyzeInput = z.infer<typeof analyzeSchema>;

function makePublicId(): string {
  return globalThis.crypto.randomUUID().replace(/-/g, "").slice(0, 12);
}

function dataUrlToBuffer(dataUrl: string): { buffer: Buffer; contentType: string } | null {
  const match = /^data:(image\/[a-zA-Z+]+);base64,(.+)$/.exec(dataUrl);
  if (!match) return null;
  return { contentType: match[1], buffer: Buffer.from(match[2], "base64") };
}

function buildPrompt(input: AnalyzeInput) {
  const lang = input.language as Lang;
  const t = (k: string) => translate(lang, k);
  const langName = lang === "es" ? "Spanish" : "English";

  const lines = input.answers.map((a) => {
    const area = t(`item.${a.id}.area`);
    const question = t(`item.${a.id}.q`);
    const answer = t(`checklist.answer.${a.value}`);
    const hasPhoto =
      a.photoDataUrls && a.photoDataUrls.length > 0
        ? " (photo attached)"
        : " (no photo)";
    return `- [${area}] ${question} => ${answer}${hasPhoto}`;
  });

  const ageMap: Record<string, string> = {
    pre1970: "before 1970",
    "1970to2000": "1970-2000",
    post2000: "after 2000",
  };

  const structMap: Record<string, string> = {
    URM: "unreinforced masonry (URM) — inherently vulnerable",
    CMF: "concrete moment frame (CMF)",
    CIW: "concrete frame with infill walls (CIW)",
    PCF: "precast concrete frame (PCF)",
    RML: "reinforced masonry, low-rise (RML)",
    unknown: "unknown structural system",
  };
  const structuralType = input.property.structuralType ?? "unknown";

  const p = input.property;
  const intensityLine =
    typeof p.seismicIntensity === "number"
      ? `Estimated ShakeMap shaking intensity at this location: MMI ${p.seismicIntensityRoman ?? ""} (${p.seismicIntensity}).`
      : "";

  // Data-driven ground-motion context from the USGS ShakeMap for this event.
  const groundMotionBits: string[] = [];
  if (typeof p.pga === "number") {
    groundMotionBits.push(`peak ground acceleration ${(p.pga * 100).toFixed(0)}%g`);
  }
  if (typeof p.pgv === "number") {
    groundMotionBits.push(`peak ground velocity ${p.pgv.toFixed(0)} cm/s`);
  }
  const groundMotionLine = groundMotionBits.length
    ? `Recorded ground motion here: ${groundMotionBits.join(", ")}.`
    : "";

  const spectralLine =
    typeof p.spectralDemand === "number" && typeof p.buildingPeriod === "number"
      ? `Spectral acceleration at this building's estimated natural period (~${p.buildingPeriod.toFixed(1)} s, SA(${p.spectralBand ?? "?"})) is ${(p.spectralDemand * 100).toFixed(0)}%g — i.e. the shaking demand a building of this height actually experienced.`
      : "";

  const soilMap: Record<string, string> = {
    rock: "rock / very stiff site (little amplification)",
    stiff: "stiff soil site",
    soft: "soft soil site (amplifies shaking, higher liquefaction risk)",
    very_soft: "very soft soil site (strong amplification, high liquefaction risk)",
  };
  const soilLine =
    p.soilClass && typeof p.vs30 === "number"
      ? `Site soil: ${soilMap[p.soilClass]} (vs30 ≈ ${p.vs30} m/s).`
      : "";

  const userText = [
    `Property: ${input.property.buildingType}, ${input.property.floors} floor(s), built ${ageMap[input.property.age]}.`,
    `Structural system: ${structMap[structuralType]}.`,
    intensityLine,
    groundMotionLine,
    spectralLine,
    soilLine,
    input.property.address ? `Location: ${input.property.address}.` : "",
    "",
    "Inspection answers (resident self-report):",
    ...lines,
    "",
    "Attached images correspond, in order, to the items that have a photo.",
    `Respond in ${langName}.`,
  ]
    .filter(Boolean)
    .join("\n");

  return userText;
}

const SYSTEM_PROMPT = `You are a structural engineer performing rapid post-earthquake safety triage (similar to ATC-20 placards) for a resident who is NOT an expert.

You receive a property description, the resident's yes/no/unsure answers to a structural checklist, and photos of damaged areas.

Assess the OVERALL risk and choose exactly one level:
- "green": No significant NEW structural damage. The building appears safe to occupy.
- "yellow": Light / cosmetic damage (e.g. thin plaster cracks, minor non-structural cracks). Habitable, but the resident should monitor and address the specific items noted.
- "orange": Moderate-to-serious structural damage that needs a professional engineer's inspection SOON, but no obvious sign of imminent collapse (e.g. wide structural cracks, a single column/beam with spalling+exposed rebar, doors/windows jammed by frame distortion, stairs cracked). Limit use to short essential entries until an engineer evaluates it.
- "red": Serious structural damage or signs of potential collapse. Unsafe to occupy; evacuate immediately.

Decision guidance:
- Reserve "yellow" for genuinely minor/cosmetic issues — do NOT use it as a catch-all. If real structural elements (foundation, columns/beams, load-bearing walls, stairs, roof) are affected but collapse is not imminent, choose "orange" so the resident knows to get an engineer urgently.
- "yes" to wide/diagonal/X-shaped cracks in load-bearing walls, spalling concrete with exposed rebar on columns/beams, doors/windows jammed by frame distortion, foundation shifts, roof deformation, or stairs separating from walls suggests orange or red.
- "yes" to a visible LEAN / tilt / sinking of the building or a floor is a sign of potential collapse — treat as red.
- "yes" to ground liquefaction signs, building-to-building pounding, severe plumbing/gas damage, or roof collapse are critical life-safety hazards (treat as red).
- Damaged flooring, electrical panels/wiring, or hanging fixtures alone suggest yellow.
- Ground-motion context (from USGS ShakeMap): higher MMI / PGA means this location was shaken harder, so weigh reported damage more heavily. The spectral acceleration at the building's own period is the demand a building of THAT height actually felt — high values there (≥0.4g) make even partial damage reports more concerning. Soft/very-soft soil sites amplify shaking and are more prone to liquefaction and settlement. Treat strong shaking together with any reported structural damage as a serious (red) combination. Ground motion alone, with no observed damage, should not by itself force red or orange.
- Use the photos to confirm or downgrade severity. Be conservative: when life-safety is uncertain, do not choose green.

Write for a frightened, non-technical resident: short, calm, plain language. Avoid jargon. Always remind them this is preliminary and a licensed engineer or Civil Protection must confirm.

Return ONLY a valid JSON object, no markdown, with this exact shape:
{
  "risk_level": "green" | "yellow" | "orange" | "red",
  "summary": "2-3 sentence plain-language overall assessment",
  "findings": ["short finding", "short finding"],
  "next_steps": ["clear actionable step", "clear actionable step"]
}
All text values must be written in the requested language.`;

function parseAiJson(text: string): AiResult | null {
  let cleaned = text.trim();
  cleaned = cleaned.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1) return null;
  try {
    const parsed = JSON.parse(cleaned.slice(start, end + 1));
    const risk = parsed.risk_level;
    if (risk !== "green" && risk !== "yellow" && risk !== "orange" && risk !== "red")
      return null;
    return {
      risk_level: risk,
      summary: String(parsed.summary ?? ""),
      findings: Array.isArray(parsed.findings) ? parsed.findings.map(String) : [],
      next_steps: Array.isArray(parsed.next_steps)
        ? parsed.next_steps.map(String)
        : [],
    };
  } catch {
    return null;
  }
}

type AnalyzeResult =
  | { ok: true; publicId: string; aiResult: AiResult; riskLevel: RiskLevel }
  | { ok: false; errorCode: "rate_limited" | "credits" | "generic" | "throttled" };

export const analyzeAssessment = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => analyzeSchema.parse(data))
  .handler(async ({ data }): Promise<AnalyzeResult> => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) {
      console.error("[analyze] Missing LOVABLE_API_KEY");
      return { ok: false, errorCode: "generic" };
    }

    // Per-device/IP rate limit BEFORE any upload or AI spend.
    const ip =
      getRequestIP({ xForwardedFor: true })?.split(",")[0]?.trim() || "unknown";
    const { checkAnalysisRateLimit } = await import("./rate-limit.server");
    const allowed = await checkAnalysisRateLimit(ip, data.deviceId || "anon");
    if (!allowed) {
      return { ok: false, errorCode: "throttled" };
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const publicId = makePublicId();

    // Upload photos to private storage (best-effort) and record paths.
    // To protect storage/bandwidth, keep the first (key) photo of every item,
    // then add extra photos only until a cumulative budget is reached.
    const storedAnswers: AssessmentRecord["answers"] = [];
    // Only the KEY (first) photo of each item is sent to the AI — keeps
    // per-analysis credit cost identical to the one-photo design.
    const imageDataUrls: string[] = [];

    const EXTRA_PHOTO_BUDGET = 11_000_000; // ~3 extra photos of base64
    let extraBudget = EXTRA_PHOTO_BUDGET;

    for (const answer of data.answers) {
      const photos = (answer.photoDataUrls ?? []).filter(Boolean);
      const photoPaths: string[] = [];

      for (let i = 0; i < photos.length; i++) {
        const dataUrl = photos[i];
        const isKey = i === 0;
        // Always keep the key photo; ration the extras.
        if (!isKey) {
          if (extraBudget - dataUrl.length < 0) continue;
          extraBudget -= dataUrl.length;
        }
        const decoded = dataUrlToBuffer(dataUrl);
        if (!decoded) continue;
        const path = `${publicId}/${answer.id}-${i}.jpg`;
        const { error: uploadError } = await supabaseAdmin.storage
          .from(BUCKET)
          .upload(path, decoded.buffer, {
            contentType: decoded.contentType,
            upsert: true,
          });
        if (!uploadError) {
          photoPaths.push(path);
          if (isKey) imageDataUrls.push(dataUrl);
        }
      }

      storedAnswers.push({ id: answer.id, value: answer.value, photoPaths });
    }

    // Denormalized photo counters kept in sync on write so analytics stay
    // clean and shape-agnostic (counts only — never the photos themselves).
    const photoCounts: Record<string, number> = {};
    let photoCount = 0;
    for (const a of storedAnswers) {
      const n = a.photoPaths?.length ?? 0;
      if (n > 0) {
        photoCounts[a.id] = n;
        photoCount += n;
      }
    }




    // Prefer the building / tower name the user typed explicitly; otherwise
    // fall back to detecting one from the free-text address so we can still
    // recognize multiple evaluations of the same building.
    const typedBuildingName = data.property.buildingName?.trim();
    const building = typedBuildingName
      ? { name: typedBuildingName, key: buildingKey(typedBuildingName) }
      : extractBuilding(data.property.address);
    // Inferred only when we derived it from the address rather than the field.
    const buildingInferred = !typedBuildingName && !!building;

    // Look up prior analyzed reports from this same building (anonymized
    // counts only) to give the AI neighbor-damage context.
    let peerContext = "";
    if (building) {
      try {
        const { data: peers } = await supabaseAdmin.rpc("get_building_peers", {
          _state: data.property.state ?? "",
          _municipality: data.property.municipality ?? "",
          _building_key: building.key,
        });
        const row = Array.isArray(peers) ? peers[0] : peers;
        if (row && (row.total ?? 0) > 0) {
          peerContext =
            `Context: ${row.total} previous evaluation(s) from this same building ` +
            `("${building.name}") — ${row.red ?? 0} red / ${row.orange ?? 0} orange / ` +
            `${row.yellow ?? 0} yellow / ${row.green ?? 0} green. Structural damage often ` +
            `affects a whole building, so weigh shared/neighbor findings accordingly.`;
        }
      } catch (e) {
        console.error("[analyze] building peers lookup failed", e);
      }
    }

    // Call Lovable AI for structural triage.
    let aiResult: AiResult | null = null;
    try {
      const gateway = createLovableAiGatewayProvider(apiKey);
      const model = gateway("google/gemini-2.5-flash");

      const userContent: Array<
        { type: "text"; text: string } | { type: "image"; image: string }
      > = [{ type: "text", text: buildPrompt(data) }];
      if (peerContext) {
        userContent.push({ type: "text", text: peerContext });
      }
      for (const url of imageDataUrls) {
        userContent.push({ type: "image", image: url });
      }

      const { text } = await generateText({
        model,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userContent },
        ],
      });

      aiResult = parseAiJson(text);
    } catch (error: unknown) {
      const status =
        (error as { statusCode?: number; status?: number })?.statusCode ??
        (error as { status?: number })?.status;
      console.error("[analyze] AI gateway error", status, error);
      if (status === 429) return { ok: false, errorCode: "rate_limited" };
      if (status === 402) return { ok: false, errorCode: "credits" };
      return { ok: false, errorCode: "generic" };
    }

    if (!aiResult) {
      console.error("[analyze] Failed to parse AI result");
      return { ok: false, errorCode: "generic" };
    }

    // Deterministic life-safety rules can OVERRIDE the AI (e.g. URM,
    // liquefaction, pounding, severe plumbing => red; high MMI / >7 floors /
    // vulnerable structural systems => at least yellow). Rule-derived findings
    // are surfaced first so residents see the critical reasons up front.
    const rules = evaluateSafetyRules(
      data.language as Lang,
      data.property,
      data.answers,
    );
    const finalRisk: RiskLevel = maxRisk(aiResult.risk_level, rules.level);
    const mergedResult: AiResult = {
      risk_level: finalRisk,
      summary: aiResult.summary,
      findings: [...rules.findings, ...aiResult.findings],
      next_steps: [...rules.nextSteps, ...aiResult.next_steps],
    };
    aiResult = mergedResult;

    // Certify the report when a valid, approved, non-expired engineer panel
    // token is supplied. Never trust the flag without a server-side check.
    let reportType: "resident" | "professional" = "resident";
    let verifiedByEngineer: string | null = null;
    if (data.engineerToken) {
      const { data: eng } = await supabaseAdmin
        .from("volunteer_engineers")
        .select("id, status, token_expires_at")
        .eq("access_token", data.engineerToken)
        .maybeSingle();
      const notExpired =
        !eng?.token_expires_at ||
        new Date(eng.token_expires_at).getTime() > Date.now();
      if (eng && eng.status === "approved" && notExpired) {
        reportType = "professional";
        verifiedByEngineer = eng.id as string;
      }
    }

    const nowIso = new Date().toISOString();
    const { error: insertError } = await supabaseAdmin.from("assessments").insert({
      public_id: publicId,
      device_id: data.deviceId?.trim() || null,
      language: data.language,
      property: data.property,
      state: data.property.state?.trim() || null,
      municipality: canonicalMunicipality(data.property.state, data.property.municipality),
      parroquia: data.property.parroquia?.trim() || null,
      building_name: building?.name ?? null,
      building_key: building?.key ?? null,
      building_inferred: buildingInferred,
      report_type: reportType,
      verified_by_engineer: verifiedByEngineer,
      answers: storedAnswers,
      photo_count: photoCount,
      photo_counts: photoCounts,
      ai_result: aiResult,
      risk_level: finalRisk,
      // Minimal resident contact (PII) — only owner/service-role can read it.
      resident_name: data.resident?.name?.trim() || null,
      resident_contact: data.resident?.contact?.trim() || null,
      resident_contact_type: data.resident?.contactType ?? null,
      // Versioned legal acceptance + data consent (blocking gate, Doc #1).
      legal_ack_at: data.consent ? data.consent.at || nowIso : null,
      legal_version: data.consent?.legalVersion ?? null,
      consent_at: data.consent ? data.consent.at || nowIso : null,
      consent_version: data.consent?.consentVersion ?? null,
      status: "analyzed",
    });

    if (insertError) {
      console.error("[analyze] DB insert error", insertError);
      return { ok: false, errorCode: "generic" };
    }

    // Loud Slack alert for dangerous self-evaluations (best-effort). Red pings
    // the channel; Orange is posted without a ping.
    if (finalRisk === "red" || finalRisk === "orange") {
      try {
        const { sendSlackNotification, riskTag } = await import("./slack-notify.server");
        const location =
          [data.property.municipality, data.property.state]
            .map((v) => v?.trim())
            .filter(Boolean)
            .join(", ") || "—";
        await sendSlackNotification({
          emoji: finalRisk === "red" ? "🚨" : "🟠",
          title:
            finalRisk === "red"
              ? "Evaluación de ALTO RIESGO (Rojo)"
              : "Evaluación de riesgo elevado (Naranja)",
          context:
            reportType === "professional"
              ? "Reporte verificado por ingeniero"
              : "Autoevaluación de un vecino",
          fields: [
            { label: "Riesgo", value: riskTag(finalRisk) },
            { label: "Ubicación", value: location },
            { label: "Edificación", value: building?.name ?? "—" },
          ],
          url: `/a/${publicId}`,
          buttonLabel: "Ver reporte",
          urgent: finalRisk === "red",
        });
      } catch (notifyErr) {
        console.error("[analyze] slack notify failed", notifyErr);
      }
    }

    return {
      ok: true,
      publicId,
      aiResult,
      riskLevel: aiResult.risk_level,
    };
  });

const getSchema = z.object({ publicId: z.string().min(6).max(40) });

export const getAssessment = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => getSchema.parse(data))
  .handler(async ({ data }): Promise<AssessmentRecord | null> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: row, error } = await supabaseAdmin
      .from("assessments")
      .select("*")
      .eq("public_id", data.publicId)
      .maybeSingle();

    if (error || !row) {
      if (error) console.error("[getAssessment] DB error", error);
      return null;
    }

    const answers = (row.answers as AssessmentRecord["answers"]) ?? [];
    const photoUrls: Record<string, string[]> = {};

    for (const answer of answers) {
      // Support both the new multi-photo shape and legacy single photoPath.
      const paths = [
        ...(answer.photoPaths ?? []),
        ...(answer.photoPath ? [answer.photoPath] : []),
      ].filter(Boolean) as string[];
      if (paths.length === 0) continue;
      const urls: string[] = [];
      for (const path of paths) {
        const { data: signed } = await supabaseAdmin.storage
          .from(BUCKET)
          .createSignedUrl(path, SIGNED_URL_TTL);
        if (signed?.signedUrl) urls.push(signed.signedUrl);
      }
      if (urls.length > 0) photoUrls[answer.id] = urls;
    }


    // Order answers to match the canonical checklist order.
    const ordered = CHECKLIST_ITEMS.map((item) =>
      answers.find((a) => a.id === item.id),
    ).filter(Boolean) as AssessmentRecord["answers"];

    // Anonymized "other reports from this building" context (counts only).
    let building: AssessmentRecord["building"] = null;
    const buildingName = (row.building_name as string | null) ?? null;
    const buildingKey = (row.building_key as string | null) ?? null;
    if (buildingName && buildingKey) {
      let peers = { total: 0, green: 0, yellow: 0, orange: 0, red: 0 };
      try {
        const { data: peerRows } = await supabaseAdmin.rpc("get_building_peers", {
          _state: (row.state as string | null) ?? "",
          _municipality: (row.municipality as string | null) ?? "",
          _building_key: buildingKey,
        });
        const pr = Array.isArray(peerRows) ? peerRows[0] : peerRows;
        if (pr) {
          peers = {
            total: pr.total ?? 0,
            green: pr.green ?? 0,
            yellow: pr.yellow ?? 0,
            orange: pr.orange ?? 0,
            red: pr.red ?? 0,
          };
        }
      } catch (e) {
        console.error("[getAssessment] building peers failed", e);
      }
      // Exclude this report itself from the "others" count.
      const others = Math.max(0, peers.total - 1);
      building = { name: buildingName, others, peers };
    }

    return {
      publicId: row.public_id,
      language: (row.language as "es" | "en") ?? "es",
      property: row.property as AssessmentRecord["property"],
      answers: ordered,
      aiResult: row.ai_result as AiResult,
      riskLevel: (row.risk_level as RiskLevel) ?? "yellow",
      priorRiskLevel: (row.prior_risk_level as RiskLevel | null) ?? null,
      reportType:
        (row.report_type as "resident" | "professional" | null) ?? "resident",
      createdAt: row.created_at,
      photoUrls,
      building,
    };
  });

