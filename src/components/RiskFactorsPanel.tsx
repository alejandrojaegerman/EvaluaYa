import { useLang } from "@/lib/i18n";
import { RISK_HEX } from "@/lib/risk";
import type { FactorRow, RiskFactors } from "@/lib/stats.functions";

function rgb(level: "red" | "yellow" | "green"): string {
  const [r, g, b] = RISK_HEX[level];
  return `rgb(${r}, ${g}, ${b})`;
}

type LabelFn = (key: string) => string;

/** One factor group rendered as labelled, risk-split bars. */
function FactorGroup({
  title,
  rows,
  label,
  max,
}: {
  title: string;
  rows: FactorRow[];
  label: LabelFn;
  max: number;
}) {
  if (rows.length === 0) return null;
  return (
    <div>
      <p className="text-xs font-semibold text-muted-foreground">{title}</p>
      <ul className="mt-2 space-y-2">
        {rows.map((row) => {
          const widthPct = max > 0 ? Math.max(6, (row.total / max) * 100) : 0;
          const seg = (n: number) =>
            row.total > 0 ? `${(n / row.total) * 100}%` : "0%";
          return (
            <li key={row.key} className="text-xs">
              <div className="flex items-center justify-between gap-2">
                <span className="min-w-0 flex-1 truncate font-medium">
                  {label(row.key)}
                </span>
                <span className="flex shrink-0 items-center gap-1.5 font-semibold tabular-nums">
                  {row.red > 0 && (
                    <span style={{ color: rgb("red") }}>{row.red}</span>
                  )}
                  {row.yellow > 0 && (
                    <span style={{ color: rgb("yellow") }}>{row.yellow}</span>
                  )}
                  {row.green > 0 && (
                    <span style={{ color: rgb("green") }}>{row.green}</span>
                  )}
                  <span className="w-6 text-right text-muted-foreground">
                    {row.total}
                  </span>
                </span>
              </div>
              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="flex h-full overflow-hidden rounded-full"
                  style={{ width: `${widthPct}%` }}
                >
                  <div style={{ width: seg(row.red), backgroundColor: rgb("red") }} />
                  <div
                    style={{ width: seg(row.yellow), backgroundColor: rgb("yellow") }}
                  />
                  <div
                    style={{ width: seg(row.green), backgroundColor: rgb("green") }}
                  />
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function RiskFactorsPanel({
  factors,
  loading,
}: {
  factors: RiskFactors | null;
  loading?: boolean;
}) {
  const { t } = useLang();

  if (loading) {
    return (
      <p className="py-4 text-center text-xs text-muted-foreground">
        {t("common.loading")}
      </p>
    );
  }

  const empty =
    !factors ||
    (factors.checklist.length === 0 &&
      factors.age.length === 0 &&
      factors.type.length === 0 &&
      factors.intensity.length === 0 &&
      factors.safetyRule.length === 0);

  if (empty) {
    return (
      <p className="py-4 text-center text-xs text-muted-foreground">
        {t("factors.empty")}
      </p>
    );
  }

  const maxOf = (rows: FactorRow[]) =>
    rows.reduce((m, r) => Math.max(m, r.total), 0);

  const checklistLabel: LabelFn = (k) => t(`item.${k}.area`);
  const ageLabel: LabelFn = (k) =>
    k === "unknown" ? t("factors.unknown") : t(`property.age.${k}`);
  const typeLabel: LabelFn = (k) =>
    k === "unknown" ? t("factors.unknown") : t(`property.type.${k}`);
  const intensityLabel: LabelFn = (k) => t(`factors.intensity.${k}`);
  const ruleLabel: LabelFn = (k) => t(`factors.rule.${k}`);

  return (
    <div className="space-y-4">
      <FactorGroup
        title={t("factors.flagged")}
        rows={factors.checklist}
        label={checklistLabel}
        max={maxOf(factors.checklist)}
      />
      <FactorGroup
        title={t("factors.age")}
        rows={factors.age}
        label={ageLabel}
        max={maxOf(factors.age)}
      />
      <FactorGroup
        title={t("factors.type")}
        rows={factors.type}
        label={typeLabel}
        max={maxOf(factors.type)}
      />
      <FactorGroup
        title={t("factors.intensity")}
        rows={factors.intensity}
        label={intensityLabel}
        max={maxOf(factors.intensity)}
      />
      <FactorGroup
        title={t("factors.rules")}
        rows={factors.safetyRule}
        label={ruleLabel}
        max={maxOf(factors.safetyRule)}
      />
    </div>
  );
}
