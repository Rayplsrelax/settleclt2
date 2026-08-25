import express from "express";
import { createServer } from "node:http";
import { afterEach, describe, expect, it } from "vitest";
import {
  createStrictPublicFormLimiter,
  mountStrictPublicFormLimiter,
  STRICT_PUBLIC_FORM_PROCEDURES,
} from "./_core/public-form-rate-limit";

const servers: Array<ReturnType<typeof createServer>> = [];
afterEach(async () => {
  await Promise.all(
    servers.splice(0).map(
      server => new Promise<void>(resolve => server.close(() => resolve()))
    )
  );
});

async function startLimiterProbe() {
  const app = express();
  mountStrictPublicFormLimiter(app, createStrictPublicFormLimiter());
  let executed = 0;
  app.post("/api/trpc/*", (_req, res) => {
    executed += 1;
    res.json({ ok: true });
  });
  const server = createServer(app);
  servers.push(server);
  await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("missing address");
  return { base: `http://127.0.0.1:${address.port}`, executed: () => executed };
}

async function post(base: string, path: string) {
  return fetch(`${base}${path}`, { method: "POST" });
}

describe("strict public form rate limiting", () => {
  it("enumerates every PII-bearing form mutation by its real router path", () => {
    expect(STRICT_PUBLIC_FORM_PROCEDURES).toEqual([
      "events.submitEvent",
      "claims.submit",
      "newsletter.subscribe",
      "leads.submitBusiness",
      "referrals.submit",
      "premium.trackLead",
      "premium.submitBizReferral",
      "contact.submit",
    ]);
    expect(STRICT_PUBLIC_FORM_PROCEDURES).not.toContain("system.notifyOwner");
  });

  it.each([
    "/api/trpc/events.submitEvent",
    "/api/trpc/claims.submit",
    "/api/trpc/premium.trackLead",
    "/api/trpc/premium.submitBizReferral",
    "/api/trpc/newsletter.subscribe",
    "/api/trpc/leads.submitBusiness",
    "/api/trpc/referrals.submit",
    "/api/trpc/contact.submit",
  ])("returns 429 after ten submissions on %s", async path => {
    const { base } = await startLimiterProbe();
    for (let index = 0; index < 10; index += 1) {
      expect((await post(base, path)).status).toBe(200);
    }
    const blocked = await post(base, path);
    expect(blocked.status).toBe(429);
    await expect(blocked.json()).resolves.toEqual({
      error: "Too many submissions, please try again later.",
    });
  });

  it.each([
    "/api/trpc/unrelated.query,premium.trackLead",
    "/api/trpc/premium.trackLead,unrelated.query",
    "/api/trpc/unrelated.query%2Cpremium.trackLead",
  ])("rejects a mixed or URL-encoded tRPC batch containing a protected procedure: %s", async path => {
    const { base, executed } = await startLimiterProbe();
    expect((await post(base, path)).status).toBe(400);
    expect(executed()).toBe(0);
  });

  it("rejects duplicate protected procedures instead of treating the batch as one submission", async () => {
    const { base, executed } = await startLimiterProbe();
    const duplicateBatch = "/api/trpc/premium.trackLead,premium.trackLead";
    expect((await post(base, duplicateBatch)).status).toBe(400);
    expect(executed()).toBe(0);
  });

  it("blocks actual protected submission 11 regardless of a batching attempt", async () => {
    const { base, executed } = await startLimiterProbe();
    for (let index = 0; index < 10; index += 1) {
      expect((await post(base, "/api/trpc/premium.trackLead")).status).toBe(200);
    }
    expect(executed()).toBe(10);
    expect((await post(base, "/api/trpc/unrelated.query%2Cpremium.trackLead")).status).toBe(400);
    expect((await post(base, "/api/trpc/premium.trackLead")).status).toBe(429);
    expect(executed()).toBe(10);
  });

  it("does not apply the strict form bucket to unrelated tRPC paths", async () => {
    const { base } = await startLimiterProbe();
    for (let index = 0; index < 11; index += 1) {
      expect((await post(base, "/api/trpc/unrelated.submit")).status).toBe(200);
    }
  });
});
