import { describe, it, expect } from "vitest";

import {
  progressSchema,
  verdictSchema,
} from "@/lib/volunteers.functions";
import { engineerPanelUrl, APP_ROOT } from "@/lib/volunteer-links";

const UUID = "11111111-1111-4111-8111-111111111111";
const UUID2 = "22222222-2222-4222-8222-222222222222";

describe("progressSchema", () => {
  it("accepts a valid stage update", () => {
    const r = progressSchema.parse({
      token: UUID,
      requestId: UUID2,
      stage: "contacted",
      note: " on my way ",
    });
    expect(r.stage).toBe("contacted");
    // note is trimmed
    expect(r.note).toBe("on my way");
  });

  it("defaults note to empty string when omitted", () => {
    const r = progressSchema.parse({
      token: UUID,
      requestId: UUID2,
      stage: "visited",
    });
    expect(r.note).toBe("");
  });

  it("rejects an unknown stage", () => {
    expect(() =>
      progressSchema.parse({
        token: UUID,
        requestId: UUID2,
        stage: "teleported",
      }),
    ).toThrow();
  });

  it("rejects a non-uuid token", () => {
    expect(() =>
      progressSchema.parse({
        token: "not-a-uuid",
        requestId: UUID2,
        stage: "resolved",
      }),
    ).toThrow();
  });

  it("rejects a note longer than 600 chars", () => {
    expect(() =>
      progressSchema.parse({
        token: UUID,
        requestId: UUID2,
        stage: "resolved",
        note: "x".repeat(601),
      }),
    ).toThrow();
  });
});

describe("verdictSchema", () => {
  it("accepts an 'agree' verdict without a level", () => {
    const r = verdictSchema.parse({
      token: UUID,
      requestId: UUID2,
      verdict: "agree",
    });
    expect(r.verdict).toBe("agree");
    expect(r.notes).toBe("");
  });

  it("accepts an 'adjust' verdict with a level", () => {
    const r = verdictSchema.parse({
      token: UUID,
      requestId: UUID2,
      verdict: "adjust",
      level: "red",
      notes: "exposed rebar in main column",
    });
    expect(r.level).toBe("red");
  });

  it("requires a level when adjusting", () => {
    const res = verdictSchema.safeParse({
      token: UUID,
      requestId: UUID2,
      verdict: "adjust",
    });
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error.issues[0]?.message).toBe("level_required");
      expect(res.error.issues[0]?.path).toEqual(["level"]);
    }
  });

  it("rejects an invalid risk level", () => {
    expect(() =>
      verdictSchema.parse({
        token: UUID,
        requestId: UUID2,
        verdict: "adjust",
        level: "purple",
      }),
    ).toThrow();
  });
});

describe("engineerPanelUrl", () => {
  it("builds a volunteer_panel URL with email UTMs by default", () => {
    const url = new URL(engineerPanelUrl(UUID));
    expect(url.origin + url.pathname).toBe(
      `${APP_ROOT}/voluntarios/panel/${UUID}`,
    );
    expect(url.searchParams.get("utm_source")).toBe("email");
    expect(url.searchParams.get("utm_medium")).toBe("email");
    expect(url.searchParams.get("utm_campaign")).toBe("volunteer_panel");
  });

  it("tags the digest campaign when requested", () => {
    const url = new URL(engineerPanelUrl(UUID, "help_digest"));
    expect(url.searchParams.get("utm_campaign")).toBe("help_digest");
  });

  it("honors a custom root for local/preview environments", () => {
    const url = engineerPanelUrl(UUID, "volunteer_panel", "http://localhost:8080");
    expect(url.startsWith("http://localhost:8080/voluntarios/panel/")).toBe(
      true,
    );
  });
});
