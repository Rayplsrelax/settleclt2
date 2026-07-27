import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock ENV
vi.mock("./_core/env", () => ({
  ENV: {
    hermesApiSecret: "test-hermes-secret-token-64chars-abcdefghijklmnopqrstuvwxyz123456",
  },
}));

// Mock db functions
vi.mock("./db", () => ({
  getReferrals: vi.fn().mockResolvedValue([]),
  updateReferralStatus: vi.fn().mockResolvedValue({ success: true }),
  getBusinessClaims: vi.fn().mockResolvedValue([]),
  updateBusinessClaimStatus: vi.fn().mockResolvedValue({ success: true }),
  getAllEvents: vi.fn().mockResolvedValue([
    { id: 1, title: "Test Event", slug: "test-event", category: "music", status: "published" },
  ]),
  getPublishedEvents: vi.fn().mockResolvedValue([
    { id: 1, title: "Test Event", slug: "test-event", category: "music", status: "published" },
  ]),
  updateEvent: vi.fn().mockResolvedValue({ success: true }),
  createEvent: vi.fn().mockResolvedValue({ id: 99 }),
  getEventById: vi.fn().mockResolvedValue({ id: 1, title: "Test Event" }),
  getAllPremiumListings: vi.fn().mockResolvedValue([]),
  getRecentBlogPosts: vi.fn().mockResolvedValue([
    { id: 1, title: "Test Post", slug: "test-post", status: "published" },
  ]),
  upsertBlogPostFromWebhook: vi.fn().mockResolvedValue({ action: "created" }),
  getDb: vi.fn().mockResolvedValue({
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      }),
    }),
  }),
}));

// Mock shared/hermesRevenueOps
vi.mock("../shared/hermesRevenueOps", () => ({
  generateHermesRevenueTasks: vi.fn().mockReturnValue([
    { id: "microsite-movingtocharlotteguide.com", type: "microsite_launch", title: "Launch movingtocharlotteguide.com", priority: "medium", sendAutomatically: false, nextAction: "Verify DNS" },
  ]),
  buildHermesRevenueOpsSummary: vi.fn().mockReturnValue({
    generatedAt: "2026-07-27T00:00:00.000Z",
    estimatedListingMrr: 0,
    openRealtorLeads: 0,
    hotRealtorLeads: 0,
    pendingClaims: 0,
    dueTasks: 1,
  }),
  createHermesRevenueDraft: vi.fn().mockReturnValue({
    subject: "Launch movingtocharlotteguide.com",
    body: "Verify DNS and HTTPS for movingtocharlotteguide.com",
  }),
}));

import express from "express";
import request from "supertest";
import { hermesRouter } from "./hermes-api";

const app = express();
app.use(express.json());
app.use("/api/hermes", hermesRouter);

const VALID_TOKEN = "test-hermes-secret-token-64chars-abcdefghijklmnopqrstuvwxyz123456";

