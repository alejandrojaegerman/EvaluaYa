import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  Loader2,
  ShieldAlert,
  WifiOff,
  RefreshCw,
  ScanSearch,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { useOnline } from "@/hooks/use-online";
import { analyzeAssessment } from "@/lib/assessment.functions";
import { clearDraft, loadDraft, type AssessmentDraft } from "@/lib/draft-store";
import { addHistory } from "@/lib/history";
import { useLang } from "@/lib/i18n";

export const Route = createFileRoute("/assess/analyze")({
  component: AnalyzeStep,
});

type Phase = "loading" | "waiting" | "uploading" | "thinking" | "error";

function AnalyzeStep() {
  const { t, lang } = useLang();
  const navigate = useNavigate();
  const online = useOnline();

  const [phase, setPhase] = useState<Phase>("loading");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const draftRef = useRef<AssessmentDraft | null>(null);
  const runningRef = useRef(false);

  const run = useCallback(async () => {
    if (runningRef.current) return;
    const draft = draftRef.current;
    if (!draft || !draft.property.buildingType || !draft.property.age) {
      navigate({ to: "/assess/property" });
      return;
    }
    if (!navigator.onLine) {
      setPhase("waiting");
      return;
    }

    runningRef.current = true;
    setPhase("uploading");
    const thinkingTimer = setTimeout(() => setPhase("thinking"), 1200);

    try {
      const result = await analyzeAssessment({
        data: {
          language: draft.language,
          property: {
            address: draft.property.address ?? "",
            buildingType: draft.property.buildingType,
            floors: draft.property.floors ?? 1,
            age: draft.property.age,
          },
          answers: draft.answers.map((a) => ({
            id: a.id,
            value: a.value,
            photoDataUrl: a.photoDataUrl ?? null,
          })),
        },
      });

      clearTimeout(thinkingTimer);

      if (!result.ok) {
        runningRef.current = false;
        setErrorMsg(
          result.errorCode === "rate_limited"
            ? t("analyze.rateLimited")
            : result.errorCode === "credits"
              ? t("analyze.creditsError")
              : t("analyze.genericError"),
        );
        setPhase("error");
        return;
      }

      addHistory({
        publicId: result.publicId,
        riskLevel: result.riskLevel,
        address: draft.property.address ?? "",
        language: draft.language,
        createdAt: new Date().toISOString(),
      });
      await clearDraft();
      navigate({ to: "/a/$publicId", params: { publicId: result.publicId } });
    } catch {
      clearTimeout(thinkingTimer);
      runningRef.current = false;
      setErrorMsg(t("analyze.genericError"));
      setPhase("error");
    }
  }, [navigate, t]);

  // Load draft once.
  useEffect(() => {
    let active = true;
    loadDraft().then((d) => {
      if (!active) return;
      if (!d || !d.property.buildingType) {
        navigate({ to: "/assess/property" });
        return;
      }
      draftRef.current = d;
      run();
    });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-retry when connection returns while waiting.
  useEffect(() => {
    if (online && phase === "waiting") run();
  }, [online, phase, run]);

  function retry() {
    runningRef.current = false;
    setPhase("loading");
    run();
  }

  return (
    <AppShell>
      <div className="flex min-h-[70vh] flex-col items-center justify-center text-center">
        {phase === "waiting" ? (
          <WaitingState />
        ) : phase === "error" ? (
          <ErrorState message={errorMsg} onRetry={retry} onBack={() => navigate({ to: "/assess/checklist" })} />
        ) : (
          <WorkingState phase={phase} />
        )}
      </div>
    </AppShell>
  );

  function WorkingState({ phase }: { phase: Phase }) {
    const label =
      phase === "thinking" ? t("analyze.thinking") : t("analyze.uploading");
    return (
      <>
        <div className="relative flex size-24 items-center justify-center">
          <span className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
          <span className="flex size-24 items-center justify-center rounded-full bg-primary/10">
            <ScanSearch className="size-10 text-primary" aria-hidden />
          </span>
        </div>
        <h1 className="mt-8 font-display text-2xl font-extrabold tracking-tight">
          {t("analyze.title")}
        </h1>
        <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          {label}
        </p>
      </>
    );
  }

  function WaitingState() {
    return (
      <>
        <span className="flex size-20 items-center justify-center rounded-full bg-muted">
          <WifiOff className="size-9 text-muted-foreground" aria-hidden />
        </span>
        <h1 className="mt-6 font-display text-2xl font-extrabold tracking-tight">
          {t("analyze.waitingTitle")}
        </h1>
        <p className="mt-2 max-w-xs text-sm text-muted-foreground">
          {t("analyze.waitingBody")}
        </p>
        <Loader2 className="mt-6 size-5 animate-spin text-muted-foreground" />
      </>
    );
  }
}

function ErrorState({
  message,
  onRetry,
  onBack,
}: {
  message: string;
  onRetry: () => void;
  onBack: () => void;
}) {
  const { t } = useLang();
  return (
    <>
      <span className="flex size-20 items-center justify-center rounded-full bg-risk-red-soft">
        <ShieldAlert className="size-9 text-risk-red" aria-hidden />
      </span>
      <h1 className="mt-6 font-display text-2xl font-extrabold tracking-tight">
        {t("analyze.errorTitle")}
      </h1>
      <p className="mt-2 max-w-xs text-sm text-muted-foreground">{message}</p>
      <div className="mt-7 flex w-full max-w-xs flex-col gap-2">
        <Button size="lg" onClick={onRetry}>
          <RefreshCw className="size-4" />
          {t("common.retry")}
        </Button>
        <Button size="lg" variant="outline" onClick={onBack}>
          {t("common.back")}
        </Button>
      </div>
    </>
  );
}
