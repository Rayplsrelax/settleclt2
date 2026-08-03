import { describe, it, expect } from "vitest";

describe("Directory Operations System", () => {
  describe("Router shape", () => {
    it("directoryOpsRouter exports expected procedures", async () => {
      const { directoryOpsRouter } = await import("./directoryOpsRouter");
      const procedures = Object.keys(directoryOpsRouter._def.procedures);
      expect(procedures).toContain("gapAnalysis");
      expect(procedures).toContain("recordVerification");
      expect(procedures).toContain("verificationHistory");
      expect(procedures).toContain("staleListings");
      expect(procedures).toContain("closureCandidates");
      expect(procedures).toContain("archiveListing");
      expect(procedures).toContain("brokenLinks");
      expect(procedures).toContain("profileCompleteness");
    });
  });

  describe("App router integration", () => {
    it("appRouter includes directoryOps router", async () => {
      const { appRouter } = await import("./routers");
      expect(appRouter._def.procedures).toHaveProperty("directoryOps.gapAnalysis");
      expect(appRouter._def.procedures).toHaveProperty("directoryOps.recordVerification");
      expect(appRouter._def.procedures).toHaveProperty("directoryOps.staleListings");
      expect(appRouter._def.procedures).toHaveProperty("directoryOps.closureCandidates");
      expect(appRouter._def.procedures).toHaveProperty("directoryOps.archiveListing");
      expect(appRouter._def.procedures).toHaveProperty("directoryOps.brokenLinks");
      expect(appRouter._def.procedures).toHaveProperty("directoryOps.profileCompleteness");
    });
  });

  describe("Schema exports", () => {
    it("listing_verifications table is exported with expected columns", async () => {
      const schema = await import("../drizzle/schema");
      expect(schema.listingVerifications).toBeDefined();
      expect(schema.listingVerifications.serviceKey).toBeDefined();
      expect(schema.listingVerifications.checkType).toBeDefined();
      expect(schema.listingVerifications.result).toBeDefined();
      expect(schema.listingVerifications.evidenceLevel).toBeDefined();
      expect(schema.listingVerifications.checkedBy).toBeDefined();
      expect(schema.listingVerifications.sourceUrl).toBeDefined();
      expect(schema.listingVerifications.beforeValue).toBeDefined();
      expect(schema.listingVerifications.afterValue).toBeDefined();
      expect(schema.listingVerifications.taskId).toBeDefined();
    });
  });

  describe("Migration exists", () => {
    it("0020_listing_verifications.sql migration file exists with CREATE TABLE", async () => {
      const fs = await import("node:fs/promises");
      const path = await import("node:path");
      const migrationPath = path.join(process.cwd(), "drizzle", "0020_listing_verifications.sql");
      const content = await fs.readFile(migrationPath, "utf-8");
      expect(content).toContain("CREATE TABLE `listing_verifications`");
      expect(content).toContain("serviceKey");
      expect(content).toContain("checkType");
      expect(content).toContain("evidenceLevel");
      expect(content).toContain("official_verified");
      expect(content).toContain("removed_confirmed");
    });
  });

  describe("Evidence levels", () => {
    it("the schema defines all 8 evidence levels", async () => {
      const schema = await import("../drizzle/schema");
      // The enum is compiled away at runtime, but the migration SQL captures all values
      const fs = await import("node:fs/promises");
      const path = await import("node:path");
      const migrationPath = path.join(process.cwd(), "drizzle", "0020_listing_verifications.sql");
      const content = await fs.readFile(migrationPath, "utf-8");
      expect(content).toContain("official_verified");
      expect(content).toContain("owner_confirmed");
      expect(content).toContain("government_verified");
      expect(content).toContain("source_identified");
      expect(content).toContain("third_party_clue");
      expect(content).toContain("conflicting");
      expect(content).toContain("stale");
      expect(content).toContain("removed_confirmed");
    });
  });

  describe("Verification result types", () => {
    it("the migration defines all verification result types", async () => {
      const fs = await import("node:fs/promises");
      const path = await import("node:path");
      const migrationPath = path.join(process.cwd(), "drizzle", "0020_listing_verifications.sql");
      const content = await fs.readFile(migrationPath, "utf-8");
      expect(content).toContain("broken_link");
      expect(content).toContain("parked_domain");
      expect(content).toContain("redirect_changed");
      expect(content).toContain("closed");
      expect(content).toContain("moved");
      expect(content).toContain("rebranded");
      expect(content).toContain("inconclusive");
      expect(content).toContain("changed");
    });
  });
});
