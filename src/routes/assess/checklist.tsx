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
  Maximize2,
  Lightbulb,
  Tag,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { PhotoLightbox, type LightboxPhoto } from "@/components/PhotoLightbox";
import { StepHeader, StepFooter } from "./property";
import {
  CHECKLIST_ITEMS,
  PRIMARY_QUESTION_IDS,
  SEVERE_SIGN_IDS,
  MAX_DAMAGE_PHOTOS,
  MIN_DAMAGE_PHOTOS,
  MAX_FACADE_PHOTOS,
  DAMAGE_CATEGORIES,
  DEFAULT_DAMAGE_CATEGORY,
  type AnswerValue,
  type ChecklistItemId,
  type DamageCategory,
  type DraftAnswer,
} from "@/lib/assessment-types";
import { loadDraft, saveDraft, type AssessmentDraft } from "@/lib/draft-store";
import {
  compressImageToDataUrl,
  isImageFile,
  verifyImageLoads,
} from "@/lib/image-utils";
import { useLang } from "@/lib/i18n";
import { CHECKLIST_ILLUSTRATIONS } from "@/lib/checklist-illustrations";
import { PHOTO_GUIDE_EXAMPLES } from "@/lib/photo-guide-examples";
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

// Self-explanatory context signals shown as a small checklist ("Marca lo que
// aplique"). Each is a clear, full sentence the resident checks off when true;
// selections are stored (by key) separately from the free-text comment and sent
// to the engineer / AI as extra context.
const CONTEXT_SIGNALS = [
  "aftershock",
  "noises",
  "common",
  "people",
  "evacuated",
] as const;

// Reserved photo-carrier ids for the consolidated photo section.
const FACADE_ID: ChecklistItemId = "facade";
const DAMAGE_ID: ChecklistItemId = "damage_photos";

export const Route = createFileRoute("/assess/checklist")({
  component: ChecklistStep,
});

type AnswerEntry = { value: AnswerValue };
type AnswerMap = Record<string, AnswerEntry>;

/** A single damage photo plus the resident's classification of it. */
type DamagePhoto = { url: string; category: DamageCategory };

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

function normalizeCategory(label: unknown): DamageCategory {
  return (DAMAGE_CATEGORIES as string[]).includes(label as string)
    ? (label as DamageCategory)
    : DEFAULT_DAMAGE_CATEGORY;
}

/**
 * Validate + compress a picked file into a data URL. Returns null (and shows a
 * toast) when the file is not an image or doesn't decode into a visible image.
 */
async function intakeImage(
  file: File,
  t: (k: string) => string,
): Promise<string | null> {
  if (!isImageFile(file)) {
    toast.error(t("checklist.invalidFile"));
    return null;
  }
  let dataUrl: string;
  try {
    dataUrl = await compressImageToDataUrl(file);
  } catch {
    toast.error(t("checklist.unreadableImage"));
    return null;
  }
  if (!(await verifyImageLoads(dataUrl))) {
    toast.error(t("checklist.unreadableImage"));
    return null;
  }
  return dataUrl;
}

