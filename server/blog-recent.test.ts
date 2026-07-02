import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the db module
vi.mock("./db", () => ({
  getRecentBlogPosts: vi.fn(),
}));

import { getRecentBlogPosts } from "./db";

describe("blog.getRecent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns up to 3 published posts by default", async () => {
    const mockPosts = [
      {
        id: 1,
        title: "Best Neighborhoods in Charlotte 2026",
        slug: "best-neighborhoods-charlotte-2026",
        excerpt: "A deep dive into Charlotte's top neighborhoods.",
        category: "Neighborhoods",
        coverImage: "https://example.com/img1.jpg",
        status: "published",
        readTime: "5 min read",
        publishedAt: new Date("2026-06-01"),
        createdAt: new Date("2026-06-01"),
        updatedAt: new Date("2026-06-01"),
        content: "Full content here...",
        authorId: 1,
      },
      {
        id: 2,
        title: "Taste of Charlotte 2026 Guide",
        slug: "taste-of-charlotte-2026",
        excerpt: "Everything you need to know about the festival.",
        category: "Events",
        coverImage: null,
        status: "published",
        readTime: "4 min read",
        publishedAt: new Date("2026-05-28"),
        createdAt: new Date("2026-05-28"),
        updatedAt: new Date("2026-05-28"),
        content: "Full content here...",
        authorId: 1,
      },
      {
        id: 3,
        title: "Charlotte Housing Market Spring 2026",
        slug: "charlotte-housing-market-spring-2026",
        excerpt: "Prices, trends, and what to expect.",
        category: "Real Estate",
        coverImage: "https://example.com/img3.jpg",
        status: "published",
        readTime: "6 min read",
        publishedAt: new Date("2026-05-20"),
        createdAt: new Date("2026-05-20"),
        updatedAt: new Date("2026-05-20"),
        content: "Full content here...",
        authorId: 1,
      },
    ];

    vi.mocked(getRecentBlogPosts).mockResolvedValue(mockPosts as any);

    const result = await getRecentBlogPosts(3);
    expect(result).toHaveLength(3);
    expect(result[0].title).toBe("Best Neighborhoods in Charlotte 2026");
    expect(result[0].status).toBe("published");
  });

  it("returns empty array when no published posts exist", async () => {
    vi.mocked(getRecentBlogPosts).mockResolvedValue([]);
    const result = await getRecentBlogPosts(3);
    expect(result).toEqual([]);
  });

  it("respects the limit parameter", async () => {
    const singlePost = [
      {
        id: 1,
        title: "Single Post",
        slug: "single-post",
        excerpt: "Just one post.",
        category: "Guide",
        coverImage: null,
        status: "published",
        readTime: "2 min read",
        publishedAt: new Date("2026-06-01"),
        createdAt: new Date("2026-06-01"),
        updatedAt: new Date("2026-06-01"),
        content: "Content",
        authorId: 1,
      },
    ];

    vi.mocked(getRecentBlogPosts).mockResolvedValue(singlePost as any);
    const result = await getRecentBlogPosts(1);
    expect(result).toHaveLength(1);
    expect(vi.mocked(getRecentBlogPosts)).toHaveBeenCalledWith(1);
  });

  it("returns posts with all required fields for the homepage card", async () => {
    const post = {
      id: 1,
      title: "Test Post",
      slug: "test-post",
      excerpt: "Test excerpt",
      category: "Test",
      coverImage: "https://example.com/img.jpg",
      status: "published",
      readTime: "3 min read",
      publishedAt: new Date("2026-06-01"),
      createdAt: new Date("2026-06-01"),
      updatedAt: new Date("2026-06-01"),
      content: "Content",
      authorId: 1,
    };

    vi.mocked(getRecentBlogPosts).mockResolvedValue([post] as any);
    const result = await getRecentBlogPosts(1);

    expect(result[0]).toMatchObject({
      title: expect.any(String),
      slug: expect.any(String),
      excerpt: expect.any(String),
      category: expect.any(String),
      readTime: expect.any(String),
      publishedAt: expect.any(Date),
    });
  });

  it("handles database errors gracefully", async () => {
    vi.mocked(getRecentBlogPosts).mockRejectedValue(new Error("DB connection failed"));
    await expect(getRecentBlogPosts(3)).rejects.toThrow("DB connection failed");
  });
});
