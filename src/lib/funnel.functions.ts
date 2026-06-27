import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// ---------------------------------------------------------------------------
// Funnel instrumentation. `trackFunnelStep` is a public, fire-and-forget
// endpoint that records one anonymous step event (device id + step + lang).
// `getFunnelMetrics` is admin-only (gated by VOLUNTEER_ADMIN_SECRET) and reads
// aggregated, anonymized counts through the service-role `get_funnel_metrics`
// RPC. The raw events table is locked down — nothing here exposes PII.
// ---------------------------------------------------------------------------

export const FUNNEL_STEPS = [
  "home_cta",
  "property_started",
  "property_completed",
  "checklist_started",
  "analyze_started",
  "result_reached",
] as const;

export type FunnelStep = (typeof FUNNEL_STEPS)[number];

const trackSchema = z.object({
  deviceId: z.string().trim().min(1).max(64),
  step: z.enum(FUNNEL_STEPS),
  language: z.string().trim().max(8).optional(),
});

export const trackFunnelStep = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => trackSchema.parse(data))
  .handler(async ({ data }) => {
    try {
      const { supabaseAdmin } = await import(
        "@/integrations/supabase/client.server"
      );
      await supabaseAdmin.from("funnel_events").insert({
        device_id: data.deviceId,
        step: data.step,
        language: data.language ?? null,
      });
    } catch (e) {
      // Tracking must never affect the user — swallow everything.
      console.error("[funnel] trackFunnelStep failed", e);
    }
    return { ok: true as const };
  });

export type FunnelStepCount = {
  step: FunnelStep;
  devices: number;
  events: number;
};

export type FunnelHourPoint = {
  hour: string;
  started: number;
  result: number;
};

export type FunnelMetrics = {
  windowHours: number;
  steps: FunnelStepCount[];
  hourly: FunnelHourPoint[];
};

const EMPTY_METRICS: FunnelMetrics = {
  windowHours: 48,
  steps: [],
  hourly: [],
};

const metricsSchema = z.object({
  adminSecret: z.string().min(1),
  windowHours: z.number().int().min(1).max(720).optional(),
});

export const getFunnelMetrics = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => metricsSchema.parse(data))
  .handler(
    async ({
      data,
    }): Promise<
      { ok: true; metrics: FunnelMetrics } | { ok: false; error: string }
    > => {
      const expected = process.env.VOLUNTEER_ADMIN_SECRET;
      if (!expected || data.adminSecret !== expected) {
        return { ok: false, error: "unauthorized" };
      }
      try {
        const { supabaseAdmin } = await import(
          "@/integrations/supabase/client.server"
        );
        const { data: raw, error } = await supabaseAdmin.rpc(
          "get_funnel_metrics",
          { _window_hours: data.windowHours ?? 48 },
        );
        if (error || !raw) {
          if (error) console.error("[funnel] getFunnelMetrics", error);
          return { ok: true, metrics: EMPTY_METRICS };
        }
        const parsed = raw as unknown as FunnelMetrics;
        return {
          ok: true,
          metrics: {
            windowHours: parsed.windowHours ?? 48,
            steps: Array.isArray(parsed.steps) ? parsed.steps : [],
            hourly: Array.isArray(parsed.hourly) ? parsed.hourly : [],
          },
        };
      } catch (e) {
        console.error("[funnel] getFunnelMetrics failed", e);
        return { ok: true, metrics: EMPTY_METRICS };
      }
    },
  );
