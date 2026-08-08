import type { Request, Response } from "express";
import { ENV } from "./env";

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export function requireSameOrigin(req: Request, res: Response): boolean {
  if (!MUTATING_METHODS.has(req.method)) return true;
  const expected = process.env.PUBLIC_APP_ORIGIN || ENV.publicAppOrigin;
  const supplied = req.get("origin") || req.get("referer");
  if (!expected || !supplied) {
    res.status(403).json({ error: "Origin validation failed" });
    return false;
  }
  try {
    if (new URL(supplied).origin !== new URL(expected).origin) {
      res.status(403).json({ error: "Origin validation failed" });
      return false;
    }
  } catch {
    res.status(403).json({ error: "Origin validation failed" });
    return false;
  }
  return true;
}

export function installAuthOriginGuard(app: { use: (path: string, handler: (req: Request, res: Response, next: () => void) => void) => void }) {
  app.use("/api/auth", (req, res, next) => {
    if (requireSameOrigin(req, res)) next();
  });
}
