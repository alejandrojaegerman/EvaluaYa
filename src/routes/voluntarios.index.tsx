import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  HardHat,
  ClipboardList,
  LinkIcon,
  MessageCircle,
  CheckCircle2,
  ArrowLeft,
  User2,
  Building2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useLang } from "@/lib/i18n";
import { absoluteUrl } from "@/lib/site";
import { cn } from "@/lib/utils";
import { ESTADO_NAMES } from "@/lib/venezuela";
import {
  submitEngineerSignup,
  type VolunteerType,
} from "@/lib/volunteers.functions";

export const Route = createFileRoute("/voluntarios/")({
  head: () => {
    const title = "Ingenieros voluntarios | EvalúaYa";
    const description =
      "Súmate como ingeniero voluntario u organización y ayuda a familias en Venezuela a entender el daño estructural de sus viviendas tras un sismo.";
    const image = absoluteUrl("/og-voluntarios.jpg");
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:url", content: absoluteUrl("/voluntarios") },
        { property: "og:image", content: image },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:image", content: image },
      ],
      links: [{ rel: "canonical", href: absoluteUrl("/voluntarios") }],
    };
  },
  component: VolunteersPage,
});

function VolunteersPage() {
  const { t } = useLang();
  const submit = useServerFn(submitEngineerSignup);

  const [volunteerType, setVolunteerType] =
    useState<VolunteerType>("individual");
  const [name, setName] = useState("");
  const [org, setOrg] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [states, setStates] = useState<string[]>([]);
  const [specialization, setSpecialization] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const isOrg = volunteerType === "organization";

  function toggleState(s: string) {
    setStates((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s],
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    if (states.length === 0) {
      toast.error(t("vol.selectStates"));
      return;
    }
    if (isOrg && org.trim().length < 2) {
      toast.error(t("vol.orgRequired"));
      return;
    }
    setBusy(true);
    try {
      const res = await submit({
        data: {
          volunteerType,
          name,
          organization: org,
          whatsapp,
          email,
          states,
          specialization,
          note,
        },
      });
      if (res.ok) {
        setDone(true);
      } else {
        toast.error(t("vol.error"));
      }
    } catch {
      toast.error(t("vol.error"));
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <AppShell>
        <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
          <CheckCircle2 className="size-14 text-risk-green" aria-hidden />
          <h1 className="mt-4 font-display text-2xl font-extrabold">
            {t("vol.successTitle")}
          </h1>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
            {t("vol.successBody")}
          </p>
          <Link to="/" className="mt-8">
            <Button variant="outline">
              <ArrowLeft className="size-4" />
              {t("result.goHome")}
            </Button>
          </Link>
        </div>
      </AppShell>
    );
  }

  const steps = [
    { icon: ClipboardList, text: t("vol.how1") },
    { icon: LinkIcon, text: t("vol.how2") },
    { icon: MessageCircle, text: t("vol.how3") },
  ];

  return (
    <AppShell>
      <section className="rounded-3xl bg-gradient-to-br from-primary to-primary/80 px-6 py-8 text-primary-foreground shadow-lg">
        <div className="flex items-center gap-2">
          <HardHat className="size-6" aria-hidden />
          <h1 className="font-display text-2xl font-extrabold leading-tight tracking-tight">
            {t("vol.title")}
          </h1>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-primary-foreground/85">
          {t("vol.subtitle")}
        </p>
      </section>

      <ol className="mt-5 space-y-3">
        {steps.map((s, i) => (
          <li
            key={i}
            className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm"
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
              <s.icon className="size-5" aria-hidden />
            </span>
            <p className="pt-1 text-sm leading-relaxed">{s.text}</p>
          </li>
        ))}
      </ol>

      <form
        onSubmit={onSubmit}
        className="mt-6 rounded-2xl border border-border bg-card p-4 shadow-sm"
      >
        <h2 className="font-display text-base font-bold">{t("vol.formTitle")}</h2>

        <div className="mt-4 space-y-4">
          <div>
            <Label>{t("vol.typeLabel")}</Label>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {(
                [
                  { value: "individual", icon: User2, label: t("vol.typeIndividual") },
                  { value: "organization", icon: Building2, label: t("vol.typeOrg") },
                ] as const
              ).map((opt) => {
                const active = volunteerType === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setVolunteerType(opt.value)}
                    aria-pressed={active}
                    className={cn(
                      "flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold transition-colors",
                      active
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background text-muted-foreground hover:border-primary/50",
                    )}
                  >
                    <opt.icon className="size-4" aria-hidden />
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {isOrg ? (
            <>
              <div>
                <Label htmlFor="vol-org">{t("vol.orgName")}</Label>
                <Input
                  id="vol-org"
                  value={org}
                  onChange={(e) => setOrg(e.target.value)}
                  placeholder={t("vol.orgNamePlaceholder")}
                  required
                  maxLength={160}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="vol-name">{t("vol.contactName")}</Label>
                <Input
                  id="vol-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t("vol.contactNamePlaceholder")}
                  required
                  maxLength={120}
                  className="mt-1.5"
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <Label htmlFor="vol-name">{t("vol.name")}</Label>
                <Input
                  id="vol-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t("vol.namePlaceholder")}
                  required
                  maxLength={120}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="vol-org">{t("vol.org")}</Label>
                <Input
                  id="vol-org"
                  value={org}
                  onChange={(e) => setOrg(e.target.value)}
                  placeholder={t("vol.orgPlaceholder")}
                  maxLength={160}
                  className="mt-1.5"
                />
              </div>
            </>
          )}

          <div>
            <Label htmlFor="vol-wa">{t("vol.whatsapp")}</Label>
            <Input
              id="vol-wa"
              type="tel"
              inputMode="tel"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder={t("connect.whatsappPlaceholder")}
              required
              maxLength={40}
              className="mt-1.5"
            />
          </div>

          <div>
            <Label htmlFor="vol-email">{t("vol.email")}</Label>
            <Input
              id="vol-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              maxLength={255}
              className="mt-1.5"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              {t("vol.emailHint")}
            </p>
          </div>

          <div>
            <Label>{t("vol.states")}</Label>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {t("vol.statesHint")}
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {ESTADO_NAMES.map((s) => {
                const active = states.includes(s);
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => toggleState(s)}
                    aria-pressed={active}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                      active
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background text-muted-foreground hover:border-primary/50",
                    )}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <Label htmlFor="vol-spec">
              {isOrg ? t("vol.orgSpecialization") : t("vol.specialization")}
            </Label>
            <Input
              id="vol-spec"
              value={specialization}
              onChange={(e) => setSpecialization(e.target.value)}
              placeholder={t("vol.specializationPlaceholder")}
              maxLength={160}
              className="mt-1.5"
            />
          </div>

          <div>
            <Label htmlFor="vol-note">{t("vol.note")}</Label>
            <Textarea
              id="vol-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={1000}
              rows={3}
              className="mt-1.5"
            />
          </div>
        </div>

        <Button type="submit" size="lg" disabled={busy} className="mt-5 w-full">
          {busy ? t("vol.sending") : t("vol.submit")}
        </Button>
      </form>
    </AppShell>
  );
}
