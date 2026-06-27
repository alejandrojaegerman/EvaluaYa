import { describe, it, expect } from "vitest";

import {
  ESTADO_NAMES,
  MUNICIPIOS_BY_STATE,
  municipiosFor,
  nearestMunicipio,
  nearestEstado,
  resolveMunicipio,
} from "@/lib/venezuela";

describe("municipio dataset integrity", () => {
  it("covers all 24 states", () => {
    expect(ESTADO_NAMES).toHaveLength(24);
    for (const name of ESTADO_NAMES) {
      expect(MUNICIPIOS_BY_STATE[name], `missing list for ${name}`).toBeTruthy();
      expect(MUNICIPIOS_BY_STATE[name].length).toBeGreaterThan(0);
    }
  });

  it("has no duplicate municipios within a state", () => {
    for (const [state, list] of Object.entries(MUNICIPIOS_BY_STATE)) {
      const unique = new Set(list);
      expect(unique.size, `duplicates in ${state}`).toBe(list.length);
    }
  });

  it("totals the expected number of municipios (335)", () => {
    const total = Object.values(MUNICIPIOS_BY_STATE).reduce(
      (sum, l) => sum + l.length,
      0,
    );
    expect(total).toBe(335);
  });
});

describe("municipiosFor", () => {
  it("returns the list for a valid state", () => {
    const m = municipiosFor("Miranda");
    expect(m).toContain("Baruta");
    expect(m).toContain("Chacao");
  });

  it("returns an empty array for unknown / empty state", () => {
    expect(municipiosFor("")).toEqual([]);
    expect(municipiosFor(null)).toEqual([]);
    expect(municipiosFor("Atlantis")).toEqual([]);
  });
});

describe("nearestMunicipio (geolocation autopopulate)", () => {
  it("snaps Baruta coordinates to 'Baruta'", () => {
    expect(nearestMunicipio(10.43, -66.87, "Miranda")).toBe("Baruta");
  });

  it("returns undefined far from any centroid", () => {
    expect(nearestMunicipio(0, 0, "Miranda")).toBeUndefined();
  });

  it("returns undefined without a state", () => {
    expect(nearestMunicipio(10.43, -66.87, null)).toBeUndefined();
  });

  it("only returns names that are official picker options", () => {
    const name = nearestMunicipio(10.43, -66.87, "Miranda");
    if (name) expect(municipiosFor("Miranda")).toContain(name);
  });
});

describe("nearestEstado", () => {
  it("maps Caracas coordinates to a real state", () => {
    const e = nearestEstado(10.5, -66.9);
    expect(e).toBeTruthy();
    expect(ESTADO_NAMES).toContain(e!.name);
  });
});
