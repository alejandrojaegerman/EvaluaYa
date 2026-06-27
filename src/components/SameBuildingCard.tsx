import { Building2 } from "lucide-react";

import type { AssessmentRecord } from "@/lib/assessment-types";
import { useLang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/**
 * "Other reports from this building" — shown only when a building name was
 * detected AND there is at least one OTHER analyzed report from the same
 * building. Anonymized counts only; never addresses, photos or report ids.
 */
export function SameBuildingCard({ record }: { record: AssessmentRecord }) {
  const { t } = useLang();
  const building = record.building;
  if (!building || building.others < 1) return null;

  const { peers } = building;
  const segs: Array<{
    key: "red" | "orange" | "yellow" | "green";
    count: number;
    cls: string;
  }> = [
    { key: "red", count: peers.red, cls: "bg-risk-red" },
    { key: "orange", count: peers.orange, cls: "bg-risk-orange" },
    { key: "yellow", count: peers.yellow, cls: "bg-risk-yellow" },
    { key: "green", count: peers.green, cls: "bg-risk-green" },
  ];
  const totalForBar = Math.max(1, peers.total);

  return (
    <section className="rounded-2xl border bg-card p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Building2 className="size-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold leading-tight">
            {t("building.title")}
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {t("building.subtitle")
              .replace("{count}", String(building.others))
              .replace("{name}", building.name)}
          </p>

          {/* Segmented risk bar */}
          <div className="mt-3 flex h-2.5 w-full overflow-hidden rounded-full bg-muted">
            {segs.map((s) =>
              s.count > 0 ? (
                <div
                  key={s.key}
                  className={cn("h-full", s.cls)}
                  style={{ width: `${(s.count / totalForBar) * 100}%` }}
                  aria-hidden
                />
              ) : null,
            )}
          </div>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-risk-red" />
              {peers.red} {t("building.legend.red")}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-risk-orange" />
              {peers.orange} {t("building.legend.orange")}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-risk-yellow" />
              {peers.yellow} {t("building.legend.yellow")}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-risk-green" />
              {peers.green} {t("building.legend.green")}
            </span>
          </div>

          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            {t("building.note")}
          </p>
        </div>
      </div>
    </section>
  );
}
