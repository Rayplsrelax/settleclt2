import "dotenv/config";
import express from "express";
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
      }

      res.json({ received: true });
    } catch (err: any) {
      console.error("[Stripe Webhook] Error:", err.message);
      res.status(400).json({ error: err.message });
    }
  });

  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  // tRPC API
  app.use(
    "/api/trpc",
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
      { loc: "/privacy-policy", priority: "0.3", changefreq: "yearly" },
      { loc: "/terms-of-service", priority: "0.3", changefreq: "yearly" },
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

    xml += `</urlset>`;

    res.set("Content-Type", "application/xml");
    res.send(xml);
  });

  // Robots.txt
  app.get("/robots.txt", (_req, res) => {
    res.set("Content-Type", "text/plain");
    res.send(`User-agent: *\nAllow: /\n\nSitemap: https://settleclt.com/sitemap.xml\n`);
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
