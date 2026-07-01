import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  Camera,
  Loader2,
  X,
  ImageOff,
  ImagePlus,
  ChevronDown,
  Plus,
  Info,
  HelpCircle,
  Lightbulb,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { LegalConsentInline } from "@/components/LegalConsentInline";
import { StepHeader, StepFooter } from "./property";
import {
  CHECKLIST_ITEMS,
  MAX_PHOTOS_PER_ITEM,
  type AnswerValue,
  type ChecklistItemId,
  type DraftAnswer,
} from "@/lib/assessment-types";
import { loadDraft, saveDraft, type AssessmentDraft } from "@/lib/draft-store";
import { setLegalConsent } from "@/lib/legal-ack";
import { compressImageToDataUrl } from "@/lib/image-utils";
import { useLang } from "@/lib/i18n";
import { CHECKLIST_ILLUSTRATIONS } from "@/lib/checklist-illustrations";
import { PHOTO_GUIDE_EXAMPLES } from "@/lib/photo-guide-examples";
import { trackStep } from "@/lib/track";
import { CHECKLIST_GLOSSARY } from "@/lib/glossary";
import { GlossaryTerm } from "@/components/GlossaryTerm";
import { cn } from "@/lib/utils";

const STRUCTURE_ITEMS = CHECKLIST_ITEMS.filter((i) => i.section === "structure");
const UTILITY_ITEMS = CHECKLIST_ITEMS.filter((i) => i.section === "utilities");

export const Route = createFileRoute("/assess/checklist")({
  component: ChecklistStep,
});

type AnswerEntry = { value: AnswerValue; photoDataUrls: string[] };
type AnswerMap = Record<string, AnswerEntry>;

const ANSWER_OPTIONS: { value: AnswerValue; tone: string; active: string }[] = [
  {
    value: "yes",
    tone: "text-risk-red",
    active: "border-risk-red bg-risk-red-soft text-risk-red",
  },
  {
    value: "no",
    tone: "text-risk-green",
    active: "border-risk-green bg-risk-green-soft text-risk-green",
  },
  {
    value: "unsure",
    tone: "text-muted-foreground",
    active: "border-muted-foreground bg-muted text-foreground",
  },
];

function normalizePhotos(a: DraftAnswer): string[] {
  if (a.photoDataUrls && a.photoDataUrls.length) return a.photoDataUrls;
  if (a.photoDataUrl) return [a.photoDataUrl];
  return [];
}

