import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Lang } from "./i18n";
import type { RiskLevel } from "./assessment-types";

const claimSchema = z.object({
  deviceId: z.string().max(64).optional().default(""),
  publicIds: z.array(z.string().max(64)).max(50).optional().default([]),
});

export type MyAssessment = {
  publicId: string;
  riskLevel: RiskLevel | null;
  address: string;
  state: string | null;
  language: Lang;
  createdAt: string;
};

/**
 * Attach every still-unclaimed report from this device (and any locally known
 * publicIds) to the signed-in user. We only ever set user_id on rows where it
 * IS NULL, so a known publicId/deviceId can never reassign someone else's
 * already-saved report.
 */
export const claimAssessments = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => claimSchema.parse(data))
  .handler(async ({ data, context }): Promise<{ claimed: number }> => {
    const deviceId = data.deviceId?.trim() || "";
    const publicIds = (data.publicIds ?? []).filter(Boolean);
    if (!deviceId && publicIds.length === 0) return { claimed: 0 };

    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );

    const orFilters: string[] = [];
    if (deviceId) orFilters.push(`device_id.eq.${deviceId}`);
    if (publicIds.length > 0) {
      orFilters.push(`public_id.in.(${publicIds.join(",")})`);
    }

    const { data: rows, error } = await supabaseAdmin
      .from("assessments")
      .update({ user_id: context.userId })
      .is("user_id", null)
      .or(orFilters.join(","))
      .select("id");

    if (error) {
      console.error("[claimAssessments] DB error", error);
      return { claimed: 0 };
    }
    return { claimed: rows?.length ?? 0 };
  });

/** Returns the signed-in user's saved reports (safe columns), newest first. */
export const getMyAssessments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<MyAssessment[]> => {
    const { data, error } = await context.supabase
      .from("assessments")
      .select("public_id, risk_level, property, state, language, created_at")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      console.error("[getMyAssessments] DB error", error);
      return [];
    }

    return (data ?? []).map((row) => {
      const property = (row.property ?? {}) as { address?: string };
      return {
        publicId: row.public_id,
        riskLevel: (row.risk_level as RiskLevel | null) ?? null,
        address: property.address ?? "",
        state: row.state ?? null,
        language: (row.language as Lang) ?? "es",
        createdAt: row.created_at,
      };
    });
  });
