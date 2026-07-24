import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";

describe("Event growth loop", () => {
  it("has a repeatable event growth report script", () => {
    const script = readFileSync("scripts/event-growth-loop-report.mjs", "utf8");
    expect(script).toContain("EVENT_CATEGORIES");
    expect(script).toContain("WEEKLY_SOURCES");
    expect(script).toContain("EVENT_GROWTH_LOOP.md");
    expect(script).toContain("charlotteweekendevents.com");
  });

  it("generates the weekly event operating report", () => {
    expect(existsSync("docs/seo/EVENT_GROWTH_LOOP.md")).toBe(true);
    const report = readFileSync("docs/seo/EVENT_GROWTH_LOOP.md", "utf8");
    expect(report).toContain("# Settle CLT Event Growth Loop");
    expect(report).toContain("## Weekly schedule");
    expect(report).toContain("## Weekend roundup template");
    expect(report).toContain("## Sponsor package prompt");
    expect(report).toContain("utm_source=charlotteweekendevents.com");
  });

  it("surfaces the event growth loop in admin events", () => {
    const page = readFileSync("client/src/pages/AdminEvents.tsx", "utf8");
    expect(page).toContain("Weekly event growth loop");
    expect(page).toContain("charlotteweekendevents.com");
    expect(page).toContain("View Public Events");
  });
});
