import { useLang } from "@/lib/i18n";
import { RISK_HEX } from "@/lib/risk";

function rgb(level: "red" | "orange" | "yellow" | "green"): string {
  const [r, g, b] = RISK_HEX[level];
  return `rgb(${r}, ${g}, ${b})`;
}

/**
 * Ranked horizontal severity bars. Each tier (high / urgent / moderate / low)
 * gets a full-width track with a colored fill proportional to its share of the
 * total, ordered most-severe → least-severe so the tiers compare on a shared
 * baseline. Colors come from RISK_HEX (no hardcoded color literals). SSR-safe —
 * pure derivation from props.
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
  const safeTotal = Math.max(1, total);

  const rows: Array<{
    level: "red" | "orange" | "yellow" | "green";
    name: string;
    value: number;
  }> = [
    { level: "red", name: t("map.high"), value: red },
    { level: "orange", name: t("map.urgent"), value: orange },
    { level: "yellow", name: t("map.moderate"), value: yellow },
    { level: "green", name: t("map.low"), value: green },
  ];

  const pct = (n: number) => (total > 0 ? Math.round((n / total) * 100) : 0);

  return (
    <div>
      {/* Total */}
      <div className="mb-6 flex items-end justify-end">
        <div className="text-right leading-none">
          <span className="font-display text-3xl font-extrabold tabular-nums text-foreground">
            {total.toLocaleString()}
          </span>
          {label && (
            <p className="mt-1 text-xs font-medium text-muted-foreground">
              {label}
            </p>
          )}
        </div>
      </div>

      {/* Ranked bars */}
      <ul className="space-y-4">
        {rows.map((r) => {
          const color = rgb(r.level);
          const width = total > 0 ? (r.value / safeTotal) * 100 : 0;
          return (
            <li key={r.level} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span
                    className="size-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: color }}
                    aria-hidden
                  />
                  <span className="text-sm font-semibold text-foreground">
                    {r.name}
                  </span>
                </span>
                <span className="text-sm">
                  <span className="font-bold tabular-nums text-foreground">
                    {r.value.toLocaleString()}
                  </span>
                  <span className="ml-1 font-medium tabular-nums text-muted-foreground">
                    {pct(r.value)}%
                  </span>
                </span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full transition-[width] duration-700"
                  style={{ width: `${width}%`, backgroundColor: color }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
