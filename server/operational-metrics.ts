import type { Express, NextFunction, Request, Response } from "express";
import { timingSafeEqual } from "node:crypto";

type MetricsState = {
  startedAt: number;
  requestCount: number;
  status4xx: number;
  status5xx: number;
  inFlight: number;
};

export type OperationalMetrics = {
  middleware: (req: Request, res: Response, next: NextFunction) => void;
  snapshot: () => {
    requestCount: number;
    status4xx: number;
    status5xx: number;
    serverErrorRate: number;
    inFlight: number;
    uptimeSeconds: number;
  };
};

export function createOperationalMetrics(): OperationalMetrics {
  const state: MetricsState = {
    startedAt: Date.now(),
    requestCount: 0,
    status4xx: 0,
    status5xx: 0,
    inFlight: 0,
  };

  return {
    middleware: (req, res, next) => {
      const excluded =
        req.path === "/" ||
        req.path === "/api/version" ||
        req.path === "/health/live" ||
        req.path === "/health/ready" ||
        req.path === "/health/summary";
      if (excluded) {
        next();
        return;
      }
      state.inFlight += 1;
      let recorded = false;
      const record = () => {
        if (recorded) return;
        recorded = true;
        state.inFlight -= 1;
        state.requestCount += 1;
        if (res.statusCode >= 500) state.status5xx += 1;
        else if (res.statusCode >= 400) state.status4xx += 1;
      };
      res.once("finish", record);
      res.once("close", record);
      next();
    },
    snapshot: () => ({
      requestCount: state.requestCount,
      status4xx: state.status4xx,
      status5xx: state.status5xx,
      serverErrorRate:
        state.requestCount === 0 ? 0 : state.status5xx / state.requestCount,
      inFlight: state.inFlight,
      uptimeSeconds: Math.floor((Date.now() - state.startedAt) / 1000),
    }),
  };
}

export function registerOperationalSummaryRoute(
  app: Express,
  metrics: OperationalMetrics,
  monitorToken = process.env.OPERATIONS_MONITOR_TOKEN
): void {
  app.get("/health/summary", (req, res) => {
    res.set("Cache-Control", "no-store");
    const authorization = req.get("authorization") ?? "";
    const expected = monitorToken ? `Bearer ${monitorToken}` : "";
    const authorized =
      expected.length > 0 &&
      authorization.length === expected.length &&
      timingSafeEqual(Buffer.from(authorization), Buffer.from(expected));
    if (!authorized) {
      res.sendStatus(404);
      return;
    }
    res.json(metrics.snapshot());
  });
}
