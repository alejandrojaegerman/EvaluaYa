import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  Camera,
  Loader2,
  X,
  ImagePlus,
  ChevronDown,
  HelpCircle,
  Check,
  Building2,
  Images,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { StepHeader, StepFooter } from "./property";
import {
  CHECKLIST_ITEMS,
  PRIMARY_QUESTION_IDS,
  SEVERE_SIGN_IDS,
  MAX_DAMAGE_PHOTOS,
  MIN_DAMAGE_PHOTOS,
  type AnswerValue,
  type ChecklistItemId,
  type DraftAnswer,
} from "@/lib/assessment-types";
import { loadDraft, saveDraft, type AssessmentDraft } from "@/lib/draft-store";
import { compressImageToDataUrl } from "@/lib/image-utils";
import { useLang } from "@/lib/i18n";
import { CHECKLIST_ILLUSTRATIONS } from "@/lib/checklist-illustrations";
import { trackStep } from "@/lib/track";
import { CHECKLIST_GLOSSARY } from "@/lib/glossary";
import { GlossaryTerm } from "@/components/GlossaryTerm";
import { cn } from "@/lib/utils";

// The 4 direct yes/no/unsure questions, plus the "señales graves" multi-select,
// plus a single consolidated photo section (facade + damage gallery). Each of
// these persists as an individual checklist answer so the engineer-validated
// deterministic rules + AI prompt + analytics keep working unchanged.
const PRIMARY_ITEMS = PRIMARY_QUESTION_IDS;
const SEVERE_ITEMS = SEVERE_SIGN_IDS;

// Reserved photo-carrier ids for the consolidated photo section.
const FACADE_ID: ChecklistItemId = "facade";
const DAMAGE_ID: ChecklistItemId = "damage_photos";

export const Route = createFileRoute("/assess/checklist")({
  component: ChecklistStep,
});

type AnswerEntry = { value: AnswerValue };
type AnswerMap = Record<string, AnswerEntry>;

