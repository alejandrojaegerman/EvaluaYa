import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  Camera,
  Loader2,
  X,
  ImageOff,
  ImagePlus,
  ChevronDown,
  Plus,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { StepHeader, StepFooter } from "./property";
import {
  CHECKLIST_ITEMS,
  MAX_PHOTOS_PER_ITEM,
  type AnswerValue,
  type ChecklistItemId,
  type DraftAnswer,
} from "@/lib/assessment-types";
import { loadDraft, saveDraft, type AssessmentDraft } from "@/lib/draft-store";
import { compressImageToDataUrl } from "@/lib/image-utils";
import { useLang } from "@/lib/i18n";
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

  useEffect(() => {
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

  async function persist(map: AnswerMap, ready: boolean) {
    if (!draft) return;
    const draftAnswers: DraftAnswer[] = CHECKLIST_ITEMS.filter(
      (i) => map[i.id]?.value,
    ).map((i) => ({
      id: i.id,
      value: map[i.id].value,
      photoDataUrls: map[i.id].photoDataUrls,
    }));
    await saveDraft({
      ...draft,
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
    await persist(answers, true);
    navigate({ to: "/assess/analyze" });
  }

  if (loading) {
    return (
      <AppShell hideBottomNav>

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
    <AppShell>
      <StepHeader step={2} title={t("checklist.title")} subtitle={t("checklist.subtitle")} />

      {/* Required-progress bar (only the essential structural checks gate
          submission; utility checks are optional). */}
      <div className="mt-4">
        <div className="flex items-center justify-between text-xs font-semibold">
          <span className="text-muted-foreground">
            {requiredAnswered} / {STRUCTURE_ITEMS.length}{" "}
            {t("checklist.coreProgress")}
          </span>
          {allRequired && (
            <span className="text-risk-green">✓</span>
          )}
        </div>
        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-border">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{
              width: `${(requiredAnswered / STRUCTURE_ITEMS.length) * 100}%`,
            }}
          />
        </div>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          {t("checklist.optionalNote")}
        </p>
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

      <StepFooter
        onBack={() => navigate({ to: "/assess/property" })}
        onNext={handleContinue}
        nextDisabled={!allRequired}
        nextLabel={t("checklist.analyze")}
        backLabel={t("common.back")}
      />
    </AppShell>
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
