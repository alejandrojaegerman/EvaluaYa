import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  HardHat,
  ClipboardList,
  LinkIcon,
  MessageCircle,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  User2,
  Building2,
  ShieldCheck,
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
  getAllApprovedEngineers,
  submitEngineerSignup,
  type VerifiedEngineer,
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
  loader: async () => {
    const engineers = await getAllApprovedEngineers().catch(
      () => [] as VerifiedEngineer[],
    );
    return { engineers };
  },
  component: VolunteersPage,
});

function VolunteersPage() {
  const { t } = useLang();
  const { engineers } = Route.useLoaderData();
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

      {/* Verified engineers — social proof, names + org only, no contact */}
      <VerifiedEngineers engineers={engineers} />

      {/* Three pillars: recruit → validate → connect (the page that owns the story) */}

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {[
          { title: t("engineers.recruit"), desc: t("engineers.recruitDesc") },
          { title: t("engineers.validate"), desc: t("engineers.validateDesc") },
          { title: t("engineers.connect"), desc: t("engineers.connectDesc") },
        ].map((p, i) => (
          <div
            key={i}
            className="rounded-2xl border border-border bg-card p-4 shadow-sm"
          >
            <span className="flex size-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              {i + 1}
            </span>
            <p className="mt-2 font-semibold leading-tight">{p.title}</p>
            <p className="mt-0.5 text-sm text-muted-foreground">{p.desc}</p>
          </div>
        ))}
      </div>

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

      {/* Residents connect only after completing an evaluation */}
      <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-primary/20 bg-secondary/40 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <ClipboardList className="size-5" aria-hidden />
          </span>
          <div>
            <p className="font-semibold leading-tight">
              {t("vol.residentNoteTitle")}
            </p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {t("vol.residentNoteBody")}
            </p>
          </div>
        </div>
        <Button asChild variant="outline" className="shrink-0">
          <Link to="/assess/property">
            {t("vol.residentNoteCta")}
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </div>



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

/** Two-letter initials from a name or organization. */
function initials(label: string): string {
  const parts = label.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function VerifiedEngineers({
  engineers,
}: {
  engineers: VerifiedEngineer[];
}) {
  const { t } = useLang();
  const count = engineers.length;

  const heading =
    count === 1
      ? t("vol.verifiedCountOne").replace("{n}", String(count))
      : t("vol.verifiedCountMany").replace("{n}", String(count));

  return (
    <section className="mt-5 rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <ShieldCheck className="size-5 text-primary" aria-hidden />
        <h2 className="font-display text-base font-bold">
          {t("vol.verifiedTitle")}
        </h2>
      </div>

      {count === 0 ? (
        <div className="mt-3 rounded-xl border border-dashed border-border bg-background p-4 text-center">
          <p className="font-semibold">{t("vol.verifiedEmptyTitle")}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("vol.verifiedEmptyBody")}
          </p>
        </div>
      ) : (
        <>
          <p className="mt-1 text-sm font-semibold text-primary">{heading}</p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {t("vol.verifiedSubtitle")}
          </p>
          <ul className="mt-4 grid gap-2.5 sm:grid-cols-2">
            {engineers.map((e) => {
              const isOrg = e.volunteerType === "organization";
              const primary = isOrg && e.organization ? e.organization : e.name;
              const secondary =
                isOrg && e.organization
                  ? e.name
                  : e.organization || null;
              const TypeIcon = isOrg ? Building2 : User2;
              return (
                <li
                  key={e.id}
                  className="flex items-start gap-3 rounded-xl border border-border bg-background p-3"
                >
                  <span
                    className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary"
                    aria-hidden
                  >
                    {initials(primary)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold leading-tight">
                      {primary}
                    </p>
                    {secondary && (
                      <p className="truncate text-xs text-muted-foreground">
                        {secondary}
                      </p>
                    )}
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium text-foreground/70">
                        <TypeIcon className="size-3" aria-hidden />
                        {isOrg
                          ? t("vol.organizationLabel")
                          : t("vol.individualLabel")}
                      </span>
                      {e.states.slice(0, 3).map((s) => (
                        <span
                          key={s}
                          className="rounded-full border border-border px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
                        >
                          {s}
                        </span>
                      ))}
                      {e.states.length > 3 && (
                        <span className="text-[11px] font-medium text-muted-foreground">
                          +{e.states.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </section>
  );
}

