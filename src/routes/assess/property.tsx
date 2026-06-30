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
import { LegalConsentGate } from "@/components/LegalConsentGate";
import {
  getLegalConsent,
  hasLegalConsent,
  type LegalConsent,
} from "@/lib/legal-ack";
import { splitFeatured } from "@/lib/impact";
import { trackStep } from "@/lib/track";
import { useLang } from "@/lib/i18n";
import { getSeismicIntensity } from "@/lib/shakemap.functions";
import { spectralDemand, type SeismicReading } from "@/lib/shakemap";
import {
  getImpactRanking,
  EMPTY_IMPACT_RANKING,
  type ImpactRanking,
} from "@/lib/stats.functions";
import { cn } from "@/lib/utils";
import {
  ESTADO_NAMES,
  getEstado,
  getEstadoBySlug,
  municipiosFor,
  nearestEstado,
  nearestMunicipio,
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
  // Public, anonymized impact ranking so the hardest-hit areas surface first.
  // Best-effort: failures fall back to the alphabetical list.
  loader: async (): Promise<ImpactRanking> =>
    getImpactRanking().catch(() => EMPTY_IMPACT_RANKING),
  errorComponent: () => null,
  notFoundComponent: () => null,
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

// Sentinel select value for the "I'm not sure" municipio option.
const UNSURE_MUNICIPIO = "__unsure__";

// Common dial codes for residents in Venezuela and the diaspora.
// Order: Venezuela first, then the most common destination countries.
const COUNTRY_CODES: { code: string; flag: string; name: string }[] = [
  { code: "+58", flag: "🇻🇪", name: "Venezuela" },
  { code: "+57", flag: "🇨🇴", name: "Colombia" },
  { code: "+1", flag: "🇺🇸", name: "EE.UU. / Canadá" },
  { code: "+34", flag: "🇪🇸", name: "España" },
  { code: "+56", flag: "🇨🇱", name: "Chile" },
  { code: "+51", flag: "🇵🇪", name: "Perú" },
  { code: "+54", flag: "🇦🇷", name: "Argentina" },
  { code: "+593", flag: "🇪🇨", name: "Ecuador" },
  { code: "+52", flag: "🇲🇽", name: "México" },
  { code: "+55", flag: "🇧🇷", name: "Brasil" },
  { code: "+507", flag: "🇵🇦", name: "Panamá" },
  { code: "+1809", flag: "🇩🇴", name: "Rep. Dominicana" },
  { code: "+39", flag: "🇮🇹", name: "Italia" },
  { code: "+351", flag: "🇵🇹", name: "Portugal" },
];
const DEFAULT_DIAL_CODE = "+58";

// Split a stored contact ("+58 414...") into dial code + local number.
function splitContact(stored: string): { dial: string; number: string } {
  const trimmed = stored.trim();
  // Longest-prefix match so "+1809" wins over "+1".
  const match = [...COUNTRY_CODES]
    .sort((a, b) => b.code.length - a.code.length)
    .find((c) => trimmed.startsWith(c.code));
  if (match) {
    return { dial: match.code, number: trimmed.slice(match.code.length).trim() };
  }
  return { dial: DEFAULT_DIAL_CODE, number: trimmed };
}



function PropertyStep() {
  const { t, lang } = useLang();
  const navigate = useNavigate();
  const { estado: estadoParam, eng: engParam } = Route.useSearch();
  const ranking = Route.useLoaderData();

  const [address, setAddress] = useState("");
  const [buildingName, setBuildingName] = useState("");
  const [state, setState] = useState("");
  const [municipality, setMunicipality] = useState("");
  const [parroquia, setParroquia] = useState("");
  // Minimal resident contact (Doc #1) — so a volunteer evaluator can reach them.
  // Contact is WhatsApp-only now: a country dial code + local phone number.
  const [residentName, setResidentName] = useState("");
  const [residentContact, setResidentContact] = useState("");
  const [dialCode, setDialCode] = useState(DEFAULT_DIAL_CODE);
  // Blocking legal + data-consent gate (Doc #1). Shown until accepted.
  const [showGate, setShowGate] = useState(false);
  const [consent, setConsent] = useState<LegalConsent | null>(null);
  // Resident explicitly chose "I'm not sure" — satisfies the required field
  // while keeping the stored municipality empty (rolls up to state level).
  const [municipalityUnsure, setMunicipalityUnsure] = useState(false);
  const [buildingType, setBuildingType] = useState<BuildingType | null>(null);
  const [structuralType, setStructuralType] =
    useState<StructuralType>("unknown");
  const [structOpen, setStructOpen] = useState(false);
  
  const [floors, setFloors] = useState(1);
  const [basements, setBasements] = useState(0);
  const [age, setAge] = useState<BuildingAge | null>(null);
  const [livesInBuilding, setLivesInBuilding] = useState<boolean | null>(null);
  const [condoBoard, setCondoBoard] = useState<boolean | null>(null);
  const [geoStatus, setGeoStatus] = useState<
    "idle" | "detecting" | "detected" | "failed"
  >("idle");
  const [intensity, setIntensity] = useState<SeismicReading | null>(null);

  const draftLoaded = useRef(false);
  const geoTried = useRef(false);

  // Funnel: resident reached the first step of the evaluation.
  useEffect(() => {
    trackStep("property_started");
  }, []);

  // Blocking gate: show until the user accepts the current legal + consent
  // versions. Reads existing acceptance so returning users aren't re-prompted.
  useEffect(() => {
    setConsent(getLegalConsent());
    setShowGate(!hasLegalConsent());
  }, []);

  useEffect(() => {
    let active = true;
    loadDraft().then((draft) => {
      if (!active) return;
      draftLoaded.current = true;
      if (!draft) return;
      const p = draft.property;
      if (p.address) setAddress(p.address);
      if (p.buildingName) setBuildingName(p.buildingName);
      if (p.state) setState(p.state);
      if (p.parroquia) setParroquia(p.parroquia);
      // Only restore the municipio when it's a valid option for the saved state.
      if (p.municipality && municipiosFor(p.state).includes(p.municipality)) {
        setMunicipality(p.municipality);
      }
      if (draft.resident?.name) setResidentName(draft.resident.name);
      if (draft.resident?.contact) {
        const { dial, number } = splitContact(draft.resident.contact);
        setDialCode(dial);
        setResidentContact(number);
      }

      if (p.buildingType) setBuildingType(p.buildingType);
      if (p.structuralType) {
        setStructuralType(p.structuralType);
        if (p.structuralType !== "unknown") setStructOpen(true);
      }
      if (p.floors) setFloors(p.floors);
      if (typeof p.basements === "number") setBasements(p.basements);
      if (typeof p.livesInBuilding === "boolean")
        setLivesInBuilding(p.livesInBuilding);
      if (typeof p.condoBoardMember === "boolean")
        setCondoBoard(p.condoBoardMember);
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
            // Best-effort: also snap to the nearest municipio in that state.
            const mun = nearestMunicipio(latitude, longitude, est.name);
            if (mun) {
              setMunicipality((cur) => (cur.trim() === "" ? mun : cur));
              setMunicipalityUnsure(false);
            }
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



  // Changing the state invalidates any previously picked municipio.
  function handleStateChange(next: string) {
    setState(next);
    setMunicipality("");
    setMunicipalityUnsure(false);
  }

  const municipioOptions = municipiosFor(state);
  // Impact-ordered grouping: most-affected areas first, full list below.
  const stateGroups = splitFeatured(ESTADO_NAMES, ranking.featuredStates);
  const muniGroups = splitFeatured(
    municipioOptions,
    state ? ranking.featuredMunicipios[state] : undefined,
  );
  // Required: either a real municipio is selected, or the resident chose "not sure".
  const municipalitySatisfied = municipality.trim() !== "" || municipalityUnsure;

  // Building name is required for multi-unit buildings (apartment/commercial);
  // a standalone house often has no tower name.
  const buildingNameRequired =
    buildingType === "apartment" || buildingType === "commercial";

  const missing: string[] = [];
  if (state.trim() === "") missing.push(t("property.miss.state"));
  if (state.trim() !== "" && !municipalitySatisfied)
    missing.push(t("property.miss.municipality"));
  if (address.trim() === "") missing.push(t("property.miss.address"));
  if (parroquia.trim() === "") missing.push(t("property.miss.parroquia"));
  if (buildingType === null) missing.push(t("property.miss.type"));
  if (buildingNameRequired && buildingName.trim() === "")
    missing.push(t("property.miss.buildingName"));
  if (residentName.trim() === "") missing.push(t("property.miss.residentName"));
  if (residentContact.trim() === "")
    missing.push(t("property.miss.residentContact"));
  if (livesInBuilding === null) missing.push(t("property.miss.livesInBuilding"));
  if (condoBoard === null) missing.push(t("property.miss.condoBoard"));
  const valid =
    buildingType !== null &&
    floors >= 1 &&
    state.trim() !== "" &&
    municipalitySatisfied &&
    address.trim() !== "" &&
    parroquia.trim() !== "" &&
    (!buildingNameRequired || buildingName.trim() !== "") &&
    residentName.trim() !== "" &&
    residentContact.trim() !== "" &&
    livesInBuilding !== null &&
    condoBoard !== null;


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
        parroquia: parroquia.trim(),
        buildingType,
        structuralType,
        floors,
        basements,
        ...(age ? { age } : {}),
        ...(livesInBuilding !== null ? { livesInBuilding } : {}),
        ...(condoBoard !== null ? { condoBoardMember: condoBoard } : {}),
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
      resident: {
        name: residentName.trim(),
        contact: `${dialCode} ${residentContact.trim()}`.trim(),
        contactType: "whatsapp",
      },
      ...(consent ? { consent } : {}),
      updatedAt: Date.now(),
    });
    trackStep("property_completed");
    navigate({ to: "/assess/checklist" });
  }

  return (
    <AppShell hideBottomNav hideFooter>
      {showGate && (
        <LegalConsentGate
          onAccept={(record) => {
            setConsent(record);
            setShowGate(false);
          }}
        />
      )}
      <StepHeader step={1} title={t("property.title")} />

      {engParam && (
        <div className="mt-3 flex items-start gap-2 rounded-xl border border-primary/40 bg-primary/10 p-3 text-sm">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
          <p className="font-medium text-primary">{t("panel.proTitle")}</p>
        </div>
      )}







      <div className="mt-6 space-y-8">
        {/* ── Location ──────────────────────────────────────── */}
        <section className="space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
            {t("property.sectionLocation")}
          </h2>

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
                onChange={(e) => handleStateChange(e.target.value)}
                className="mt-2 h-12 w-full rounded-xl border border-input bg-card px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">{t("property.statePlaceholder")}</option>
                {stateGroups.featured.length > 0 ? (
                  <>
                    <optgroup label={t("picker.mostAffected")}>
                      {stateGroups.featured.map((name) => (
                        <option key={name} value={name}>
                          {name}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label={t("picker.allAreas")}>
                      {stateGroups.rest.map((name) => (
                        <option key={name} value={name}>
                          {name}
                        </option>
                      ))}
                    </optgroup>
                  </>
                ) : (
                  stateGroups.rest.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))
                )}
              </select>
            </div>
            <div>
              <Label htmlFor="municipio" className="text-sm font-semibold">
                {t("property.municipality")}{" "}
                <span className="font-normal text-destructive">*</span>
              </Label>
              <select
                id="municipio"
                value={municipalityUnsure ? UNSURE_MUNICIPIO : municipality}
                disabled={state.trim() === ""}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === UNSURE_MUNICIPIO) {
                    setMunicipality("");
                    setMunicipalityUnsure(true);
                  } else {
                    setMunicipality(v);
                    setMunicipalityUnsure(false);
                  }
                }}
                className="mt-2 h-12 w-full rounded-xl border border-input bg-card px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
              >
                <option value="">
                  {state.trim() === ""
                    ? t("property.municipalitySelectState")
                    : t("property.municipalityPlaceholder")}
                </option>
                {muniGroups.featured.length > 0 ? (
                  <>
                    <optgroup label={t("picker.mostAffected")}>
                      {muniGroups.featured.map((name) => (
                        <option key={name} value={name}>
                          {name}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label={t("picker.allAreas")}>
                      {muniGroups.rest.map((name) => (
                        <option key={name} value={name}>
                          {name}
                        </option>
                      ))}
                    </optgroup>
                  </>
                ) : (
                  muniGroups.rest.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))
                )}
                {state.trim() !== "" && (
                  <option value={UNSURE_MUNICIPIO}>
                    {t("property.municipalityUnsure")}
                  </option>
                )}
              </select>
            </div>
          </div>


          {geoStatus !== "idle" && (
            <p
              className={cn(
                "flex items-center gap-1.5 text-xs",
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

          <p className="text-xs text-muted-foreground">
            {t("property.locationHint")}
          </p>

          {/* Address + building detail — required so an evaluator can locate
              the property and group reports per building. */}
          <div className="space-y-4 rounded-2xl border border-border bg-card/60 p-4">
            <div>
              <Label htmlFor="address" className="text-sm font-semibold">
                {t("property.address")}{" "}
                <span className="font-normal text-destructive">*</span>
              </Label>
              <Input
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder={t("property.addressPlaceholder")}
                className="mt-2 h-12 rounded-xl bg-background"
                autoComplete="street-address"
              />
            </div>

            <div>
              <Label htmlFor="buildingName" className="text-sm font-semibold">
                {t("property.buildingName")}{" "}
                {buildingNameRequired && (
                  <span className="font-normal text-destructive">*</span>
                )}
              </Label>
              <Input
                id="buildingName"
                value={buildingName}
                onChange={(e) => setBuildingName(e.target.value)}
                placeholder={t("property.buildingNamePlaceholder")}
                className="mt-2 h-12 rounded-xl bg-background"
                maxLength={160}
              />
              <p className="mt-1.5 text-xs text-muted-foreground">
                {t("property.buildingNameHint")}
              </p>
            </div>

            <div>
              <Label htmlFor="parroquia" className="text-sm font-semibold">
                {t("property.parroquia")}{" "}
                <span className="font-normal text-destructive">*</span>
              </Label>
              <Input
                id="parroquia"
                value={parroquia}
                onChange={(e) => setParroquia(e.target.value)}
                placeholder={t("property.parroquiaPlaceholder")}
                className="mt-2 h-12 rounded-xl bg-background"
                maxLength={120}
              />
            </div>
          </div>


          {/* ShakeMap intensity (auto-detected) */}
          {intensity && (
            <div
              className={cn(
                "flex items-start gap-2 rounded-xl border p-3 text-sm",
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
        </section>

        {/* ── Contact (minimal, required — so a volunteer can reach them) ── */}
        <section className="space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
            {t("property.sectionContact")}
          </h2>
          <p className="text-xs text-muted-foreground">
            {t("property.contactHint")}
          </p>

          <div>
            <Label htmlFor="residentName" className="text-sm font-semibold">
              {t("property.residentName")}{" "}
              <span className="font-normal text-destructive">*</span>
            </Label>
            <Input
              id="residentName"
              value={residentName}
              onChange={(e) => setResidentName(e.target.value)}
              placeholder={t("property.residentNamePlaceholder")}
              className="mt-2 h-12 rounded-xl bg-card"
              maxLength={160}
              autoComplete="name"
            />
          </div>

          <div>
            <Label htmlFor="residentContact" className="text-sm font-semibold">
              {t("property.phone")}{" "}
              <span className="font-normal text-destructive">*</span>
            </Label>
            <div className="mt-2 flex gap-2">
              <select
                aria-label={t("property.countryCode")}
                value={dialCode}
                onChange={(e) => setDialCode(e.target.value)}
                className="h-12 w-28 shrink-0 rounded-xl border border-input bg-card px-2 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {COUNTRY_CODES.map((c) => (
                  <option key={c.code} value={c.code} title={`${c.name} (${c.code})`}>
                    {c.flag} {c.code}
                  </option>
                ))}
              </select>
              <Input
                id="residentContact"
                value={residentContact}
                onChange={(e) => setResidentContact(e.target.value)}
                placeholder={t("property.residentContactPhonePlaceholder")}
                className="h-12 flex-1 rounded-xl bg-card"
                maxLength={40}
                inputMode="tel"
                autoComplete="tel"
              />
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground">
              {t("property.phoneHint")}
            </p>
          </div>

          {/* ¿Vives en el edificio? */}
          <div>
            <p className="text-sm font-semibold">
              {t("property.livesInBuilding")}{" "}
              <span className="font-normal text-destructive">*</span>
            </p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {([true, false] as const).map((v) => {
                const selected = livesInBuilding === v;
                return (
                  <button
                    key={String(v)}
                    type="button"
                    onClick={() => setLivesInBuilding(v)}
                    className={`h-12 rounded-xl border text-sm font-semibold transition ${
                      selected
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-input bg-card text-foreground"
                    }`}
                  >
                    {v ? t("checklist.answer.yes") : t("checklist.answer.no")}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ¿Eres parte de la junta de condominio? */}
          <div>
            <p className="text-sm font-semibold">
              {t("property.condoBoard")}{" "}
              <span className="font-normal text-destructive">*</span>
            </p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {([true, false] as const).map((v) => {
                const selected = condoBoard === v;
                return (
                  <button
                    key={String(v)}
                    type="button"
                    onClick={() => setCondoBoard(v)}
                    className={`h-12 rounded-xl border text-sm font-semibold transition ${
                      selected
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-input bg-card text-foreground"
                    }`}
                  >
                    {v ? t("checklist.answer.yes") : t("checklist.answer.no")}
                  </button>
                );
              })}
            </div>
          </div>
        </section>


        {/* ── Building ──────────────────────────────────────── */}

        <section className="space-y-6">
          <h2 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
            {t("property.sectionBuilding")}
          </h2>

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

          {/* Basements (sótanos) */}
          <div>
            <p className="text-sm font-semibold">{t("property.basements")}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {t("property.basements.help")}
            </p>
            <div className="mt-2 flex items-center gap-4 rounded-2xl border border-border bg-card p-2">
              <button
                type="button"
                onClick={() => setBasements((b) => Math.max(0, b - 1))}
                disabled={basements <= 0}
                aria-label="-"
                className="flex size-12 items-center justify-center rounded-xl bg-secondary text-secondary-foreground transition-colors hover:bg-secondary/70 disabled:opacity-40"
              >
                <Minus className="size-5" />
              </button>
              <span className="flex-1 text-center font-display text-2xl font-bold tabular-nums">
                {basements}
              </span>
              <button
                type="button"
                onClick={() => setBasements((b) => Math.min(20, b + 1))}
                aria-label="+"
                className="flex size-12 items-center justify-center rounded-xl bg-secondary text-secondary-foreground transition-colors hover:bg-secondary/70"
              >
                <Plus className="size-5" />
              </button>
            </div>
          </div>



          {/* Age */}
          <div>
            <p className="text-sm font-semibold">
              {t("property.age")}{" "}
              <span className="font-normal text-muted-foreground">
                {t("common.optional")}
              </span>
            </p>
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
        </section>
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
        {[1, 2].map((n) => (
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
        {t("common.step")} {step} {t("common.of")} 2
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
