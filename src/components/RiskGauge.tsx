import { useMemo } from "react";
import {
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
} from "recharts";

import { useLang } from "@/lib/i18n";
import { RISK_HEX } from "@/lib/risk";

function rgb(level: "red" | "orange" | "yellow" | "green"): string {
  const [r, g, b] = RISK_HEX[level];
  return `rgb(${r}, ${g}, ${b})`;
}

/**
 * Radial gauge that renders the high / urgent / moderate / low risk split as
 * concentric rings with the total in the center. Colors come from RISK_HEX (no
 * hardcoded color literals). SSR-safe — pure derivation from props.
 */
export function RiskGauge({
  green,
  yellow,
  orange = 0,
  red,
  label,
}: {
  green: number;
  yellow: number;
  orange?: number;
  red: number;
  label?: string;
}) {
  const { t } = useLang();
  const total = green + yellow + orange + red;

  // Outer ring = red (high), then orange, yellow, inner = green. Each ring fills
  // proportionally to its share of the total via a shared 0..total angle axis.
  const data = useMemo(
    () => [
      { name: "red", value: red, fill: rgb("red") },
      { name: "orange", value: orange, fill: rgb("orange") },
      { name: "yellow", value: yellow, fill: rgb("yellow") },
      { name: "green", value: green, fill: rgb("green") },
    ],
    [red, orange, yellow, green],
  );

  const pct = (n: number) => (total > 0 ? Math.round((n / total) * 100) : 0);

  return (
    <div className="flex flex-col items-center sm:flex-row sm:items-center sm:gap-4">
      <div className="relative h-40 w-40 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            data={data}
            innerRadius="34%"
            outerRadius="100%"
            startAngle={90}
            endAngle={-270}
            barSize={9}
          >
            <PolarAngleAxis
              type="number"
              domain={[0, Math.max(1, total)]}
              angleAxisId={0}
              tick={false}
            />
            <RadialBar
              background={{ fill: "var(--muted)" }}
              dataKey="value"
              cornerRadius={6}
              isAnimationActive
              animationDuration={900}
            />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-3xl font-extrabold tabular-nums text-foreground">
            {total.toLocaleString()}
          </span>
          {label && (
            <span className="max-w-[6rem] text-center text-[10px] font-medium leading-tight text-muted-foreground">
              {label}
            </span>
          )}
        </div>
      </div>

      <ul className="mt-3 grid w-full grid-cols-2 gap-2 text-center text-xs sm:mt-0 sm:grid-cols-1 sm:text-left">
        <GaugeLegend
          color={rgb("red")}
          name={t("map.high")}
          value={red}
          pct={pct(red)}
        />
        <GaugeLegend
          color={rgb("orange")}
          name={t("map.urgent")}
          value={orange}
          pct={pct(orange)}
        />
        <GaugeLegend
          color={rgb("yellow")}
          name={t("map.moderate")}
          value={yellow}
          pct={pct(yellow)}
        />
        <GaugeLegend
          color={rgb("green")}
          name={t("map.low")}
          value={green}
          pct={pct(green)}
        />
      </ul>
    </div>
  );
}

function GaugeLegend({
  color,
  name,
  value,
  pct,
}: {
  color: string;
  name: string;
  value: number;
  pct: number;
}) {
  return (
    <li className="flex flex-col items-center gap-0.5 sm:flex-row sm:items-center sm:gap-2">
      <span className="flex items-center gap-1.5">
        <span
          className="size-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: color }}
          aria-hidden
        />
        <span className="font-display text-base font-bold tabular-nums" style={{ color }}>
          {value.toLocaleString()}
        </span>
      </span>
      <span className="text-muted-foreground">
        {name}
        <span className="ml-1 tabular-nums opacity-70">{pct}%</span>
      </span>
    </li>
  );
}
