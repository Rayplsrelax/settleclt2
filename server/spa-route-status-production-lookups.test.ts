import { beforeEach, describe, expect, it, vi } from "vitest";

const { getBlogPostBySlug, getTagBySlug } = vi.hoisted(() => ({
  getBlogPostBySlug: vi.fn(),
  getTagBySlug: vi.fn(),
}));

vi.mock("./db", () => ({ getBlogPostBySlug, getTagBySlug }));

import { getProductionLookups } from "./_core/spa-route-status";

describe("production published-blog lookup contract", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns the title only for a published row", async () => {
    getBlogPostBySlug.mockResolvedValue({
      slug: "published-post",
      title: "Published Fixture Title",
      status: "published",
    });
    const lookups = await getProductionLookups();
    await expect(lookups.getPublishedBlog("published-post")).resolves.toEqual({
      title: "Published Fixture Title",
    });
  });

  it.each([
    ["draft", { slug: "draft-post", title: "Draft Fixture Title", status: "draft" }],
    ["missing", undefined],
  ])("returns null for a %s row without leaking its title", async (_label, row) => {
    getBlogPostBySlug.mockResolvedValue(row);
    const lookups = await getProductionLookups();
    await expect(lookups.getPublishedBlog("fixture-post")).resolves.toBeNull();
  });
});
