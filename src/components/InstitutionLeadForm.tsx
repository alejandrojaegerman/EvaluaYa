import { Building2, CheckCircle2, Loader2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useLang } from "@/lib/i18n";
import { submitInstitutionLead } from "@/lib/stats.functions";

type Status = "idle" | "sending" | "done" | "error";

export function InstitutionLeadForm() {
  const { t } = useLang();
  const [organization, setOrganization] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const valid = organization.trim().length > 0 && emailOk;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid || status === "sending") return;
    setStatus("sending");
    try {
      const res = await submitInstitutionLead({
        data: {
          organization: organization.trim(),
          contactName: contactName.trim(),
          email: email.trim(),
          note: note.trim(),
        },
      });
      setStatus(res.ok ? "done" : "error");
    } catch {
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <div className="flex items-start gap-3 rounded-2xl border border-risk-green/30 bg-risk-green-soft/60 p-5">
        <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-risk-green" aria-hidden />
        <p className="text-sm font-medium text-foreground">{t("inst.success")}</p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-border bg-card p-5 shadow-sm"
    >
      <div className="flex items-center gap-2">
        <Building2 className="size-5 text-primary" aria-hidden />
        <h3 className="font-display text-base font-bold">{t("inst.title")}</h3>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{t("inst.body")}</p>

      <div className="mt-4 space-y-4">
        <div>
          <Label htmlFor="org" className="text-sm font-semibold">
            {t("inst.org")}
          </Label>
          <Input
            id="org"
            value={organization}
            onChange={(e) => setOrganization(e.target.value)}
            placeholder={t("inst.orgPlaceholder")}
            className="mt-2 h-11 rounded-xl"
            maxLength={200}
          />
        </div>
        <div>
          <Label htmlFor="contact" className="text-sm font-semibold">
            {t("inst.name")}
          </Label>
          <Input
            id="contact"
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
            placeholder={t("inst.namePlaceholder")}
            className="mt-2 h-11 rounded-xl"
            maxLength={200}
          />
        </div>
        <div>
          <Label htmlFor="email" className="text-sm font-semibold">
            {t("inst.email")}
          </Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("inst.emailPlaceholder")}
            className="mt-2 h-11 rounded-xl"
            maxLength={255}
          />
        </div>
        <div>
          <Label htmlFor="note" className="text-sm font-semibold">
            {t("inst.note")}
          </Label>
          <Textarea
            id="note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t("inst.notePlaceholder")}
            className="mt-2 min-h-20 rounded-xl"
            maxLength={1000}
          />
        </div>
      </div>

      {status === "error" && (
        <p className="mt-3 text-sm font-medium text-risk-red">{t("inst.error")}</p>
      )}

      <Button
        type="submit"
        disabled={!valid || status === "sending"}
        className="mt-4 w-full"
      >
        {status === "sending" && <Loader2 className="size-4 animate-spin" />}
        {t("inst.submit")}
      </Button>
    </form>
  );
}