function ChecklistStep() {
  const { t, lang } = useLang();
  const navigate = useNavigate();

  const [draft, setDraft] = useState<AssessmentDraft | null>(null);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [loading, setLoading] = useState(true);
  const [showOptional, setShowOptional] = useState(false);
  // Legal + data consent, captured here (as late as possible) right before the
  // analysis. Both required. Pre-checked if the current draft already consented.
  const [acceptLegal, setAcceptLegal] = useState(false);
  const [acceptData, setAcceptData] = useState(false);
  const [consentError, setConsentError] = useState(false);
  const consentGiven = acceptLegal && acceptData;

  useEffect(() => {
    trackStep("checklist_started");
    let active = true;
    loadDraft().then((d) => {
      if (!active) return;
      if (!d || !d.property.buildingType) {
        navigate({ to: "/assess/property" });
        return;
      }
      setDraft(d);
      if (d.consent) {
        setAcceptLegal(true);
        setAcceptData(true);
      }
      const initial: AnswerMap = {};
      for (const a of d.answers) {
        initial[a.id] = {
          value: a.value,
          photoDataUrls: normalizePhotos(a),
        };
      }
      setAnswers(initial);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [navigate]);

  function setAnswer(id: ChecklistItemId, value: AnswerValue) {
    setAnswers((prev) => ({
      ...prev,
      [id]: { value, photoDataUrls: prev[id]?.photoDataUrls ?? [] },
    }));
  }

  function addPhoto(id: ChecklistItemId, photoDataUrl: string) {
    setAnswers((prev) => {
      const cur = prev[id] ?? { value: "unsure" as AnswerValue, photoDataUrls: [] };
      const next = [...cur.photoDataUrls, photoDataUrl].slice(0, MAX_PHOTOS_PER_ITEM);
      return { ...prev, [id]: { ...cur, photoDataUrls: next } };
    });
  }

  function removePhoto(id: ChecklistItemId, index: number) {
    setAnswers((prev) => {
      const cur = prev[id];
      if (!cur) return prev;
      const next = cur.photoDataUrls.filter((_, i) => i !== index);
      return { ...prev, [id]: { ...cur, photoDataUrls: next } };
    });
  }

  const requiredAnswered = STRUCTURE_ITEMS.filter(
    (i) => answers[i.id]?.value,
  ).length;
  const allRequired = requiredAnswered === STRUCTURE_ITEMS.length;
  const hasUtilityAnswers = UTILITY_ITEMS.some((i) => answers[i.id]?.value);
  const optionalVisible = showOptional || hasUtilityAnswers;

  async function persist(map: AnswerMap, ready: boolean, consentGranted: boolean) {
    if (!draft) return;
    const draftAnswers: DraftAnswer[] = CHECKLIST_ITEMS.filter(
      (i) => map[i.id]?.value,
    ).map((i) => ({
      id: i.id,
      value: map[i.id].value,
      photoDataUrls: map[i.id].photoDataUrls,
    }));
    // Stamp a fresh, versioned consent record onto this evaluation when granted
    // (proof is persisted per assessment via assessment.functions).
    const consent = consentGranted ? (draft.consent ?? setLegalConsent()) : draft.consent;
    await saveDraft({
      ...draft,
      answers: draftAnswers,
      language: lang,
      status: ready ? "ready_to_send" : "in_progress",
      ...(consent ? { consent } : {}),
    });
  }

  async function handleContinue() {
    if (!allRequired) {
      toast.warning(t("checklist.answerAll"));
      return;
    }
    if (!consentGiven) {
      setConsentError(true);
      toast.warning(t("gate.mustAccept"));
      return;
    }
    await persist(answers, true, true);
    navigate({ to: "/assess/analyze" });
  }

  if (loading) {
    return (
      <AppShell hideBottomNav hideFooter>

        <div className="flex min-h-[50vh] items-center justify-center">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      </AppShell>
    );
  }

  const renderCard = (id: ChecklistItemId, index: number) => (
    <ChecklistCard
      key={id}
      index={index}
      id={id}
      value={answers[id]?.value ?? null}
      photos={answers[id]?.photoDataUrls ?? []}
      onAnswer={(v) => setAnswer(id, v)}
      onAddPhoto={(p) => addPhoto(id, p)}
      onRemovePhoto={(i) => removePhoto(id, i)}
    />
  );

  return (
    <AppShell hideBottomNav hideFooter>
      <StepHeader step={2} title={t("checklist.title")} subtitle={t("checklist.subtitle")} />


      {/* Report NEW damage only (feedback #7) */}
      <div className="mt-4 flex gap-2.5 rounded-2xl border border-amber-300/60 bg-amber-50 p-3.5 dark:border-amber-500/30 dark:bg-amber-500/10">
        <Info className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
        <div>
          <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
            {t("checklist.newDamageTitle")}
          </p>
          <p className="mt-0.5 text-xs leading-relaxed text-amber-800/90 dark:text-amber-200/80">
            {t("checklist.newDamageBody")}
          </p>
        </div>
      </div>



      {/* Structural checks (required) */}
      <h2 className="mt-5 font-display text-sm font-bold uppercase tracking-wide text-muted-foreground">
        {t("checklist.sectionStructure")}
      </h2>
      <div className="mt-3 space-y-4">
        {STRUCTURE_ITEMS.map((item, idx) => renderCard(item.id, idx + 1))}
      </div>

      {/* Utility checks (optional, collapsed by default) */}
      {!optionalVisible ? (
        <button
          type="button"
          onClick={() => setShowOptional(true)}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border bg-card py-3.5 text-sm font-semibold text-primary transition-colors hover:border-primary/40"
        >
          <Plus className="size-4" />
          {t("checklist.showOptional")}
        </button>
      ) : (
        <>
          <div className="mt-5 flex items-center justify-between">
            <h2 className="font-display text-sm font-bold uppercase tracking-wide text-muted-foreground">
              {t("checklist.sectionUtilities")}{" "}
              <span className="ml-1 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium normal-case tracking-normal text-secondary-foreground">
                {t("checklist.optionalTag")}
              </span>
            </h2>
            {!hasUtilityAnswers && (
              <button
                type="button"
                onClick={() => setShowOptional(false)}
                aria-label={t("checklist.hideOptional")}
                className="text-muted-foreground transition-transform hover:text-foreground"
              >
                <ChevronDown className="size-4 rotate-180" />
              </button>
            )}
          </div>
          <div className="mt-3 space-y-4">
            {UTILITY_ITEMS.map((item, idx) =>
              renderCard(item.id, STRUCTURE_ITEMS.length + idx + 1),
            )}
          </div>
        </>
      )}

      {!allRequired && (
        <p className="mt-6 rounded-xl bg-muted px-4 py-3 text-center text-sm text-muted-foreground">
          {t("checklist.remaining").replace(
            "{n}",
            `${STRUCTURE_ITEMS.length - requiredAnswered} ${
              STRUCTURE_ITEMS.length - requiredAnswered === 1
                ? t("checklist.remainingOne")
                : t("checklist.remainingMany")
            }`,
          )}
        </p>
      )}

      {/* Legal + data consent — captured as late as possible, right before analysis */}
      <LegalConsentInline
        acceptLegal={acceptLegal}
        acceptData={acceptData}
        onChangeLegal={(v) => {
          setAcceptLegal(v);
          setConsentError(false);
        }}
        onChangeData={(v) => {
          setAcceptData(v);
          setConsentError(false);
        }}
        showError={consentError}
      />

      <StepFooter
        onBack={() => navigate({ to: "/assess/property" })}
        onNext={handleContinue}
        nextDisabled={!allRequired || !consentGiven}
        nextLabel={t("checklist.analyze")}
        backLabel={t("common.back")}
      />
    </AppShell>
  );
}

/* ------------------------------------------------------------------ */
/* Collapsible "which photos help the engineer" guidance               */
/* ------------------------------------------------------------------ */
function UsefulPhotosTip() {
  const { t } = useLang();
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-4 rounded-2xl border border-primary/20 bg-primary/5 p-3">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 text-left text-sm font-semibold text-primary"
      >
        <Lightbulb className="size-4 shrink-0" />
        <span className="flex-1">{t("checklist.usefulToggle")}</span>
        <ChevronDown
          className={cn("size-4 transition-transform", open && "rotate-180")}
        />
      </button>
      {open && (
        <div className="mt-2.5 space-y-3">
          <p className="text-xs leading-relaxed text-muted-foreground">
            {t("checklist.usefulIntro")}
          </p>
          <div className="grid grid-cols-2 gap-3">
            {PHOTO_GUIDE_EXAMPLES.map((ex) => (
              <figure
                key={ex.titleKey}
                className="overflow-hidden rounded-xl border border-border bg-card"
              >
                <img
                  src={ex.img}
                  alt={t(ex.titleKey)}
                  loading="lazy"
                  width={816}
                  height={816}
                  className="aspect-square w-full object-cover"
                />
                <figcaption className="p-2">
                  <p className="text-xs font-semibold leading-tight">
                    {t(ex.titleKey)}
                  </p>
                  <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
                    {t(ex.descKey)}
                  </p>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}



function ChecklistCard({
  index,
  id,
  value,
  photos,
  onAnswer,
  onAddPhoto,
  onRemovePhoto,
}: {
  index: number;
  id: ChecklistItemId;
  value: AnswerValue | null;
  photos: string[];
  onAnswer: (v: AnswerValue) => void;
  onAddPhoto: (p: string) => void;
  onRemovePhoto: (i: number) => void;
}) {
  const { t } = useLang();
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const [processing, setProcessing] = useState(false);
  const [showExample, setShowExample] = useState(false);
  const canAddMore = photos.length < MAX_PHOTOS_PER_ITEM;

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setProcessing(true);
    try {
      const dataUrl = await compressImageToDataUrl(file);
      onAddPhoto(dataUrl);
    } catch {
      toast.error(t("analyze.genericError"));
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-secondary text-xs font-bold text-secondary-foreground">
          {index}
        </span>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">
            {t(`item.${id}.area`)}
          </p>
          <p className="mt-0.5 text-sm font-medium leading-snug">
            {t(`item.${id}.q`)}
          </p>
          <button
            type="button"
            onClick={() => setShowExample((s) => !s)}
            aria-expanded={showExample}
            className="mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-primary"
          >
            <HelpCircle className="size-3.5" />
            {t("checklist.exampleToggle")}
            <ChevronDown
              className={cn(
                "size-3.5 transition-transform",
                showExample && "rotate-180",
              )}
            />
          </button>
          {showExample && (
            <div className="mt-2 space-y-2.5 rounded-xl bg-muted/50 p-2.5 text-xs leading-relaxed">
              <figure className="overflow-hidden rounded-lg border border-border bg-background">
                <img
                  src={CHECKLIST_ILLUSTRATIONS[id]}
                  alt={t("checklist.exampleAlt")}
                  loading="lazy"
                  width={1024}
                  height={512}
                  className="h-auto w-full"
                />
                <figcaption className="flex items-center justify-between border-t border-border px-3 py-1.5 text-[11px] font-semibold">
                  <span className="text-destructive">❌ {t("checklist.illoDamage")}</span>
                  <span className="text-emerald-600">✅ {t("checklist.illoOk")}</span>
                </figcaption>
              </figure>
              <p className="flex gap-1.5">
                <span aria-hidden>❌</span>
                <span>
                  <span className="font-semibold">{t("checklist.exampleYes")}:</span>{" "}
                  {t(`item.${id}.example.yes`)}
                </span>
              </p>
              <p className="flex gap-1.5">
                <span aria-hidden>✅</span>
                <span>
                  <span className="font-semibold">{t("checklist.exampleNo")}:</span>{" "}
                  {t(`item.${id}.example.no`)}
                </span>
              </p>
              {CHECKLIST_GLOSSARY[id] && (
                <div className="border-t border-border pt-2">
                  <p className="text-[11px] text-muted-foreground">
                    {t("checklist.glossaryHint")}
                  </p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {CHECKLIST_GLOSSARY[id]!.map((term) => (
                      <GlossaryTerm key={term} term={term} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>


      <div className="mt-3 grid grid-cols-3 gap-2">
        {ANSWER_OPTIONS.map((opt) => {
          const selected = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onAnswer(opt.value)}
              aria-pressed={selected}
              className={cn(
                "rounded-xl border-2 py-2.5 text-sm font-semibold transition-colors",
                selected
                  ? opt.active
                  : "border-border bg-background text-foreground hover:border-primary/30",
              )}
            >
              {t(`checklist.answer.${opt.value}`)}
            </button>
          );
        })}
      </div>

      {value === "yes" && photos.length === 0 && (
        <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-300/60 bg-amber-50 p-2.5 text-xs leading-relaxed text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
          <Camera className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          <span>{t("checklist.photoPromptYes")}</span>
        </div>
      )}

      {/* Photos */}
      <div className="mt-3">
        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleFile}
        />
        <input
          ref={galleryRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFile}
        />

        {photos.length > 0 ? (
          <div className="grid grid-cols-3 gap-2">
            {photos.map((src, i) => (
              <div
                key={i}
                className="relative overflow-hidden rounded-xl border border-border"
              >
                <img
                  src={src}
                  alt={`${t(`item.${id}.area`)} ${i + 1}`}
                  className="h-24 w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => onRemovePhoto(i)}
                  aria-label={t("checklist.removePhoto")}
                  className="absolute right-1 top-1 flex size-6 items-center justify-center rounded-lg bg-background/90 shadow-sm backdrop-blur"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            ))}
            {canAddMore && (
              <div className="grid grid-cols-2 gap-1">
                <button
                  type="button"
                  onClick={() => cameraRef.current?.click()}
                  disabled={processing}
                  aria-label={t("checklist.takePhoto")}
                  className="flex h-24 flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-border text-[11px] font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground disabled:opacity-60"
                >
                  {processing ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Camera className="size-4" />
                  )}
                  {t("checklist.takePhoto")}
                </button>
                <button
                  type="button"
                  onClick={() => galleryRef.current?.click()}
                  disabled={processing}
                  aria-label={t("checklist.fromGallery")}
                  className="flex h-24 flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-border text-[11px] font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground disabled:opacity-60"
                >
                  {processing ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <ImagePlus className="size-4" />
                  )}
                  {t("checklist.fromGallery")}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => cameraRef.current?.click()}
              disabled={processing}
              className="flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border py-3 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground disabled:opacity-60"
            >
              {processing ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Camera className="size-4" />
              )}
              {t("checklist.takePhoto")}
            </button>
            <button
              type="button"
              onClick={() => galleryRef.current?.click()}
              disabled={processing}
              className="flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border py-3 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground disabled:opacity-60"
            >
              {processing ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <ImagePlus className="size-4" />
              )}
              {t("checklist.fromGallery")}
            </button>
          </div>
        )}

        {photos.length === 0 && !processing && (
          <p className="mt-1.5 flex items-center gap-1 text-[11px] text-muted-foreground">
            <ImageOff className="size-3" /> {t("checklist.photoHint")}
          </p>
        )}
      </div>
    </div>
  );
}
