import { Fragment } from "react";
import { Link } from "@tanstack/react-router";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { absoluteUrl } from "@/lib/site";

export type Crumb = {
  label: string;
  /** If omitted (or when it's the last item), rendered as the active page. */
  to?: string;
};

/**
 * Build the standard Encyclopedia trail: `Inicio › Enciclopedia › <current>`.
 * Pass `current: undefined` for the hub itself (then Encyclopedia is active).
 */
export function encyclopediaCrumbs(
  lang: "es" | "en",
  current?: { label: string },
): Crumb[] {
  const home: Crumb = { label: lang === "es" ? "Inicio" : "Home", to: "/" };
  const hub: Crumb = {
    label: lang === "es" ? "Enciclopedia" : "Encyclopedia",
    to: "/guia",
  };
  return current ? [home, hub, { label: current.label }] : [home, hub];
}

/** BreadcrumbList JSON-LD for SEO. `to` values are resolved to absolute URLs. */
export function breadcrumbJsonLd(items: Crumb[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.label,
      ...(item.to ? { item: absoluteUrl(item.to) } : {}),
    })),
  };
}

/**
 * Breadcrumb navigation for the Encyclopedia (`/guia`) and its guides.
 * Renders `Inicio › Enciclopedia › <página actual>` so the user can jump
 * back to the hub or home from any guide with a single tap.
 */
export function EncyclopediaBreadcrumb({ items }: { items: Crumb[] }) {
  return (
    <Breadcrumb className="mb-4">
      <BreadcrumbList>
        {items.map((item, i) => {
          const isLast = i === items.length - 1;
          return (
            <Fragment key={`${item.label}-${i}`}>
              <BreadcrumbItem>
                {item.to && !isLast ? (
                  <BreadcrumbLink asChild>
                    <Link to={item.to}>{item.label}</Link>
                  </BreadcrumbLink>
                ) : (
                  <BreadcrumbPage>{item.label}</BreadcrumbPage>
                )}
              </BreadcrumbItem>
              {!isLast && <BreadcrumbSeparator />}
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
