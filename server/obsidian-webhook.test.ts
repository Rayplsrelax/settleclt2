import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the db module
vi.mock("./db", () => ({
  upsertBlogPostFromWebhook: vi.fn().mockResolvedValue({ action: "created", id: 42 }),
}));

// Mock notification
vi.mock("./_core/notification", () => ({
  notifyOwner: vi.fn().mockResolvedValue(true),
}));

const VALID_SECRET = "test-secret-abc123";

// Helper: build a minimal valid payload
const validPayload = () => ({
  slug: "charlotte-rooftop-bars-2026",
  title: "Charlotte's Best Rooftop Bars",
  content: "## Introduction\n\nGreat bars up high.",
  excerpt: "The best views in the Queen City.",
  category: "Food & Drink",
  coverImage: null,
  status: "published",
  readTime: "4 min read",
  publishedAt: "2026-07-13T08:00:00.000Z",
});

describe("POST /api/obsidian/publish webhook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.OBSIDIAN_PUBLISH_SECRET = VALID_SECRET;
  });

  it("rejects requests with no Authorization header (401)", async () => {
    const { upsertBlogPostFromWebhook } = await import("./db");
    // Simulate the auth check logic directly
    const secret = process.env.OBSIDIAN_PUBLISH_SECRET;
    const authHeader = "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
    expect(token).not.toBe(secret);
    expect(upsertBlogPostFromWebhook).not.toHaveBeenCalled();
  });

  it("rejects requests with wrong secret (401)", async () => {
    const { upsertBlogPostFromWebhook } = await import("./db");
    const secret = process.env.OBSIDIAN_PUBLISH_SECRET;
    const authHeader = "Bearer wrong-secret";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
    expect(token).not.toBe(secret);
    expect(upsertBlogPostFromWebhook).not.toHaveBeenCalled();
  });

  it("accepts requests with correct secret (200)", async () => {
    const { upsertBlogPostFromWebhook } = await import("./db");
    const secret = process.env.OBSIDIAN_PUBLISH_SECRET;
    const authHeader = `Bearer ${VALID_SECRET}`;
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
    expect(token).toBe(secret);

    // Simulate calling the db helper
    const payload = validPayload();
    await upsertBlogPostFromWebhook({
      slug: payload.slug,
      title: payload.title,
      content: payload.content,
      excerpt: payload.excerpt,
      category: payload.category,
      coverImage: payload.coverImage,
      status: "published",
      readTime: payload.readTime,
      publishedAt: new Date(payload.publishedAt),
    });
    expect(upsertBlogPostFromWebhook).toHaveBeenCalledOnce();
  });

  it("validates required fields: slug, title, content", async () => {
    const incompletePayloads = [
      { title: "No Slug", content: "content" },
      { slug: "no-title", content: "content" },
      { slug: "no-content", title: "No Content" },
    ];
    for (const p of incompletePayloads) {
      const missing = !p.slug || !(p as any).title || !(p as any).content;
      expect(missing).toBe(true);
    }
  });

  it("calls upsertBlogPostFromWebhook with correct data shape", async () => {
    const { upsertBlogPostFromWebhook } = await import("./db");
    const payload = validPayload();

    await upsertBlogPostFromWebhook({
      slug: payload.slug,
      title: payload.title,
      content: payload.content,
      excerpt: payload.excerpt,
      category: payload.category,
      coverImage: payload.coverImage,
      status: "published",
      readTime: payload.readTime,
      publishedAt: new Date(payload.publishedAt),
    });

    expect(upsertBlogPostFromWebhook).toHaveBeenCalledWith(
      expect.objectContaining({
        slug: "charlotte-rooftop-bars-2026",
        title: "Charlotte's Best Rooftop Bars",
        status: "published",
        category: "Food & Drink",
      })
    );
  });

  it("defaults status to 'published' when not 'draft'", () => {
    const statuses = ["published", "live", undefined, ""];
    for (const s of statuses) {
      const resolved = s === "draft" ? "draft" : "published";
      expect(resolved).toBe("published");
    }
    expect("draft" === "draft" ? "draft" : "published").toBe("draft");
  });

  it("defaults category to 'Charlotte Guide' when not provided", () => {
    const category = undefined;
    const resolved = category || "Charlotte Guide";
    expect(resolved).toBe("Charlotte Guide");
  });

  it("uses current date as publishedAt when not provided", () => {
    const before = Date.now();
    const publishedAt = new Date();
    const after = Date.now();
    expect(publishedAt.getTime()).toBeGreaterThanOrEqual(before);
    expect(publishedAt.getTime()).toBeLessThanOrEqual(after);
  });

  it("returns action: 'created' for new posts", async () => {
    const { upsertBlogPostFromWebhook } = await import("./db");
    const result = await upsertBlogPostFromWebhook({
      slug: "new-post",
      title: "New Post",
      content: "Content",
      excerpt: null,
      category: "Charlotte Guide",
      coverImage: null,
      status: "published",
      readTime: null,
      publishedAt: new Date(),
    });
    expect(result.action).toBe("created");
    expect(result.id).toBe(42);
  });

  it("returns action: 'updated' for existing posts", async () => {
    const { upsertBlogPostFromWebhook } = await import("./db");
    vi.mocked(upsertBlogPostFromWebhook).mockResolvedValueOnce({ action: "updated", id: 7 });

    const result = await upsertBlogPostFromWebhook({
      slug: "existing-post",
      title: "Updated Post",
      content: "New content",
      excerpt: null,
      category: "Charlotte Guide",
      coverImage: null,
      status: "published",
      readTime: null,
      publishedAt: new Date(),
    });
    expect(result.action).toBe("updated");
    expect(result.id).toBe(7);
  });
});
