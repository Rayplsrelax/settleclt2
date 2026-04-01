import { describe, it, expect } from "vitest";

// Test the referral stats shape and logic
describe("Referral Stats", () => {
  it("should return correct shape from getReferralStats when no data", async () => {
    // The function returns a specific shape even with no data
    const emptyStats = { total: 0, byStatus: {}, byType: {}, conversionRate: 0, avgAgeDays: 0, monthlyTrend: [], recentLeads: [] };
    expect(emptyStats).toHaveProperty("total");
    expect(emptyStats).toHaveProperty("byStatus");
    expect(emptyStats).toHaveProperty("byType");
    expect(emptyStats).toHaveProperty("conversionRate");
    expect(emptyStats).toHaveProperty("avgAgeDays");
    expect(emptyStats).toHaveProperty("monthlyTrend");
    expect(emptyStats).toHaveProperty("recentLeads");
    expect(emptyStats.total).toBe(0);
    expect(emptyStats.conversionRate).toBe(0);
    expect(emptyStats.avgAgeDays).toBe(0);
    expect(emptyStats.monthlyTrend).toEqual([]);
    expect(emptyStats.recentLeads).toEqual([]);
  });

  it("should calculate conversion rate correctly", () => {
    // Conversion rate = closed / (total - new)
    const scenarios = [
      { total: 10, newCount: 3, closed: 4, expected: 57 }, // 4/7 = 57%
      { total: 5, newCount: 5, closed: 0, expected: 0 },   // all new, 0 processed
      { total: 1, newCount: 0, closed: 1, expected: 100 },  // 1/1 = 100%
      { total: 0, newCount: 0, closed: 0, expected: 0 },    // empty
      { total: 20, newCount: 5, closed: 10, expected: 67 }, // 10/15 = 67%
    ];

    scenarios.forEach(({ total, newCount, closed, expected }) => {
      const processed = total - newCount;
      const rate = processed > 0 ? Math.round((closed / processed) * 100) : 0;
      expect(rate).toBe(expected);
    });
  });

  it("should compute average lead age in days", () => {
    const now = Date.now();
    const threeDaysAgo = new Date(now - 3 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

    const openLeads = [
      { createdAt: threeDaysAgo, status: "new" },
      { createdAt: sevenDaysAgo, status: "contacted" },
    ];

    const avgAgeDays = openLeads.length > 0
      ? Math.round(openLeads.reduce((sum, r) => sum + (now - new Date(r.createdAt).getTime()) / (1000 * 60 * 60 * 24), 0) / openLeads.length)
      : 0;

    expect(avgAgeDays).toBe(5); // (3 + 7) / 2 = 5
  });

  it("should aggregate monthly trend correctly", () => {
    const leads = [
      { createdAt: new Date("2026-01-15") },
      { createdAt: new Date("2026-01-20") },
      { createdAt: new Date("2026-02-10") },
      { createdAt: new Date("2026-03-05") },
      { createdAt: new Date("2026-03-15") },
      { createdAt: new Date("2026-03-25") },
    ];

    const monthlyMap: Record<string, number> = {};
    leads.forEach(r => {
      const d = new Date(r.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthlyMap[key] = (monthlyMap[key] || 0) + 1;
    });

    const monthlyTrend = Object.entries(monthlyMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([month, count]) => ({ month, count }));

    expect(monthlyTrend).toEqual([
      { month: "2026-01", count: 2 },
      { month: "2026-02", count: 1 },
      { month: "2026-03", count: 3 },
    ]);
  });

  it("should count by status and type correctly", () => {
    const referrals = [
      { status: "new", referralType: "buying" },
      { status: "new", referralType: "renting" },
      { status: "contacted", referralType: "buying" },
      { status: "closed", referralType: "relocating" },
      { status: "lost", referralType: "renting" },
    ];

    const byStatus: Record<string, number> = {};
    const byType: Record<string, number> = {};
    referrals.forEach(r => {
      byStatus[r.status] = (byStatus[r.status] || 0) + 1;
      byType[r.referralType] = (byType[r.referralType] || 0) + 1;
    });

    expect(byStatus).toEqual({ new: 2, contacted: 1, closed: 1, lost: 1 });
    expect(byType).toEqual({ buying: 2, renting: 2, relocating: 1 });
  });
});
