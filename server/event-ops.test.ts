import { describe, it, expect } from "vitest";

describe("Event Operations System", () => {
  describe("Router shape", () => {
    it("eventOpsRouter exports expected procedures", async () => {
      const { eventOpsRouter } = await import("./eventOpsRouter");
      const procedures = Object.keys(eventOpsRouter._def.procedures);
      expect(procedures).toContain("summary");
      expect(procedures).toContain("expiredEvents");
      expect(procedures).toContain("upcomingForCheck");
      expect(procedures).toContain("archiveEvent");
      expect(procedures).toContain("updateStatus");
      expect(procedures).toContain("recurringEvents");
      expect(procedures).toContain("recurringStale");
      expect(procedures).toContain("recurringStaleDates");
      expect(procedures).toContain("unverifiedEvents");
      expect(procedures).toContain("eventsWithSources");
    });
  });

  describe("App router integration", () => {
    it("appRouter includes eventOps router", async () => {
      const { appRouter } = await import("./routers");
      expect(appRouter._def.procedures).toHaveProperty("eventOps.summary");
      expect(appRouter._def.procedures).toHaveProperty("eventOps.expiredEvents");
      expect(appRouter._def.procedures).toHaveProperty("eventOps.archiveEvent");
      expect(appRouter._def.procedures).toHaveProperty("eventOps.recurringEvents");
      expect(appRouter._def.procedures).toHaveProperty("eventOps.recurringStale");
      expect(appRouter._def.procedures).toHaveProperty("eventOps.recurringStaleDates");
      expect(appRouter._def.procedures).toHaveProperty("eventOps.unverifiedEvents");
    });
  });

  describe("Event ops functions module", () => {
    it("event-ops module exports expected functions", async () => {
      const mod = await import("./event-ops");
      expect(typeof mod.getExpiredEvents).toBe("function");
      expect(typeof mod.getUpcomingEventsForCheck).toBe("function");
      expect(typeof mod.archiveEvent).toBe("function");
      expect(typeof mod.updateEventStatus).toBe("function");
      expect(typeof mod.getRecurringEvents).toBe("function");
      expect(typeof mod.getRecurringEventsNeedingRefresh).toBe("function");
      expect(typeof mod.getRecurringEventsWithStaleDates).toBe("function");
      expect(typeof mod.getUnverifiedEvents).toBe("function");
      expect(typeof mod.getEventsWithBrokenSources).toBe("function");
      expect(typeof mod.getEventOpsSummary).toBe("function");
    });
  });
});
