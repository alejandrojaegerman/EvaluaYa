import { HelpCircle } from "lucide-react";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useLang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/**
 * Tap-to-define glossary chip. Shows a technical term as a small pill that, when
 * tapped, opens a popover with a plain-language definition. Definitions live in
 * i18n under `glossary.<term>.term` (label) and `glossary.<term>.def`.
 */
export function GlossaryTerm({
  term,
  label,
  className,
}: {
  term: string;
  /** Optional override for the visible label (defaults to the glossary label). */
  label?: string;
  className?: string;
}) {
  const { t } = useLang();
  const visible = label ?? t(`glossary.${term}.term`);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/5 px-2 py-0.5 text-xs font-medium text-primary transition-colors hover:bg-primary/10",
            className,
          )}
        >
          {visible}
          <HelpCircle className="size-3" aria-hidden />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64" align="start">
        <p className="text-sm font-semibold text-foreground">{visible}</p>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          {t(`glossary.${term}.def`)}
        </p>
      </PopoverContent>
    </Popover>
  );
}
