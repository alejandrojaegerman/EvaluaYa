import { Link } from "@tanstack/react-router";
import { ArrowRight, Info, Landmark } from "lucide-react";

import { OfficialDirectory, SosCard } from "@/components/OfficialDirectory";
import { useLang } from "@/lib/i18n";
import type { RiskLevel } from "@/lib/assessment-types";

/**
 * Mandatory post-assessment transparency block: makes clear EvalúaYa is only a
 * quick visual check (Phase 0) and channels the resident to the official
 * organisms. Shows an SOS module with priority on Red/Orange results.
 */
export function TransparencyBanner({ riskLevel }: { riskLevel: RiskLevel }) {
  const { t } = useLang();
  // Emergency SOS (911 / avoid entering) matches the red action only; orange
  // ("serios") is "get an engineer soon", not evacuate.
  const urgent = riskLevel === "red";

  return (
    <section className="mt-6">
      {urgent && <SosCard className="mb-4" />}

      <div className="rounded-2xl border border-primary/25 bg-primary/5 p-4">
        <div className="flex items-center gap-2">
          <Landmark className="size-5 text-primary" aria-hidden />
          <h2 className="font-display text-base font-bold">
            {t("transparency.title")}
          </h2>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-foreground/80">
          {t("transparency.body")}
        </p>
        <p className="mt-2 flex items-start gap-1.5 text-xs leading-relaxed text-muted-foreground">
          <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          {t("transparency.limits")}
        </p>
        <p className="mt-2 rounded-xl border border-primary/20 bg-card/70 p-3 text-xs leading-relaxed text-foreground/80">
          {t("transparency.remit")}
        </p>
        <Link
          to="/guia/proceso-oficial-funvisis"
          className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
        >
          {t("transparency.processCta")}
          <ArrowRight className="size-4" aria-hidden />
        </Link>
      </div>

      <OfficialDirectory className="mt-4" />
    </section>
  );
}
