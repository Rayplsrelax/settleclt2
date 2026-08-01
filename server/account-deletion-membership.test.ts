import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("./db.ts", import.meta.url), "utf8");
const deletionBody = source.slice(
  source.indexOf("export async function deleteUserAccount"),
  source.indexOf("// ─── Notification System Helpers"),
);

describe("account deletion business authority", () => {
  it("locks claims, anonymizes them, and revokes authority in one transaction", () => {
    expect(deletionBody).toContain("return db.transaction(async tx =>");
    expect(deletionBody).toContain("tx.select({ id: businessClaims.id })");
    expect(deletionBody).toContain('.for("update")');
    expect(deletionBody).toContain("tx.update(businessClaims)");
    expect(deletionBody).toContain("tx.update(businessMemberships)");
    expect(deletionBody).toContain('status: "revoked"');

    const lockClaims = deletionBody.indexOf("tx.select({ id: businessClaims.id })");
    const anonymizeClaims = deletionBody.indexOf("tx.update(businessClaims)");
    const revokeMemberships = deletionBody.indexOf("tx.update(businessMemberships)");
    const deleteUser = deletionBody.indexOf("tx.delete(users)");
    expect(lockClaims).toBeLessThan(anonymizeClaims);
    expect(anonymizeClaims).toBeLessThan(revokeMemberships);
    expect(revokeMemberships).toBeLessThan(deleteUser);
  });
});
