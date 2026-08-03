import { describe, expect, it } from "vitest";
import { selectEffectiveClaimId } from "./business-memberships";

describe("selectEffectiveClaimId", () => {
  it("uses the canonical membership owner claim id", () => {
    expect(selectEffectiveClaimId(25, 99)).toBe(25);
  });

  it("rejects membership rows without an owner claim id", () => {
    expect(() => selectEffectiveClaimId(null, 99)).toThrow("Business membership is missing an owner claim");
  });
});
