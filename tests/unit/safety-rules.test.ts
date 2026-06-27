import { describe, it, expect } from "vitest";

import { evaluateSafetyRules, maxRisk } from "@/lib/safety-rules";
import type { RiskLevel } from "@/lib/assessment-types";

// Minimal property/answer helpers for the deterministic safety rules.
const baseProperty = {
  structuralType: "unknown" as const,
  floors: 2,
};

function answer(id: string, value: "yes" | "no" | "unsure") {
  return { id, value } as { id: string; value: "yes" | "no" | "unsure" };
}

describe("maxRisk", () => {
  it("orders green < yellow < orange < red", () => {
    expect(maxRisk("green", "yellow")).toBe("yellow");
    expect(maxRisk("yellow", "orange")).toBe("orange");
    expect(maxRisk("orange", "red")).toBe("red");
    expect(maxRisk("red", "green")).toBe("red");
    expect(maxRisk("green", "green")).toBe("green");
  });
});

describe("evaluateSafetyRules — forced RED hazards", () => {
  const cases: Array<[string]> = [
    ["liquefaction"],
    ["pounding"],
    ["plumbing"],
  ];
  for (const [id] of cases) {
    it(`forces red when ${id} = yes`, () => {
      const res = evaluateSafetyRules("es", baseProperty, [answer(id, "yes")]);
      expect(res.level).toBe("red");
      expect(res.findings.length).toBeGreaterThan(0);
      expect(res.nextSteps.length).toBeGreaterThan(0);
    });
  }

  it("does NOT force red when those items are 'no'", () => {
    const res = evaluateSafetyRules("es", baseProperty, [
      answer("liquefaction", "no"),
      answer("pounding", "no"),
      answer("plumbing", "no"),
    ]);
    expect(res.level).toBe("green");
  });
});

describe("evaluateSafetyRules — URM (unreinforced masonry)", () => {
  it("URM with structural damage is red", () => {
    const res = evaluateSafetyRules(
      "es",
      { ...baseProperty, structuralType: "URM" },
      [answer("columns_beams", "yes")],
    );
    expect(res.level).toBe("red");
  });

  it("URM alone (no damage, no shaking) escalates to at least orange", () => {
    const res = evaluateSafetyRules(
      "es",
      { ...baseProperty, structuralType: "URM" },
      [answer("foundation", "no")],
    );
    expect(["orange", "red"]).toContain(res.level);
  });
});

describe("evaluateSafetyRules — shaking & site", () => {
  it("severe shaking (high PGA) escalates to at least orange", () => {
    const res = evaluateSafetyRules(
      "es",
      { ...baseProperty, pga: 0.6 },
      [answer("foundation", "no")],
    );
    expect(["orange", "red"]).toContain(res.level);
  });

  it("severe shaking + structural damage is red", () => {
    const res = evaluateSafetyRules(
      "es",
      { ...baseProperty, seismicIntensity: 9 },
      [answer("exterior_walls", "yes")],
    );
    expect(res.level).toBe("red");
  });

  it("tall building (>7 floors) is at least yellow", () => {
    const res = evaluateSafetyRules(
      "es",
      { ...baseProperty, floors: 12 },
      [answer("foundation", "no")],
    );
    expect(["yellow", "orange", "red"]).toContain(res.level);
  });
});

describe("evaluateSafetyRules — clean building stays green", () => {
  it("no damage, modern frame, low rise => green", () => {
    const res = evaluateSafetyRules(
      "es",
      { structuralType: "unknown", floors: 1 },
      [
        answer("foundation", "no"),
        answer("exterior_walls", "no"),
        answer("interior_walls", "no"),
      ],
    );
    expect(res.level).toBe<RiskLevel>("green");
    expect(res.findings).toHaveLength(0);
  });
});
