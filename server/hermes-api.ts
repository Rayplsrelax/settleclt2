/**
 * Hermes External API — REST endpoints for the Hermes revenue ops agent.
 * Authenticated via Bearer token (HERMES_API_SECRET).
 *
 * Endpoints:
 *   GET  /api/hermes/snapshot       — Revenue ops summary + tasks
 *   GET  /api/hermes/tasks          — All due revenue tasks
 *   GET  /api/hermes/draft/:taskId  — Draft message for a specific task
 *   POST /api/hermes/referrals/:id  — Update a referral (status, leadPriority, nextAction, adminNotes)
 *   POST /api/hermes/claims/:id     — Update a business claim (status, adminNotes)
 *   POST /api/hermes/events/:id     — Update an event (startDate, endDate, status, etc.)
 *   POST /api/hermes/events         — Create a new event
 *   GET  /api/hermes/events         — List events (with optional filters)
 *   GET  /api/hermes/referrals      — List referrals
 *   GET  /api/hermes/claims         — List business claims
 *   GET  /api/hermes/blog           — List blog posts
 *   POST /api/hermes/blog           — Create/update a blog post (upsert by slug)
 */

import { Router, Request, Response, NextFunction } from "express";
import { ENV } from "./_core/env";
import {
  getReferrals,
  updateReferralStatus,
  getBusinessClaims,
  updateBusinessClaimStatus,
  getAllEvents,
  getPublishedEvents,
  updateEvent,
  createEvent,
  getEventById,
  getAllPremiumListings,
  getRecentBlogPosts,
  upsertBlogPostFromWebhook,
} from "./db";
import {
  generateHermesRevenueTasks,
  buildHermesRevenueOpsSummary,
  createHermesRevenueDraft,
} from "../shared/hermesRevenueOps";

// Microsite config (same as in routers.ts)
const SETTLE_CLT_MICROSITES = [
  { domain: "movingtocharlotteguide.com", campaign: "relocation", status: "ready_for_dns", primaryFunnel: "/find-your-home" },
  { domain: "charlotteweekendevents.com", campaign: "events", status: "ready_for_dns", primaryFunnel: "/events" },
  { domain: "charlottejobmarket.com", campaign: "jobs", status: "ready_for_dns", primaryFunnel: "/jobs" },
  { domain: "charlotteneighborhoodsguide.com", campaign: "neighborhoods", status: "ready_for_dns", primaryFunnel: "/neighborhoods" },
  { domain: "charlottehomepros.org", campaign: "home_pros", status: "ready_for_dns", primaryFunnel: "/directory" },
];

export const hermesRouter = Router();

// ─── Auth middleware ────────────────────────────────────────────────────────

function hermesAuth(req: Request, res: Response, next: NextFunction) {
  const secret = ENV.hermesApiSecret;
  if (!secret) {
    console.error("[Hermes API] HERMES_API_SECRET not configured");
    return res.status(500).json({ error: "Server misconfiguration: HERMES_API_SECRET not set" });
  }
  const authHeader = req.headers["authorization"] || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (!token || token !== secret) {
    return res.status(401).json({ error: "Unauthorized: invalid or missing Bearer token" });
  }
  next();
}

hermesRouter.use(hermesAuth);

// ─── Helper to build revenue ops input ──────────────────────────────────────

async function buildOpsInput() {
  const [referrals, claims, premiumListings] = await Promise.all([
    getReferrals({ limit: 200 }),
    getBusinessClaims(),
    getAllPremiumListings(),
  ]);
  return {
    referrals: referrals as any[],
    claims: claims as any[],
    premiumListings: premiumListings as any[],
    microsites: SETTLE_CLT_MICROSITES as any[],
  };
}

// ─── READ endpoints ─────────────────────────────────────────────────────────

