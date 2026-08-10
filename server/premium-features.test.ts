import { describe, it, expect } from "vitest";
import { getPhotoLimit, canUploadPhoto, PHOTO_LIMITS } from "../shared/premium-limits";

describe("Premium Feature: Photo Gallery Tier Limits", () => {
  describe("Tier photo limits", () => {
    it("free tier allows 0 owner-uploaded photos", () => {
      expect(getPhotoLimit("basic", true)).toBe(0);
    });

    it("featured tier allows 5 owner-uploaded photos", () => {
      expect(getPhotoLimit("featured", true)).toBe(5);
    });

    it("premium tier allows 15 owner-uploaded photos", () => {
      expect(getPhotoLimit("premium", true)).toBe(15);
    });

    it("inactive premium tier falls back to 0 (no payment = no photos)", () => {
      expect(getPhotoLimit("premium", false)).toBe(0);
    });

    it("inactive featured tier falls back to 0", () => {
      expect(getPhotoLimit("featured", false)).toBe(0);
    });

    it("PHOTO_LIMITS constant has correct values", () => {
      expect(PHOTO_LIMITS.basic).toBe(0);
      expect(PHOTO_LIMITS.featured).toBe(5);
      expect(PHOTO_LIMITS.premium).toBe(15);
    });
  });

  describe("canUploadPhoto", () => {
    it("allows upload when under limit", () => {
      expect(canUploadPhoto("featured", true, 3)).toBe(true);
      expect(canUploadPhoto("premium", true, 10)).toBe(true);
    });

    it("rejects upload at limit", () => {
      expect(canUploadPhoto("featured", true, 5)).toBe(false);
      expect(canUploadPhoto("premium", true, 15)).toBe(false);
    });

    it("rejects upload for basic tier", () => {
      expect(canUploadPhoto("basic", true, 0)).toBe(false);
    });

    it("rejects upload for inactive subscription", () => {
      expect(canUploadPhoto("premium", false, 0)).toBe(false);
    });
  });
});

describe("Premium Feature: Lead Capture", () => {
  it("appRouter includes premium.trackLead procedure", async () => {
    const { appRouter } = await import("./routers");
    expect(appRouter._def.procedures).toHaveProperty("premium.trackLead");
  });

  it("appRouter includes premium.getLeads procedure", async () => {
    const { appRouter } = await import("./routers");
    expect(appRouter._def.procedures).toHaveProperty("premium.getLeads");
  });

  it("appRouter includes premium.updateLeadStatus procedure", async () => {
    const { appRouter } = await import("./routers");
    expect(appRouter._def.procedures).toHaveProperty("premium.updateLeadStatus");
  });

  it("appRouter includes premium.updateLeadDetails procedure", async () => {
    const { appRouter } = await import("./routers");
    expect(appRouter._def.procedures).toHaveProperty("premium.updateLeadDetails");
  });

  it("appRouter includes premium.getPhotoLimit procedure", async () => {
    const { appRouter } = await import("./routers");
    expect(appRouter._def.procedures).toHaveProperty("premium.getPhotoLimit");
  });

  it("appRouter includes premium.getReport procedure", async () => {
    const { appRouter } = await import("./routers");
    expect(appRouter._def.procedures).toHaveProperty("premium.getReport");
  });
});

describe("Premium Feature: Schema and Migration", () => {
  it("business_leads table is exported from schema", async () => {
    const schema = await import("../drizzle/schema");
    expect(schema.businessLeads).toBeDefined();
    expect(schema.businessLeads.serviceKey).toBeDefined();
    expect(schema.businessLeads.name).toBeDefined();
    expect(schema.businessLeads.email).toBeDefined();
    expect(schema.businessLeads.message).toBeDefined();
    expect(schema.businessLeads.status).toBeDefined();
    expect(schema.businessLeads.followUpAt).toBeDefined();
    expect(schema.businessLeads.notes).toBeDefined();
    expect(schema.businessLeads.source).toBeDefined();
    expect(schema.businessLeads.estimatedValueCents).toBeDefined();
    expect(schema.businessListingOverrides.serviceMenu).toBeDefined();
    expect(schema.businessListingOverrides.bookingProvider).toBeDefined();
    expect(schema.businessListingOverrides.bookingUrl).toBeDefined();
  });

  it("0022_business_leads.sql migration exists with CREATE TABLE", async () => {
    const fs = await import("node:fs/promises");
    const path = await import("node:path");
    const migrationPath = path.join(process.cwd(), "drizzle", "0022_business_leads.sql");
    const content = await fs.readFile(migrationPath, "utf-8");
    expect(content).toContain("CREATE TABLE `business_leads`");
    expect(content).toContain("serviceKey");
    expect(content).toContain("message");
    expect(content).toContain("new");
    expect(content).toContain("contacted");
    expect(content).toContain("qualified");
    expect(content).toContain("closed");
    expect(content).toContain("archived");
  });

  it("0026_phase1_business_tools.sql migration exists", async () => {
    const fs = await import("node:fs/promises");
    const path = await import("node:path");
    const content = await fs.readFile(path.join(process.cwd(), "drizzle", "0026_phase1_business_tools.sql"), "utf-8");
    expect(content).toContain("followUpAt");
    expect(content).toContain("estimatedValueCents");
    expect(content).toContain("serviceMenu");
    expect(content).toContain("bookingUrl");
  });
});

describe("App router integration", () => {
  it("appRouter still includes all expected routers", async () => {
    const { appRouter } = await import("./routers");
    expect(appRouter._def.procedures).toHaveProperty("operations.summary");
    expect(appRouter._def.procedures).toHaveProperty("directoryOps.gapAnalysis");
    expect(appRouter._def.procedures).toHaveProperty("eventOps.summary");
    expect(appRouter._def.procedures).toHaveProperty("editorialOps.summary");
    expect(appRouter._def.procedures).toHaveProperty("communityOps.summary");
    expect(appRouter._def.procedures).toHaveProperty("sourceRegistry.stats");
    expect(appRouter._def.procedures).toHaveProperty("premium.getTier");
    expect(appRouter._def.procedures).toHaveProperty("premium.createCheckout");
  });
});
