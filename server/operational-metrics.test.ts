import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import {
  createOperationalMetrics,
  registerOperationalSummaryRoute,
} from "./operational-metrics";

describe("low-cardinality release metrics", () => {
  it("counts status classes without exposing request URLs", async () => {
    const app = express();
    const metrics = createOperationalMetrics();
    registerOperationalSummaryRoute(app, metrics, "operator-secret");
    app.use(metrics.middleware);
    app.get("/ok", (_req, res) => res.sendStatus(200));
    app.get("/bad", (_req, res) => res.sendStatus(500));

    await request(app).get("/ok?token=secret").expect(200);
    await request(app).get("/bad?email=private@example.com").expect(500);
    await request(app).get("/health/summary").expect(404);
    const response = await request(app)
      .get("/health/summary")
      .set("Authorization", "Bearer operator-secret")
      .expect(200);

    expect(response.headers["cache-control"]).toBe("no-store");
    expect(response.body).toMatchObject({
      requestCount: 2,
      status4xx: 0,
      status5xx: 1,
      serverErrorRate: 0.5,
      inFlight: 0,
    });
    expect(response.text).not.toContain("secret");
    expect(response.text).not.toContain("private@example.com");
    expect(response.text).not.toContain("/bad");
  });

  it("excludes release-monitor probes from application traffic counters", async () => {
    const app = express();
    const metrics = createOperationalMetrics();
    app.use(metrics.middleware);
    app.get("/", (_req, res) => res.sendStatus(200));
    app.get("/api/version", (_req, res) => res.sendStatus(200));
    app.get("/health/live", (_req, res) => res.sendStatus(200));
    app.get("/health/ready", (_req, res) => res.sendStatus(200));
    app.get("/health/summary", (_req, res) => res.json(metrics.snapshot()));
    app.get("/application", (_req, res) => res.sendStatus(500));

    await request(app).get("/");
    await request(app).get("/api/version");
    await request(app).get("/health/live");
    await request(app).get("/health/ready");
    await request(app).get("/health/summary");
    await request(app).get("/application");

    expect(metrics.snapshot()).toMatchObject({ requestCount: 1, status5xx: 1 });
  });
});
