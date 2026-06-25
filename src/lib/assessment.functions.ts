import { createServerFn } from "@tanstack/react-start";
import { getRequestIP } from "@tanstack/react-start/server";
import { generateText } from "ai";
import { z } from "zod";

import { createLovableAiGatewayProvider } from "./ai-gateway.server";
import {
  CHECKLIST_ITEMS,
  type AiResult,
  type AssessmentRecord,
  type RiskLevel,
} from "./assessment-types";
import { translate, type Lang } from "./i18n";

const BUCKET = "assessment-photos";
const SIGNED_URL_TTL = 60 * 60 * 24 * 7; // 7 days

const answerSchema = z.object({
  id: z.enum([
    "foundation",
    "exterior_walls",
    "interior_walls",
    "columns_beams",
    "doors_windows",
    "roof",
    "stairs",
  ]),
  value: z.enum(["yes", "no", "unsure"]),
  // ~2.5MB decoded ≈ 3.4M base64 chars; cap generously to reject abusive payloads.
  photoDataUrl: z.string().max(3_600_000).nullable().optional(),
});

const analyzeSchema = z.object({
  language: z.enum(["es", "en"]),
  deviceId: z.string().min(1).max(64).optional().default(""),
  property: z.object({
    address: z.string().max(300).optional().default(""),
    state: z.string().max(120).optional().default(""),
    municipality: z.string().max(120).optional().default(""),
    buildingType: z.enum(["house", "apartment", "commercial"]),
    floors: z.number().int().min(1).max(200),
    age: z.enum(["pre1970", "1970to2000", "post2000"]),
  }),
  answers: z.array(answerSchema).min(1).max(7),
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
    const hasPhoto = a.photoDataUrl ? " (photo attached)" : " (no photo)";
    return `- [${area}] ${question} => ${answer}${hasPhoto}`;
  });

  const ageMap: Record<string, string> = {
    pre1970: "before 1970",
    "1970to2000": "1970-2000",
    post2000: "after 2000",
  };

  const userText = [
    `Property: ${input.property.buildingType}, ${input.property.floors} floor(s), built ${ageMap[input.property.age]}.`,
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
- "green": No significant structural damage observed. The building appears safe to occupy.
- "yellow": Possible or moderate structural damage. Restricted/limited use; entry only for short, essential tasks.
- "red": Serious structural damage or signs of potential collapse. Unsafe to occupy; evacuate immediately.

Decision guidance:
- "yes" to foundation shifts, diagonal exterior cracks/separation, spalling concrete with exposed rebar, roof deformation/collapse, or stairs separating from walls strongly suggests yellow or red.
- Exposed rebar + spalling on columns/beams, or roof collapse, should push toward red.
- Use the photos to confirm or downgrade severity. Be conservative: when life-safety is uncertain, do not choose green.

Write for a frightened, non-technical resident: short, calm, plain language. Avoid jargon. Always remind them this is preliminary and a licensed engineer or Civil Protection must confirm.

Return ONLY a valid JSON object, no markdown, with this exact shape:
{
  "risk_level": "green" | "yellow" | "red",
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
    if (risk !== "green" && risk !== "yellow" && risk !== "red") return null;
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
    const storedAnswers: AssessmentRecord["answers"] = [];
    const imageDataUrls: string[] = [];


    for (const answer of data.answers) {
      let photoPath: string | null = null;
      if (answer.photoDataUrl) {
        const decoded = dataUrlToBuffer(answer.photoDataUrl);
        if (decoded) {
          const path = `${publicId}/${answer.id}.jpg`;
          const { error: uploadError } = await supabaseAdmin.storage
            .from(BUCKET)
            .upload(path, decoded.buffer, {
              contentType: decoded.contentType,
              upsert: true,
            });
          if (!uploadError) {
            photoPath = path;
            imageDataUrls.push(answer.photoDataUrl);
          }
        }
      }
      storedAnswers.push({ id: answer.id, value: answer.value, photoPath });
    }

    // Call Lovable AI for structural triage.
    let aiResult: AiResult | null = null;
    try {
      const gateway = createLovableAiGatewayProvider(apiKey);
      const model = gateway("google/gemini-2.5-flash");

      const userContent: Array<
        { type: "text"; text: string } | { type: "image"; image: string }
      > = [{ type: "text", text: buildPrompt(data) }];
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

    const { error: insertError } = await supabaseAdmin.from("assessments").insert({
      public_id: publicId,
      language: data.language,
      property: data.property,
      state: data.property.state?.trim() || null,
      municipality: data.property.municipality?.trim() || null,
      answers: storedAnswers,
      ai_result: aiResult,
      risk_level: aiResult.risk_level,
      status: "analyzed",
    });

    if (insertError) {
      console.error("[analyze] DB insert error", insertError);
      return { ok: false, errorCode: "generic" };
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
    const photoUrls: Record<string, string> = {};

    for (const answer of answers) {
      if (answer.photoPath) {
        const { data: signed } = await supabaseAdmin.storage
          .from(BUCKET)
          .createSignedUrl(answer.photoPath, SIGNED_URL_TTL);
        if (signed?.signedUrl) photoUrls[answer.id] = signed.signedUrl;
      }
    }

    // Order answers to match the canonical checklist order.
    const ordered = CHECKLIST_ITEMS.map((item) =>
      answers.find((a) => a.id === item.id),
    ).filter(Boolean) as AssessmentRecord["answers"];

    return {
      publicId: row.public_id,
      language: (row.language as "es" | "en") ?? "es",
      property: row.property as AssessmentRecord["property"],
      answers: ordered,
      aiResult: row.ai_result as AiResult,
      riskLevel: (row.risk_level as RiskLevel) ?? "yellow",
      createdAt: row.created_at,
      photoUrls,
    };
  });
