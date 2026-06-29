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
  BadgeCheck,
  FileUp,
  Loader2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useLang } from "@/lib/i18n";
import { splitFeatured } from "@/lib/impact";
import { absoluteUrl } from "@/lib/site";
import {
  getImpactRanking,
  EMPTY_IMPACT_RANKING,
  type ImpactRanking,
} from "@/lib/stats.functions";
import { cn } from "@/lib/utils";
import { ESTADO_NAMES } from "@/lib/venezuela";
import {
  submitEngineerSignup,
  uploadEngineerCredential,
  type VolunteerType,
} from "@/lib/volunteers.functions";


export const Route = createFileRoute("/voluntarios/")({
  head: () => {
    const title = "Ingenieros voluntarios | EvalúaYa";
    const description =
      "Súmate como ingeniero voluntario u organización en Venezuela: cuando una familia lo solicita, la orientas por videollamada y, si hace falta, en persona.";
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
    const ranking = await getImpactRanking().catch(
      () => EMPTY_IMPACT_RANKING as ImpactRanking,
    );
    return { ranking };
  },
  component: VolunteersPage,
});

function VolunteersPage() {
  const { t } = useLang();
  const { engineers, ranking } = Route.useLoaderData();
  const submit = useServerFn(submitEngineerSignup);


  const [volunteerType, setVolunteerType] =
    useState<VolunteerType>("individual");
  const [name, setName] = useState("");
  const [org, setOrg] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [credentialPath, setCredentialPath] = useState("");
  const [credentialName, setCredentialName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [states, setStates] = useState<string[]>([]);
  const [specialization, setSpecialization] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const upload = useServerFn(uploadEngineerCredential);

  const isOrg = volunteerType === "organization";

  function toggleState(s: string) {
    setStates((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s],
    );
  }

  async function onCredentialChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > 6_000_000) {
      toast.error(t("vol.credentialTooLarge"));
      return;
    }
    setUploading(true);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
      });
      const res = await upload({ data: { dataUrl, filename: file.name } });
      if (res.ok && res.path) {
        setCredentialPath(res.path);
        setCredentialName(file.name);
        toast.success(t("vol.credentialUploaded"));
      } else {
        toast.error(t("vol.credentialError"));
      }
    } catch {
      toast.error(t("vol.credentialError"));
    } finally {
      setUploading(false);
    }
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
          licenseNumber,
          credentialPath,
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

      {/* Compact trust line — social proof without burying the call to action */}
      <VerifiedCount engineers={engineers} />

      {/* Sign-up form — lead with the call to action */}
      <form
        onSubmit={onSubmit}
        className="mt-5 rounded-2xl border border-border bg-card p-4 shadow-sm"
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

          {/* Validation: CIV/license + credential upload */}
          <div className="rounded-xl border border-primary/20 bg-secondary/30 p-3.5">
            <div className="flex items-center gap-2">
              <BadgeCheck className="size-4 text-primary" aria-hidden />
              <p className="text-sm font-semibold">{t("vol.verifyTitle")}</p>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {t("vol.verifyHint")}
            </p>

            <div className="mt-3">
              <Label htmlFor="vol-license">{t("vol.license")}</Label>
              <Input
                id="vol-license"
                value={licenseNumber}
                onChange={(e) => setLicenseNumber(e.target.value)}
                placeholder={t("vol.licensePlaceholder")}
                maxLength={40}
                className="mt-1.5"
              />
            </div>

            <div className="mt-3">
              <Label htmlFor="vol-credential">{t("vol.credential")}</Label>
              <div className="mt-1.5">
                <input
                  id="vol-credential"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/heic,application/pdf"
                  onChange={onCredentialChange}
                  className="sr-only"
                  disabled={uploading}
                />
                <Label
                  htmlFor="vol-credential"
                  className={cn(
                    "flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-background px-3 py-2.5 text-sm font-medium transition-colors hover:border-primary/50",
                    uploading && "pointer-events-none opacity-70",
                  )}
                >
                  {uploading ? (
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                  ) : credentialPath ? (
                    <CheckCircle2 className="size-4 text-risk-green" aria-hidden />
                  ) : (
                    <FileUp className="size-4" aria-hidden />
                  )}
                  {uploading
                    ? t("vol.credentialUploading")
                    : credentialPath
                      ? credentialName || t("vol.credentialUploaded")
                      : t("vol.credentialCta")}
                </Label>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {t("vol.credentialHint")}
              </p>
            </div>
          </div>

          <div>
            <Label>{t("vol.states")}</Label>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {t("vol.statesHint")}
            </p>
            {(() => {
              const groups = splitFeatured(
                ESTADO_NAMES,
                ranking.featuredStates,
              );
              const renderChip = (s: string, featured: boolean) => {
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
                        : featured
                          ? "border-orange-400/60 bg-orange-50 text-orange-700 hover:border-orange-500 dark:bg-orange-950/40 dark:text-orange-300"
                          : "border-border bg-background text-muted-foreground hover:border-primary/50",
                    )}
                  >
                    {featured && !active ? "🔴 " : ""}
                    {s}
                  </button>
                );
              };
              return (
                <>
                  {groups.featured.length > 0 && (
                    <div className="mt-2">
                      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-orange-600 dark:text-orange-400">
                        {t("picker.mostAffected")}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {groups.featured.map((s) => renderChip(s, true))}
                      </div>
                    </div>
                  )}
                  <div className="mt-3">
                    {groups.featured.length > 0 && (
                      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        {t("picker.allAreas")}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-1.5">
                      {groups.rest.map((s) => renderChip(s, false))}
                    </div>
                  </div>
                </>
              );
            })()}
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

      {/* Three pillars: recruit → validate → connect (the page that owns the story) */}

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
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


      {/* Verified engineers — social proof at the bottom, names + org only, no contact */}
      <VerifiedEngineers engineers={engineers} />

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

const TIER_STYLE: Record<
  Exclude<RecognitionTier, "none">,
  { label: string; className: string }
> = {
  gold: { label: "Oro", className: "bg-amber-100 text-amber-800" },
  silver: { label: "Plata", className: "bg-slate-200 text-slate-700" },
  bronze: { label: "Bronce", className: "bg-orange-100 text-orange-800" },
};

/** Recognition badge shown next to engineers who have resolved requests. */
function TierBadge({ tier }: { tier: RecognitionTier }) {
  if (tier === "none") return null;
  const s = TIER_STYLE[tier];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold",
        s.className,
      )}
    >
      <Award className="size-3" aria-hidden />
      {s.label}
    </span>
  );
}


/** Compact one-line social proof shown under the hero; hidden when empty. */
function VerifiedCount({ engineers }: { engineers: VerifiedEngineer[] }) {
  const { t } = useLang();
  const count = engineers.length;
  if (count === 0) return null;

  const label =
    count === 1
      ? t("vol.verifiedCountOne").replace("{n}", String(count))
      : t("vol.verifiedCountMany").replace("{n}", String(count));

  return (
    <div className="mt-4 flex items-center gap-2 rounded-full border border-primary/20 bg-secondary/40 px-4 py-2 text-sm font-semibold text-primary">
      <ShieldCheck className="size-4 shrink-0" aria-hidden />
      <span>{label}</span>
    </div>
  );
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
                      <TierBadge tier={e.tier} />

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

