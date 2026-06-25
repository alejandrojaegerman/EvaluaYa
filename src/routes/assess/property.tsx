import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Building2, Home, Store, Minus, Plus, ArrowRight, LocateFixed } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { BuildingAge, BuildingType } from "@/lib/assessment-types";
import { loadDraft, saveDraft } from "@/lib/draft-store";
import { useLang } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { ESTADO_NAMES, nearestEstado } from "@/lib/venezuela";

export const Route = createFileRoute("/assess/property")({
  component: PropertyStep,
});

const BUILDING_TYPES: { id: BuildingType; icon: typeof Home }[] = [
  { id: "house", icon: Home },
  { id: "apartment", icon: Building2 },
  { id: "commercial", icon: Store },
];

const AGES: BuildingAge[] = ["pre1970", "1970to2000", "post2000"];

function PropertyStep() {
  const { t, lang } = useLang();
  const navigate = useNavigate();

  const [address, setAddress] = useState("");
  const [state, setState] = useState("");
  const [municipality, setMunicipality] = useState("");
  const [buildingType, setBuildingType] = useState<BuildingType | null>(null);
  const [floors, setFloors] = useState(1);
  const [age, setAge] = useState<BuildingAge | null>(null);
  const [geoStatus, setGeoStatus] = useState<
    "idle" | "detecting" | "detected" | "failed"
  >("idle");

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
      if (p.state) setState(p.state);
      if (p.municipality) setMunicipality(p.municipality);
      if (p.buildingType) setBuildingType(p.buildingType);
      if (p.floors) setFloors(p.floors);
      if (p.age) setAge(p.age);
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
          const est = nearestEstado(pos.coords.latitude, pos.coords.longitude);
          if (est) {
            setState((cur) => (cur.trim() === "" ? est.name : cur));
            setGeoStatus("detected");
          } else {
            setGeoStatus("failed");
          }
        },
        () => setGeoStatus("failed"),
        { enableHighAccuracy: false, timeout: 8000, maximumAge: 600000 },
      );
    }, 600);
    return () => clearTimeout(timer);
  }, [state]);

  const valid =
    buildingType !== null && age !== null && floors >= 1 && state.trim() !== "";


  async function handleContinue() {
    if (!valid) return;
    const existing = await loadDraft();
    await saveDraft({
      language: lang,
      property: {
        address: address.trim(),
        state: state.trim(),
        municipality: municipality.trim(),
        buildingType,
        floors,
        age,
      },
      answers: existing?.answers ?? [],
      updatedAt: Date.now(),
    });
    navigate({ to: "/assess/checklist" });
  }

  return (
    <AppShell>
      <StepHeader step={1} title={t("property.title")} subtitle={t("property.subtitle")} />

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

        {/* Estado + Municipio (coarse location for the public map) */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="estado" className="text-sm font-semibold">
              {t("property.state")}{" "}
              <span className="font-normal text-muted-foreground">
                ({t("common.optional")})
              </span>
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

        <p className="-mt-3 text-xs text-muted-foreground">
          {t("property.locationHint")}
        </p>

        {/* Building type */}
        <div>
          <p className="text-sm font-semibold">{t("property.buildingType")}</p>
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

        {/* Floors */}
        <div>
          <p className="text-sm font-semibold">{t("property.floors")}</p>
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
        </div>

        {/* Age */}
        <div>
          <p className="text-sm font-semibold">{t("property.age")}</p>
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
                    "flex w-full items-center justify-between rounded-2xl border-2 px-4 py-3.5 text-left text-sm font-medium transition-colors",
                    selected
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card text-foreground hover:border-primary/40",
                  )}
                >
                  {t(`property.age.${a}`)}
                  <span
                    className={cn(
                      "size-4 rounded-full border-2",
                      selected ? "border-primary bg-primary" : "border-muted-foreground/40",
                    )}
                  />
                </button>
              );
            })}
          </div>
        </div>
      </div>

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
