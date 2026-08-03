import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("./db.ts", import.meta.url), "utf8");
const body = source.slice(
  source.indexOf("export async function updateBusinessClaimStatus"),
  source.indexOf("export async function approveBusinessClaimAndCreateOwnerMembership"),
);

describe("claim invalidation revokes authority", () => {
  it("updates claim status and revokes every membership derived from it atomically", () => {
    expect(body).toContain("return db.transaction(async tx =>");
    expect(body).toContain("eq(businessMemberships.ownerClaimId, id)");
    expect(body).toContain('status: "revoked"');
    expect(body).not.toContain('eq(businessMemberships.role, "owner")');
  });
});
