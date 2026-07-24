import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";

describe("Revenue operations packaging", () => {
  it("registers an admin revenue operations route", () => {
    const app = readFileSync("client/src/App.tsx", "utf8");
    expect(app).toContain("AdminRevenueOps");
    expect(app).toContain('path="/admin/revenue"');
  });

  it("packages the major revenue lanes in the dashboard", () => {
    const page = readFileSync("client/src/pages/AdminRevenueOps.tsx", "utf8");
    expect(page).toContain("Revenue Operations");
    expect(page).toContain("Realtor leads");
    expect(page).toContain("Business listings");
    expect(page).toContain("Events");
    expect(page).toContain("Microsites");
    expect(page).toContain("MONTHLY_TARGETS");
    expect(page).toContain("claimStats.data as any)?.pending");
    expect(page).not.toContain("byStatus?.pending");
    expect(page).toContain("authLoading");
    expect(page).toContain("Loading revenue operations");
  });

  it("includes the operating manual", () => {
    expect(existsSync("docs/operations/SETTLE_CLT_REVENUE_OS.md")).toBe(true);
    const manual = readFileSync("docs/operations/SETTLE_CLT_REVENUE_OS.md", "utf8");
    expect(manual).toContain("# Settle CLT Revenue Operating System");
    expect(manual).toContain("/admin/revenue");
    expect(manual).toContain("Daily checklist");
    expect(manual).toContain("Stage 5–10 completion map");
  });
});
