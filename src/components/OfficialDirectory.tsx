import { Phone, ShieldAlert, ExternalLink, Info, Siren } from "lucide-react";

import { useLang } from "@/lib/i18n";
import {
  CONTACT_GROUP_ORDER,
  CONTACT_GROUP_TITLE_KEY,
  OFFICIAL_CONTACTS,
  PCIVIL_FREE,
  VEN_911,
  type OfficialContact,
} from "@/lib/official-contacts";
import { cn } from "@/lib/utils";

/**
 * Red SOS block for imminent danger — one-tap dial to the national
 * life-safety lines. Rendered with priority on Red/Orange results.
 */
export function SosCard({ className }: { className?: string }) {
  const { t } = useLang();
  return (
    <section
      className={cn(
        "rounded-2xl border border-risk-red/40 bg-risk-red-soft/60 p-4",
        className,
      )}
    >
      <div className="flex items-center gap-2">
        <Siren className="size-5 text-risk-red" aria-hidden />
        <h2 className="font-display text-base font-bold text-risk-red">
          {t("sos.title")}
        </h2>
      </div>
      <p className="mt-1.5 text-sm leading-relaxed text-foreground/80">
        {t("sos.body")}
      </p>
      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
        <a
          href={`tel:${VEN_911.tel}`}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-risk-red px-4 py-3 text-sm font-bold text-risk-red-foreground shadow-sm transition-opacity hover:opacity-90"
        >
          <Phone className="size-4" aria-hidden />
          {t("sos.call911")}
        </a>
        <a
          href={`tel:${PCIVIL_FREE.tel}`}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-risk-red/40 bg-background px-4 py-3 text-sm font-bold text-risk-red transition-colors hover:bg-risk-red-soft"
        >
          <Phone className="size-4" aria-hidden />
          {t("sos.callPcivil")}
        </a>
      </div>
    </section>
  );
}

function ContactRow({ contact }: { contact: OfficialContact }) {
  const { t } = useLang();
  const name = t(contact.nameKey);
  const desc = t(contact.descKey);

  const inner = (
    <>
      <span
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-xl",
          contact.featured
            ? "bg-primary text-primary-foreground"
            : "bg-secondary text-secondary-foreground",
        )}
      >
        <Phone className="size-5" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-semibold leading-tight">{name}</span>
        {contact.display && (
          <span className="mt-0.5 block font-display text-base font-bold tabular-nums text-primary">
            {contact.display}
          </span>
        )}
        <span className="mt-0.5 block text-sm leading-relaxed text-muted-foreground">
          {desc}
        </span>
      </span>
    </>
  );

  if (contact.tel) {
    return (
      <a
        href={`tel:${contact.tel}`}
        className={cn(
          "flex items-start gap-3 rounded-2xl border p-4 shadow-sm transition-colors",
          contact.featured
            ? "border-primary/40 bg-primary/5 hover:bg-primary/10"
            : "border-border bg-card hover:bg-accent/40",
        )}
        aria-label={`${t("official.dir.call")} ${name} ${contact.display ?? ""}`}
      >
        {inner}
      </a>
    );
  }

  // No verified number (CIV) → link out to the official site instead.
  return (
    <a
      href={contact.href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm transition-colors hover:bg-accent/40"
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
        <ExternalLink className="size-5" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-semibold leading-tight">{name}</span>
        <span className="mt-0.5 block text-sm leading-relaxed text-muted-foreground">
          {desc}
        </span>
        <span className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-primary">
          {t("official.dir.open")}
          <ExternalLink className="size-3" aria-hidden />
        </span>
      </span>
    </a>
  );
}

/**
 * Verified official directory (tap-to-call). Reused on the result card, the
 * dedicated contacts route and the official-process encyclopedia page.
 */
export function OfficialDirectory({
  sos = false,
  showHeader = true,
  className,
}: {
  sos?: boolean;
  showHeader?: boolean;
  className?: string;
}) {
  const { t } = useLang();

  return (
    <div className={className}>
      {sos && <SosCard className="mb-4" />}

      {showHeader && (
        <div className="mb-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="size-5 text-primary" aria-hidden />
            <h2 className="font-display text-lg font-bold">
              {t("official.dir.title")}
            </h2>
          </div>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            {t("official.dir.subtitle")}
          </p>
        </div>
      )}

      <div className="space-y-5">
        {CONTACT_GROUP_ORDER.map((group) => {
          const items = OFFICIAL_CONTACTS.filter((c) => c.group === group);
          if (!items.length) return null;
          return (
            <section key={group}>
              <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                {t(CONTACT_GROUP_TITLE_KEY[group])}
              </h3>
              <ul className="space-y-2">
                {items.map((c) => (
                  <li key={c.id}>
                    <ContactRow contact={c} />
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>

      <p className="mt-4 flex items-start gap-1.5 text-xs leading-relaxed text-muted-foreground">
        <Info className="mt-0.5 size-3.5 shrink-0 text-primary" aria-hidden />
        <span>
          <span className="font-semibold text-foreground">
            {t("official.source")}
          </span>{" "}
          {t("official.dir.note")}
        </span>
      </p>
    </div>
  );
}
