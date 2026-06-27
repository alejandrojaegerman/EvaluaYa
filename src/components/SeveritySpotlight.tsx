import { CountUp } from "@/components/CountUp";
import { useLang } from "@/lib/i18n";
import { RISK_HEX } from "@/lib/risk";

function rgb(level: "red" | "orange" | "yellow" | "green"): string {
  const [r, g, b] = RISK_HEX[level];
  return `rgb(${r}, ${g}, ${b})`;
}

/**
 * Headline urgency block. Leads with the share of assessments at orange/red
 * level, a thin stacked severity bar, a plain-language caption, and the most
 * affected area. Pure derivation from props — SSR-safe.
 */
export function SeveritySpotlight({
  total,
  green,
  yellow,
  orange,
  red,
  topAreaLabel,
}: {
  total: number;
  green: number;
  yellow: number;
  orange: number;
  red: number;
  topAreaLabel?: string | null;
}) {
  const { t } = useLang();
  const safeTotal = Math.max(1, total);
  const serious = orange + red;
  const pct = Math.round((serious / safeTotal) * 100);

  const segments: Array<{ level: "red" | "orange" | "yellow" | "green"; count: number }> = [
    { level: "red", count: red },
    { level: "orange", count: orange },
    { level: "yellow", count: yellow },
    { level: "green", count: green },
  ];

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <p className="text-sm font-semibold text-muted-foreground">
        {t("map.severityTitle")}
      </p>

      <div className="mt-2 flex items-end gap-2">
        <span
          className="font-display text-5xl font-extrabold leading-none"
          style={{ color: serious > 0 ? rgb("orange") : rgb("green") }}
        >
          <CountUp value={pct} />%
        </span>
        <span className="pb-1.5 text-sm font-medium text-muted-foreground">
          {serious > 0 ? t("map.severityNeedAttention") : t("map.severityNone")}
        </span>
      </div>

      {/* stacked severity bar */}
      <div className="mt-4 flex h-3 w-full overflow-hidden rounded-full bg-muted">
        {segments.map((s) =>
          s.count > 0 ? (
            <div
              key={s.level}
              style={{
                width: `${(s.count / safeTotal) * 100}%`,
                backgroundColor: rgb(s.level),
              }}
              title={`${s.count}`}
            />
          ) : null,
        )}
      </div>

      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
        {t("map.severityCaption")}
      </p>

      {topAreaLabel && serious > 0 && (
        <div className="mt-4 flex items-center justify-between gap-2 rounded-xl bg-muted/50 px-3 py-2">
          <span className="text-xs font-medium text-muted-foreground">
            {t("map.severityTopArea")}
          </span>
          <span className="min-w-0 truncate text-xs font-semibold">
            {topAreaLabel}
          </span>
        </div>
      )}
    </div>
  );
}