function ChecklistStep() {
  const { t, lang } = useLang();
  const navigate = useNavigate();

  const [draft, setDraft] = useState<AssessmentDraft | null>(null);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [facadePhotos, setFacadePhotos] = useState<string[]>([]);
  const [damagePhotos, setDamagePhotos] = useState<DamagePhoto[]>([]);
  const [comments, setComments] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState<{
    photos: LightboxPhoto[];
    index: number;
  } | null>(null);

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
          setFacadePhotos(normalizePhotos(a));
          continue;
        }
        if (a.id === DAMAGE_ID) {
          const urls = normalizePhotos(a);
          const labels = a.photoLabels ?? [];
          setDamagePhotos(
            urls.map((url, i) => ({ url, category: normalizeCategory(labels[i]) })),
          );
          continue;
        }
        initial[a.id] = { value: a.value };
      }
      setAnswers(initial);
      setComments(d.property.comments ?? "");
      setSelectedTags(d.property.contextTags ?? []);
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
  const hasFacade = facadePhotos.length >= 1;
  const enoughDamage = damagePhotos.length >= MIN_DAMAGE_PHOTOS;
  const canContinue = allRequired && hasFacade && enoughDamage;

  function openFacadeLightbox(index: number) {
    setLightbox({
      photos: facadePhotos.map((url) => ({
        url,
        caption: t("checklist.facadeTitle"),
      })),
      index,
    });
  }

  function openDamageLightbox(index: number) {
    setLightbox({
      photos: damagePhotos.map((p) => ({
        url: p.url,
        caption: t(`checklist.cat.${p.category}`),
      })),
      index,
    });
  }

  async function persist(ready: boolean) {
    if (!draft) return;
    const draftAnswers: DraftAnswer[] = CHECKLIST_ITEMS.filter(
      (i) => answers[i.id]?.value,
    ).map((i) => ({
      id: i.id,
      value: answers[i.id].value,
      photoDataUrls: [],
    }));
    if (facadePhotos.length) {
      draftAnswers.push({
        id: FACADE_ID,
        value: "yes",
        photoDataUrls: facadePhotos,
      });
    }
    if (damagePhotos.length) {
      draftAnswers.push({
        id: DAMAGE_ID,
        value: "yes",
        photoDataUrls: damagePhotos.map((p) => p.url),
        photoLabels: damagePhotos.map((p) => p.category),
      });
    }
    await saveDraft({
      ...draft,
      property: {
        ...draft.property,
        comments: comments.trim() || undefined,
        contextTags: selectedTags.length ? selectedTags : undefined,
      },
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

      <UsefulPhotosTip />

      <FacadeGallery
        photos={facadePhotos}
        onChange={setFacadePhotos}
        onView={openFacadeLightbox}
      />

      <DamageGallery
        photos={damagePhotos}
        onChange={setDamagePhotos}
        onView={openDamageLightbox}
      />

      {/* Extra context signals — self-explanatory checklist, stored apart */}
      <div className="mt-6 rounded-2xl border border-border bg-card p-4 shadow-sm">
        <h2 className="font-display text-base font-bold">
          {t("checklist.signalsTitle")}
        </h2>
        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
          {t("checklist.signalsHint")}
        </p>
        <div className="mt-3 space-y-2">
          {CONTEXT_SIGNALS.map((key) => {
            const checked = selectedTags.includes(key);
            return (
              <button
                key={key}
                type="button"
                role="checkbox"
                aria-checked={checked}
                onClick={() =>
                  setSelectedTags((prev) =>
                    prev.includes(key)
                      ? prev.filter((k) => k !== key)
                      : [...prev, key],
                  )
                }
                className={cn(
                  "flex w-full items-start gap-3 rounded-xl border bg-background p-3 text-left transition-colors",
                  checked ? "border-primary bg-primary/5" : "border-border",
                )}
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
                  {t(`checklist.suggest.${key}`)}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Optional free-text comments */}
      <div className="mt-6 rounded-2xl border border-border bg-card p-4 shadow-sm">
        <label htmlFor="comments" className="block text-sm font-semibold">
          {t("checklist.commentsTitle")}
        </label>
        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
          {t("checklist.commentsHint")}
        </p>
        <textarea
          id="comments"
          value={comments}
          onChange={(e) => setComments(e.target.value.slice(0, 1000))}
          rows={4}
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

      {lightbox && (
        <PhotoLightbox
          photos={lightbox.photos}
          index={lightbox.index}
          onIndexChange={(i) =>
            setLightbox((lb) => (lb ? { ...lb, index: i } : lb))
          }
          onClose={() => setLightbox(null)}
        />
      )}
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
/* Collapsible "which photos help the engineer" tip                    */
/* ------------------------------------------------------------------ */
function UsefulPhotosTip() {
  const { t } = useLang();
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-3 rounded-2xl border border-primary/20 bg-primary/5 p-3">
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


/* ------------------------------------------------------------------ */
/* Required facade gallery (min 1, max MAX_FACADE_PHOTOS)               */
/* ------------------------------------------------------------------ */
function FacadeGallery({
  photos,
  onChange,
  onView,
}: {
  photos: string[];
  onChange: (next: string[]) => void;
  onView: (index: number) => void;
}) {
  const { t } = useLang();
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const [processing, setProcessing] = useState(false);
  const canAddMore = photos.length < MAX_FACADE_PHOTOS;

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (!files.length) return;
    setProcessing(true);
    try {
      const room = MAX_FACADE_PHOTOS - photos.length;
      const next = [...photos];
      for (const file of files.slice(0, room)) {
        const url = await intakeImage(file, t);
        if (url) next.push(url);
      }
      onChange(next);
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

      <div className="mt-2">
        <span
          className={cn(
            "text-xs font-semibold",
            photos.length >= 1 ? "text-risk-green" : "text-muted-foreground",
          )}
        >
          {t("checklist.facadeCount")
            .replace("{n}", String(photos.length))
            .replace("{max}", String(MAX_FACADE_PHOTOS))}
          {photos.length >= 1 && " ✓"}
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
            <PhotoThumb
              key={i}
              src={src}
              index={i}
              label={t("checklist.facadeTitle")}
              onView={() => onView(i)}
              onRemove={() => removeAt(i)}
            />
          ))}
        </div>
      )}

      {canAddMore && (
        <PhotoButtons
          processing={processing}
          onCamera={() => cameraRef.current?.click()}
          onGallery={() => galleryRef.current?.click()}
        />
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
  onView,
}: {
  photos: DamagePhoto[];
  onChange: (next: DamagePhoto[]) => void;
  onView: (index: number) => void;
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
        const url = await intakeImage(file, t);
        if (url) next.push({ url, category: DEFAULT_DAMAGE_CATEGORY });
      }
      onChange(next);
    } finally {
      setProcessing(false);
    }
  }

  function removeAt(i: number) {
    onChange(photos.filter((_, idx) => idx !== i));
  }

  function setCategory(i: number, category: DamageCategory) {
    onChange(photos.map((p, idx) => (idx === i ? { ...p, category } : p)));
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
        <div className="mt-3 grid grid-cols-2 gap-3">
          {photos.map((p, i) => {
            const tagged = p.category !== DEFAULT_DAMAGE_CATEGORY;
            return (
              <div
                key={i}
                className="space-y-1.5 rounded-xl border border-border bg-background p-1.5"
              >
                <PhotoThumb
                  src={p.url}
                  index={i}
                  label={`${t("checklist.damageTitle")} ${i + 1}`}
                  badge={tagged ? t(`checklist.cat.${p.category}`) : null}
                  onView={() => onView(i)}
                  onRemove={() => removeAt(i)}
                />
                <label
                  htmlFor={`cat-${i}`}
                  className="flex items-center gap-1 px-0.5 text-[11px] font-semibold text-muted-foreground"
                >
                  <Tag className="size-3" />
                  {t("checklist.photoCategoryHeader")}
                </label>
                <select
                  id={`cat-${i}`}
                  value={p.category}
                  onChange={(e) =>
                    setCategory(i, e.target.value as DamageCategory)
                  }
                  aria-label={t("checklist.photoCategoryLabel")}
                  className={cn(
                    "w-full rounded-lg border px-2 py-1.5 text-xs font-semibold outline-none focus:border-primary",
                    tagged
                      ? "border-primary/40 bg-primary/5 text-primary"
                      : "border-border bg-background text-muted-foreground",
                  )}
                >
                  {DAMAGE_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {t(`checklist.cat.${cat}`)}
                    </option>
                  ))}
                </select>
              </div>
            );
          })}
        </div>
      )}


      {canAddMore && (
        <PhotoButtons
          processing={processing}
          onCamera={() => cameraRef.current?.click()}
          onGallery={() => galleryRef.current?.click()}
        />
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

/* ------------------------------------------------------------------ */
/* Shared photo thumbnail (tap to view full, separate remove button)   */
/* ------------------------------------------------------------------ */
function PhotoThumb({
  src,
  index,
  label,
  badge,
  onView,
  onRemove,
}: {
  src: string;
  index: number;
  label: string;
  badge?: string | null;
  onView: () => void;
  onRemove: () => void;
}) {
  const { t } = useLang();
  const [broken, setBroken] = useState(false);

  return (
    <div className="relative overflow-hidden rounded-xl border border-border">
      {broken ? (
        <div className="flex h-24 w-full flex-col items-center justify-center gap-1 bg-muted px-2 text-center">
          <X className="size-4 text-destructive" />
          <span className="text-[10px] font-medium text-muted-foreground">
            {t("checklist.unreadableImage")}
          </span>
        </div>
      ) : (
        <button
          type="button"
          onClick={onView}
          aria-label={t("checklist.viewPhoto")}
          className="group block w-full"
        >
          <img
            src={src}
            alt={label}
            onError={() => setBroken(true)}
            className="h-24 w-full object-cover transition-transform group-hover:scale-105"
          />
          <span className="absolute bottom-1 left-1 flex items-center gap-0.5 rounded-md bg-background/85 px-1.5 py-0.5 text-[10px] font-semibold text-foreground shadow-sm backdrop-blur">
            <Maximize2 className="size-3" />
            {index + 1}
          </span>
          {badge && (
            <span className="absolute left-1 top-1 max-w-[85%] truncate rounded-md bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground shadow-sm">
              {badge}
            </span>
          )}
        </button>
      )}
      <button
        type="button"
        onClick={onRemove}
        aria-label={t("checklist.removePhoto")}
        className="absolute right-1 top-1 flex size-6 items-center justify-center rounded-lg bg-background/90 shadow-sm backdrop-blur"
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Shared "take photo / from gallery" button pair                      */
/* ------------------------------------------------------------------ */
function PhotoButtons({
  processing,
  onCamera,
  onGallery,
}: {
  processing: boolean;
  onCamera: () => void;
  onGallery: () => void;
}) {
  const { t } = useLang();
  return (
    <div className="mt-3 grid grid-cols-2 gap-2">
      <button
        type="button"
        onClick={onCamera}
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
        onClick={onGallery}
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
  );
}
