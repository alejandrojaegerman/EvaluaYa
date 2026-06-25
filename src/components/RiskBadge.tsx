import { ShieldCheck, AlertTriangle, OctagonAlert } from "lucide-react";

import type { RiskLevel } from "@/lib/assessment-types";
import { useLang } from "@/lib/i18n";
import { RISK_THEME } from "@/lib/risk";
import { cn } from "@/lib/utils";

const ICONS = {
  green: ShieldCheck,
  yellow: AlertTriangle,
  red: OctagonAlert,
} as const;

export function RiskBadge({
  level,
  size = "md",
  className,
}: {
  level: RiskLevel;
  size?: "sm" | "md";
  className?: string;
}) {
  const { t } = useLang();
  const theme = RISK_THEME[level];
  const Icon = ICONS[level];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-semibold",
        theme.badge,
        size === "sm" ? "px-2.5 py-1 text-xs" : "px-3.5 py-1.5 text-sm",
        className,
      )}
    >
      <Icon className={size === "sm" ? "size-3.5" : "size-4"} aria-hidden />
      {t(theme.tagKey)}
    </span>
  );
}
