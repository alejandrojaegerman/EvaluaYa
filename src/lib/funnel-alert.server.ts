import { createClient } from "@supabase/supabase-js";

import { sendSlackNotification } from "./slack-notify.server";
import { FUNNEL_STEPS, type FunnelMetrics, type FunnelStep } from "./funnel.functions";


// How many of the most-recent complete hours count as "recent".
const RECENT_HOURS = 3;
// Minimum starts in the recent window before we trust the ratio enough to alert
// (avoids noisy alerts on tiny samples / quiet nights).
const MIN_RECENT_STARTS = 12;
// Alert when recent conversion drops to less than this fraction of baseline.
const DROP_FRACTION = 0.5;

const STEP_LABEL_ES: Record<FunnelStep, string> = {
  home_cta: "Inicio: comenzar",
  property_started: "Datos del inmueble",
  property_completed: "Inmueble completado",
  checklist_started: "Lista de revisión",
  analyze_started: "Análisis con IA",
  result_reached: "Resultado",
};

/**
 * Hourly funnel watchdog. Compares the conversion rate (result_reached /
 * property_started) of the last few hours against the trailing 7-day baseline.
 * If conversion collapses while traffic is still flowing, it emails the admin —
 * so a *flow regression* is caught quickly and told apart from a normal
 * traffic/time-of-day dip. Idempotent per hour so re-runs never double-send.
 */
export async function runFunnelAlert(): Promise<{
  ok: boolean;
  alerted: boolean;
  reason?: string;
}> {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    console.error("[funnel-alert] missing supabase env");
    return { ok: false, alerted: false, reason: "config" };
  }

  const supabase = createClient(supabaseUrl, serviceKey);
  const { data, error } = await supabase.rpc("get_funnel_metrics", {
    _window_hours: 168, // 7 days
  });
  if (error || !data) {
    console.error("[funnel-alert] rpc failed", error);
    return { ok: false, alerted: false, reason: "rpc" };
  }

  const metrics = data as unknown as FunnelMetrics;
  const hourly = Array.isArray(metrics.hourly) ? [...metrics.hourly] : [];
  hourly.sort((a, b) => a.hour.localeCompare(b.hour));

  if (hourly.length < RECENT_HOURS + 6) {
    // Not enough history to compute a meaningful baseline yet.
    return { ok: true, alerted: false, reason: "insufficient_history" };
  }

  const recent = hourly.slice(-RECENT_HOURS);
  const baseline = hourly.slice(0, -RECENT_HOURS);

  const sum = (arr: typeof hourly, k: "started" | "result") =>
    arr.reduce((acc, h) => acc + (h[k] ?? 0), 0);

  const recentStarted = sum(recent, "started");
  const recentResult = sum(recent, "result");
  const baselineStarted = sum(baseline, "started");
  const baselineResult = sum(baseline, "result");

  if (recentStarted < MIN_RECENT_STARTS || baselineStarted <= 0) {
    return { ok: true, alerted: false, reason: "low_volume" };
  }

  const recentConv = recentResult / recentStarted;
  const baselineConv = baselineResult / baselineStarted;

  if (baselineConv <= 0 || recentConv >= baselineConv * DROP_FRACTION) {
    return { ok: true, alerted: false, reason: "healthy" };
  }

  // Identify the worst step-to-step drop in the recent window (excluding the
  // upstream home CTA), using the windowed device counts as a proxy.
  const counts = new Map<FunnelStep, number>(
    (metrics.steps ?? []).map((s) => [s.step, s.devices]),
  );
  const flow = FUNNEL_STEPS.filter((s) => s !== "home_cta");
  let worstStep: FunnelStep | null = null;
  let worstRetention = Infinity;
  for (let i = 1; i < flow.length; i++) {
    const prev = counts.get(flow[i - 1]) ?? 0;
    const cur = counts.get(flow[i]) ?? 0;
    if (prev <= 0) continue;
    const retention = cur / prev;
    if (retention < worstRetention) {
      worstRetention = retention;
      worstStep = flow[i];
    }
  }

  const worstStepLabel = worstStep ? STEP_LABEL_ES[worstStep] : null;
  const res = await sendSlackNotification({
    emoji: "📉",
    title: "Caída de conversión detectada",
    context: `Las ${RECENT_HOURS} últimas horas vs. promedio de 7 días`,
    fields: [
      {
        label: "Conversión reciente",
        value: `${Math.round(recentConv * 100)}% (${recentResult}/${recentStarted})`,
      },
      { label: "Conversión base", value: `${Math.round(baselineConv * 100)}%` },
      ...(worstStepLabel
        ? [{ label: "Paso más débil", value: worstStepLabel }]
        : []),
    ],
    url: "/admin",
    buttonLabel: "Abrir panel admin",
    urgent: true,
  });

  return { ok: res.ok, alerted: res.ok };

}
