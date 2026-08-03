import { describe, it, expect } from "vitest";

describe("Editorial Ops System", () => {
  it("editorialOpsRouter exports expected procedures", async () => {
    const { editorialOpsRouter } = await import("./editorialOpsRouter");
    const procedures = Object.keys(editorialOpsRouter._def.procedures);
    expect(procedures).toContain("summary");
    expect(procedures).toContain("stalePosts");
    expect(procedures).toContain("drafts");
    expect(procedures).toContain("byCategory");
  });

  it("appRouter includes editorialOps router", async () => {
    const { appRouter } = await import("./routers");
    expect(appRouter._def.procedures).toHaveProperty("editorialOps.summary");
    expect(appRouter._def.procedures).toHaveProperty("editorialOps.stalePosts");
    expect(appRouter._def.procedures).toHaveProperty("editorialOps.drafts");
    expect(appRouter._def.procedures).toHaveProperty("editorialOps.byCategory");
  });

  it("editorial-ops module exports expected functions", async () => {
    const mod = await import("./editorial-ops");
    expect(typeof mod.getBlogOpsSummary).toBe("function");
    expect(typeof mod.getStalePosts).toBe("function");
    expect(typeof mod.getDraftPosts).toBe("function");
    expect(typeof mod.getPostsByCategory).toBe("function");
  });
});

describe("Community Ops System", () => {
  it("communityOpsRouter exports expected procedures", async () => {
    const { communityOpsRouter } = await import("./communityOpsRouter");
    const procedures = Object.keys(communityOpsRouter._def.procedures);
    expect(procedures).toContain("summary");
    expect(procedures).toContain("submissions");
    expect(procedures).toContain("submissionStats");
    expect(procedures).toContain("reviews");
    expect(procedures).toContain("hiddenReviews");
    expect(procedures).toContain("comments");
    expect(procedures).toContain("deletedComments");
  });

  it("appRouter includes communityOps router", async () => {
    const { appRouter } = await import("./routers");
    expect(appRouter._def.procedures).toHaveProperty("communityOps.summary");
    expect(appRouter._def.procedures).toHaveProperty("communityOps.submissions");
    expect(appRouter._def.procedures).toHaveProperty("communityOps.reviews");
    expect(appRouter._def.procedures).toHaveProperty("communityOps.comments");
  });

  it("community-ops module exports expected functions", async () => {
    const mod = await import("./community-ops");
    expect(typeof mod.getSubmissionQueue).toBe("function");
    expect(typeof mod.getSubmissionStats).toBe("function");
    expect(typeof mod.getReviewQueue).toBe("function");
    expect(typeof mod.getHiddenReviews).toBe("function");
    expect(typeof mod.getCommentQueue).toBe("function");
    expect(typeof mod.getDeletedComments).toBe("function");
    expect(typeof mod.getModerationSummary).toBe("function");
  });
});

describe("Source Registry System", () => {
  it("sourceRegistryRouter exports expected procedures", async () => {
    const { sourceRegistryRouter } = await import("./sourceRegistryRouter");
    const procedures = Object.keys(sourceRegistryRouter._def.procedures);
    expect(procedures).toContain("stats");
    expect(procedures).toContain("list");
    expect(procedures).toContain("getById");
    expect(procedures).toContain("add");
    expect(procedures).toContain("updateCheckResult");
    expect(procedures).toContain("deactivate");
    expect(procedures).toContain("needingCheck");
  });

  it("appRouter includes sourceRegistry router", async () => {
    const { appRouter } = await import("./routers");
    expect(appRouter._def.procedures).toHaveProperty("sourceRegistry.stats");
    expect(appRouter._def.procedures).toHaveProperty("sourceRegistry.list");
    expect(appRouter._def.procedures).toHaveProperty("sourceRegistry.add");
    expect(appRouter._def.procedures).toHaveProperty("sourceRegistry.needingCheck");
  });

  it("source-registry module exports expected functions", async () => {
    const mod = await import("./source-registry");
    expect(typeof mod.addSource).toBe("function");
    expect(typeof mod.getSources).toBe("function");
    expect(typeof mod.getSourceById).toBe("function");
    expect(typeof mod.updateSourceCheckResult).toBe("function");
    expect(typeof mod.deactivateSource).toBe("function");
    expect(typeof mod.getSourcesNeedingCheck).toBe("function");
    expect(typeof mod.getSourceStats).toBe("function");
  });

  it("source_registry table is exported from schema", async () => {
    const schema = await import("../drizzle/schema");
    expect(schema.sourceRegistry).toBeDefined();
    expect(schema.sourceRegistry.sourceType).toBeDefined();
    expect(schema.sourceRegistry.url).toBeDefined();
    expect(schema.sourceRegistry.trustLevel).toBeDefined();
    expect(schema.sourceRegistry.checkFrequency).toBeDefined();
    expect(schema.sourceRegistry.lastCheckedAt).toBeDefined();
    expect(schema.sourceRegistry.lastCheckResult).toBeDefined();
  });

  it("0021_source_registry.sql migration exists with CREATE TABLE", async () => {
    const fs = await import("node:fs/promises");
    const path = await import("node:path");
    const migrationPath = path.join(process.cwd(), "drizzle", "0021_source_registry.sql");
    const content = await fs.readFile(migrationPath, "utf-8");
    expect(content).toContain("CREATE TABLE `source_registry`");
    expect(content).toContain("business_discovery");
    expect(content).toContain("event_discovery");
    expect(content).toContain("blog_research");
    expect(content).toContain("charlotte_news");
    expect(content).toContain("government");
    expect(content).toContain("license_verification");
    expect(content).toContain("official");
    expect(content).toContain("aggregator");
  });
});
