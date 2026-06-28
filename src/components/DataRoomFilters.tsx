import { X } from "lucide-react";
import { useMemo } from "react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLang } from "@/lib/i18n";
import { splitFeatured } from "@/lib/impact";
import { cn } from "@/lib/utils";
import { ESTADO_NAMES, MUNICIPIOS } from "@/lib/venezuela";

export type RangeKey = "7" | "30" | "90" | "all";

export type DataFilters = {
  state: string | null;
  municipality: string | null;
  range: RangeKey;
};

export const DEFAULT_FILTERS: DataFilters = {
  state: null,
  municipality: null,
  range: "90",
};

/** Resolve the active range to inclusive ISO dates (Eastern) for the API. */
export function rangeToDates(range: RangeKey): {
  from?: string;
  to?: string;
} {
  if (range === "all") return {};
  const days = Number(range);
  const now = new Date();
  // Eastern-time "today" — good enough for day-level bucketing.
  const et = new Date(
    now.toLocaleString("en-US", { timeZone: "America/New_York" }),
  );
  const to = et.toISOString().slice(0, 10);
  const fromDate = new Date(et);
  fromDate.setDate(fromDate.getDate() - (days - 1));
  const from = fromDate.toISOString().slice(0, 10);
  return { from, to };
}

const ALL = "__all__";

export function DataRoomFilters({
  filters,
  onChange,
  availableStates,
  availableMunicipios,
  featuredStates,
  featuredMunicipios,
}: {
  filters: DataFilters;
  onChange: (next: DataFilters) => void;
  /** States that have at least one report in the active range. When omitted, all states show. */
  availableStates?: string[];
  /** Per-state municipalities that have reports in the active range. */
  availableMunicipios?: Record<string, string[]>;
  /** Most-affected states, impact-ordered, to surface first. */
  featuredStates?: string[];
  /** Most-affected municipios per state, impact-ordered. */
  featuredMunicipios?: Record<string, string[]>;
}) {
  const { t } = useLang();

  const states = useMemo(() => {
    if (!availableStates) return ESTADO_NAMES;
    const allowed = new Set(availableStates);
    return ESTADO_NAMES.filter((name) => allowed.has(name));
  }, [availableStates]);

  const municipios = useMemo(() => {
    if (!filters.state) return [];
    if (availableMunicipios) {
      return [...(availableMunicipios[filters.state] ?? [])].sort((a, b) =>
        a.localeCompare(b),
      );
    }
    return MUNICIPIOS.filter((m) => m.state === filters.state)
      .map((m) => m.name)
      .sort((a, b) => a.localeCompare(b));
  }, [filters.state, availableMunicipios]);

  const stateGroups = useMemo(
    () => splitFeatured(states, featuredStates),
    [states, featuredStates],
  );

  const muniGroups = useMemo(
    () =>
      splitFeatured(
        municipios,
        filters.state ? featuredMunicipios?.[filters.state] : undefined,
      ),
    [municipios, filters.state, featuredMunicipios],
  );


  const ranges: RangeKey[] = ["7", "30", "90", "all"];
  const rangeLabel: Record<RangeKey, string> = {
    "7": t("data.range7"),
    "30": t("data.range30"),
    "90": t("data.range90"),
    all: t("data.rangeAll"),
  };

  const dirty =
    filters.state !== null ||
    filters.municipality !== null ||
    filters.range !== "90";

  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="flex flex-wrap items-end gap-4">
        {/* State */}
        <label className="flex min-w-[160px] flex-1 flex-col gap-1">
          <span className="text-xs font-semibold text-muted-foreground">
            {t("data.filterState")}
          </span>
          <Select
            value={filters.state ?? ALL}
            onValueChange={(v) =>
              onChange({
                ...filters,
                state: v === ALL ? null : v,
                municipality: null,
              })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>{t("data.filterAll")}</SelectItem>
              {stateGroups.featured.length > 0 ? (
                <>
                  <SelectGroup>
                    <SelectLabel>{t("picker.mostAffected")}</SelectLabel>
                    {stateGroups.featured.map((name) => (
                      <SelectItem key={name} value={name}>
                        {name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                  <SelectGroup>
                    <SelectLabel>{t("picker.allAreas")}</SelectLabel>
                    {stateGroups.rest.map((name) => (
                      <SelectItem key={name} value={name}>
                        {name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </>
              ) : (
                stateGroups.rest.map((name) => (
                  <SelectItem key={name} value={name}>
                    {name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </label>

        {/* Municipality */}
        <label className="flex min-w-[160px] flex-1 flex-col gap-1">
          <span className="text-xs font-semibold text-muted-foreground">
            {t("data.filterMunicipality")}
          </span>
          <Select
            value={filters.municipality ?? ALL}
            disabled={!filters.state || municipios.length === 0}
            onValueChange={(v) =>
              onChange({
                ...filters,
                municipality: v === ALL ? null : v,
              })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>{t("data.filterAll")}</SelectItem>
              {muniGroups.featured.length > 0 ? (
                <>
                  <SelectGroup>
                    <SelectLabel>{t("picker.mostAffected")}</SelectLabel>
                    {muniGroups.featured.map((name) => (
                      <SelectItem key={name} value={name}>
                        {name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                  <SelectGroup>
                    <SelectLabel>{t("picker.allAreas")}</SelectLabel>
                    {muniGroups.rest.map((name) => (
                      <SelectItem key={name} value={name}>
                        {name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </>
              ) : (
                muniGroups.rest.map((name) => (
                  <SelectItem key={name} value={name}>
                    {name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </label>

        {/* Date range */}
        <div className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-muted-foreground">
            {t("data.filterRange")}
          </span>
          <div className="inline-flex items-center gap-0.5 rounded-full border border-border bg-card/80 p-0.5">
            {ranges.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => onChange({ ...filters, range: r })}
                aria-pressed={filters.range === r}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
                  filters.range === r
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {rangeLabel[r]}
              </button>
            ))}
          </div>
        </div>

        {dirty && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onChange(DEFAULT_FILTERS)}
            className="text-muted-foreground"
          >
            <X className="size-4" />
            {t("data.clearFilters")}
          </Button>
        )}
      </div>
    </div>
  );
}
