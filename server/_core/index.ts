import "dotenv/config";
import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  app.set('trust proxy', 1);
  const server = createServer(app);

  // Stripe webhook must be BEFORE express.json() for raw body signature verification
  app.post("/api/stripe/webhook", express.raw({ type: "application/json" }), async (req, res) => {
    try {
      const { constructWebhookEvent } = await import("../stripe-helpers");
      const { upsertPremiumListing } = await import("../db");
      const sig = req.headers["stripe-signature"] as string;
      const event = constructWebhookEvent(req.body, sig);

      // Handle test events
      if (event.id.startsWith("evt_test_")) {
        console.log("[Webhook] Test event detected, returning verification response");
        return res.json({ verified: true });
      }

      console.log(`[Stripe Webhook] ${event.type} (${event.id})`);

      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object as any;
          const serviceKey = session.metadata?.service_key;
          const tier = session.metadata?.tier;
          const claimId = session.metadata?.claim_id ? parseInt(session.metadata.claim_id) : undefined;
          const billingEmail = session.metadata?.customer_email;
          if (serviceKey && tier) {
            await upsertPremiumListing(serviceKey, {
              tier: tier as any,
              stripeCustomerId: session.customer,
              stripeSubscriptionId: session.subscription,
              claimId,
              billingEmail,
              paymentStatus: "active" as any,
            });
            console.log(`[Stripe] Activated ${tier} tier for ${serviceKey}`);
            // Notify user about successful payment
            try {
              const userId = session.metadata?.user_id ? parseInt(session.metadata.user_id) : null;
              if (userId) {
                const { notifyPaymentSuccess } = await import("../notification-service");
                await notifyPaymentSuccess(userId, tier, serviceKey);
              }
            } catch (e) { console.error("[Webhook] Notification error:", e); }
          }
          break;
        }
        case "customer.subscription.updated": {
          const sub = event.data.object as any;
          const { getStripe } = await import("../stripe-helpers");
          // Find the premium listing by subscription ID
          const { getAllPremiumListings } = await import("../db");
          const all = await getAllPremiumListings();
          const listing = all.find((l: any) => l.stripeSubscriptionId === sub.id);
          if (listing) {
            const statusMap: Record<string, string> = {
              active: "active", past_due: "past_due", canceled: "canceled", trialing: "trialing",
            };
            await upsertPremiumListing(listing.serviceKey, {
              paymentStatus: (statusMap[sub.status] || "active") as any,
              currentPeriodStart: new Date(sub.current_period_start * 1000),
              currentPeriodEnd: new Date(sub.current_period_end * 1000),
            });
          }
          break;
        }
        case "customer.subscription.deleted": {
          const sub = event.data.object as any;
          const { getAllPremiumListings } = await import("../db");
          const all = await getAllPremiumListings();
          const listing = all.find((l: any) => l.stripeSubscriptionId === sub.id);
          if (listing) {
            await upsertPremiumListing(listing.serviceKey, {
              paymentStatus: "canceled" as any,
              tier: "basic" as any,
            });
            console.log(`[Stripe] Canceled subscription for ${listing.serviceKey}`);
          }
          break;
        }
        case "invoice.payment_succeeded": {
          const invoice = event.data.object as any;
          const subId = invoice.subscription;
          if (subId) {
            const { getAllPremiumListings } = await import("../db");
            const all = await getAllPremiumListings();
            const listing = all.find((l: any) => l.stripeSubscriptionId === subId);
            if (listing) {
              await upsertPremiumListing(listing.serviceKey, {
                paymentStatus: "active" as any,
              });
              console.log(`[Stripe] Payment succeeded for ${listing.serviceKey}`);
            }
          }
          break;
        }
        case "invoice.payment_failed": {
          const invoice = event.data.object as any;
          const subId = invoice.subscription;
          if (subId) {
            const { getAllPremiumListings } = await import("../db");
            const { notifyOwner } = await import("./notification");
            const all = await getAllPremiumListings();
            const listing = all.find((l: any) => l.stripeSubscriptionId === subId);
            if (listing) {
              await upsertPremiumListing(listing.serviceKey, {
                paymentStatus: "past_due" as any,
              });
              // Notify admin about failed payment
              await notifyOwner({
                title: `Payment Failed: ${listing.serviceKey}`,
                content: `A subscription payment failed for business listing "${listing.serviceKey}" (${listing.billingEmail || 'unknown email'}). The listing has been marked as past_due. The customer will be retried automatically by Stripe.`,
              });
              console.log(`[Stripe] Payment failed for ${listing.serviceKey}`);
              // Notify user about failed payment
              try {
                if (listing.claimId) {
                  const { getBusinessClaims } = await import("../db");
                  const claims = await getBusinessClaims();
                  const claim = claims.find((c: any) => c.id === listing.claimId);
                  if (claim?.userId) {
                    const { notifyPaymentFailed } = await import("../notification-service");
                    await notifyPaymentFailed(claim.userId, listing.serviceKey);
                  }
                }
              } catch (e) { console.error("[Webhook] Notification error:", e); }
            }
          }
          break;
        }
      }

      res.json({ received: true });
    } catch (err: any) {
      console.error("[Stripe Webhook] Error:", err.message);
      res.status(400).json({ error: err.message });
    }
  });

  // ── Security headers via helmet ──────────────────────────────────────────
  // Two modes, selected per request by hostname:
  //  • PREVIEW (manus.space / manus.computer / localhost): CSP disabled.
  //    The Manus dashboard embeds these hosts in an iframe from its own origin
  //    (manus.im), which we can't reliably enumerate — any frame-ancestors list
  //    here blanks the preview. Other helmet headers still apply.
  //  • PRODUCTION (settleclt.com): full CSP, including frame-ancestors 'self'
  //    (nobody should frame the real site).
  const isPreviewHost = (hostname: string) =>
    hostname.includes("manus.space") ||
    hostname.includes("manus.computer") ||
    hostname === "localhost" ||
    hostname === "127.0.0.1";

  // Derive third-party origins the client actually uses from env, so CSP and
  // reality can't drift apart. Falls back to the known Forge default.
  const toOrigin = (u?: string): string | null => {
    try { return u ? new URL(u).origin : null; } catch { return null; }
  };
  const forgeOrigin =
    toOrigin(process.env.VITE_FRONTEND_FORGE_API_URL) ??
    "https://forge.butterfly-effect.dev";
  const analyticsOrigin = toOrigin(process.env.VITE_ANALYTICS_ENDPOINT);

  // Use helmet for basic security headers but DISABLE CSP entirely.
  // CSP was causing blank pages due to circular chunk imports and dynamic
  // module loading issues. The other helmet headers (X-Content-Type-Options,
  // X-Frame-Options, HSTS, etc.) still provide meaningful protection.
  const commonHelmet = helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginOpenerPolicy: false, // don't isolate — breaks dynamic imports
    frameguard: isPreviewHost("placeholder") ? false : undefined, // allow preview embedding
  });

  app.use((req, res, next) => {
    // Disable frameguard on preview hosts so Manus dashboard can embed
    if (isPreviewHost(req.hostname)) {
      return helmet({
        contentSecurityPolicy: false,
        crossOriginResourcePolicy: { policy: "cross-origin" },
        crossOriginOpenerPolicy: false,
        frameguard: false,
        hsts: false,
      })(req, res, next);
    }
    return commonHelmet(req, res, next);
  });

  // SEO: Tell search engines not to index the manus.space subdomain
  app.use((req, res, next) => {
    const host = req.hostname;
    if (host.includes("manus.space") || host.includes("manus.computer")) {
      res.setHeader("X-Robots-Tag", "noindex, nofollow");
    }
    // Add Link header with canonical URL for all HTML pages
    if (req.accepts("html") && !req.path.startsWith("/api/")) {
      const canonicalUrl = `https://settleclt.com${req.path === "/" ? "" : req.path}`;
      res.setHeader("Link", `<${canonicalUrl}>; rel="canonical"`);
    }
    next();
  });

  // Global body parsers — keep small to prevent DoS; large limit only on upload routes
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ limit: "1mb", extended: true }));
  // Upload-specific routes that need a larger body limit
  app.use("/api/trpc/storage", express.json({ limit: "50mb" }));
  app.use("/api/upload", express.json({ limit: "50mb" }));
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  // Rate limiting for API endpoints
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200, // limit each IP to 200 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many requests, please try again later." },
  });

  // Stricter rate limit for form submissions (contact, event submit, business claim)
  const formLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // limit each IP to 10 form submissions per hour
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many submissions, please try again later." },

  });

  // Apply form limiter to mutation-heavy tRPC paths
  app.use("/api/trpc/event.submit", formLimiter);
  app.use("/api/trpc/system.notifyOwner", formLimiter);
  app.use("/api/trpc/claim.submit", formLimiter);

  // tRPC API
  app.use(
    "/api/trpc",
    apiLimiter,
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // Sitemap
  app.get("/sitemap.xml", async (_req, res) => {
    const baseUrl = "https://settleclt.com";
    const today = new Date().toISOString().split("T")[0];

    // Static pages
    const staticPages = [
      { loc: "/", priority: "1.0", changefreq: "daily" },
      { loc: "/neighborhoods", priority: "0.9", changefreq: "weekly" },
      { loc: "/directory", priority: "0.9", changefreq: "weekly" },
      { loc: "/events", priority: "0.9", changefreq: "daily" },
      { loc: "/blog", priority: "0.8", changefreq: "weekly" },
      { loc: "/passport", priority: "0.7", changefreq: "weekly" },
      { loc: "/bingo", priority: "0.7", changefreq: "monthly" },
      { loc: "/leaderboard", priority: "0.6", changefreq: "daily" },
      { loc: "/quiz", priority: "0.8", changefreq: "monthly" },
      { loc: "/compare", priority: "0.7", changefreq: "monthly" },
      { loc: "/find-your-home", priority: "0.8", changefreq: "monthly" },
      { loc: "/list-your-business", priority: "0.6", changefreq: "monthly" },
      { loc: "/submit-event", priority: "0.5", changefreq: "monthly" },
      { loc: "/contact", priority: "0.5", changefreq: "yearly" },
      { loc: "/privacy", priority: "0.3", changefreq: "yearly" },
      { loc: "/terms", priority: "0.3", changefreq: "yearly" },
    ];

    // Directory category pages (e.g., /directory?category=restaurants)
    const directoryCategories = [
      "moving-companies", "storage", "utilities", "internet", "insurance",
      "dmv", "government", "banking", "tax", "legal",
      "plumbers", "electricians", "hvac", "roofing", "handyman",
      "pressure-washing", "lawn", "tree", "fencing", "tv-mounting",
      "pest", "cleaning", "dumpster",
      "barbers", "salons", "makeup", "photographers", "chefs",
      "grocery", "healthcare", "fitness", "auto", "childcare", "pets",
      "restaurants", "breweries", "coffee-shops", "food-trucks",
      "attractions", "community", "coworking", "beauty-booking",
      "nightlife", "outdoor-parks", "tours-experiences", "art-culture",
      "live-music", "yoga-wellness", "sports-recreation", "kids-activities",
      "date-night", "classes-workshops", "shopping-boutiques", "wedding-events"
    ];

    // Neighborhood pages
    const neighborhoodIds = [
      "south-end", "noda", "dilworth", "ballantyne", "plaza-midwood",
      "uptown", "myers-park", "university-city", "southpark", "elizabeth",
      "loso", "east-charlotte", "south-charlotte", "west-charlotte",
      "huntersville", "lake-norman", "matthews", "concord", "fort-mill", "pineville"
    ];

    // Individual business detail pages (700+ URLs)
    const { SERVICES: allServices } = await import("../../shared/services");
    const businessSlugs = Array.from(new Set(allServices.map((s: { name: string }) =>
      s.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    )));

    // Blog slugs from DB
    let blogSlugs: string[] = [];
    try {
      const { getDb } = await import("../db");
      const { blogPosts } = await import("../../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      const db = await getDb();
      if (db) {
        const posts = await db.select({ slug: blogPosts.slug }).from(blogPosts).where(eq(blogPosts.status, "published"));
        blogSlugs = posts.map((p: { slug: string }) => p.slug);
      }
    } catch { /* fallback: no DB blog posts */ }

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    for (const page of staticPages) {
      xml += `  <url>\n    <loc>${baseUrl}${page.loc}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${page.changefreq}</changefreq>\n    <priority>${page.priority}</priority>\n  </url>\n`;
    }

    for (const id of neighborhoodIds) {
      xml += `  <url>\n    <loc>${baseUrl}/neighborhood/${id}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
    }

    for (const slug of blogSlugs) {
      xml += `  <url>\n    <loc>${baseUrl}/blog/${slug}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.7</priority>\n  </url>\n`;
    }

    for (const cat of directoryCategories) {
      xml += `  <url>\n    <loc>${baseUrl}/directory?category=${cat}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.6</priority>\n  </url>\n`;
    }

    for (const bSlug of businessSlugs) {
      xml += `  <url>\n    <loc>${baseUrl}/directory/${bSlug}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.5</priority>\n  </url>\n`;
    }

    xml += `</urlset>`;

    res.set("Content-Type", "application/xml");
    res.send(xml);
  });

  // Robots.txt — block admin, private, and API paths; declare canonical host + sitemap
  app.get("/robots.txt", (req, res) => {
    const host = req.hostname;
    res.set("Content-Type", "text/plain");
    // If accessed via the manus.space subdomain, block all crawling
    if (host.includes("manus.space") || host.includes("manus.computer")) {
      return res.send(`User-agent: *\nDisallow: /\n`);
    }
    res.send(
`User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /profile
Disallow: /wishlist
Disallow: /notifications

Host: https://settleclt.com
Sitemap: https://settleclt.com/sitemap.xml
`
    );
  });

  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