describe("Hermes API", () => {
  describe("Authentication", () => {
    it("rejects requests without Authorization header", async () => {
      const res = await request(app).get("/api/hermes/snapshot");
      expect(res.status).toBe(401);
      expect(res.body.error).toContain("Unauthorized");
    });

    it("rejects requests with invalid Bearer token", async () => {
      const res = await request(app)
        .get("/api/hermes/snapshot")
        .set("Authorization", "Bearer wrong-token");
      expect(res.status).toBe(401);
      expect(res.body.error).toContain("Unauthorized");
    });

    it("accepts requests with valid Bearer token", async () => {
      const res = await request(app)
        .get("/api/hermes/snapshot")
        .set("Authorization", `Bearer ${VALID_TOKEN}`);
      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
    });
  });

  describe("READ endpoints", () => {
    it("GET /snapshot returns summary and tasks", async () => {
      const res = await request(app)
        .get("/api/hermes/snapshot")
        .set("Authorization", `Bearer ${VALID_TOKEN}`);
      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.summary).toBeDefined();
      expect(res.body.tasks).toBeInstanceOf(Array);
    });

    it("GET /tasks returns tasks array", async () => {
      const res = await request(app)
        .get("/api/hermes/tasks")
        .set("Authorization", `Bearer ${VALID_TOKEN}`);
      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.tasks).toBeInstanceOf(Array);
      expect(res.body.tasks.length).toBeGreaterThan(0);
    });

    it("GET /draft/:taskId returns draft for valid task", async () => {
      const res = await request(app)
        .get("/api/hermes/draft/microsite-movingtocharlotteguide.com")
        .set("Authorization", `Bearer ${VALID_TOKEN}`);
      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.draft).toBeDefined();
      expect(res.body.draft.subject).toBeDefined();
    });

    it("GET /draft/:taskId returns 404 for invalid task", async () => {
      const res = await request(app)
        .get("/api/hermes/draft/nonexistent-task")
        .set("Authorization", `Bearer ${VALID_TOKEN}`);
      expect(res.status).toBe(404);
      expect(res.body.error).toContain("Task not found");
    });

    it("GET /referrals returns referrals list", async () => {
      const res = await request(app)
        .get("/api/hermes/referrals")
        .set("Authorization", `Bearer ${VALID_TOKEN}`);
      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.referrals).toBeInstanceOf(Array);
    });

    it("GET /claims returns claims list", async () => {
      const res = await request(app)
        .get("/api/hermes/claims")
        .set("Authorization", `Bearer ${VALID_TOKEN}`);
      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.claims).toBeInstanceOf(Array);
    });

    it("GET /events returns events list", async () => {
      const res = await request(app)
        .get("/api/hermes/events")
        .set("Authorization", `Bearer ${VALID_TOKEN}`);
      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.events).toBeInstanceOf(Array);
    });

    it("GET /blog returns blog posts", async () => {
      const res = await request(app)
        .get("/api/hermes/blog")
        .set("Authorization", `Bearer ${VALID_TOKEN}`);
      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.posts).toBeInstanceOf(Array);
    });
  });

  describe("WRITE endpoints", () => {
    it("POST /referrals/:id updates referral status", async () => {
      const { updateReferralStatus } = await import("./db");
      const res = await request(app)
        .post("/api/hermes/referrals/1")
        .set("Authorization", `Bearer ${VALID_TOKEN}`)
        .send({ status: "contacted", adminNotes: "Called by Hermes" });
      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(updateReferralStatus).toHaveBeenCalledWith(1, "contacted", "Called by Hermes");
    });

    it("POST /referrals/:id rejects invalid status", async () => {
      const res = await request(app)
        .post("/api/hermes/referrals/1")
        .set("Authorization", `Bearer ${VALID_TOKEN}`)
        .send({ status: "invalid_status" });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain("Invalid status");
    });

    it("POST /referrals/:id rejects invalid ID", async () => {
      const res = await request(app)
        .post("/api/hermes/referrals/abc")
        .set("Authorization", `Bearer ${VALID_TOKEN}`)
        .send({ status: "contacted" });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain("Invalid referral ID");
    });

    it("POST /claims/:id updates claim status", async () => {
      const { updateBusinessClaimStatus } = await import("./db");
      const res = await request(app)
        .post("/api/hermes/claims/5")
        .set("Authorization", `Bearer ${VALID_TOKEN}`)
        .send({ status: "approved", adminNotes: "Verified by Hermes" });
      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(updateBusinessClaimStatus).toHaveBeenCalledWith(5, "approved", "Verified by Hermes");
    });

    it("POST /claims/:id rejects invalid status", async () => {
      const res = await request(app)
        .post("/api/hermes/claims/5")
        .set("Authorization", `Bearer ${VALID_TOKEN}`)
        .send({ status: "invalid" });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain("Invalid status");
    });

    it("POST /events/:id updates an event", async () => {
      const { updateEvent } = await import("./db");
      const res = await request(app)
        .post("/api/hermes/events/1")
        .set("Authorization", `Bearer ${VALID_TOKEN}`)
        .send({ title: "Updated Event", category: "food" });
      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(updateEvent).toHaveBeenCalled();
    });

    it("POST /events/:id returns 400 for no valid fields", async () => {
      const res = await request(app)
        .post("/api/hermes/events/1")
        .set("Authorization", `Bearer ${VALID_TOKEN}`)
        .send({ invalidField: "value" });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain("No valid fields");
    });

    it("POST /events creates a new event", async () => {
      const { createEvent } = await import("./db");
      const res = await request(app)
        .post("/api/hermes/events")
        .set("Authorization", `Bearer ${VALID_TOKEN}`)
        .send({
          title: "New Hermes Event",
          category: "community",
          description: "Created by Hermes agent",
          startDate: "2026-08-01T18:00:00Z",
          venueName: "Settle CLT HQ",
        });
      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.title).toBe("New Hermes Event");
      expect(createEvent).toHaveBeenCalled();
    });

    it("POST /events rejects missing required fields", async () => {
      const res = await request(app)
        .post("/api/hermes/events")
        .set("Authorization", `Bearer ${VALID_TOKEN}`)
        .send({ description: "No title or category" });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain("Missing required fields");
    });

    it("POST /blog creates a blog post", async () => {
      const { upsertBlogPostFromWebhook } = await import("./db");
      const res = await request(app)
        .post("/api/hermes/blog")
        .set("Authorization", `Bearer ${VALID_TOKEN}`)
        .send({
          slug: "hermes-test-post",
          title: "Hermes Test Post",
          content: "# Test\n\nContent from Hermes.",
          category: "Charlotte Guide",
        });
      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.action).toBe("created");
      expect(upsertBlogPostFromWebhook).toHaveBeenCalled();
    });

    it("POST /blog rejects missing required fields", async () => {
      const res = await request(app)
        .post("/api/hermes/blog")
        .set("Authorization", `Bearer ${VALID_TOKEN}`)
        .send({ title: "No slug or content" });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain("Missing required fields");
    });
  });
});
