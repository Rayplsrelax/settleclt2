import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const readProjectFile = (relativePath: string) =>
  readFileSync(resolve(__dirname, "..", relativePath), "utf-8");

const normalize = (source: string) => source.replace(/\s+/g, " ");

describe("public accessibility contracts", () => {
  it("exposes the mobile navigation state and controlled region", () => {
    const navbar = normalize(
      readProjectFile("client/src/components/Navbar.tsx")
    );

    expect(navbar).toContain("aria-expanded={mobileOpen}");
    expect(navbar).toContain('aria-controls="mobile-navigation"');
    expect(navbar).toContain('id="mobile-navigation"');
  });

  it("gives the homepage newsletter email a programmatic label", () => {
    const home = normalize(readProjectFile("client/src/pages/Home.tsx"));

    expect(home).toContain('<label htmlFor="newsletter-email"');
    expect(home).toContain('id="newsletter-email"');
  });

  it("labels directory controls and exposes toggle state", () => {
    const directory = normalize(
      readProjectFile("client/src/pages/Directory.tsx")
    );

    expect(directory).toContain('aria-label={t("directory.searchAria")}');
    expect(directory).toContain('aria-label={t("directory.sortAria")}');
    expect(directory).toContain('aria-label={t("directory.area")}');
    expect(directory).toContain('aria-pressed={viewMode === "list"}');
    expect(directory).toContain('aria-pressed={viewMode === "map"}');
    expect(directory).toContain("aria-expanded={showFilters}");
  });

  it("labels event filters and exposes selected toggle state", () => {
    const events = normalize(readProjectFile("client/src/pages/Events.tsx"));

    expect(events).toContain('aria-label={t("events.searchAria")}');
    expect(events).toContain('aria-label={t("events.clearSearchAria")}');
    expect(events).toContain("aria-expanded={showFilters}");
    expect(events).toContain('aria-controls="events-date-filters"');
    expect(events).toContain('id="events-date-filters"');
    expect(events).toContain('htmlFor="events-date-from"');
    expect(events).toContain('id="events-date-from"');
    expect(events).toContain('htmlFor="events-date-to"');
    expect(events).toContain('id="events-date-to"');
    expect(events).toContain("aria-pressed={recurringOnly}");
    expect(events).toContain("aria-pressed={newcomerFriendlyOnly}");
    expect(events).toContain("aria-pressed={selectedCategory === cat.value}");
  });

  it("keeps public search labels aligned with visible text", () => {
    const search = normalize(
      readProjectFile("client/src/components/GlobalSearch.tsx")
    );

    expect(search).toContain('aria-label={t("search.trigger")}');
    expect(search).toContain('{t("search.trigger")}');
    expect(search).not.toContain('aria-label="Open site search"');
  });

  it("uses one interactive element for homepage CTAs", () => {
    const home = normalize(readProjectFile("client/src/pages/Home.tsx"));

    expect(home).toContain('asChild size="lg"');
    expect(home).not.toContain('<Link href="/neighborhoods"> <Button');
    expect(home).not.toContain('<Link href="/quiz?source=homepage"> <Button');
  });

  it("associates contact form labels with their controls", () => {
    const contact = normalize(readProjectFile("client/src/pages/Contact.tsx"));

    for (const id of [
      "contact-name",
      "contact-email",
      "contact-subject",
      "contact-message",
    ]) {
      expect(contact).toContain(`htmlFor="${id}"`);
      expect(contact).toContain(`id="${id}"`);
    }
  });

  it("formats event times in the Charlotte timezone and handles missing times", () => {
    const events = normalize(readProjectFile("client/src/pages/Events.tsx"));

    expect(events).toContain('const CHARLOTTE_TIME_ZONE = "America/New_York"');
    expect(events).toContain("timeZone: CHARLOTTE_TIME_ZONE");
    expect(events).toContain("if (!value) return null");
    expect(events).toContain("if (!d) return fallback");
    expect(events).toContain('t("events.timeTba")');
    expect(events).toContain('t("events.dateTba")');
  });
});
