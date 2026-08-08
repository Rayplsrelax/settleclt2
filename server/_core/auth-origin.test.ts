import express from "express";
import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import { installAuthOriginGuard } from "./auth-origin";

describe("auth origin guard", () => {
  it("rejects cross-origin mutation requests", async () => {
    vi.stubEnv("PUBLIC_APP_ORIGIN", "https://settleclt.com");
    const app = express();
    installAuthOriginGuard(app);
    app.post("/api/auth/login", (_req, res) => res.json({ ok: true }));
    const response = await request(app)
      .post("/api/auth/login")
      .set("Origin", "https://evil.example")
      .send({});
    expect(response.status).toBe(403);
    vi.unstubAllEnvs();
  });

  it("allows same-origin mutation requests", async () => {
    vi.stubEnv("PUBLIC_APP_ORIGIN", "https://settleclt.com");
    const app = express();
    installAuthOriginGuard(app);
    app.post("/api/auth/login", (_req, res) => res.json({ ok: true }));
    const response = await request(app)
      .post("/api/auth/login")
      .set("Origin", "https://settleclt.com")
      .send({});
    expect(response.status).toBe(200);
    vi.unstubAllEnvs();
  });
});
