import { Lightbulb, ChevronDown } from "lucide-react";
import { useState } from "react";

import { useLang } from "@/lib/i18n";
import { PHOTO_GUIDE_EXAMPLES } from "@/lib/photo-guide-examples";
import { cn } from "@/lib/utils";

/**
 * Collapsible "which photos help the engineer" guidance. Shown on the report,
 * inside the block where the resident chooses to contact a volunteer engineer,
 * so the photo tips appear where they're actionable. Collapsed by default.
 */
export function UsefulPhotosTip() {
  const { t } = useLang();
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-4 rounded-2xl border border-primary/20 bg-primary/5 p-3">
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
