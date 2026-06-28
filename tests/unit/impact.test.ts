import { describe, expect, it } from "vitest";

import {
  rankMunicipios,
  rankStates,
  scoreArea,
  splitFeatured,
  type AreaRow,
} from "@/lib/impact";

const counts = (
  p: Partial<{
    green: number;
    yellow: number;
    orange: number;
    red: number;
    total: number;
  }>,
) => ({
  green: p.green ?? 0,
  yellow: p.yellow ?? 0,
  orange: p.orange ?? 0,
  red: p.red ?? 0,
  total: p.total ?? 0,
});

describe("scoreArea", () => {
  it("weights red and orange above yellow", () => {
    expect(scoreArea(counts({ red: 1, total: 1 }))).toBeGreaterThan(
      scoreArea(counts({ yellow: 1, total: 1 })),
    );
  });

  it("returns 0 for empty area", () => {
    expect(scoreArea(counts({}))).toBe(0);
  });
});

describe("rankStates", () => {
  const rows: AreaRow[] = [
    { state: "Miranda", ...counts({ red: 8, total: 35 }) },
    { state: "Distrito Capital", ...counts({ red: 14, total: 60 }) },
    { state: "La Guaira", ...counts({ red: 7, total: 8 }) },
    { state: "Zulia", ...counts({ green: 2, total: 2 }) },
    { state: "Desconocido", ...counts({ red: 99, total: 99 }) },
    { state: "NotAState", ...counts({ red: 5, total: 5 }) },
  ];
  const valid = [
    "Miranda",
    "Distrito Capital",
    "La Guaira",
    "Zulia",
    "Amazonas",
  ];

  it("orders by impact descending and drops invalid/unspecified", () => {
    const ranked = rankStates(rows, valid);
    expect(ranked[0]).toBe("Distrito Capital");
    expect(ranked).toContain("Miranda");
    expect(ranked).not.toContain("Desconocido");
    expect(ranked).not.toContain("NotAState");
    expect(ranked).not.toContain("Amazonas"); // no reports
  });

  it("respects cap", () => {
    expect(rankStates(rows, valid, 2)).toHaveLength(2);
  });
});

describe("rankMunicipios", () => {
  it("ranks per-state and filters to valid options", () => {
    const rows: AreaRow[] = [
      { state: "Miranda", municipality: "Chacao", ...counts({ red: 5, total: 6 }) },
      { state: "Miranda", municipality: "Baruta", ...counts({ red: 1, total: 2 }) },
      { state: "Miranda", municipality: "Ghost", ...counts({ red: 9, total: 9 }) },
    ];
    const out = rankMunicipios(rows, (s) =>
      s === "Miranda" ? ["Chacao", "Baruta", "Sucre"] : [],
    );
    expect(out["Miranda"][0]).toBe("Chacao");
    expect(out["Miranda"]).not.toContain("Ghost");
  });
});

describe("splitFeatured", () => {
  it("separates featured from alphabetical rest", () => {
    const all = ["Bravo", "Alpha", "Charlie"];
    const { featured, rest } = splitFeatured(all, ["Charlie", "Zeta"]);
    expect(featured).toEqual(["Charlie"]); // Zeta not a valid option
    expect(rest).toEqual(["Alpha", "Bravo"]);
  });

  it("keeps everything in rest when nothing featured", () => {
    const { featured, rest } = splitFeatured(["B", "A"], undefined);
    expect(featured).toEqual([]);
    expect(rest).toEqual(["A", "B"]);
  });
});
