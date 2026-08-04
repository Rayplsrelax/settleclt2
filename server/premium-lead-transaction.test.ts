import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const dbSource = readFileSync(new URL("./db.ts", import.meta.url), "utf8");

function functionBody(source: string, functionName: string): string {
  const start = source.indexOf(`export async function ${functionName}`);
  const next = source.indexOf("\nexport async function ", start + 1);
  return source.slice(start, next === -1 ? source.length : next);
}

describe("Premium lead persistence transaction", () => {
  it("inserts the lead and increments its counter in one transaction", () => {
    const body = functionBody(dbSource, "createBusinessLead");
    expect(body).toContain("return db.transaction(async tx =>");
    expect(body).toContain("tx.insert(businessLeads)");
    expect(body).toContain("tx.update(premiumListings)");
    expect(body).not.toContain("await db.insert(businessLeads)");
    expect(body).not.toContain("await db.update(premiumListings)");
  });
});
