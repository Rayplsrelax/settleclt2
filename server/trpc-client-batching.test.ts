import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("../client/src/main.tsx", import.meta.url), "utf8");

describe("PII mutation client transport", () => {
  it("routes every quota-protected mutation through a non-batching tRPC link", () => {
    for (const procedure of [
      "events.submitEvent",
      "claims.submit",
      "newsletter.subscribe",
      "leads.submitBusiness",
      "referrals.submit",
      "premium.trackLead",
      "premium.submitBizReferral",
      "contact.submit",
    ]) {
      expect(source).toContain(`\"${procedure}\"`);
    }
    expect(source).toContain("splitLink");
    expect(source).toContain("httpLink");
    expect(source).toContain("NON_BATCHED_PII_PROCEDURES.has(op.path)");
  });
});