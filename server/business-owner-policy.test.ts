import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("./db.ts", import.meta.url), "utf8");

describe("single-owner persistence policy", () => {
  it("claims the unique owner key during approval", () => {
    const approval = source.slice(
      source.indexOf("export async function approveBusinessClaimAndCreateOwnerMembership"),
      source.indexOf("export async function getBusinessMembershipsForUser"),
    );
    expect(approval).toContain("activeOwnerKey: claim.serviceKey");
    expect(approval).toContain('.for("update")');
  });

  it("releases the owner key whenever authority is revoked", () => {
    const revocation = source.slice(
      source.indexOf("export async function updateBusinessClaimStatus"),
      source.indexOf("export async function approveBusinessClaimAndCreateOwnerMembership"),
    );
    expect(revocation).toContain("activeOwnerKey: null");
  });
});
