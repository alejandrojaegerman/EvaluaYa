import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, CheckCircle2, MessageSquareHeart, Send } from "lucide-react";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";

import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { submitFeedback } from "@/lib/feedback.functions";
import { useLang } from "@/lib/i18n";
import { absoluteUrl } from "@/lib/site";

export const Route = createFileRoute("/feedback")({
  head: () => {
    const title = "Enviar comentarios | EvalúaYa";
    const description =
      "¿Tienes una idea, una duda o encontraste un problema? Cuéntanos para mejorar EvalúaYa. Sin registro.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:url", content: absoluteUrl("/feedback") },
        { name: "twitter:card", content: "summary" },
      ],
      links: [{ rel: "canonical", href: absoluteUrl("/feedback") }],
    };
  },
  component: FeedbackPage,
});

function FeedbackPage() {
  const { t, lang } = useLang();
  const send = useServerFn(submitFeedback);

  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">(
    "idle",
  );

  const canSubmit = message.trim().length > 0 && status !== "sending";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setStatus("sending");
    try {
      const page =
        typeof window !== "undefined"
          ? document.referrer || window.location.pathname
          : "";
      const res = await send({
        data: {
          message: message.trim(),
          email: email.trim(),
          page,
          language: lang,
        },
      });
      setStatus(res?.ok ? "done" : "error");
    } catch {
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <AppShell>
        <section className="mt-10 flex flex-col items-center text-center">
          <span className="flex size-16 items-center justify-center rounded-full bg-risk-green-soft text-risk-green">
            <CheckCircle2 className="size-8" aria-hidden />
          </span>
          <h1 className="mt-4 font-display text-2xl font-extrabold">
            {t("feedback.thanksTitle")}
          </h1>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            {t("feedback.thanksBody")}
          </p>
          <Button asChild className="mt-6">
            <Link to="/">{t("feedback.backHome")}</Link>
          </Button>
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <Link
        to="/"
        className="inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden />
        {t("feedback.backHome")}
      </Link>

      <section className="mt-4">
        <div className="flex items-center gap-2">
          <span className="flex size-10 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
            <MessageSquareHeart className="size-5" aria-hidden />
          </span>
          <h1 className="font-display text-2xl font-extrabold tracking-tight">
            {t("feedback.title")}
          </h1>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {t("feedback.subtitle")}
        </p>
      </section>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="fb-message">{t("feedback.messageLabel")}</Label>
          <Textarea
            id="fb-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={t("feedback.messagePlaceholder")}
            maxLength={2000}
            rows={6}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="fb-email">
            {t("feedback.emailLabel")}{" "}
            <span className="font-normal text-muted-foreground">
              ({t("common.optional")})
            </span>
          </Label>
          <Input
            id="fb-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("feedback.emailPlaceholder")}
            maxLength={255}
          />
          <p className="text-xs text-muted-foreground">
            {t("feedback.emailHint")}
          </p>
        </div>

        {status === "error" && (
          <p className="text-sm font-medium text-destructive">
            {t("feedback.error")}
          </p>
        )}

        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={!canSubmit}
        >
          <Send className="size-4" />
          {status === "sending" ? t("feedback.sending") : t("feedback.submit")}
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          {t("feedback.privacy")}
        </p>
      </form>
    </AppShell>
  );
}
