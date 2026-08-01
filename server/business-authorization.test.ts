import { describe, expect, it } from "vitest";
import { TRPCError } from "@trpc/server";
import { requireApprovedBusinessClaim } from "./business-authorization";

const claims = [
  { id: 11, serviceKey: "owner-business" },
  { id: 12, serviceKey: "second-business" },
];

describe("requireApprovedBusinessClaim", () => {
  it("returns the matching approved claim", () => {
    expect(requireApprovedBusinessClaim(claims, "owner-business", 11)).toEqual(
      claims[0]
    );
  });

  it("rejects access to a business the user does not own", () => {
    expect(() =>
      requireApprovedBusinessClaim(claims, "someone-elses-business")
    ).toThrowError(TRPCError);
  });

  it("rejects a claim id that does not match the business", () => {
    expect(() =>
      requireApprovedBusinessClaim(claims, "owner-business", 12)
    ).toThrowError("You do not have an approved claim for this business.");
  });
});
