import { Megaphone, MessageCircle, Copy } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useLang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/**
 * Reusable promotion block. Encourages anyone — not just people who
 * finished an assessment — to share EvalúaYa with their network, with a
 * one-tap WhatsApp share plus native share / copy-link fallbacks.
 */
export function ShareApp({ className }: { className?: string }) {
  const { t } = useLang();

  function shareUrl() {
    // Always points to the public site (resolves to https://evaluaya.app
    // in production), never a draft/preview path.
    return typeof window !== "undefined" ? window.location.origin : "";
  }

  function shareText() {
    return `${t("share.message")} ${shareUrl()}`.trim();
  }

  function shareWhatsApp() {
    window.open(
      `https://wa.me/?text=${encodeURIComponent(shareText())}`,
      "_blank",
      "noopener,noreferrer",
    );
  }

  async function nativeOrCopy() {
    const url = shareUrl();
    if (navigator.share) {
      try {
        await navigator.share({
          title: "EvalúaYa",
          text: t("share.message"),
          url,
        });
        return;
      } catch {
        /* user cancelled — fall through to copy */
      }
    }
    try {
      await navigator.clipboard.writeText(url);
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
