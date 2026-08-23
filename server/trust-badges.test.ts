import { describe, it, expect } from "vitest";
import {
  SERVICES,
  TRUST_TIERS,
  type Service,
  type TrustTier,
} from "../shared/services";

describe("Trust Tier Badge System", () => {
  describe("TrustTier type", () => {
    it("exports the TrustTier type with the expected values", () => {
      // The TrustTier union must include all six tiers.
      const expected: TrustTier[] = [
        "listed",
        "verified",
        "owner_claimed",
        "newcomer_friendly",
        "certified",
        "featured_partner",
      ];
      expect(TRUST_TIERS).toEqual(expected);
      expect(TRUST_TIERS).toHaveLength(6);
    });

    it("TrustTier values are valid strings", () => {
      for (const t of TRUST_TIERS) {
        expect(typeof t).toBe("string");
        expect(t.length).toBeGreaterThan(0);
      }
    });

    it("TRUST_TIERS entries are unique", () => {
      expect(new Set(TRUST_TIERS).size).toBe(TRUST_TIERS.length);
    });
  });

  describe("Service interface", () => {
    it("accepts an optional trustTier field", () => {
      // A Service with trustTier set should type-check and carry the value.
      const s: Service = {
        name: "Test Service",
        category: "test",
        description: "desc",
        area: "Uptown",
        phone: "555-0000",
        website: "https://example.com",
        trustTier: "verified",
      };
      expect(s.trustTier).toBe("verified");
    });

    it("allows services without trustTier (backward compatible)", () => {
      const s: Service = {
        name: "No Tier Service",
        category: "test",
        description: "desc",
        area: "Uptown",
        phone: "555-0000",
        website: "https://example.com",
      };
      expect(s.trustTier).toBeUndefined();
    });
  });

  describe("SERVICES array (no breakage)", () => {
    it("every existing entry still satisfies the Service interface", () => {
      expect(SERVICES.length).toBeGreaterThan(0);
      for (const s of SERVICES) {
        expect(typeof s.name).toBe("string");
        expect(typeof s.category).toBe("string");
        expect(typeof s.description).toBe("string");
        expect(typeof s.area).toBe("string");
        expect(typeof s.phone).toBe("string");
        expect(typeof s.website).toBe("string");
      }
    });

    it("does not require trustTier on existing entries", () => {
      // No existing entry should be forced to carry trustTier.
      const withoutTier = SERVICES.filter((s) => s.trustTier === undefined);
      expect(withoutTier.length).toBe(SERVICES.length);
    });
  });
});
