import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import type { Json } from "@/integrations/supabase/types";

import {
  seismicAt,
  type MmiGrid,
  type SeismicGrid,
  type SeismicReading,
} from "./shakemap";

const intensitySchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

/**
 * Public, read-only lookup: returns the estimated ShakeMap ground-motion
 * metrics (MMI, PGA, PGV, spectral accelerations and soil vs30) at a
 * coordinate for the currently active seismic event, or null if there is no
 * active event or the point is outside coverage. Only the point reading is
 * returned — the full grid never leaves the server.
 */
export const getSeismicIntensity = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => intensitySchema.parse(data))
  .handler(async ({ data }): Promise<SeismicReading | null> => {
    try {
      const { supabaseAdmin } = await import(
        "@/integrations/supabase/client.server"
      );
      const { data: row, error } = await supabaseAdmin
        .from("seismic_events")
        .select("grid")
        .eq("is_active", true)
        .maybeSingle();
      if (error || !row) return null;
      const grid = row.grid as unknown as SeismicGrid | MmiGrid;
      return seismicAt(grid, data.lat, data.lng);
    } catch (err) {
      console.error("[getSeismicIntensity] error", err);
      return null;
    }
  });

const refreshSchema = z.object({
  eventId: z.string().min(3).max(60),
  adminSecret: z.string().min(1).max(256),
});

type RefreshResult =
  | { ok: true; eventId: string; nx: number; ny: number }
  | { ok: false; error: string };

/**
 * Guarded admin endpoint: fetch the latest ShakeMap MMI coverage for a USGS
 * event id and store it as the active event. Lets a new earthquake be
 * activated without a code deploy. Protected by SHAKEMAP_ADMIN_SECRET.
 */
export const setActiveShakemapEvent = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => refreshSchema.parse(data))
  .handler(async ({ data }): Promise<RefreshResult> => {
    const expected = process.env.SHAKEMAP_ADMIN_SECRET;
    if (!expected) return { ok: false, error: "not_configured" };
    if (
      data.adminSecret.length !== expected.length ||
      data.adminSecret !== expected
    ) {
      return { ok: false, error: "forbidden" };
    }

    try {
      const eventRes = await fetch(
        `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&eventid=${encodeURIComponent(
          data.eventId,
        )}`,
      );
      if (!eventRes.ok) return { ok: false, error: "event_not_found" };
      const event = (await eventRes.json()) as {
        properties?: {
          title?: string;
          products?: {
            shakemap?: Array<{
              contents?: Record<string, { url?: string }>;
            }>;
          };
        };
      };
      const shakemap = event.properties?.products?.shakemap?.[0];
      const covUrl =
        shakemap?.contents?.["download/coverage_mmi_low_res.covjson"]?.url;
      if (!covUrl) return { ok: false, error: "no_shakemap" };

      const covRes = await fetch(covUrl);
      if (!covRes.ok) return { ok: false, error: "coverage_fetch_failed" };
      const cov = (await covRes.json()) as {
        domain: {
          axes: {
            x: { start: number; stop: number; num: number };
            y: { start: number; stop: number; num: number };
          };
        };
        ranges: Record<string, { values: (number | null)[] }>;
      };

      const ax = cov.domain.axes;
      const mmiRange = cov.ranges.MMI ?? cov.ranges[Object.keys(cov.ranges)[0]];
      const grid: MmiGrid = {
        x0: ax.x.start,
        x1: ax.x.stop,
        nx: ax.x.num,
        y0: ax.y.start,
        y1: ax.y.stop,
        ny: ax.y.num,
        values: mmiRange.values,
      };
      if (grid.values.length !== grid.nx * grid.ny) {
        return { ok: false, error: "grid_shape_mismatch" };
      }
      const bbox = {
        minLng: Math.min(grid.x0, grid.x1),
        maxLng: Math.max(grid.x0, grid.x1),
        minLat: Math.min(grid.y0, grid.y1),
        maxLat: Math.max(grid.y0, grid.y1),
      };

      const { supabaseAdmin } = await import(
        "@/integrations/supabase/client.server"
      );
      // Single-active invariant: deactivate everything first.
      await supabaseAdmin
        .from("seismic_events")
        .update({ is_active: false })
        .eq("is_active", true);
      const { error: upErr } = await supabaseAdmin
        .from("seismic_events")
        .upsert(
          {
            event_id: data.eventId,
            label: event.properties?.title ?? data.eventId,
            is_active: true,
            grid: grid as unknown as Json,
            bbox: bbox as unknown as Json,
          },
          { onConflict: "event_id" },
        );
      if (upErr) return { ok: false, error: "db_write_failed" };

      return { ok: true, eventId: data.eventId, nx: grid.nx, ny: grid.ny };
    } catch (err) {
      console.error("[setActiveShakemapEvent] error", err);
      return { ok: false, error: "unexpected" };
    }
  });
