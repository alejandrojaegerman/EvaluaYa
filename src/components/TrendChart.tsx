import { useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { CountUp } from "@/components/CountUp";
import { formatDayLabel } from "@/lib/datetime";
import { useLang } from "@/lib/i18n";
import { RISK_HEX } from "@/lib/risk";
import type { TimeseriesPoint } from "@/lib/stats.functions";

function rgb(level: "red" | "orange" | "yellow" | "green"): string {
  const [r, g, b] = RISK_HEX[level];
  return `rgb(${r}, ${g}, ${b})`;
}

const LEVELS: Array<"green" | "yellow" | "orange" | "red"> = [
  "green",
  "yellow",
  "orange",
  "red",
];

/**
 * Stacked area chart of daily assessments split by risk level. Recharts draws
 * itself in on mount. Renders an empty-state when there is no data.
 */
export function TrendChart({ points }: { points: TimeseriesPoint[] }) {
  const { t, lang } = useLang();

  const data = useMemo(
    () =>
      points.map((p) => ({
        ...p,
        label: formatDayLabel(p.day, lang),
      })),
    [points, lang],
  );

  const totalReports = useMemo(
    () => points.reduce((sum, p) => sum + p.total, 0),
    [points],
  );

  if (data.length === 0) {
    return (
      <p className="rounded-xl bg-muted/40 py-6 text-center text-xs text-muted-foreground">
        {t("map.trendEmpty")}
      </p>
    );
  }

  return (
    <div>
      <p className="text-xs text-muted-foreground">
        <span className="font-semibold text-foreground">
          <CountUp value={totalReports} />
        </span>{" "}
        {t("map.trendTotalReports")}
      </p>

      <div className="mt-3 h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 6, right: 6, bottom: 0, left: -22 }}
          >
            <defs>
              {LEVELS.map((lvl) => (
                <linearGradient
                  key={lvl}
                  id={`trend-${lvl}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="0%" stopColor={rgb(lvl)} stopOpacity={0.7} />
                  <stop offset="100%" stopColor={rgb(lvl)} stopOpacity={0.15} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              className="stroke-border"
            />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              minTickGap={24}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
              width={32}
            />
            <Tooltip
              contentStyle={{
                borderRadius: 12,
                border: "1px solid hsl(var(--border))",
                fontSize: 12,
              }}
              labelStyle={{ fontWeight: 600 }}
            />
            {LEVELS.map((lvl) => (
              <Area
                key={lvl}
                type="monotone"
                dataKey={lvl}
                name={t(
                  lvl === "red"
                    ? "map.high"
                    : lvl === "orange"
                      ? "map.urgent"
                      : lvl === "yellow"
                        ? "map.moderate"
                        : "map.low",
                )}
                stackId="1"
                stroke={rgb(lvl)}
                strokeWidth={1.5}
                fill={`url(#trend-${lvl})`}
                isAnimationActive
                animationDuration={800}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
