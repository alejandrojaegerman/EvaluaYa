import { ShieldAlert, Lock, FileWarning, CloudLightning } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { useLang } from "@/lib/i18n";
import { setLegalConsent, type LegalConsent } from "@/lib/legal-ack";

/**
 * Blocking legal + data-consent gate (Doc #1, lawyer requirement).
 *
 * Renders a full-screen, non-dismissable overlay that prevents access to the
 * assessment flow until the user has (1) read and accepted the legal notice /
 * disclaimer and (2) consented to processing their personal data. Both are
 * required. On acceptance the versioned record is stored client-side and passed
 * back so the caller can persist it with the assessment.
 */
export function LegalConsentGate({
  onAccept,
}: {
  onAccept: (consent: LegalConsent) => void;
}) {
  const { t } = useLang();
  const [acceptLegal, setAcceptLegal] = useState(false);
  const [acceptData, setAcceptData] = useState(false);
  const [showError, setShowError] = useState(false);

  const ready = acceptLegal && acceptData;

  function handleAccept() {
    if (!ready) {
      setShowError(true);
      return;
    }
    const record = setLegalConsent();
    onAccept(record);
  }

  const clauses = [
    { icon: ShieldAlert, title: t("gate.c1.title"), body: t("gate.c1.body") },
    { icon: FileWarning, title: t("gate.c2.title"), body: t("gate.c2.body") },
    { icon: CloudLightning, title: t("gate.c3.title"), body: t("gate.c3.body") },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="gate-title"
      className="fixed inset-0 z-[100] flex items-end justify-center bg-background/80 backdrop-blur-sm sm:items-center"
    >
      <div className="flex max-h-[100dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-border bg-card shadow-xl sm:rounded-2xl">
        <div className="flex items-start gap-3 border-b border-border p-5">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Lock className="size-5" aria-hidden />
          </div>
          <div>
            <h2 id="gate-title" className="text-lg font-bold leading-tight">
              {t("gate.title")}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("gate.subtitle")}
            </p>
          </div>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto p-5">
          {clauses.map((c) => (
            <div
              key={c.title}
              className="flex items-start gap-3 rounded-xl border border-border bg-background p-3"
            >
              <c.icon
                className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                aria-hidden
              />
              <div>
                <p className="text-sm font-semibold">{c.title}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                  {c.body}
                </p>
              </div>
            </div>
          ))}

          <a
            href="/legal"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block text-xs font-medium text-primary underline underline-offset-2"
          >
            {t("gate.readFull")}
          </a>

          <div className="space-y-3 pt-1">
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border p-3 text-sm">
              <input
                type="checkbox"
                checked={acceptLegal}
                onChange={(e) => {
                  setAcceptLegal(e.target.checked);
                  setShowError(false);
                }}
                className="mt-0.5 size-4 shrink-0 accent-primary"
              />
              <span className="leading-relaxed">{t("gate.accept")}</span>
            </label>

            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border p-3 text-sm">
              <input
                type="checkbox"
                checked={acceptData}
                onChange={(e) => {
                  setAcceptData(e.target.checked);
                  setShowError(false);
                }}
                className="mt-0.5 size-4 shrink-0 accent-primary"
              />
              <span className="leading-relaxed">{t("gate.consent")}</span>
            </label>
          </div>

          {showError && (
            <p className="text-xs font-medium text-destructive">
              {t("gate.mustAccept")}
            </p>
          )}
        </div>

        <div className="border-t border-border p-4">
          <Button
            type="button"
            onClick={handleAccept}
            disabled={!ready}
            className="w-full"
            size="lg"
          >
            {t("gate.cta")}
          </Button>
        </div>
      </div>
    </div>
  );
}
