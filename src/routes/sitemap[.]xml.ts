import { createFileRoute } from "@tanstack/react-router";

import { absoluteUrl } from "@/lib/site";
import { ESTADOS, estadoSlug } from "@/lib/venezuela";

type Entry = {
  loc: string;
  changefreq: "daily" | "weekly" | "monthly" | "yearly";
  priority: string;
};

function buildSitemap(): string {
  const entries: Entry[] = [
    { loc: absoluteUrl("/"), changefreq: "daily", priority: "1.0" },
    {
      loc: absoluteUrl("/assess/property"),
      changefreq: "weekly",
      priority: "0.9",
    },
    { loc: absoluteUrl("/mapa"), changefreq: "daily", priority: "0.8" },
    { loc: absoluteUrl("/datos"), changefreq: "daily", priority: "0.8" },
    {
      loc: absoluteUrl("/voluntarios"),
      changefreq: "weekly",
      priority: "0.8",
    },
    {
      loc: absoluteUrl("/metodologia"),
      changefreq: "monthly",
      priority: "0.7",
    },
    { loc: absoluteUrl("/ayuda"), changefreq: "monthly", priority: "0.6" },
    {
      loc: absoluteUrl("/guia/que-hacer-despues-de-un-temblor"),
      changefreq: "weekly",
      priority: "0.8",
    },
    {
      loc: absoluteUrl("/guia/falla-de-bocono"),
      changefreq: "monthly",
      priority: "0.7",
    },
    { loc: absoluteUrl("/feedback"), changefreq: "monthly", priority: "0.5" },
    { loc: absoluteUrl("/privacidad"), changefreq: "yearly", priority: "0.3" },
    // Regional landing pages — one per estado.
    ...ESTADOS.map((e) => ({
      loc: absoluteUrl(`/zona/${estadoSlug(e.name)}`),
      changefreq: "daily" as const,
      priority: "0.7",
    })),
  ];

  const urls = entries
    .map(
      (e) =>
        `  <url>\n    <loc>${e.loc}</loc>\n    <changefreq>${e.changefreq}</changefreq>\n    <priority>${e.priority}</priority>\n  </url>`,
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: () =>
        new Response(buildSitemap(), {
          headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "public, max-age=3600",
          },
        }),
    },
  },
});
