import { describe, it, expect } from "vitest";

import { absoluteUrl, withUtm } from "@/lib/site";

describe("withUtm", () => {
  it("appends the three required UTM params", () => {
    const url = new URL(
      withUtm("/a/abc123", {
        source: "whatsapp",
        medium: "share",
        campaign: "result",
      }),
    );
    expect(url.pathname).toBe("/a/abc123");
    expect(url.searchParams.get("utm_source")).toBe("whatsapp");
    expect(url.searchParams.get("utm_medium")).toBe("share");
    expect(url.searchParams.get("utm_campaign")).toBe("result");
    expect(url.searchParams.get("utm_content")).toBeNull();
  });

  it("includes utm_content only when provided", () => {
    const url = new URL(
      withUtm("/mapa", {
        source: "image",
        medium: "share",
        campaign: "map",
        content: "stats_card",
      }),
    );
    expect(url.searchParams.get("utm_content")).toBe("stats_card");
  });

  it("produces an absolute URL on the canonical domain with no double '?'", () => {
    const result = withUtm("/datos", {
      source: "copy",
      medium: "share",
      campaign: "data",
    });
    expect(result.startsWith(absoluteUrl("/datos"))).toBe(true);
    expect(result.indexOf("?")).toBe(result.lastIndexOf("?"));
  });

  it("normalizes the root path", () => {
    const url = new URL(
      withUtm("/", { source: "native", medium: "share", campaign: "app_share" }),
    );
    expect(url.pathname).toBe("/");
    expect(url.searchParams.get("utm_campaign")).toBe("app_share");
  });
});
