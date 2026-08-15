import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { registerHealthRoutes } from "./health-routes";

describe("release health routes", () => {
  it("reports process liveness without caching or infrastructure details", async () => {
    const app = express();
    registerHealthRoutes(app, async () => undefined);

    const response = await request(app).get("/health/live").expect(200);
    expect(response.headers["cache-control"]).toBe("no-store");
    expect(response.body).toEqual({ status: "ok" });
  });

  it("reports readiness only after the bounded dependency check succeeds", async () => {
    const app = express();
    registerHealthRoutes(app, async () => undefined, 50);

    const response = await request(app).get("/health/ready").expect(200);
    expect(response.body).toEqual({ status: "ready" });
  });

  it("fails readiness without leaking dependency errors", async () => {
    const app = express();
    registerHealthRoutes(
      app,
      async () => {
        throw new Error("mysql://secret-host/private");
      },
      50
    );

    const response = await request(app).get("/health/ready").expect(503);
    expect(response.body).toEqual({ status: "unavailable" });
    expect(response.text).not.toContain("secret-host");
  });

  it("times out a stalled readiness dependency", async () => {
    const app = express();
    let probes = 0;
    registerHealthRoutes(
      app,
      () => {
        probes += 1;
        return new Promise(() => undefined);
      },
      5
    );

    await Promise.all([
      request(app).get("/health/ready").expect(503),
      request(app).get("/health/ready").expect(503),
      request(app).get("/health/ready").expect(503),
    ]);
    expect(probes).toBe(1);

    const recovered = express();
    let recoveryProbes = 0;
    registerHealthRoutes(
      recovered,
      async () => {
        recoveryProbes += 1;
      },
      50
    );
    await request(recovered).get("/health/ready").expect(200);
    expect(recoveryProbes).toBe(1);
  });

  it("cancels timed-out checks and recovers in the same probe instance", async () => {
    const app = express();
    let probes = 0;
    let aborted = 0;
    registerHealthRoutes(
      app,
      signal => {
        probes += 1;
        if (probes === 3) return Promise.resolve();
        return new Promise((_, reject) => {
          signal.addEventListener(
            "abort",
            () => {
              aborted += 1;
              reject(new Error("aborted"));
            },
            { once: true }
          );
        });
      },
      2
    );

    await request(app).get("/health/ready").expect(503);
    await request(app).get("/health/ready").expect(503);
    await request(app).get("/health/ready").expect(200);
    expect(probes).toBe(3);
    expect(aborted).toBe(2);
  });
});
