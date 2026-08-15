import type { Express } from "express";
import {
  createConnection,
  type Connection,
  type ConnectionOptions,
} from "mysql2";

type ReadinessCheck = (signal: AbortSignal) => Promise<void>;
type MysqlConnectionFactory = (
  options: ConnectionOptions & { uri: string }
) => Connection;

const defaultConnectionFactory: MysqlConnectionFactory = options =>
  createConnection(options);

export function createDatabaseReadinessCheck(
  databaseUrl: string | undefined,
  operationTimeoutMs: number,
  connect: MysqlConnectionFactory = defaultConnectionFactory
): ReadinessCheck {
  return signal => {
    if (!databaseUrl) return Promise.reject(new Error("database unavailable"));
    if (signal.aborted)
      return Promise.reject(new Error("readiness check aborted"));

    return new Promise<void>((resolve, reject) => {
      const connection = connect({
        uri: databaseUrl,
        connectTimeout: operationTimeoutMs,
      });
      let settled = false;
      const finish = (error?: Error | null) => {
        if (settled) return;
        settled = true;
        signal.removeEventListener("abort", onAbort);
        connection.removeListener("error", onConnectionError);
        connection.destroy();
        if (error) reject(error);
        else resolve();
      };
      const onAbort = () => finish(new Error("readiness check aborted"));
      const onConnectionError = (error: Error) => finish(error);
      signal.addEventListener("abort", onAbort, { once: true });
      connection.once("error", onConnectionError);
      if (signal.aborted) {
        onAbort();
        return;
      }
      try {
        connection.query(
          { sql: "SELECT 1", timeout: operationTimeoutMs },
          error => finish(error)
        );
      } catch (error) {
        finish(error instanceof Error ? error : new Error(String(error)));
      }
    });
  };
}

function createReadinessProbe(
  check: ReadinessCheck,
  timeoutMs: number,
  cacheMs = 1_000
): () => Promise<boolean> {
  let inFlight: Promise<boolean> | undefined;
  let cachedSuccessUntil = 0;

  return () => {
    if (cachedSuccessUntil > Date.now()) return Promise.resolve(true);
    if (inFlight) return inFlight;

    const controller = new AbortController();
    const current = new Promise<boolean>(resolve => {
      const timer = setTimeout(() => {
        controller.abort();
        resolve(false);
      }, timeoutMs);
      void Promise.resolve()
        .then(() => check(controller.signal))
        .then(
          () => resolve(true),
          () => resolve(false)
        )
        .finally(() => clearTimeout(timer));
    })
      .then(ready => {
        if (ready) cachedSuccessUntil = Date.now() + cacheMs;
        return ready;
      })
      .finally(() => {
        if (inFlight === current) inFlight = undefined;
      });
    inFlight = current;
    return current;
  };
}

export function registerHealthRoutes(
  app: Express,
  readinessCheck: ReadinessCheck = createDatabaseReadinessCheck(
    process.env.DATABASE_URL,
    2_000
  ),
  timeoutMs = 2_000
): void {
  const probeReadiness = createReadinessProbe(readinessCheck, timeoutMs);
  app.get("/health/live", (_req, res) => {
    res.setHeader("Cache-Control", "no-store");
    res.json({ status: "ok" });
  });

  app.get("/health/ready", async (_req, res) => {
    res.setHeader("Cache-Control", "no-store");
    if (await probeReadiness()) res.json({ status: "ready" });
    else res.status(503).json({ status: "unavailable" });
  });
}
