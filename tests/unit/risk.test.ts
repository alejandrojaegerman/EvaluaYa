import { describe, it, expect } from "vitest";

import { isRiskLevel, RISK_THEME, RISK_HEX } from "@/lib/risk";
import {
  buildingPeriod,
  bandForPeriod,
  mmiToRoman,
  spectralDemand,
} from "@/lib/shakemap";

describe("isRiskLevel", () => {
  it("accepts the four valid levels", () => {
    for (const l of ["green", "yellow", "orange", "red"]) {
      expect(isRiskLevel(l)).toBe(true);
    }
  });
  it("rejects anything else", () => {
    expect(isRiskLevel("blue")).toBe(false);
    expect(isRiskLevel(null)).toBe(false);
    expect(isRiskLevel(undefined)).toBe(false);
  });
});

describe("risk theme/hex tables", () => {
  it("define every risk level", () => {
    for (const l of ["green", "yellow", "orange", "red"] as const) {
      expect(RISK_THEME[l]).toBeTruthy();
      expect(RISK_HEX[l]).toHaveLength(3);
    }
  });
});

describe("shakemap helpers", () => {
  it("buildingPeriod scales with floors and stays clamped", () => {
    expect(buildingPeriod(1)).toBeCloseTo(0.1, 5);
    expect(buildingPeriod(50)).toBe(4);
    expect(buildingPeriod(NaN)).toBe(0.1);
  });

  it("bandForPeriod picks the right band", () => {
    expect(bandForPeriod(0.1)).toBe("0.3");
    expect(bandForPeriod(0.6)).toBe("0.6");
    expect(bandForPeriod(1.5)).toBe("1.0");
    expect(bandForPeriod(3)).toBe("3.0");
  });

  it("mmiToRoman converts intensities", () => {
    expect(mmiToRoman(1)).toBe("I");
    expect(mmiToRoman(9)).toBe("IX");
  });

  it("spectralDemand reads the band value for the building period", () => {
    const res = spectralDemand(
      { sa: { "0.3": 0.42, "0.6": 0.3, "1.0": 0.2, "3.0": 0.05 } },
      2,
    );
    expect(res?.band).toBe("0.3");
    expect(res?.value).toBe(0.42);
  });

  it("spectralDemand returns null when the band value is missing", () => {
    const res = spectralDemand({ sa: {} }, 2);
    expect(res).toBeNull();
  });
});
