import { readFileSync } from "node:fs";
import { getTableConfig } from "drizzle-orm/mysql-core";
import { describe, expect, it } from "vitest";
import { stripeCheckoutReconciliations } from "../drizzle/schema";

const dbSource = readFileSync(new URL("./db.ts", import.meta.url), "utf8");

describe("Stripe reconciliation persistence", () => {
  it("enforces unique Stripe event and Checkout session identifiers", () => {
    const config = getTableConfig(stripeCheckoutReconciliations);
    const uniqueNames = config.indexes.filter(index => index.config.unique).map(index => index.config.name);
    expect(uniqueNames).toContain("stripe_checkout_reconciliations_event_unique");
    expect(uniqueNames).toContain("stripe_checkout_reconciliations_session_unique");
  });

  it("reserves by both durable identifiers and rejects conflicting pairs", () => {
    const body = dbSource.slice(
      dbSource.indexOf("export async function reserveCheckoutReconciliation"),
      dbSource.indexOf("export async function markCheckoutReconciliationSucceeded"),
    );
    expect(body).toContain("stripeCheckoutReconciliations.stripeEventId");
    expect(body).toContain("stripeCheckoutReconciliations.checkoutSessionId");
    expect(body).toContain("Conflicting checkout reconciliation identifiers");
  });

  it("marks reconciliation outcomes by Stripe event ID", () => {
    const body = dbSource.slice(
      dbSource.indexOf("export async function markCheckoutReconciliationSucceeded"),
      dbSource.indexOf("export async function getPremiumListing"),
    );
    expect(body).toContain("stripeCheckoutReconciliations.stripeEventId");
  });
});