const ANSWER_OPTIONS: { value: AnswerValue; active: string }[] = [
  { value: "yes", active: "border-risk-red bg-risk-red-soft text-risk-red" },
  {
    value: "no",
    active: "border-risk-green bg-risk-green-soft text-risk-green",
  },
  {
    value: "unsure",
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
  const [facadePhoto, setFacadePhoto] = useState<string | null>(null);
  const [damagePhotos, setDamagePhotos] = useState<string[]>([]);
  const [comments, setComments] = useState("");
  const [loading, setLoading] = useState(true);

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
      const initial: AnswerMap = {};
      for (const a of d.answers) {
        if (a.id === FACADE_ID) {
          const photos = normalizePhotos(a);
          if (photos[0]) setFacadePhoto(photos[0]);
          continue;
        }
        if (a.id === DAMAGE_ID) {
          setDamagePhotos(normalizePhotos(a));
          continue;
        }
        initial[a.id] = { value: a.value };
      }
      setAnswers(initial);
      setComments(d.property.comments ?? "");
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [navigate]);

  function setAnswer(id: ChecklistItemId, value: AnswerValue) {
    setAnswers((prev) => ({ ...prev, [id]: { value } }));
  }

  // A severe sign is "on" when stored as a "yes" answer; toggling off removes it.
  function toggleSevere(id: ChecklistItemId) {
    setAnswers((prev) => {
      if (prev[id]?.value === "yes") {
        const next = { ...prev };
        delete next[id];
        return next;
      }
      return { ...prev, [id]: { value: "yes" } };
    });
  }

  const requiredAnswered = PRIMARY_ITEMS.filter(
    (id) => answers[id]?.value,
  ).length;
  const allRequired = requiredAnswered === PRIMARY_ITEMS.length;
  const hasFacade = !!facadePhoto;
  const enoughDamage = damagePhotos.length >= MIN_DAMAGE_PHOTOS;
  const canContinue = allRequired && hasFacade && enoughDamage;

  async function persist(ready: boolean) {
    if (!draft) return;
    const draftAnswers: DraftAnswer[] = CHECKLIST_ITEMS.filter(
      (i) => answers[i.id]?.value,
    ).map((i) => ({
      id: i.id,
      value: answers[i.id].value,
      photoDataUrls: [],
    }));
    if (facadePhoto) {
      draftAnswers.push({
        id: FACADE_ID,
        value: "yes",
        photoDataUrls: [facadePhoto],
      });
    }
    if (damagePhotos.length) {
      draftAnswers.push({
        id: DAMAGE_ID,
        value: "yes",
        photoDataUrls: damagePhotos,
      });
    }
    await saveDraft({
      ...draft,
      property: { ...draft.property, comments: comments.trim() || undefined },
      answers: draftAnswers,
      language: lang,
      status: ready ? "ready_to_send" : "in_progress",
    });
  }

  async function handleContinue() {
    if (!allRequired) {
      toast.warning(t("checklist.answerAll"));
      return;
    }
    if (!hasFacade) {
      toast.warning(t("checklist.missingFacade"));
      return;
    }
    if (!enoughDamage) {
      toast.warning(
        t("checklist.missingDamage").replace("{n}", String(MIN_DAMAGE_PHOTOS)),
      );
      return;
    }
    await persist(true);
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

  return (
    <AppShell hideBottomNav hideFooter>
      <StepHeader
        step={2}
        title={t("checklist.title")}
        subtitle={t("checklist.subtitle")}
      />

      {/* The four main structural questions (no per-item photos) */}
      <h2 className="mt-5 font-display text-sm font-bold uppercase tracking-wide text-muted-foreground">
        {t("checklist.sectionStructure")}
      </h2>
      <div className="mt-3 space-y-4">
        {PRIMARY_ITEMS.map((id, idx) => (
          <QuestionCard
            key={id}
            index={idx + 1}
            id={id}
            value={answers[id]?.value ?? null}
            onAnswer={(v) => setAnswer(id, v)}
          />
        ))}
      </div>

      {/* "Otras señales" multi-select — softened styling, optional, with
          examples. Each selection maps to an engineer-validated rule. */}
      <div className="mt-6 rounded-2xl border border-border bg-card p-4 shadow-sm">
        <h2 className="font-display text-base font-bold">
          {t("checklist.severeTitle")}
        </h2>
        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
          {t("checklist.severeSubtitle")}
        </p>
        <div className="mt-3 space-y-2">
          {SEVERE_ITEMS.map((id) => (
            <SevereRow
              key={id}
              id={id}
              checked={answers[id]?.value === "yes"}
              onToggle={() => toggleSevere(id)}
            />
          ))}
        </div>
      </div>

      {/* Consolidated, MANDATORY photo section */}
      <h2 className="mt-6 font-display text-sm font-bold uppercase tracking-wide text-muted-foreground">
        {t("checklist.photosTitle")}
      </h2>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
        {t("checklist.photosIntro")}
      </p>

      <FacadePhoto
        photo={facadePhoto}
        onSet={setFacadePhoto}
        onClear={() => setFacadePhoto(null)}
      />

      <DamageGallery photos={damagePhotos} onChange={setDamagePhotos} />

      {/* Optional comments */}
      <div className="mt-6 rounded-2xl border border-border bg-card p-4 shadow-sm">
        <label
          htmlFor="comments"
          className="block text-sm font-semibold"
        >
          {t("checklist.commentsTitle")}
        </label>
        <textarea
          id="comments"
          value={comments}
          onChange={(e) => setComments(e.target.value.slice(0, 1000))}
          rows={3}
          placeholder={t("checklist.commentsPlaceholder")}
          className="mt-2 w-full resize-none rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
        />
      </div>

      <StepFooter
        onBack={() => navigate({ to: "/assess/property" })}
        onNext={handleContinue}
        nextDisabled={!canContinue}
        nextLabel={t("checklist.analyze")}
        backLabel={t("common.back")}
      />
    </AppShell>
  );
}

/* ------------------------------------------------------------------ */
/* Primary structural question — yes/no/unsure with collapsible example */
/* ------------------------------------------------------------------ */
function QuestionCard({
  index,
  id,
  value,
  onAnswer,
}: {
  index: number;
  id: ChecklistItemId;
  value: AnswerValue | null;
  onAnswer: (v: AnswerValue) => void;
}) {
  const { t } = useLang();
  const [showExample, setShowExample] = useState(false);

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
          {showExample && <ExampleBlock id={id} />}
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
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* "Otras señales" checkbox row with collapsible example               */
/* ------------------------------------------------------------------ */
function SevereRow({
  id,
  checked,
  onToggle,
}: {
  id: ChecklistItemId;
  checked: boolean;
  onToggle: () => void;
}) {
  const { t } = useLang();
  const [showExample, setShowExample] = useState(false);

  return (
    <div
      className={cn(
        "rounded-xl border bg-background p-3 transition-colors",
        checked ? "border-primary bg-primary/5" : "border-border",
      )}
    >
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        onClick={onToggle}
        className="flex w-full items-start gap-3 text-left"
      >
        <span
          className={cn(
            "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors",
            checked
              ? "border-primary bg-primary text-primary-foreground"
              : "border-muted-foreground/40",
          )}
        >
          {checked && <Check className="size-3.5" strokeWidth={3} />}
        </span>
        <span className="min-w-0 text-sm font-medium leading-snug">
          {t(`item.${id}.q`)}
        </span>
      </button>
      <button
        type="button"
        onClick={() => setShowExample((s) => !s)}
        aria-expanded={showExample}
        className="ml-8 mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-primary"
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
        <div className="ml-8">
          <ExampleBlock id={id} />
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Shared illustrated example block                                    */
/* ------------------------------------------------------------------ */
function ExampleBlock({ id }: { id: ChecklistItemId }) {
  const { t } = useLang();
  return (
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
          <span className="text-destructive">
            ❌ {t("checklist.illoDamage")}
          </span>
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
  );
}

/* ------------------------------------------------------------------ */
/* Required facade photo (single)                                      */
/* ------------------------------------------------------------------ */
function FacadePhoto({
  photo,
  onSet,
  onClear,
}: {
  photo: string | null;
  onSet: (p: string) => void;
  onClear: () => void;
}) {
  const { t } = useLang();
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const [processing, setProcessing] = useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setProcessing(true);
    try {
      onSet(await compressImageToDataUrl(file));
    } catch {
      toast.error(t("analyze.genericError"));
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="mt-3 rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-start gap-2.5">
        <Building2 className="mt-0.5 size-5 shrink-0 text-primary" />
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-sm font-semibold">
            {t("checklist.facadeTitle")}
            <span className="rounded-full bg-risk-red-soft px-2 py-0.5 text-[10px] font-bold uppercase text-risk-red">
              {t("checklist.required")}
            </span>
          </p>
          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
            {t("checklist.facadeHelp")}
          </p>
        </div>
      </div>

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

      {photo ? (
        <div className="relative mt-3 overflow-hidden rounded-xl border border-border">
          <img
            src={photo}
            alt={t("checklist.facadeTitle")}
            className="h-44 w-full object-cover"
          />
          <button
            type="button"
            onClick={onClear}
            aria-label={t("checklist.removePhoto")}
            className="absolute right-2 top-2 flex size-7 items-center justify-center rounded-lg bg-background/90 shadow-sm backdrop-blur"
          >
            <X className="size-4" />
          </button>
        </div>
      ) : (
        <div className="mt-3 grid grid-cols-2 gap-2">
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
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Required damage gallery (min MIN_DAMAGE_PHOTOS, max MAX_DAMAGE_PHOTOS)*/
/* ------------------------------------------------------------------ */
function DamageGallery({
  photos,
  onChange,
}: {
  photos: string[];
  onChange: (next: string[]) => void;
}) {
  const { t } = useLang();
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const [processing, setProcessing] = useState(false);
  const canAddMore = photos.length < MAX_DAMAGE_PHOTOS;
  const enough = photos.length >= MIN_DAMAGE_PHOTOS;

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (!files.length) return;
    setProcessing(true);
    try {
      const room = MAX_DAMAGE_PHOTOS - photos.length;
      const next = [...photos];
      for (const file of files.slice(0, room)) {
        next.push(await compressImageToDataUrl(file));
      }
      onChange(next);
    } catch {
      toast.error(t("analyze.genericError"));
    } finally {
      setProcessing(false);
    }
  }

  function removeAt(i: number) {
    onChange(photos.filter((_, idx) => idx !== i));
  }

  return (
    <div className="mt-3 rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-start gap-2.5">
        <Images className="mt-0.5 size-5 shrink-0 text-primary" />
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-sm font-semibold">
            {t("checklist.damageTitle")}
            <span className="rounded-full bg-risk-red-soft px-2 py-0.5 text-[10px] font-bold uppercase text-risk-red">
              {t("checklist.required")}
            </span>
          </p>
          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
            {t("checklist.damageHelp")
              .replace("{min}", String(MIN_DAMAGE_PHOTOS))
              .replace("{max}", String(MAX_DAMAGE_PHOTOS))}
          </p>
        </div>
      </div>

      <div className="mt-2 flex items-center gap-2">
        <span
          className={cn(
            "text-xs font-semibold",
            enough ? "text-risk-green" : "text-muted-foreground",
          )}
        >
          {t("checklist.damageCount")
            .replace("{n}", String(photos.length))
            .replace("{max}", String(MAX_DAMAGE_PHOTOS))}
          {enough && " ✓"}
        </span>
      </div>

      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFiles}
      />
      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFiles}
      />

      {photos.length > 0 && (
        <div className="mt-3 grid grid-cols-3 gap-2">
          {photos.map((src, i) => (
            <div
              key={i}
              className="relative overflow-hidden rounded-xl border border-border"
            >
              <img
                src={src}
                alt={`${t("checklist.damageTitle")} ${i + 1}`}
                className="h-24 w-full object-cover"
              />
              <button
                type="button"
                onClick={() => removeAt(i)}
                aria-label={t("checklist.removePhoto")}
                className="absolute right-1 top-1 flex size-6 items-center justify-center rounded-lg bg-background/90 shadow-sm backdrop-blur"
              >
                <X className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {canAddMore && (
        <div className="mt-3 grid grid-cols-2 gap-2">
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

      {!enough && (
        <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
          {t("checklist.missingDamage").replace(
            "{n}",
            String(MIN_DAMAGE_PHOTOS),
          )}
        </p>
      )}
    </div>
  );
}
