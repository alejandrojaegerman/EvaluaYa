import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Loader2,
  ShieldAlert,
  WifiOff,
  RefreshCw,
  ScanSearch,
  Home as HomeIcon,
  FileText,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { AppShell } from "@/components/AppShell";
import { RiskBadge } from "@/components/RiskBadge";
import { Button } from "@/components/ui/button";
import { useOnline } from "@/hooks/use-online";
import { analyzeAssessment } from "@/lib/assessment.functions";
import { getDeviceId } from "@/lib/device-id";
import { clearDraft, loadDraft, type AssessmentDraft } from "@/lib/draft-store";
import { addHistory } from "@/lib/history";
import { useLang } from "@/lib/i18n";
import { computeProvisional, type ProvisionalResult } from "@/lib/provisional";
import { enqueueOutbox } from "@/lib/outbox-store";
import { syncOutboxItem } from "@/lib/outbox-sync";

export const Route = createFileRoute("/assess/analyze")({
  component: AnalyzeStep,
});

type Phase =
  | "loading"
  | "waiting"
  | "uploading"
  | "thinking"
  | "error"
  | "provisional";

function AnalyzeStep() {
  const { t, lang } = useLang();
  const navigate = useNavigate();
  const online = useOnline();

  const [phase, setPhase] = useState<Phase>("loading");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [provisional, setProvisional] = useState<ProvisionalResult | null>(null);
  const draftRef = useRef<AssessmentDraft | null>(null);
  const outboxIdRef = useRef<string | null>(null);
  const runningRef = useRef(false);

  // Save the finished assessment to the offline outbox and show a provisional,
  // deterministic safety result so the resident is never left without guidance.
  const goProvisional = useCallback(async () => {
    const draft = draftRef.current;
    if (!draft) return;
    const result = computeProvisional(draft);
    setProvisional(result);
    if (!outboxIdRef.current) {
      const item = await enqueueOutbox(draft, result);
      outboxIdRef.current = item.id;
      await clearDraft();
    }
    setPhase("provisional");
  }, []);


  const run = useCallback(async () => {
    if (runningRef.current) return;
    const draft = draftRef.current;
    if (!draft || !draft.property.buildingType || !draft.property.age) {
      navigate({ to: "/assess/property" });
      return;
    }
    if (!navigator.onLine) {
      void goProvisional();
      return;
    }

    runningRef.current = true;
    setPhase("uploading");
    const thinkingTimer = setTimeout(() => setPhase("thinking"), 1200);

    // Submit with a few retries (exponential backoff) plus a hard timeout so a
    // flaky low-bandwidth connection doesn't leave the user stuck forever.
    const MAX_ATTEMPTS = 3;
    const OVERALL_TIMEOUT = 90_000;

    const submit = () =>
      analyzeAssessment({
        data: {
          language: draft.language,
          deviceId: getDeviceId(),
          property: {
            address: draft.property.address ?? "",
            state: draft.property.state ?? "",
            municipality: draft.property.municipality ?? "",
            buildingType: draft.property.buildingType,
            structuralType: draft.property.structuralType ?? "unknown",
            floors: draft.property.floors ?? 1,
            age: draft.property.age,
            ...(typeof draft.property.seismicIntensity === "number"
              ? {
                  seismicIntensity: draft.property.seismicIntensity,
                  seismicIntensityRoman: draft.property.seismicIntensityRoman,
                }
              : {}),
            ...(typeof draft.property.pga === "number"
              ? { pga: draft.property.pga }
              : {}),
            ...(typeof draft.property.pgv === "number"
              ? { pgv: draft.property.pgv }
              : {}),
            ...(typeof draft.property.vs30 === "number"
              ? { vs30: draft.property.vs30 }
              : {}),
            ...(draft.property.soilClass
              ? { soilClass: draft.property.soilClass }
              : {}),
            ...(typeof draft.property.buildingPeriod === "number"
              ? { buildingPeriod: draft.property.buildingPeriod }
              : {}),
            ...(typeof draft.property.spectralDemand === "number"
              ? { spectralDemand: draft.property.spectralDemand }
              : {}),
            ...(draft.property.spectralBand
              ? { spectralBand: draft.property.spectralBand }
              : {}),
          },
          answers: draft.answers.map((a) => ({
            id: a.id,
            value: a.value,
            photoDataUrls:
              a.photoDataUrls && a.photoDataUrls.length
                ? a.photoDataUrls
                : a.photoDataUrl
                  ? [a.photoDataUrl]
                  : [],
          })),
        },
      });

    const deadline = Date.now() + OVERALL_TIMEOUT;

    try {
      let result: Awaited<ReturnType<typeof submit>> | null = null;
      let lastError: unknown = null;

      for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
        if (!navigator.onLine) {
          clearTimeout(thinkingTimer);
          runningRef.current = false;
          void goProvisional();
          return;
        }
        try {
          result = await submit();
          // Don't retry definitive server-side rejections.
          if (result.ok || result.errorCode !== "generic") break;
          lastError = result;
        } catch (err) {
          lastError = err;
        }
        if (attempt < MAX_ATTEMPTS - 1 && Date.now() < deadline) {
          await new Promise((r) => setTimeout(r, 1000 * 2 ** attempt));
        }
      }

      clearTimeout(thinkingTimer);

      if (!result) {
        runningRef.current = false;
        setErrorMsg(t("analyze.genericError"));
        setPhase("error");
        void lastError;
        return;
      }

      if (!result.ok) {
        runningRef.current = false;
        setErrorMsg(
          result.errorCode === "rate_limited"
            ? t("analyze.rateLimited")
            : result.errorCode === "throttled"
              ? t("analyze.throttled")
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
  }, [navigate, t, goProvisional]);


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

  // Once a provisional result is queued, complete it as soon as we're online
  // and jump straight to the full result.
  useEffect(() => {
    if (!online || phase !== "provisional" || !outboxIdRef.current) return;
    let active = true;
    syncOutboxItem(outboxIdRef.current).then((publicId) => {
      if (active && publicId) {
        navigate({ to: "/a/$publicId", params: { publicId } });
      }
    });
    return () => {
      active = false;
    };
  }, [online, phase, navigate]);

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
        <p className="mt-4 max-w-xs text-xs leading-relaxed text-muted-foreground">
          {t("analyze.savedHint")}
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
