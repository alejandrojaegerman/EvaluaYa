import { describe, it, expect } from "vitest";

import { extractBuilding, buildingKey } from "@/lib/building";

describe("extractBuilding", () => {
  it("extracts an Edificio name", () => {
    const b = extractBuilding("Av. La Guairita, Santa Paula, Edificio Uracoa");
    expect(b?.key).toBe("uracoa");
    expect(b?.name.toLowerCase()).toContain("uracoa");
  });

  it("extracts Residencias even without a space after the period", () => {
    const b = extractBuilding("Esquina de Ferrenquín, Res.Doral Plaza");
    expect(b?.key).toContain("doral");
  });

  it("clusters abbreviations to the same key", () => {
    const a = extractBuilding("Calle 1, Edificio Uracoa");
    const b = extractBuilding("Otra calle, Ed. Uracoa");
    expect(a?.key).toBe(b?.key);
  });

  it("returns null for a plain neighborhood with no named structure", () => {
    expect(extractBuilding("Sector Las Mercedes, calle principal")).toBeNull();
  });

  it("returns null for empty / nullish input", () => {
    expect(extractBuilding("")).toBeNull();
    expect(extractBuilding(null)).toBeNull();
    expect(extractBuilding(undefined)).toBeNull();
  });
});

describe("buildingKey", () => {
  it("strips accents and marker words", () => {
    expect(buildingKey("Edificio Ávila")).toBe("avila");
    expect(buildingKey("Torre María")).toBe("maria");
  });
});
