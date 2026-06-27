import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  Building2,
  Home,
  Store,
  Minus,
  Plus,
  ArrowRight,
  LocateFixed,
  Activity,
  AlertTriangle,
  ShieldCheck,
  Users,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type {
  BuildingAge,
  BuildingType,
  StructuralType,
} from "@/lib/assessment-types";
import { loadDraft, saveDraft } from "@/lib/draft-store";
import { useLang } from "@/lib/i18n";
import { getSeismicIntensity } from "@/lib/shakemap.functions";
import { spectralDemand, type SeismicReading } from "@/lib/shakemap";
import { cn } from "@/lib/utils";
import {
  ESTADO_NAMES,
  getEstado,
  getEstadoBySlug,
  nearestEstado,
} from "@/lib/venezuela";

export const Route = createFileRoute("/assess/property")({
  validateSearch: (
    search: Record<string, unknown>,
  ): { estado?: string; eng?: string } => {
    const estado =
      typeof search.estado === "string" && search.estado.trim() !== ""
        ? search.estado.trim()
        : undefined;
    const eng =
      typeof search.eng === "string" && search.eng.trim() !== ""
        ? search.eng.trim()
        : undefined;
    return { ...(estado ? { estado } : {}), ...(eng ? { eng } : {}) };
  },
  component: PropertyStep,
});

const BUILDING_TYPES: { id: BuildingType; icon: typeof Home }[] = [
  { id: "house", icon: Home },
  { id: "apartment", icon: Building2 },
  { id: "commercial", icon: Store },
];

const AGES: BuildingAge[] = ["pre1970", "1970to2000", "post2000"];

const STRUCTURAL_TYPES: StructuralType[] = [
  "URM",
  "CMF",
  "CIW",
  "PCF",
  "RML",
  "unknown",
];

