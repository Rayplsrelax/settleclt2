import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("server security middleware ordering", () => {
  it("mounts security headers before every webhook route", () => {
    const source = readFileSync(
      new URL("./_core/index.ts", import.meta.url),
      "utf8"
    );
    const serverSetup = source.indexOf("async function startServer");
    const securityMount = source.indexOf(
      "createSecurityMiddleware({",
      serverSetup
    );
    const stripeWebhook = source.indexOf(
      'app.post("/api/stripe/webhook"',
      serverSetup
    );
    const obsidianWebhook = source.indexOf(
      'app.post("/api/obsidian/publish"',
      serverSetup
    );

    expect(securityMount).toBeGreaterThan(serverSetup);
    expect(securityMount).toBeLessThan(stripeWebhook);
    expect(securityMount).toBeLessThan(obsidianWebhook);
  });
});
