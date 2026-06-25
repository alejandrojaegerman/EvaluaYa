import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Camera, Loader2, X, ImageOff } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { StepHeader, StepFooter } from "./property";
import {
  CHECKLIST_ITEMS,
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

type AnswerMap = Record<string, { value: AnswerValue; photoDataUrl: string | null }>;

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
          photoDataUrl: a.photoDataUrl ?? null,
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
      [id]: { value, photoDataUrl: prev[id]?.photoDataUrl ?? null },
    }));
  }

  function setPhoto(id: ChecklistItemId, photoDataUrl: string | null) {
    setAnswers((prev) => ({
      ...prev,
      [id]: { value: prev[id]?.value ?? "unsure", photoDataUrl },
    }));
  }

  const answeredCount = CHECKLIST_ITEMS.filter((i) => answers[i.id]?.value).length;
  const allAnswered = answeredCount === CHECKLIST_ITEMS.length;

  async function persist(map: AnswerMap) {
    if (!draft) return;
    const draftAnswers: DraftAnswer[] = CHECKLIST_ITEMS.filter(
      (i) => map[i.id]?.value,
    ).map((i) => ({
      id: i.id,
      value: map[i.id].value,
      photoDataUrl: map[i.id].photoDataUrl,
    }));
    await saveDraft({ ...draft, answers: draftAnswers, language: lang });
  }

  async function handleContinue() {
    if (!allAnswered) {
      toast.warning(t("checklist.answerAll"));
      return;
    }
    await persist(answers);
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
            photo={answers[item.id]?.photoDataUrl ?? null}
            onAnswer={(v) => setAnswer(item.id, v)}
            onPhoto={(p) => setPhoto(item.id, p)}
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
  photo,
  onAnswer,
  onPhoto,
}: {
  index: number;
  id: ChecklistItemId;
  value: AnswerValue | null;
  photo: string | null;
  onAnswer: (v: AnswerValue) => void;
  onPhoto: (p: string | null) => void;
}) {
  const { t } = useLang();
  const inputRef = useRef<HTMLInputElement>(null);
  const [processing, setProcessing] = useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setProcessing(true);
    try {
      const dataUrl = await compressImageToDataUrl(file);
      onPhoto(dataUrl);
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

      {/* Photo */}
      <div className="mt-3">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleFile}
        />
        {photo ? (
          <div className="relative overflow-hidden rounded-xl border border-border">
            <img
              src={photo}
              alt={t(`item.${id}.area`)}
              className="h-36 w-full object-cover"
            />
            <div className="absolute bottom-2 right-2 flex gap-2">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="rounded-lg bg-background/90 px-2.5 py-1 text-xs font-semibold shadow-sm backdrop-blur"
              >
                {t("checklist.changePhoto")}
              </button>
              <button
                type="button"
                onClick={() => onPhoto(null)}
                aria-label={t("checklist.removePhoto")}
                className="flex size-7 items-center justify-center rounded-lg bg-background/90 shadow-sm backdrop-blur"
              >
                <X className="size-4" />
              </button>
            </div>
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
        {!photo && !processing && (
          <p className="mt-1.5 flex items-center gap-1 text-[11px] text-muted-foreground">
            <ImageOff className="size-3" /> {t("checklist.photoHint")}
          </p>
        )}
      </div>
    </div>
  );
}