function PropertyStep() {
  const { t, lang } = useLang();
  const navigate = useNavigate();
  const { estado: estadoParam, eng: engParam } = Route.useSearch();

  const [address, setAddress] = useState("");
  const [buildingName, setBuildingName] = useState("");
  const [state, setState] = useState("");
  const [municipality, setMunicipality] = useState("");
  const [buildingType, setBuildingType] = useState<BuildingType | null>(null);
  const [structuralType, setStructuralType] =
    useState<StructuralType>("unknown");
  const [structOpen, setStructOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [floors, setFloors] = useState(1);
  const [age, setAge] = useState<BuildingAge | null>(null);
  const [geoStatus, setGeoStatus] = useState<
    "idle" | "detecting" | "detected" | "failed"
  >("idle");
  const [intensity, setIntensity] = useState<SeismicReading | null>(null);

  const draftLoaded = useRef(false);
  const geoTried = useRef(false);

  useEffect(() => {
    let active = true;
    loadDraft().then((draft) => {
      if (!active) return;
      draftLoaded.current = true;
      if (!draft) return;
      const p = draft.property;
      if (p.address) setAddress(p.address);
      if (p.buildingName) setBuildingName(p.buildingName);
      if (p.address || p.buildingName) setDetailsOpen(true);
      if (p.state) setState(p.state);
      if (p.municipality) setMunicipality(p.municipality);
      if (p.buildingType) setBuildingType(p.buildingType);
      if (p.structuralType) {
        setStructuralType(p.structuralType);
        if (p.structuralType !== "unknown") setStructOpen(true);
      }
      if (p.floors) setFloors(p.floors);
      if (p.age) setAge(p.age);
      if (typeof p.seismicIntensity === "number") {
        const sa: SeismicReading["sa"] = {};
        if (p.spectralBand && typeof p.spectralDemand === "number") {
          sa[p.spectralBand] = p.spectralDemand;
        }
        setIntensity({
          mmi: p.seismicIntensity,
          roman: p.seismicIntensityRoman ?? "",
          pga: typeof p.pga === "number" ? p.pga : null,
          pgv: typeof p.pgv === "number" ? p.pgv : null,
          sa,
          vs30: typeof p.vs30 === "number" ? p.vs30 : null,
          soilClass: p.soilClass ?? null,
        });
      }
    });
    return () => {
      active = false;
    };
  }, []);

  // Auto-detect estado once, only if the user hasn't already chosen one.
  useEffect(() => {
    if (geoTried.current) return;
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    // Wait until the draft has loaded so we don't clobber a saved state.
    const timer = setTimeout(() => {
      if (geoTried.current || state.trim() !== "") return;
      geoTried.current = true;
      setGeoStatus("detecting");
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          const est = nearestEstado(latitude, longitude);
          if (est) {
            setState((cur) => (cur.trim() === "" ? est.name : cur));
            setGeoStatus("detected");
          } else {
            setGeoStatus("failed");
          }
          // Look up ShakeMap intensity at the precise coordinate (best-effort).
          getSeismicIntensity({ data: { lat: latitude, lng: longitude } })
            .then((res) => {
              if (res) setIntensity(res);
            })
            .catch(() => {
              /* offline / no active event — ignore */
            });
        },
        () => setGeoStatus("failed"),
        { enableHighAccuracy: false, timeout: 8000, maximumAge: 600000 },
      );
    }, 600);
    return () => clearTimeout(timer);
  }, [state]);

  // Preselect estado when arriving from a regional landing page (?estado=).
  // Accepts either the full name or a slug; never overrides a chosen value.
  useEffect(() => {
    if (!estadoParam) return;
    const match =
      getEstado(estadoParam)?.name ?? getEstadoBySlug(estadoParam)?.name;
    if (!match) return;
    geoTried.current = true; // skip geo auto-detect — user picked this region
    setState((cur) => (cur.trim() === "" ? match : cur));
  }, [estadoParam]);



  const missing: string[] = [];
  if (state.trim() === "") missing.push(t("property.miss.state"));
  if (buildingType === null) missing.push(t("property.miss.type"));
  if (age === null) missing.push(t("property.miss.age"));
  const valid =
    buildingType !== null &&
    age !== null &&
    floors >= 1 &&
    state.trim() !== "";


  async function handleContinue() {
    if (!valid) return;
    const existing = await loadDraft();
    await saveDraft({
      language: lang,
      property: {
        address: address.trim(),
        buildingName: buildingName.trim(),
        state: state.trim(),
        municipality: municipality.trim(),
        buildingType,
        structuralType,
        floors,
        age,
        ...(intensity
          ? (() => {
              const demand = spectralDemand(intensity, floors);
              return {
                seismicIntensity: intensity.mmi,
                seismicIntensityRoman: intensity.roman,
                ...(intensity.pga != null ? { pga: intensity.pga } : {}),
                ...(intensity.pgv != null ? { pgv: intensity.pgv } : {}),
                ...(intensity.vs30 != null ? { vs30: intensity.vs30 } : {}),
                ...(intensity.soilClass
                  ? { soilClass: intensity.soilClass }
                  : {}),
                ...(demand
                  ? {
                      buildingPeriod: demand.period,
                      spectralDemand: demand.value,
                      spectralBand: demand.band,
                    }
                  : {}),
              };
            })()
          : {}),
      },
      answers: existing?.answers ?? [],
      ...(engParam ? { engineerToken: engParam } : {}),
      updatedAt: Date.now(),
    });
    navigate({ to: "/assess/checklist" });
  }

  return (
    <AppShell hideBottomNav>
      <StepHeader step={1} title={t("property.title")} subtitle={t("property.subtitle")} />

      <p className="mt-3 text-sm text-muted-foreground">{t("property.effortHint")}</p>

      {engParam ? (
        <div className="mt-3 flex items-start gap-2 rounded-xl border border-primary/40 bg-primary/10 p-3 text-sm">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
          <p className="font-medium text-primary">{t("panel.proTitle")}</p>
        </div>
      ) : (
        <div className="mt-3 flex items-start gap-2 rounded-xl border border-border bg-card p-3 text-sm">
          <Users className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
          <p className="text-muted-foreground">{t("property.behalfHint")}</p>
        </div>
      )}




      <div className="mt-6 space-y-7">
        {/* Address */}
        <div>
          <Label htmlFor="address" className="text-sm font-semibold">
            {t("property.address")}{" "}
            <span className="font-normal text-muted-foreground">
              ({t("common.optional")})
            </span>
          </Label>
          <Input
            id="address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder={t("property.addressPlaceholder")}
            className="mt-2 h-12 rounded-xl bg-card"
            autoComplete="street-address"
          />
        </div>

        {/* Building / tower name — optional, powers community map clustering */}
        <div>
          <Label htmlFor="buildingName" className="text-sm font-semibold">
            {t("property.buildingName")}{" "}
            <span className="font-normal text-muted-foreground">
              ({t("common.optional")})
            </span>
          </Label>
          <Input
            id="buildingName"
            value={buildingName}
            onChange={(e) => setBuildingName(e.target.value)}
            placeholder={t("property.buildingNamePlaceholder")}
            className="mt-2 h-12 rounded-xl bg-card"
            maxLength={160}
          />
          <p className="mt-1.5 text-xs text-muted-foreground">
            {t("property.buildingNameHint")}
          </p>
        </div>



        {/* Estado + Municipio (coarse location for the public map) */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="estado" className="text-sm font-semibold">
              {t("property.state")}{" "}
              <span className="font-normal text-destructive">*</span>
            </Label>
            <select
              id="estado"
              value={state}
              onChange={(e) => setState(e.target.value)}
              className="mt-2 h-12 w-full rounded-xl border border-input bg-card px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">{t("property.statePlaceholder")}</option>
              {ESTADO_NAMES.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="municipio" className="text-sm font-semibold">
              {t("property.municipality")}{" "}
              <span className="font-normal text-muted-foreground">
                ({t("common.optional")})
              </span>
            </Label>
            <Input
              id="municipio"
              value={municipality}
              onChange={(e) => setMunicipality(e.target.value)}
              placeholder={t("property.municipalityPlaceholder")}
              className="mt-2 h-12 rounded-xl bg-card"
              maxLength={120}
            />
          </div>
        </div>

        {geoStatus !== "idle" && (
          <p
            className={cn(
              "-mt-3 flex items-center gap-1.5 text-xs",
              geoStatus === "detected"
                ? "text-primary"
                : "text-muted-foreground",
            )}
          >
            <LocateFixed className="size-3.5 shrink-0" aria-hidden />
            {geoStatus === "detecting" && t("property.detecting")}
            {geoStatus === "detected" && t("property.detected")}
            {geoStatus === "failed" && t("property.detectFailed")}
          </p>
        )}

        <p className="-mt-3 text-xs text-muted-foreground">
          {t("property.locationHint")}
        </p>

        {/* ShakeMap intensity (auto-detected) */}
        {intensity && (
          <div
            className={cn(
              "-mt-2 flex items-start gap-2 rounded-xl border p-3 text-sm",
              intensity.mmi >= 7
                ? "border-risk-yellow/40 bg-risk-yellow-soft"
                : "border-border bg-card",
            )}
          >
            <Activity className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
            <div>
              <p className="font-medium">
                {t("property.intensityDetected")}:{" "}
                <span className="font-bold tabular-nums">
                  {intensity.roman} ({intensity.mmi})
                </span>
              </p>
              {intensity.mmi >= 7 && (
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {t("property.intensityHigh")}
                </p>
              )}
              <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground tabular-nums">
                {intensity.pga != null && (
                  <span>PGA {(intensity.pga * 100).toFixed(0)}%g</span>
                )}
                {intensity.pgv != null && (
                  <span>PGV {intensity.pgv.toFixed(0)} cm/s</span>
                )}
                {intensity.soilClass && (
                  <span>{t(`soil.${intensity.soilClass}`)}</span>
                )}
              </div>
            </div>
          </div>
        )}


        {/* Building type */}
        <div>
          <p className="text-sm font-semibold">{t("property.buildingType")}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {t("property.buildingType.help")}
          </p>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {BUILDING_TYPES.map(({ id, icon: Icon }) => {
              const selected = buildingType === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setBuildingType(id)}
                  aria-pressed={selected}
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-2xl border-2 p-4 text-center text-sm font-medium transition-colors",
                    selected
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card text-foreground hover:border-primary/40",
                  )}
                >
                  <Icon className="size-6" aria-hidden />
                  {t(`property.type.${id}`)}
                </button>
              );
            })}
          </div>
        </div>

        {/* Structural system — collapsed by default, defaults to "Not sure" so
            it never blocks the resident from continuing. */}
        <div>
          <p className="text-sm font-semibold">{t("property.structuralType")}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {t("property.structuralType.help")}
          </p>
          {!structOpen ? (
            <button
              type="button"
              onClick={() => setStructOpen(true)}
              className="mt-2 flex w-full items-center justify-between gap-3 rounded-2xl border-2 border-border bg-card px-4 py-3 text-left transition-colors hover:border-primary/40"
            >
              <span className="min-w-0 truncate text-sm font-medium">
                {t(`property.struct.${structuralType}`)}
              </span>
              <span className="shrink-0 text-xs font-semibold text-primary">
                {t("property.structToggle")}
              </span>
            </button>
          ) : (
            <>
              <div className="mt-2 space-y-2">
                {STRUCTURAL_TYPES.map((id) => {
                  const selected = structuralType === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setStructuralType(id)}
                      aria-pressed={selected}
                      className={cn(
                        "flex w-full items-start gap-3 rounded-2xl border-2 px-4 py-3 text-left transition-colors",
                        selected
                          ? "border-primary bg-primary/10"
                          : "border-border bg-card hover:border-primary/40",
                      )}
                    >
                      <span
                        className={cn(
                          "mt-1 size-4 shrink-0 rounded-full border-2",
                          selected
                            ? "border-primary bg-primary"
                            : "border-muted-foreground/40",
                        )}
                      />
                      <span>
                        <span
                          className={cn(
                            "block text-sm font-medium",
                            selected ? "text-primary" : "text-foreground",
                          )}
                        >
                          {t(`property.struct.${id}`)}
                        </span>
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          {t(`property.struct.${id}.desc`)}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
              <button
                type="button"
                onClick={() => setStructOpen(false)}
                className="mt-2 text-xs font-semibold text-muted-foreground hover:text-foreground"
              >
                {t("property.structHide")}
              </button>
            </>
          )}
        </div>

        {/* Floors */}
        <div>
          <p className="text-sm font-semibold">{t("property.floors")}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {t("property.floors.help")}
          </p>
          <div className="mt-2 flex items-center gap-4 rounded-2xl border border-border bg-card p-2">
            <button
              type="button"
              onClick={() => setFloors((f) => Math.max(1, f - 1))}
              disabled={floors <= 1}
              aria-label="-"
              className="flex size-12 items-center justify-center rounded-xl bg-secondary text-secondary-foreground transition-colors hover:bg-secondary/70 disabled:opacity-40"
            >
              <Minus className="size-5" />
            </button>
            <span className="flex-1 text-center font-display text-2xl font-bold tabular-nums">
              {floors}
            </span>
            <button
              type="button"
              onClick={() => setFloors((f) => Math.min(200, f + 1))}
              aria-label="+"
              className="flex size-12 items-center justify-center rounded-xl bg-secondary text-secondary-foreground transition-colors hover:bg-secondary/70"
            >
              <Plus className="size-5" />
            </button>
          </div>
          {floors > 7 && (
            <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
              <AlertTriangle className="size-3.5 shrink-0" aria-hidden />
              {t("property.floorsHigh")}
            </p>
          )}
        </div>

        {/* Age */}
        <div>
          <p className="text-sm font-semibold">{t("property.age")}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {t("property.age.help")}
          </p>
          <div className="mt-2 space-y-2">
            {AGES.map((a) => {
              const selected = age === a;
              return (
                <button
                  key={a}
                  type="button"
                  onClick={() => setAge(a)}
                  aria-pressed={selected}
                  className={cn(
                    "flex w-full items-center justify-between gap-3 rounded-2xl border-2 px-4 py-3.5 text-left transition-colors",
                    selected
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card text-foreground hover:border-primary/40",
                  )}
                >
                  <span className="min-w-0">
                    <span className="block text-sm font-medium">
                      {t(`property.age.${a}`)}
                    </span>
                    <span
                      className={cn(
                        "mt-0.5 block text-xs",
                        selected ? "text-primary/80" : "text-muted-foreground",
                      )}
                    >
                      {t(`property.age.${a}.desc`)}
                    </span>
                  </span>
                  <span
                    className={cn(
                      "size-4 shrink-0 rounded-full border-2",
                      selected ? "border-primary bg-primary" : "border-muted-foreground/40",
                    )}
                  />
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {!valid && missing.length > 0 && (
        <p className="mt-6 rounded-xl bg-muted px-4 py-3 text-center text-sm text-muted-foreground">
          {t("property.missingPrefix")}{" "}
          <span className="font-semibold text-foreground">
            {missing.join(", ")}
          </span>
        </p>
      )}

      <StepFooter
        onBack={() => navigate({ to: "/" })}
        onNext={handleContinue}
        nextDisabled={!valid}
        nextLabel={t("common.next")}
        backLabel={t("common.back")}
      />
    </AppShell>
  );
}

export function StepHeader({
  step,
  title,
  subtitle,
}: {
  step: number;
  title: string;
  subtitle?: string;
}) {
  const { t } = useLang();
  return (
    <div>
      <div className="flex items-center gap-1.5">
        {[1, 2, 3].map((n) => (
          <span
            key={n}
            className={cn(
              "h-1.5 flex-1 rounded-full",
              n <= step ? "bg-primary" : "bg-border",
            )}
          />
        ))}
      </div>
      <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {t("common.step")} {step} {t("common.of")} 3
      </p>
      <h1 className="mt-1 font-display text-2xl font-extrabold tracking-tight">
        {title}
      </h1>
      {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
    </div>
  );
}

export function StepFooter({
  onBack,
  onNext,
  nextDisabled,
  nextLabel,
  backLabel,
}: {
  onBack: () => void;
  onNext: () => void;
  nextDisabled?: boolean;
  nextLabel: string;
  backLabel: string;
}) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-screen-sm items-center gap-3 px-4 py-3">
        <Button variant="outline" size="lg" onClick={onBack} className="flex-1">
          {backLabel}
        </Button>
        <Button
          size="lg"
          onClick={onNext}
          disabled={nextDisabled}
          className="flex-[2]"
        >
          {nextLabel}
          <ArrowRight className="size-5" />
        </Button>
      </div>
    </div>
  );
}