/** GET /api/hermes/snapshot — Full revenue ops summary + tasks */
hermesRouter.get("/snapshot", async (_req, res) => {
  try {
    const input = await buildOpsInput();
    const summary = buildHermesRevenueOpsSummary(input);
    const tasks = generateHermesRevenueTasks(input);
    res.json({ ok: true, summary, tasks });
  } catch (err: any) {
    console.error("[Hermes API] snapshot error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

/** GET /api/hermes/tasks — All due revenue tasks */
hermesRouter.get("/tasks", async (_req, res) => {
  try {
    const input = await buildOpsInput();
    const tasks = generateHermesRevenueTasks(input);
    res.json({ ok: true, tasks });
  } catch (err: any) {
    console.error("[Hermes API] tasks error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

/** GET /api/hermes/draft/:taskId — Draft message for a specific task */
hermesRouter.get("/draft/:taskId", async (req, res) => {
  try {
    const input = await buildOpsInput();
    const tasks = generateHermesRevenueTasks(input);
    const task = tasks.find(t => t.id === req.params.taskId);
    if (!task) return res.status(404).json({ error: "Task not found" });
    const draft = createHermesRevenueDraft(task);
    res.json({ ok: true, draft });
  } catch (err: any) {
    console.error("[Hermes API] draft error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

/** GET /api/hermes/referrals — List all referrals */
hermesRouter.get("/referrals", async (req, res) => {
  try {
    const status = req.query.status as string | undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
    const referrals = await getReferrals({ status, limit });
    res.json({ ok: true, referrals });
  } catch (err: any) {
    console.error("[Hermes API] referrals list error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

/** GET /api/hermes/claims — List all business claims */
hermesRouter.get("/claims", async (req, res) => {
  try {
    const status = req.query.status as string | undefined;
    const claims = await getBusinessClaims({ status });
    res.json({ ok: true, claims });
  } catch (err: any) {
    console.error("[Hermes API] claims list error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

/** GET /api/hermes/events — List events */
hermesRouter.get("/events", async (req, res) => {
  try {
    const includeAll = req.query.all === "true";
    const events = includeAll ? await getAllEvents() : await getPublishedEvents();
    res.json({ ok: true, events });
  } catch (err: any) {
    console.error("[Hermes API] events list error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

/** GET /api/hermes/blog — List recent blog posts */
hermesRouter.get("/blog", async (req, res) => {
  try {
    const days = req.query.days ? parseInt(req.query.days as string, 10) : 90;
    const posts = await getRecentBlogPosts(days);
    res.json({ ok: true, posts });
  } catch (err: any) {
    console.error("[Hermes API] blog list error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── WRITE endpoints ────────────────────────────────────────────────────────

/** POST /api/hermes/referrals/:id — Update a referral */
hermesRouter.post("/referrals/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid referral ID" });

    const { status, adminNotes, leadScore, leadPriority, nextAction, nextActionDueAt } = req.body;

    // Update status + adminNotes via existing helper
    if (status) {
      const validStatuses = ["new", "contacted", "matched", "closed", "lost"];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` });
      }
      await updateReferralStatus(id, status, adminNotes);
    }

    // Update lead ops fields directly if provided
    if (leadScore !== undefined || leadPriority !== undefined || nextAction !== undefined || nextActionDueAt !== undefined) {
      const { getDb } = await import("./db");
      const { referrals } = await import("../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      const db = await (getDb as any)();
      if (!db) return res.status(500).json({ error: "Database not available" });

      const updates: Record<string, any> = {};
      if (leadScore !== undefined) updates.leadScore = leadScore;
      if (leadPriority !== undefined) {
        const validPriorities = ["hot", "qualified", "nurture", "early", "low"];
        if (!validPriorities.includes(leadPriority)) {
          return res.status(400).json({ error: `Invalid leadPriority. Must be one of: ${validPriorities.join(", ")}` });
        }
        updates.leadPriority = leadPriority;
      }
      if (nextAction !== undefined) updates.nextAction = nextAction;
      if (nextActionDueAt !== undefined) updates.nextActionDueAt = new Date(nextActionDueAt);

      await db.update(referrals).set(updates).where(eq(referrals.id, id));
    }

    console.log(`[Hermes API] Updated referral ${id}: ${JSON.stringify(req.body)}`);
    res.json({ ok: true, id, updated: req.body });
  } catch (err: any) {
    console.error("[Hermes API] referral update error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

/** POST /api/hermes/claims/:id — Update a business claim */
hermesRouter.post("/claims/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid claim ID" });

    const { status, adminNotes } = req.body;
    const validStatuses = ["pending", "approved", "rejected"];
    if (!status) {
      return res.status(400).json({ error: "Claim status is required" });
    }
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` });
    }
    if (status === "approved") {
      return res.status(403).json({
        error: "Claim approval requires an authenticated administrator in the admin portal",
      });
    }

    await updateBusinessClaimStatus(id, status, adminNotes);
    console.log(`[Hermes API] Updated claim ${id}: status=${status}, notes=${adminNotes}`);
    res.json({ ok: true, id, updated: { status, adminNotes } });
  } catch (err: any) {
    console.error("[Hermes API] claim update error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

/** POST /api/hermes/events/:id — Update an existing event */
hermesRouter.post("/events/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid event ID" });

    const existing = await getEventById(id);
    if (!existing) return res.status(404).json({ error: "Event not found" });

    const allowedFields = [
      "title", "name", "description", "startDate", "endDate", "startDateStr", "endDateStr",
      "venueName", "venueAddress", "venue", "venueArea", "neighborhood", "externalUrl",
      "imageUrl", "organizer", "organizerWebsite", "recurringPattern", "sourceUrl",
      "category", "cost", "rsvpUrl", "isFeatured", "isRecurring", "status", "active",
      "newcomerFriendly", "type",
    ];

    const updates: Record<string, any> = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        if (field === "startDate" || field === "endDate") {
          updates[field] = new Date(req.body[field]);
        } else if (field === "active" || field === "newcomerFriendly" || field === "sourceVerified") {
          updates[field] = Boolean(req.body[field]);
        } else {
          updates[field] = req.body[field];
        }
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "No valid fields to update" });
    }

    await updateEvent(id, updates);
    console.log(`[Hermes API] Updated event ${id}: ${JSON.stringify(updates)}`);
    res.json({ ok: true, id, updated: updates });
  } catch (err: any) {
    console.error("[Hermes API] event update error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

/** POST /api/hermes/events — Create a new event */
hermesRouter.post("/events", async (req, res) => {
  try {
    const { title, description, startDate, endDate, venueName, venueAddress, neighborhood, externalUrl, category, isRecurring } = req.body;

    if (!title || !category) {
      return res.status(400).json({ error: "Missing required fields: title, category" });
    }

    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") + "-" + Date.now().toString(36);

    const eventData: any = {
      title,
      slug,
      description: description || null,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      venueName: venueName || null,
      venueAddress: venueAddress || null,
      neighborhood: neighborhood || null,
      externalUrl: externalUrl || null,
      category,
      isRecurring: isRecurring || "no",
      status: "published",
    };

    // Copy additional optional fields
    const optionalFields = ["name", "type", "venue", "venueArea", "organizer", "organizerWebsite",
      "recurringPattern", "sourceUrl", "cost", "rsvpUrl", "imageUrl", "newcomerFriendly", "startDateStr", "endDateStr"];
    for (const field of optionalFields) {
      if (req.body[field] !== undefined) {
        eventData[field] = req.body[field];
      }
    }

    await createEvent(eventData);
    console.log(`[Hermes API] Created event: ${title} (/${slug})`);
    res.json({ ok: true, slug, title });
  } catch (err: any) {
    console.error("[Hermes API] event create error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

/** POST /api/hermes/blog — Create or update a blog post (upsert by slug) */
hermesRouter.post("/blog", async (req, res) => {
  try {
    const { slug, title, content, excerpt, category, coverImage, status, readTime, publishedAt } = req.body;

    if (!slug || !title || !content) {
      return res.status(400).json({ error: "Missing required fields: slug, title, content" });
    }

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

    console.log(`[Hermes API] Blog upsert: ${slug} (${post.action})`);
    res.json({ ok: true, action: post.action, slug });
  } catch (err: any) {
    console.error("[Hermes API] blog upsert error:", err.message);
    res.status(500).json({ error: err.message });
  }
});
