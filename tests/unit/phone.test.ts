import { describe, it, expect } from "vitest";

import {
  toWhatsappNumber,
  isValidWhatsappNumber,
  digitsOnly,
} from "@/lib/phone";

describe("digitsOnly", () => {
  it("strips non-digit characters", () => {
    expect(digitsOnly("+58 (414) 123-4567")).toBe("584141234567");
    expect(digitsOnly("")).toBe("");
  });
});

describe("toWhatsappNumber", () => {
  it("converts a local trunk-0 number to +58 E.164 digits", () => {
    expect(toWhatsappNumber("0414 123 4567")).toBe("584141234567");
    expect(toWhatsappNumber("0212-555-1234")).toBe("582125551234");
  });

  it("keeps numbers already in Venezuelan international form", () => {
    expect(toWhatsappNumber("584141234567")).toBe("584141234567");
    expect(toWhatsappNumber("+58 414 123 4567")).toBe("584141234567");
  });

  it("adds +58 to a 10-digit local mobile without trunk 0", () => {
    expect(toWhatsappNumber("4141234567")).toBe("584141234567");
  });

  it("preserves foreign country codes", () => {
    expect(toWhatsappNumber("+1 305 555 0000")).toBe("13055550000");
  });

  it("returns empty string for empty input", () => {
    expect(toWhatsappNumber("")).toBe("");
    expect(toWhatsappNumber("abc")).toBe("");
  });
});

describe("isValidWhatsappNumber", () => {
  it("accepts plausible numbers", () => {
    expect(isValidWhatsappNumber("0414 123 4567")).toBe(true);
    expect(isValidWhatsappNumber("584141234567")).toBe(true);
  });

  it("rejects junk / too-short numbers", () => {
    expect(isValidWhatsappNumber("")).toBe(false);
    expect(isValidWhatsappNumber("123")).toBe(false);
  });
});
