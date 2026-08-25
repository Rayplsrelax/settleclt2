import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync("server/routers.ts", "utf8");
const claimsStart = source.indexOf("claims: router");
const statusStart = source.indexOf("updateStatus: adminProcedure", claimsStart);
const updateStatus = source.slice(
  statusStart,
  source.indexOf("stats: adminProcedure", statusStart)
);

describe("claim status concurrency side effects", () => {
  it("performs only the authoritative status mutation and emits no stale post-status notifications", () => {
    expect(updateStatus).toContain("approveBusinessClaimAndCreateOwnerMembership");
    expect(updateStatus).toContain("updateBusinessClaimStatus");
    expect(updateStatus).not.toContain("getBusinessClaims");
    expect(updateStatus).not.toContain("notifyOwner");
    expect(updateStatus).not.toContain("notifyClaimApproved");
    expect(updateStatus).not.toContain("notifyClaimRejected");
  });
});
