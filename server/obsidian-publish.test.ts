import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("./db", () => ({
  createBlogPost: vi.fn(),
  updateBlogPost: vi.fn(),
  getBlogPostBySlug: vi.fn(),
}));

import { createBlogPost, updateBlogPost, getBlogPostBySlug } from "./db";
import { publishObsidianPost, isValidPublishSecret } from "./obsidian-publish";

describe("Obsidian publish endpoint logic", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.OBSIDIAN_PUBLISH_SECRET;
    delete process.env.OBSIDIAN_PUBLISH_AUTHOR_ID;
  });

  it("accepts only the configured publish secret", () => {
    process.env.OBSIDIAN_PUBLISH_SECRET = "super-secret";

    expect(isValidPublishSecret("super-secret")).toBe(true);
    expect(isValidPublishSecret("wrong-secret")).toBe(false);
    expect(isValidPublishSecret(undefined)).toBe(false);
  });

  it("creates a published blog post from Obsidian frontmatter", async () => {
    process.env.OBSIDIAN_PUBLISH_AUTHOR_ID = "7";
    vi.mocked(getBlogPostBySlug).mockResolvedValue(undefined);
    vi.mocked(createBlogPost).mockResolvedValue({ success: true } as any);

    const result = await publishObsidianPost({
      title: "Charlotte Rooftop Bars",
      slug: "charlotte-rooftop-bars",
      publish: true,
      status: "published",
      publishedAt: "2026-07-18",
      category: "Food & Drink",
      excerpt: "A rooftop guide.",
      coverImage: "https://cdn.example.com/roof.jpg",
      readTime: "5 min read",
      content: "## Intro\nGreat views.",
    });

    expect(result).toMatchObject({ success: true, action: "created", slug: "charlotte-rooftop-bars" });
    expect(createBlogPost).toHaveBeenCalledWith(expect.objectContaining({
      title: "Charlotte Rooftop Bars",
      slug: "charlotte-rooftop-bars",
      content: "## Intro\nGreat views.",
      category: "Food & Drink",
      excerpt: "A rooftop guide.",
      coverImage: "https://cdn.example.com/roof.jpg",
      readTime: "5 min read",
      status: "published",
      authorId: 7,
      publishedAt: expect.any(Date),
    }));
    expect(updateBlogPost).not.toHaveBeenCalled();
  });

  it("updates an existing post matched by slug", async () => {
    vi.mocked(getBlogPostBySlug).mockResolvedValue({ id: 42, slug: "existing-post" } as any);
    vi.mocked(updateBlogPost).mockResolvedValue({ success: true } as any);

    const result = await publishObsidianPost({
      title: "Existing Post Updated",
      slug: "existing-post",
      publish: true,
      status: "draft",
      excerpt: "Updated excerpt.",
      content: "Updated content.",
    });

    expect(result).toMatchObject({ success: true, action: "updated", slug: "existing-post" });
    expect(updateBlogPost).toHaveBeenCalledWith(42, expect.objectContaining({
      title: "Existing Post Updated",
      slug: "existing-post",
      status: "draft",
      publishedAt: null,
    }));
    expect(createBlogPost).not.toHaveBeenCalled();
  });

  it("turns publish:false into an unpublish update for an existing post", async () => {
    vi.mocked(getBlogPostBySlug).mockResolvedValue({ id: 9, slug: "hide-me" } as any);
    vi.mocked(updateBlogPost).mockResolvedValue({ success: true } as any);

    const result = await publishObsidianPost({
      title: "Hide Me",
      slug: "hide-me",
      publish: false,
      content: "Keep the draft in DB.",
    });

    expect(result).toMatchObject({ success: true, action: "unpublished", slug: "hide-me" });
    expect(updateBlogPost).toHaveBeenCalledWith(9, expect.objectContaining({
      status: "draft",
      publishedAt: null,
    }));
    expect(createBlogPost).not.toHaveBeenCalled();
  });

  it("skips publish:false for a post that is not already in the database", async () => {
    vi.mocked(getBlogPostBySlug).mockResolvedValue(undefined);

    const result = await publishObsidianPost({
      title: "Not Ready",
      slug: "not-ready",
      publish: false,
      content: "Draft only.",
    });

    expect(result).toMatchObject({ success: true, action: "skipped", slug: "not-ready" });
    expect(createBlogPost).not.toHaveBeenCalled();
    expect(updateBlogPost).not.toHaveBeenCalled();
  });

  it("derives a slug from title when slug is omitted", async () => {
    vi.mocked(getBlogPostBySlug).mockResolvedValue(undefined);
    vi.mocked(createBlogPost).mockResolvedValue({ success: true } as any);

    const result = await publishObsidianPost({
      title: "Charlotte's Best Rooftop Bars in 2026!",
      publish: true,
      status: "published",
      content: "Content.",
    });

    expect(result.slug).toBe("charlottes-best-rooftop-bars-in-2026");
    expect(createBlogPost).toHaveBeenCalledWith(expect.objectContaining({
      slug: "charlottes-best-rooftop-bars-in-2026",
    }));
  });
});
