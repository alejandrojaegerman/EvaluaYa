import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";

import {
  buildLiveSchemas,
  EN_PATH,
  ES_PATH,
  LIVE_META,
  LiveQuakesPage,
  quakeFeedQuery,
} from "@/components/LiveQuakesPage";
import { absoluteUrl } from "@/lib/site";

export const Route = createFileRoute("/temblo-en-venezuela-hoy")({
  loader: ({ context }) => context.queryClient.ensureQueryData(quakeFeedQuery),
  head: ({ loaderData }) => {
    const { title, description } = LIVE_META.es;
    const updatedAt = loaderData?.updatedAt ?? new Date().toISOString();
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { property: "og:url", content: absoluteUrl(ES_PATH) },
        { property: "og:locale", content: "es_VE" },
        { name: "twitter:card", content: "summary" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
      ],
      links: [
        { rel: "canonical", href: absoluteUrl(ES_PATH) },
        { rel: "alternate", hrefLang: "es", href: absoluteUrl(ES_PATH) },
        { rel: "alternate", hrefLang: "en", href: absoluteUrl(EN_PATH) },
        { rel: "alternate", hrefLang: "x-default", href: absoluteUrl(ES_PATH) },
      ],
      scripts: buildLiveSchemas("es", ES_PATH, updatedAt).map((schema) => ({
        type: "application/ld+json",
        children: JSON.stringify(schema),
      })),
    };
  },
  component: TembloHoyPage,
});

function TembloHoyPage() {
  const { data: feed } = useSuspenseQuery(quakeFeedQuery);
  return <LiveQuakesPage feed={feed} />;
}
