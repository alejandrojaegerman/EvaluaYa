import { Megaphone, MessageCircle, Copy } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useLang } from "@/lib/i18n";
import { withUtm } from "@/lib/site";
import { cn } from "@/lib/utils";

/**
 * Reusable promotion block. Encourages anyone — not just people who
 * finished an assessment — to share EvalúaYa with their network, with a
 * one-tap WhatsApp share plus native share / copy-link fallbacks.
 *
 * Every emitted link carries UTM params so analytics can attribute the
 * resulting visits to this share loop (`campaign`, defaulting to "app_share").
 */
export function ShareApp({
  className,
  campaign = "app_share",
}: {
  className?: string;
  /** UTM campaign tag — override when reusing on a specific surface. */
  campaign?: string;
}) {
  const { t } = useLang();

  function shareUrl(source: string) {
    // Always the canonical branded domain (never a preview/published host),
    // tagged with the channel so we can compare WhatsApp vs copy vs native.
    return withUtm("/", { source, medium: "share", campaign });
  }

  function shareWhatsApp() {
    const text = `${t("share.message")} ${shareUrl("whatsapp")}`.trim();
    window.open(
      `https://wa.me/?text=${encodeURIComponent(text)}`,
      "_blank",
      "noopener,noreferrer",
    );
  }

  async function nativeOrCopy() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "EvalúaYa",
          text: t("share.message"),
          url: shareUrl("native"),
        });
        return;
      } catch {
        /* user cancelled — fall through to copy */
      }
    }
    try {
      await navigator.clipboard.writeText(shareUrl("copy"));
      toast.success(t("share.copied"));
    } catch {
      /* clipboard unavailable — open WhatsApp as last resort */
      shareWhatsApp();
    }
  }

  return (
    <section
      className={cn(
        "rounded-2xl border border-primary/20 bg-secondary/40 p-5",
        className,
      )}
    >
      <div className="flex items-center gap-2">
        <Megaphone className="size-5 text-primary" aria-hidden />
        <h2 className="font-display text-base font-bold">{t("share.title")}</h2>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        {t("share.body")}
      </p>
      <div className="mt-4 grid gap-2">
        <Button
          onClick={shareWhatsApp}
          className="bg-[#25D366] text-white hover:bg-[#1ebe5a]"
        >
          <MessageCircle className="size-4" />
          {t("share.whatsapp")}
        </Button>
        <Button onClick={nativeOrCopy} variant="outline">
          <Copy className="size-4" />
          {t("share.copy")}
        </Button>
      </div>
    </section>
  );
}
