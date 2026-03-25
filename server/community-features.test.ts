import { describe, it, expect } from "vitest";

// Test the database schema exports
import {
  passportEntries,
  wishlists,
  comments,
  commentVotes,
  blogPosts,
  bingoCards,
  bingoProgress,
} from "../drizzle/schema";

// Test DB helpers
import {
  getPassportEntries,
  addPassportEntry,
  deletePassportEntry,
  getWishlistEntries,
  addWishlistEntry,
  removeWishlistEntry,
  getComments,
  addComment,
  deleteComment,
  voteComment,
  getPublishedBlogPosts,
  getBlogPostBySlug,
  createBlogPost,
  updateBlogPost,
  deleteBlogPost,
} from "../server/db";

describe("Database Schema - Community Tables", () => {
  it("passport_entries table has required columns", () => {
    const cols = Object.keys(passportEntries);
    expect(cols).toContain("id");
    expect(cols).toContain("userId");
    expect(cols).toContain("serviceKey");
    expect(cols).toContain("visitedAt");
  });

  it("wishlists table has required columns", () => {
    const cols = Object.keys(wishlists);
    expect(cols).toContain("id");
    expect(cols).toContain("userId");
    expect(cols).toContain("serviceKey");
  });

  it("comments table has required columns", () => {
    const cols = Object.keys(comments);
    expect(cols).toContain("id");
    expect(cols).toContain("userId");
    expect(cols).toContain("targetType");
    expect(cols).toContain("targetId");
    expect(cols).toContain("content");
    expect(cols).toContain("parentId");
    expect(cols).toContain("upvotes");
    expect(cols).toContain("downvotes");
  });

  it("comment_votes table has required columns", () => {
    const cols = Object.keys(commentVotes);
    expect(cols).toContain("id");
    expect(cols).toContain("userId");
    expect(cols).toContain("commentId");
    expect(cols).toContain("voteType");
  });

  it("blog_posts table has required columns", () => {
    const cols = Object.keys(blogPosts);
    expect(cols).toContain("id");
    expect(cols).toContain("title");
    expect(cols).toContain("slug");
    expect(cols).toContain("content");
    expect(cols).toContain("status");
    expect(cols).toContain("authorId");
    expect(cols).toContain("publishedAt");
  });

  it("bingo_cards table has required columns", () => {
    const cols = Object.keys(bingoCards);
    expect(cols).toContain("id");
    expect(cols).toContain("title");
    expect(cols).toContain("theme");
    expect(cols).toContain("squaresJson");
  });

  it("bingo_progress table has required columns", () => {
    const cols = Object.keys(bingoProgress);
    expect(cols).toContain("id");
    expect(cols).toContain("userId");
    expect(cols).toContain("cardId");
    expect(cols).toContain("completedSquaresJson");
  });
});

describe("DB Helpers - Passport", () => {
  it("getPassportEntries is a function", () => {
    expect(typeof getPassportEntries).toBe("function");
  });

  it("addPassportEntry is a function", () => {
    expect(typeof addPassportEntry).toBe("function");
  });

  it("deletePassportEntry is a function", () => {
    expect(typeof deletePassportEntry).toBe("function");
  });
});

describe("DB Helpers - Wishlist", () => {
  it("getWishlistEntries is a function", () => {
    expect(typeof getWishlistEntries).toBe("function");
  });

  it("addWishlistEntry is a function", () => {
    expect(typeof addWishlistEntry).toBe("function");
  });

  it("removeWishlistEntry is a function", () => {
    expect(typeof removeWishlistEntry).toBe("function");
  });
});

describe("DB Helpers - Comments", () => {
  it("getComments is a function", () => {
    expect(typeof getComments).toBe("function");
  });

  it("addComment is a function", () => {
    expect(typeof addComment).toBe("function");
  });

  it("deleteComment is a function", () => {
    expect(typeof deleteComment).toBe("function");
  });

  it("voteComment is a function", () => {
    expect(typeof voteComment).toBe("function");
  });
});

describe("DB Helpers - Blog", () => {
  it("getPublishedBlogPosts is a function", () => {
    expect(typeof getPublishedBlogPosts).toBe("function");
  });

  it("getBlogPostBySlug is a function", () => {
    expect(typeof getBlogPostBySlug).toBe("function");
  });

  it("createBlogPost is a function", () => {
    expect(typeof createBlogPost).toBe("function");
  });

  it("updateBlogPost is a function", () => {
    expect(typeof updateBlogPost).toBe("function");
  });

  it("deleteBlogPost is a function", () => {
    expect(typeof deleteBlogPost).toBe("function");
  });
});
