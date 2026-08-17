import "dotenv/config";
import express from "express";
import rateLimit from "express-rate-limit";
import { createServer } from "http";
import net from "net";
import path from "node:path";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { registerObsidianPublishRoute } from "../obsidian-publish";
import { registerStorageProxy } from "./storageProxy";
import { resolveStorageDirectory } from "../storage-path";
import { validateStorageDirectory } from "../storage-filesystem";
import { registerLocalAuthRoutes } from "../local-auth-routes";
import { installAuthOriginGuard } from "./auth-origin";
import { hermesRouter } from "../hermes-api";
import { createSecurityMiddleware } from "./security";
import { registerNewsletterRoutes } from "../newsletter-routes";
import { loadReleaseManifest, registerReleaseRoutes } from "../release-info";
import { registerFeatureFlagRoutes } from "../feature-flags";
import { registerHealthRoutes } from "../health-routes";
import {
  createOperationalMetrics,
  registerOperationalSummaryRoute,
} from "../operational-metrics";

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
  const isProduction = process.env.NODE_ENV === "production";
  const storageDirectory = resolveStorageDirectory(
    process.env,
    process.cwd(),
    isProduction
  );
  await validateStorageDirectory(storageDirectory, !isProduction);

  const app = express();
  const operationalMetrics = createOperationalMetrics();
  app.use(operationalMetrics.middleware);
  app.set("trust proxy", 1);
  const server = createServer(app);

  // Security headers must be mounted before every route, including webhooks.
  // Environment-derived origins keep policy and runtime integrations aligned.
  app.use(
    createSecurityMiddleware({
      analyticsEndpoint: process.env.VITE_ANALYTICS_ENDPOINT,
    })
  );
  registerReleaseRoutes(
    app,
    loadReleaseManifest(
      process.env.RELEASE_MANIFEST_PATH ??
        path.resolve(process.cwd(), "dist/release-manifest.json"),
      process.env.NODE_ENV === "production"
    )
  );
  registerFeatureFlagRoutes(app);
  registerHealthRoutes(app);
  registerOperationalSummaryRoute(app, operationalMetrics);

  // Stripe webhook must be BEFORE express.json() for raw body signature verification
  app.post(
    "/api/stripe/webhook",
    express.raw({ type: "application/json" }),
    async (req, res) => {
      try {
        const { constructWebhookEvent, getStripe } = await import(
          "../stripe-helpers"
        );
        const {
          activateCanonicalCheckout,
          markCheckoutReconciliationFailed,
          markCheckoutReconciliationSucceeded,
          reserveCheckoutReconciliation,
          upsertPremiumListing,
        } = await import("../db");
        const { processCheckoutCompletion } = await import(
          "../stripe-checkout-completion"
        );
        const { getInvoiceSubscriptionId, getSubscriptionBillingUpdate } =
          await import("../stripe-webhook-fields");
        const { cancelSubscriptionIfActive, reconcileRejectedCheckout } =
          await import("../stripe-checkout-reconciliation");
        const sig = req.headers["stripe-signature"] as string;
        const event = constructWebhookEvent(req.body, sig);

        // Handle test events
        if (event.id.startsWith("evt_test_")) {
          console.log(
            "[Webhook] Test event detected, returning verification response"
          );
          return res.json({ verified: true });
        }

        console.log(`[Stripe Webhook] ${event.type} (${event.id})`);

        switch (event.type) {
          case "checkout.session.completed": {
            const session = event.data.object as any;
            // Plan A: event promotion activation (one-time payment)
            if (session.metadata?.kind === "event_promotion") {
              const promotionId = Number(session.metadata.promotion_id);
              if (Number.isSafeInteger(promotionId) && promotionId > 0) {
                const { activateEventPromotion } = await import("../db");
                const result = await activateEventPromotion(promotionId, {
                  stripePaymentRef:
                    (typeof session.payment_intent === "string" &&
                      session.payment_intent) ||
                    session.id,
                  priceCents: session.amount_total ?? undefined,
                });
                console.log(
                  `[Stripe] Event promotion ${promotionId}: ${result.activated ? `activated (${result.level})` : result.reason}`
                );
              }
              break;
            }
            const result = await processCheckoutCompletion(event.id, session, {
              activateCanonicalCheckout,
              reconcileRejectedCheckout: details =>
                reconcileRejectedCheckout(details, {
                  reserve: reserveCheckoutReconciliation,
                  cancelSubscription: subscriptionId =>
                    cancelSubscriptionIfActive(subscriptionId, {
                      retrieve: id => getStripe().subscriptions.retrieve(id),
                      cancel: id => getStripe().subscriptions.cancel(id),
                    }),
                  markSucceeded: markCheckoutReconciliationSucceeded,
                  markFailed: markCheckoutReconciliationFailed,
                }),
            });
            if (result.accepted) {
              console.log(
                `[Stripe] Activated ${result.tier} tier for ${result.serviceKey}`
              );
              // Notify user about successful payment
              try {
                const { notifyPaymentSuccess } = await import(
                  "../notification-service"
                );
                await notifyPaymentSuccess(
                  result.userId,
                  result.tier,
                  result.serviceKey
                );
              } catch (e) {
                console.error("[Webhook] Notification error:", e);
              }
            }
            break;
          }
          case "charge.refunded": {
            // Plan A: refund cancels the event promotion (matched by payment intent)
            const charge = event.data.object as any;
            const paymentIntent =
              typeof charge.payment_intent === "string"
                ? charge.payment_intent
                : null;
            if (paymentIntent) {
              const { getDb, cancelEventPromotion } = await import("../db");
              const { eventPromotions } = await import("../../drizzle/schema");
              const { eq } = await import("drizzle-orm");
              const db = await getDb();
              if (db) {
                const rows = await db
                  .select()
                  .from(eventPromotions)
                  .where(eq(eventPromotions.stripePaymentRef, paymentIntent))
                  .limit(1);
                if (rows.length > 0 && rows[0].status !== "canceled") {
                  await cancelEventPromotion(rows[0].id);
                  console.log(
                    `[Stripe] Event promotion ${rows[0].id} canceled (refund)`
                  );
                }
              }
            }
            break;
          }
          case "customer.subscription.updated": {
            const sub = event.data.object as any;
            // Find the premium listing by subscription ID
            const { getAllPremiumListings } = await import("../db");
            const all = await getAllPremiumListings();
            const listing = all.find(
              (l: any) => l.stripeSubscriptionId === sub.id
            );
            if (listing) {
              await upsertPremiumListing(
                listing.serviceKey,
                getSubscriptionBillingUpdate(sub)
              );
            }
            break;
          }
          case "customer.subscription.deleted": {
            const sub = event.data.object as any;
            const { getAllPremiumListings } = await import("../db");
            const all = await getAllPremiumListings();
            const listing = all.find(
              (l: any) => l.stripeSubscriptionId === sub.id
            );
            if (listing) {
              await upsertPremiumListing(listing.serviceKey, {
                paymentStatus: "canceled" as any,
                tier: "basic" as any,
              });
              console.log(
                `[Stripe] Canceled subscription for ${listing.serviceKey}`
              );
            }
            break;
          }
          case "invoice.payment_succeeded": {
            const invoice = event.data.object as any;
            const subId = getInvoiceSubscriptionId(invoice);
            if (subId) {
              const { getAllPremiumListings } = await import("../db");
              const all = await getAllPremiumListings();
              const listing = all.find(
                (l: any) => l.stripeSubscriptionId === subId
              );
              if (listing) {
                await upsertPremiumListing(listing.serviceKey, {
                  paymentStatus: "active" as any,
                });
                console.log(
                  `[Stripe] Payment succeeded for ${listing.serviceKey}`
                );
              }
            }
            break;
          }
          case "invoice.payment_failed": {
            const invoice = event.data.object as any;
            const subId = getInvoiceSubscriptionId(invoice);
            if (subId) {
              const { getAllPremiumListings } = await import("../db");
              const { notifyOwner } = await import("./notification");
              const all = await getAllPremiumListings();
              const listing = all.find(
                (l: any) => l.stripeSubscriptionId === subId
              );
              if (listing) {
                await upsertPremiumListing(listing.serviceKey, {
                  paymentStatus: "past_due" as any,
                });
                // Notify admin about failed payment
                await notifyOwner({
                  title: `Payment Failed: ${listing.serviceKey}`,
                  content: `A subscription payment failed for business listing "${listing.serviceKey}" (${listing.billingEmail || "unknown email"}). The listing has been marked as past_due. The customer will be retried automatically by Stripe.`,
                });
                console.log(
                  `[Stripe] Payment failed for ${listing.serviceKey}`
                );
                // Notify user about failed payment
                try {
                  if (listing.claimId) {
                    const { getBusinessClaims } = await import("../db");
                    const claims = await getBusinessClaims();
                    const claim = claims.find(
                      (c: any) => c.id === listing.claimId
                    );
                    if (claim?.userId) {
                      const { notifyPaymentFailed } = await import(
                        "../notification-service"
                      );
                      await notifyPaymentFailed(
                        claim.userId,
                        listing.serviceKey
                      );
                    }
                  }
                } catch (e) {
                  console.error("[Webhook] Notification error:", e);
                }
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
    }
  );

  // ── Obsidian → Settle CLT publish webhook ─────────────────────────────────
  // Accepts POST /api/obsidian/publish with a shared secret in the Authorization
  // header. Called by GitHub Actions when a note tagged `publish: true` is
  // pushed to the vault repo. Creates or updates a blog post by slug.
  app.post(
    "/api/obsidian/publish",
    express.json({ limit: "2mb" }),
    async (req, res) => {
      try {
        const secret = process.env.OBSIDIAN_PUBLISH_SECRET;
        if (!secret) {
          console.error("[Obsidian Webhook] OBSIDIAN_PUBLISH_SECRET not set");
          return res.status(500).json({ error: "Server misconfiguration" });
        }
        const authHeader = req.headers["authorization"] || "";
        const token = authHeader.startsWith("Bearer ")
          ? authHeader.slice(7)
          : "";
        if (token !== secret) {
          console.warn("[Obsidian Webhook] Unauthorized attempt");
          return res.status(401).json({ error: "Unauthorized" });
        }

        const {
          slug,
          title,
          content,
          excerpt,
          category,
          coverImage,
          status,
          readTime,
          publishedAt,
        } = req.body;
        if (!slug || !title || !content) {
          return res
            .status(400)
            .json({ error: "Missing required fields: slug, title, content" });
        }

        const { upsertBlogPostFromWebhook } = await import("../db");
        const post = await upsertBlogPostFromWebhook({
          slug,
          title,
          content,
          excerpt: excerpt || null,
          category: category || "Charlotte Guide",
          coverImage: coverImage || null,
          status: status === "draft" ? "draft" : "published",
          readTime: readTime || null,
          publishedAt: publishedAt ? new Date(publishedAt) : new Date(),
        });

        console.log(
          `[Obsidian Webhook] Upserted post: ${slug} (${post.action})`
        );
        const { notifyOwner } = await import("./notification");
        await notifyOwner({
          title: `📝 Blog post ${post.action}: "${title}"`,
          content: `Obsidian pipeline published "${title}" (/${slug}) — status: ${status || "published"}.`,
        });

        res.json({ ok: true, action: post.action, slug });
      } catch (err: any) {
        console.error("[Obsidian Webhook] Error:", err.message);
        res.status(500).json({ error: err.message });
      }
    }
  );

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
  app.use(
    "/api/trpc/businessPortal.uploadPhotoFile",
    express.json({ limit: "10mb" })
  );
  app.use("/api/upload", express.json({ limit: "50mb" }));
  // Rate limiting for all API endpoints, including authentication routes.
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many requests, please try again later." },
  });
  app.use("/api", apiLimiter);
  installAuthOriginGuard(app);
  // OAuth callback under /api/oauth/callback
  registerStorageProxy(app);
  registerLocalAuthRoutes(app);
  registerOAuthRoutes(app);
  registerNewsletterRoutes(app);
  // Shared-secret endpoint for Obsidian/GitHub Actions blog publishing
  registerObsidianPublishRoute(app);
  // Hermes revenue ops agent REST API (Bearer token auth)
  app.use("/api/hermes", express.json({ limit: "2mb" }), hermesRouter);

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
  app.use("/api/trpc/newsletter.subscribe", formLimiter);

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
      { loc: "/things-to-do", priority: "0.85", changefreq: "weekly" },
      { loc: "/blog", priority: "0.8", changefreq: "weekly" },
      { loc: "/passport", priority: "0.7", changefreq: "weekly" },
      { loc: "/bingo", priority: "0.7", changefreq: "monthly" },
      { loc: "/leaderboard", priority: "0.6", changefreq: "daily" },
      { loc: "/quiz", priority: "0.8", changefreq: "monthly" },
      { loc: "/newcomer-plan", priority: "0.8", changefreq: "monthly" },
      { loc: "/compare", priority: "0.7", changefreq: "monthly" },
      { loc: "/find-your-home", priority: "0.8", changefreq: "monthly" },
      { loc: "/business-pricing", priority: "0.7", changefreq: "monthly" },
      { loc: "/list-your-business", priority: "0.6", changefreq: "monthly" },
      { loc: "/submit-event", priority: "0.5", changefreq: "monthly" },
      { loc: "/contact", priority: "0.5", changefreq: "yearly" },
      { loc: "/privacy", priority: "0.3", changefreq: "yearly" },
      { loc: "/terms", priority: "0.3", changefreq: "yearly" },
    ];

    // Directory category pages (e.g., /directory/category/restaurants)
    const directoryCategories = [
      "moving-companies",
      "storage",
      "utilities",
      "internet",
      "insurance",
      "dmv",
      "government",
      "banking",
      "tax",
      "legal",
      "plumbers",
      "electricians",
      "hvac",
      "roofing",
      "handyman",
      "pressure-washing",
      "lawn",
      "tree",
      "fencing",
      "tv-mounting",
      "pest",
      "cleaning",
      "dumpster",
      "barbers",
      "salons",
      "makeup",
      "photographers",
      "chefs",
      "grocery",
      "healthcare",
      "fitness",
      "auto",
      "childcare",
      "pets",
      "restaurants",
      "breweries",
      "coffee-shops",
      "food-trucks",
      "attractions",
      "community",
      "coworking",
      "beauty-booking",
      "nightlife",
      "outdoor-parks",
      "tours-experiences",
      "art-culture",
      "live-music",
      "yoga-wellness",
      "sports-recreation",
      "kids-activities",
      "date-night",
      "classes-workshops",
      "shopping-boutiques",
      "wedding-events",
    ];

    // Neighborhood pages
    const neighborhoodIds = [
      "south-end",
      "noda",
      "dilworth",
      "ballantyne",
      "plaza-midwood",
      "uptown",
      "myers-park",
      "university-city",
      "southpark",
      "elizabeth",
      "loso",
      "east-charlotte",
      "south-charlotte",
      "west-charlotte",
      "huntersville",
      "lake-norman",
      "matthews",
      "concord",
      "fort-mill",
      "pineville",
    ];

    // Event category landing pages (recurring community events)
    const eventCategories = [
      "run-walk",
      "yoga-fitness",
      "farmers-markets",
      "game-nights",
      "veteran",
      "music-jam",
      "kids-storytime",
      "meditation",
      "dog-meetups",
      "makers-crafts",
      "community",
      "neighborhood",
      "professional",
      "festivals",
      "sports",
      "family",
    ];

    // Individual business detail pages (700+ URLs)
    const { SERVICES: allServices } = await import("../../shared/services");
    const businessSlugs = Array.from(
      new Set(
        allServices.map((s: { name: string }) =>
          s.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "")
        )
      )
    );

    // Blog slugs from DB
    let blogSlugs: string[] = [];
    try {
      const { getDb } = await import("../db");
      const { blogPosts } = await import("../../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      const db = await getDb();
      if (db) {
        const posts = await db
          .select({ slug: blogPosts.slug })
          .from(blogPosts)
          .where(eq(blogPosts.status, "published"));
        blogSlugs = posts.map((p: { slug: string }) => p.slug);
      }
    } catch {
      /* fallback: no DB blog posts */
    }

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
      xml += `  <url>\n    <loc>${baseUrl}/directory/category/${cat}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.6</priority>\n  </url>\n`;
    }

    for (const evtCat of eventCategories) {
      xml += `  <url>\n    <loc>${baseUrl}/events/category/${evtCat}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.7</priority>\n  </url>\n`;
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
  const releaseSlot = process.env.RELEASE_SLOT;
  const port = releaseSlot
    ? preferredPort
    : await findAvailablePort(preferredPort);

  if (!releaseSlot && port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  const host = process.env.HOST || "0.0.0.0";
  server.listen(port, host, () => {
    console.log(`Server running on http://${host}:${port}/`);
  });
}

startServer().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
