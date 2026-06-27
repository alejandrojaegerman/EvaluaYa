import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/plus-jakarta-sans/600.css";
import "@fontsource/plus-jakarta-sans/700.css";
import "@fontsource/plus-jakarta-sans/800.css";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { LanguageProvider } from "../lib/i18n";
import { registerServiceWorker } from "../lib/pwa";
import { Toaster } from "../components/ui/sonner";
import { SITE_URL } from "../lib/site";
import { useClaimOnSignIn } from "../lib/use-claim-on-signin";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      {
        name: "viewport",
        content:
          "width=device-width, initial-scale=1, viewport-fit=cover, maximum-scale=1",
      },
      { title: "EvalúaYa — Evaluación estructural" },
      {
        name: "description",
        content:
          "Autoevaluación de daños estructurales tras un sismo. Sin registro, funciona con poca señal.",
      },
      { name: "author", content: "EvalúaYa" },
      { name: "theme-color", content: "#0f3443" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-title", content: "EvalúaYa" },
      {
        name: "apple-mobile-web-app-status-bar-style",
        content: "black-translucent",
      },
      { property: "og:title", content: "EvalúaYa — Evaluación estructural" },
      {
        property: "og:description",
        content:
          "Autoevaluación de daños estructurales tras un sismo. Gratis, sin registro y funciona con poca señal.",
      },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "EvalúaYa" },
      { property: "og:url", content: SITE_URL },
      { property: "og:locale", content: "es_VE" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "EvalúaYa — Evaluación estructural" },
      {
        name: "twitter:description",
        content:
          "Autoevaluación de daños estructurales tras un sismo. Gratis, sin registro y funciona con poca señal.",
      },
      { property: "og:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/cJy4f9Hr3ub8meqhg39MueCFNYX2/social-images/social-1782403490801-Screenshot_2026-06-25_at_12.04.39_PM.webp" },
      { name: "twitter:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/cJy4f9Hr3ub8meqhg39MueCFNYX2/social-images/social-1782403490801-Screenshot_2026-06-25_at_12.04.39_PM.webp" },
      { name: "description", content: "Una guía paso a paso para revisar daños estructurales después de un terremoto. Sin registro. Funciona con poca señal." },
      { property: "og:description", content: "Una guía paso a paso para revisar daños estructurales después de un terremoto. Sin registro. Funciona con poca señal." },
      { name: "twitter:description", content: "Una guía paso a paso para revisar daños estructurales después de un terremoto. Sin registro. Funciona con poca señal." },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
      { rel: "canonical", href: SITE_URL },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: "EvalúaYa",
          url: SITE_URL,
          applicationCategory: "UtilitiesApplication",
          operatingSystem: "Web",
          inLanguage: "es-VE",
          description:
            "Autoevaluación de daños estructurales tras un sismo. Gratis, sin registro y funciona con poca señal.",
          offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        }),
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  useEffect(() => {
    registerServiceWorker();
    void import("../lib/outbox-sync").then((m) => m.startOutboxAutoSync());
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <ClaimOnSignIn />
        {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
        <Outlet />
        <Toaster position="top-center" richColors closeButton />
      </LanguageProvider>
    </QueryClientProvider>
  );
}

/** Mounted inside LanguageProvider so the auto-claim toast can be localized. */
function ClaimOnSignIn() {
  useClaimOnSignIn();
  return null;
}
