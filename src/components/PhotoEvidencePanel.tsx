import { useMemo } from "react";
import { Camera, ImageOff } from "lucide-react";
import { useLang } from "@/lib/i18n";
import type { PhotoStats } from "@/lib/stats.functions";

type Props = {
  stats: PhotoStats | null;
  loading?: boolean;
};

function pct(part: number, whole: number) {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

function Card({
  value,
  label,
}: {
  value: string | number;
  label: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 text-center shadow-sm">
      <p className="font-display text-2xl font-extrabold tabular-nums">
        {value}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

/**
 * Anonymized photo-evidence dashboard. Shows only counts and coverage —
 * never any actual photo, storage path or report id.
 */
export function PhotoEvidencePanel({ stats, loading }: Props) {
  const { t } = useLang();

  const coverage = useMemo(
    () =>
      [...(stats?.coverage ?? [])].sort((a, b) => b.photos - a.photos),
    [stats],
  );
  const byArea = useMemo(
    () =>
      [...(stats?.byArea ?? [])].sort((a, b) => b.photos - a.photos).slice(0, 8),
    [stats],
  );
  const maxAreaPhotos = byArea[0]?.photos ?? 0;

  if (loading) {
    return (
      <div className="mt-3 h-40 animate-pulse rounded-2xl border border-border bg-muted/40" />
    );
  }

  const totalPhotos = stats?.totalPhotos ?? 0;
  const reportsTotal = stats?.reportsTotal ?? 0;
  const reportsWithPhotos = stats?.reportsWithPhotos ?? 0;

  if (totalPhotos === 0) {
    return (
      <div className="mt-3 flex flex-col items-center rounded-2xl border border-border bg-card p-6 text-center shadow-sm">
        <ImageOff className="size-6 text-muted-foreground" />
        <p className="mt-2 text-sm text-muted-foreground">{t("photos.empty")}</p>
      </div>
    );
  }

  const itemLabel = (id: string) => {
    const label = t(`item.${id}.area`);
    return label === `item.${id}.area` ? id : label;
  };

  const avg =
    reportsWithPhotos > 0
      ? (totalPhotos / reportsWithPhotos).toFixed(1)
      : "0";

  return (
    <div className="mt-3 space-y-4">
      {/* Headline counters */}
      <div className="grid grid-cols-3 gap-3">
        <Card value={totalPhotos} label={t("photos.total")} />
        <Card
          value={`${reportsWithPhotos}/${reportsTotal}`}
          label={t("photos.withPhoto")}
        />
        <Card value={avg} label={t("photos.avgPerReport")} />
      </div>

      {/* Coverage by checklist element */}
      <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        <p className="flex items-center gap-1.5 text-sm font-semibold">
          <Camera className="size-4 text-muted-foreground" />
          {t("photos.coverageTitle")}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {t("photos.coverageSubtitle")}
        </p>
        <ul className="mt-3 space-y-3">
          {coverage.map((row) => {
            const coveragePct = pct(row.reportsWithPhoto, row.reportsTotal);
            return (
              <li key={row.itemId}>
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="min-w-0 truncate font-medium">
                    {itemLabel(row.itemId)}
                  </span>
                  <span className="shrink-0 tabular-nums text-muted-foreground">
                    {row.photos} {t("photos.photosWord")} · {coveragePct}%
                  </span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${coveragePct}%` }}
                  />
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {row.reportsWithPhoto} {t("photos.coverageOf")}{" "}
                  {row.reportsTotal} {t("photos.reportsWord")}
                </p>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Photos by area */}
      {byArea.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <p className="text-sm font-semibold">{t("photos.byAreaTitle")}</p>
          <ul className="mt-3 space-y-2.5">
            {byArea.map((row, i) => {
              const label =
                [row.municipality, row.state].filter(Boolean).join(", ") || "—";
              return (
                <li key={`${row.state}-${row.municipality}-${i}`}>
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="min-w-0 truncate font-medium">{label}</span>
                    <span className="shrink-0 tabular-nums text-muted-foreground">
                      {row.photos} {t("photos.photosWord")}
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary/70"
                      style={{ width: `${pct(row.photos, maxAreaPhotos)}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
