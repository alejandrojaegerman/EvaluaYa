import { useLang } from "@/lib/i18n";

/**
 * Compact fine-print disclaimer shown at the END of the checklist step — the
 * last thing the resident sees before requesting the analysis.
 *
 * Standard disclaimer practice: a single line of fine print that summarizes the
 * legal notice and links to the full text, with consent *implied* by tapping
 * "Analyze". This keeps the footprint minimal and the primary action reachable.
 * The versioned consent record is still stamped per assessment on continue
 * (see checklist `persist` + legal-ack), preserving the legal audit trail.
 */
export function LegalConsentInline() {
  const { t } = useLang();

  return (
    <p className="mt-6 text-center text-[11px] leading-relaxed text-muted-foreground">
      {t("gate.finePrint")}{" "}
      <a
        href="/legal"
        target="_blank"
        rel="noopener noreferrer"
        className="font-medium text-primary underline underline-offset-2"
      >
        {t("gate.readFull")}
      </a>
    </p>
  );
}
