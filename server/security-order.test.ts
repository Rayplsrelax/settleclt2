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
    const serverSource = source.slice(serverSetup);
    const stripeWebhook =
      serverSetup +
      serverSource.search(/app\.post\(\s*["']\/api\/stripe\/webhook["']/);
    const obsidianWebhook =
      serverSetup +
      serverSource.search(/app\.post\(\s*["']\/api\/obsidian\/publish["']/);

    expect(serverSetup).toBeGreaterThanOrEqual(0);
    expect(securityMount).toBeGreaterThan(serverSetup);
    expect(stripeWebhook).toBeGreaterThanOrEqual(serverSetup);
    expect(obsidianWebhook).toBeGreaterThanOrEqual(serverSetup);
    expect(securityMount).toBeLessThan(stripeWebhook);
    expect(securityMount).toBeLessThan(obsidianWebhook);
  });

  it("marks startup validation failures as unsuccessful process exits", () => {
    const source = readFileSync(
      new URL("./_core/index.ts", import.meta.url),
      "utf8"
    );
    const startupCatch = source.indexOf("startServer().catch(error => {");
    const failedExit = source.indexOf("process.exitCode = 1", startupCatch);

    expect(startupCatch).toBeGreaterThanOrEqual(0);
    expect(failedExit).toBeGreaterThan(startupCatch);
  });
});
