import { ShieldAlert, FileWarning, CloudLightning } from "lucide-react";

import { useLang } from "@/lib/i18n";

/**
 * Inline legal + data-consent block (Doc #1, lawyer requirement).
 *
 * Rendered at the END of the checklist step — the last thing the resident sees
 * before requesting the analysis — instead of a blocking gate at the start.
 * Placing consent as late as possible keeps the top of the funnel friction-free
 * and lifts completion, while still requiring an explicit, versioned acceptance
 * that is persisted per assessment (see legal-ack + assessment.functions).
 *
 * Presentational only: the parent owns the checkbox state so it can gate the
 * "analyze" button and stamp the consent record into the draft on continue.
 */
export function LegalConsentInline({
  acceptLegal,
  acceptData,
  onChangeLegal,
  onChangeData,
  showError,
}: {
  acceptLegal: boolean;
  acceptData: boolean;
  onChangeLegal: (v: boolean) => void;
  onChangeData: (v: boolean) => void;
  showError: boolean;
}) {
  const { t } = useLang();

  const clauses = [
    { icon: ShieldAlert, title: t("gate.c1.title"), body: t("gate.c1.body") },
    { icon: FileWarning, title: t("gate.c2.title"), body: t("gate.c2.body") },
    { icon: CloudLightning, title: t("gate.c3.title"), body: t("gate.c3.body") },
  ];

  return (
    <section className="mt-6 rounded-2xl border border-border bg-card p-4 shadow-sm">
      <h2 className="font-display text-sm font-bold">{t("gate.title")}</h2>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
        {t("gate.subtitle")}
      </p>

      <div className="mt-3 space-y-2">
        {clauses.map((c) => (
          <div key={c.title} className="flex items-start gap-2.5">
            <c.icon
              className="mt-0.5 size-4 shrink-0 text-muted-foreground"
              aria-hidden
            />
            <div>
              <p className="text-xs font-semibold">{c.title}</p>
              <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
                {c.body}
              </p>
            </div>
          </div>
        ))}
      </div>

      <a
        href="/legal"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 inline-block text-xs font-medium text-primary underline underline-offset-2"
      >
        {t("gate.readFull")}
      </a>

      <div className="mt-3 space-y-2.5">
        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border p-3 text-sm">
          <input
            type="checkbox"
            checked={acceptLegal}
            onChange={(e) => onChangeLegal(e.target.checked)}
            className="mt-0.5 size-4 shrink-0 accent-primary"
          />
          <span className="text-xs leading-relaxed">{t("gate.accept")}</span>
        </label>

        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border p-3 text-sm">
          <input
            type="checkbox"
            checked={acceptData}
            onChange={(e) => onChangeData(e.target.checked)}
            className="mt-0.5 size-4 shrink-0 accent-primary"
          />
          <span className="text-xs leading-relaxed">{t("gate.consent")}</span>
        </label>
      </div>

      {showError && (
        <p className="mt-2 text-xs font-medium text-destructive">
          {t("gate.mustAccept")}
        </p>
      )}
    </section>
  );
}
