import type { Express, Request, RequestHandler } from "express";
import rateLimit from "express-rate-limit";

export const STRICT_PUBLIC_FORM_PROCEDURES = [
  "events.submitEvent",
  "claims.submit",
  "newsletter.subscribe",
  "leads.submitBusiness",
  "referrals.submit",
  "premium.trackLead",
  "premium.submitBizReferral",
  "contact.submit",
] as const;

export const STRICT_PUBLIC_FORM_PATHS = STRICT_PUBLIC_FORM_PROCEDURES.map(
  procedure => `/api/trpc/${procedure}`
);
const STRICT_PUBLIC_FORM_PROCEDURE_SET = new Set<string>(
  STRICT_PUBLIC_FORM_PROCEDURES
);
const MAX_TRPC_PATH_LENGTH = 4096;
const MAX_BATCH_PROCEDURES = 20;

function classifyStrictPublicFormRequest(req: Request): {
  protected: boolean;
  rejectBatch: boolean;
} {
  const rawPath = req.originalUrl.split("?", 1)[0];
  const prefix = "/api/trpc/";
  if (!rawPath.startsWith(prefix)) return { protected: false, rejectBatch: false };
  const rawProcedures = rawPath.slice(prefix.length);
  if (rawProcedures.length > MAX_TRPC_PATH_LENGTH) {
    return { protected: true, rejectBatch: true };
  }

  let decodedProcedures: string;
  try {
    decodedProcedures = decodeURIComponent(rawProcedures);
  } catch {
    return { protected: true, rejectBatch: true };
  }

  const procedures = decodedProcedures.split(",");
  if (procedures.length > MAX_BATCH_PROCEDURES) {
    return { protected: true, rejectBatch: true };
  }
  const protectedRequest = procedures.some(procedure =>
    STRICT_PUBLIC_FORM_PROCEDURE_SET.has(procedure)
  );
  return {
    protected: protectedRequest,
    rejectBatch: protectedRequest && procedures.length > 1,
  };
}

export function isStrictPublicFormRequest(req: Request): boolean {
  return classifyStrictPublicFormRequest(req).protected;
}

export function createStrictPublicFormLimiter(): RequestHandler {
  return rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many submissions, please try again later." },
  });
}

export function mountStrictPublicFormLimiter(
  app: Express,
  limiter: RequestHandler
): void {
  app.use((req, res, next) => {
    const classification = classifyStrictPublicFormRequest(req);
    if (classification.rejectBatch) {
      return res.status(400).json({
        error: "Protected form submissions cannot be batched.",
      });
    }
    if (!classification.protected) return next();
    return limiter(req, res, next);
  });
}
