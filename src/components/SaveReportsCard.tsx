import { Link } from "@tanstack/react-router";
import { BookmarkCheck, FolderOpen, Mail, Send } from "lucide-react";
import { useEffect, useState } from "react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { getDeviceId } from "@/lib/device-id";
import { useLang } from "@/lib/i18n";

const emailSchema = z.string().email();

type State = "loading" | "signed_in" | "form" | "sent";

export function SaveReportsCard() {
  const { t } = useLang();
  const [state, setState] = useState<State>("loading");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setState(data.session ? "signed_in" : "form");
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!active) return;
      setState(session ? "signed_in" : "form");
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  async function sendLink() {
    setError(null);
    const parsed = emailSchema.safeParse(email.trim());
    if (!parsed.success) {
      setError(t("account.invalidEmail"));
      return;
    }
    setBusy(true);
    try {
      const deviceId = getDeviceId();
      const redirect = `${window.location.origin}/mis-reportes${
        deviceId ? `?d=${encodeURIComponent(deviceId)}` : ""
      }`;
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: parsed.data,
        options: { emailRedirectTo: redirect },
      });
      if (otpError) {
        setError(t("account.sendError"));
      } else {
        setState("sent");
      }
    } catch {
      setError(t("account.sendError"));
    } finally {
      setBusy(false);
    }
  }

  if (state === "loading") return null;

  if (state === "signed_in") {
    return (
      <section className="mt-5 rounded-2xl border border-primary/20 bg-secondary/40 p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <BookmarkCheck className="size-5 text-primary" aria-hidden />
          <h2 className="font-display text-base font-bold">
            {t("account.savedTitle")}
          </h2>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("account.savedBody")}
        </p>
        <Button asChild variant="outline" className="mt-3 w-full">
          <Link to="/mis-reportes">
            <FolderOpen className="size-4" />
            {t("account.viewMyReports")}
          </Link>
        </Button>
      </section>
    );
  }

  if (state === "sent") {
    return (
      <section className="mt-5 rounded-2xl border border-primary/20 bg-secondary/40 p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <Mail className="size-5 text-primary" aria-hidden />
          <h2 className="font-display text-base font-bold">
            {t("account.checkEmailTitle")}
          </h2>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("account.checkEmailBody")}
        </p>
      </section>
    );
  }

  return (
    <section className="mt-5 rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <BookmarkCheck className="size-5 text-primary" aria-hidden />
        <h2 className="font-display text-base font-bold">
          {t("account.saveTitle")}
        </h2>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{t("account.saveBody")}</p>
      <div className="mt-3 space-y-2">
        <Input
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder={t("account.emailPlaceholder")}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") sendLink();
          }}
          aria-label={t("account.emailLabel")}
        />
        {error && <p className="text-xs font-medium text-destructive">{error}</p>}
        <Button onClick={sendLink} disabled={busy} className="w-full">
          <Send className="size-4" />
          {busy ? t("account.sending") : t("account.sendLink")}
        </Button>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">{t("account.saveHint")}</p>
    </section>
  );
}
