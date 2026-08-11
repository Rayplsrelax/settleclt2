import helmet from "helmet";
import type { RequestHandler } from "express";
import type { IncomingMessage, ServerResponse } from "node:http";
import { createCspNonce } from "./csp-nonce";

export type SecurityMiddlewareOptions = {
  analyticsEndpoint?: string;
};

const PREVIEW_DOMAINS = [
  "manus.space",
  "manus.computer",
  "manuspre.computer",
  "manus-asia.computer",
  "manuscomputer.ai",
  "manusvm.computer",
];

const PERMISSIONS_POLICY = "camera=(), geolocation=(), microphone=()";

export function isPreviewHost(hostname: string): boolean {
  const normalizedHostname = hostname.toLowerCase().replace(/\.$/, "");
  return (
    normalizedHostname === "localhost" ||
    normalizedHostname === "127.0.0.1" ||
    PREVIEW_DOMAINS.some(
      domain =>
        normalizedHostname === domain ||
        normalizedHostname.endsWith(`.${domain}`)
    )
  );
}

function toOrigin(url?: string): string | null {
  try {
    if (!url) return null;
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:"
      ? parsed.origin
      : null;
  } catch {
    return null;
  }
}

function hostnameFromAuthority(authority?: string): string {
  if (!authority) return "";
  if (authority.startsWith("[")) {
    const closingBracket = authority.indexOf("]");
    return closingBracket === -1
      ? authority
      : authority.slice(1, closingBracket);
  }
  return authority.split(":", 1)[0];
}

export function createSecurityMiddleware(
  options: SecurityMiddlewareOptions = {}
): RequestHandler {
  const analyticsOrigin = toOrigin(options.analyticsEndpoint);
  const optionalAnalytics = analyticsOrigin ? [analyticsOrigin] : [];

  const productionHelmet = helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        baseUri: ["'self'"],
        connectSrc: [
          "'self'",
          ...optionalAnalytics,
          "https://maps.googleapis.com",
          "https://maps.gstatic.com",
          "https://*.mixpanel.com",
        ],
        fontSrc: ["'self'", "data:", "https://fonts.gstatic.com"],
        formAction: ["'self'", "https://checkout.stripe.com"],
        frameAncestors: ["'self'"],
        frameSrc: ["'self'", "https://*.google.com"],
        imgSrc: ["'self'", "data:", "blob:", "https:"],
        manifestSrc: ["'self'"],
        mediaSrc: ["'self'", "data:", "blob:", "https:"],
        objectSrc: ["'none'"],
        scriptSrc: [
          "'self'",
          ...optionalAnalytics,
          "https://maps.googleapis.com",
          "https://maps.gstatic.com",
          (_req: IncomingMessage, res: ServerResponse) => {
            const locals = (res as ServerResponse & {
              locals: { cspNonce: string };
            }).locals;
            return `'nonce-${locals.cspNonce}'`;
          },
        ],
        scriptSrcAttr: ["'none'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        workerSrc: ["'self'", "blob:"],
        upgradeInsecureRequests: [],
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  });

  const previewHelmet = helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
    frameguard: false,
    hsts: false,
  });

  return (req, res, next) => {
    // Use the actual Host authority rather than proxy-derived X-Forwarded-Host
    // so a forwarded-header spoof cannot disable production protections.
    const hostname = hostnameFromAuthority(req.get("host"));
    const previewHost = isPreviewHost(hostname);
    if (!previewHost) {
      res.locals.cspNonce = createCspNonce();
    }
    const middleware = previewHost
      ? previewHelmet
      : productionHelmet;
    return middleware(req, res, (err?: unknown) => {
      if (err) return next(err);
      if (!res.headersSent) {
        res.setHeader("Permissions-Policy", PERMISSIONS_POLICY);
      }
      return next();
    });
  };
}
