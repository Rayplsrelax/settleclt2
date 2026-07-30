import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { createSecurityMiddleware } from "./_core/security";

function createApp() {
  const app = express();
  app.set("trust proxy", 1);
  app.use(
    createSecurityMiddleware({
      analyticsEndpoint: "https://analytics.example.com/umami",
      forgeApiUrl: "https://forge.example.com/v1",
    })
  );
  app.get("/", (_req, res) => res.send("ok"));
  return app;
}

describe("production security headers", () => {
  it("enforces a restrictive CSP on the production host", async () => {
    const response = await request(createApp())
      .get("/")
      .set("Host", "settleclt.com");

    expect(response.status).toBe(200);
    const csp = response.headers["content-security-policy"];
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("script-src 'self' https://analytics.example.com");
    expect(csp).toContain(
      "connect-src 'self' https://analytics.example.com https://forge.example.com"
    );
    expect(csp).toContain(
      "script-src 'self' https://analytics.example.com https://forge.example.com https://maps.googleapis.com https://maps.gstatic.com"
    );
    expect(csp).toContain("frame-ancestors 'self'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("upgrade-insecure-requests");
    expect(csp).not.toContain("'unsafe-eval'");
  });

  it.each([
    "preview.manus.space",
    "preview.manus.computer",
    "preview.manus-asia.computer",
    "preview.manuscomputer.ai",
    "preview.manusvm.computer",
    "preview.manuspre.computer",
    "localhost",
    "127.0.0.1",
  ])("keeps CSP and frameguard disabled on preview host %s", async hostname => {
    const response = await request(createApp()).get("/").set("Host", hostname);

    expect(response.status).toBe(200);
    expect(response.headers["content-security-policy"]).toBeUndefined();
    expect(response.headers["x-frame-options"]).toBeUndefined();
    expect(response.headers["strict-transport-security"]).toBeUndefined();
  });

  it("does not grant preview exemptions to lookalike hostnames", async () => {
    const response = await request(createApp())
      .get("/")
      .set("Host", "manus.computer.attacker.example");

    expect(response.status).toBe(200);
    expect(response.headers["content-security-policy"]).toContain(
      "default-src 'self'"
    );
    expect(response.headers["x-frame-options"]).toBe("SAMEORIGIN");
  });

  it("does not grant preview exemptions from X-Forwarded-Host", async () => {
    const response = await request(createApp())
      .get("/")
      .set("Host", "settleclt.com")
      .set("X-Forwarded-Host", "preview.manus.computer");

    expect(response.status).toBe(200);
    expect(response.headers["content-security-policy"]).toContain(
      "default-src 'self'"
    );
    expect(response.headers["x-frame-options"]).toBe("SAMEORIGIN");
  });
});
