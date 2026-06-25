import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Camera, Loader2, X, ImageOff, Plus } from "lucide-react";
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

  const answeredCount = CHECKLIST_ITEMS.filter((i) => answers[i.id]?.value).length;
  const allAnswered = answeredCount === CHECKLIST_ITEMS.length;

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
    if (!allAnswered) {
      toast.warning(t("checklist.answerAll"));
      return;
    }
    await persist(answers, true);
    navigate({ to: "/assess/analyze" });
  }

  if (loading) {
    return (
      <AppShell>
        <div className="flex min-h-[50vh] items-center justify-center">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <StepHeader step={2} title={t("checklist.title")} subtitle={t("checklist.subtitle")} />

      <p className="mt-4 text-xs font-semibold text-muted-foreground">
        {answeredCount} / {CHECKLIST_ITEMS.length}
      </p>

      <div className="mt-3 space-y-4">
        {CHECKLIST_ITEMS.map((item, idx) => (
          <ChecklistCard
            key={item.id}
            index={idx + 1}
            id={item.id}
            value={answers[item.id]?.value ?? null}
            photos={answers[item.id]?.photoDataUrls ?? []}
            onAnswer={(v) => setAnswer(item.id, v)}
            onAddPhoto={(p) => addPhoto(item.id, p)}
            onRemovePhoto={(i) => removePhoto(item.id, i)}
          />
        ))}
      </div>

      <StepFooter
        onBack={() => navigate({ to: "/assess/property" })}
        onNext={handleContinue}
        nextDisabled={!allAnswered}
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
  const inputRef = useRef<HTMLInputElement>(null);
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
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
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
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={processing}
                className="flex h-24 flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-border text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground disabled:opacity-60"
              >
                {processing ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Plus className="size-4" />
                )}
                {t("checklist.morePhotos")}
              </button>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={processing}
            className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border py-3 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground disabled:opacity-60"
          >
            {processing ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Camera className="size-4" />
            )}
            {t("checklist.addPhoto")}
          </button>
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
