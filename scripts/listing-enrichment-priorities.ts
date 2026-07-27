import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { SERVICE_CATEGORIES, SERVICES, type Service } from "../shared/services";

const MONEY_CATEGORIES = new Set([
  "moving-companies",
  "plumbers",
  "electricians",
  "hvac",
  "roofing",
  "handyman",
  "cleaning",
  "pest",
  "lawn",
  "insurance",
  "legal",
  "tax",
  "barbers",
  "salons",
  "photographers",
  "wedding-events",
]);

function serviceSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function getCategoryName(categoryId: string): string {
  return SERVICE_CATEGORIES.find(category => category.id === categoryId)?.name || categoryId;
}

function scoreListing(service: Service) {
  const issues: string[] = [];
  const opportunities: string[] = [];
  let priorityScore = 0;

  if (MONEY_CATEGORIES.has(service.category)) {
    priorityScore += 30;
    opportunities.push("money category");
  }
  if (service.featured || service.affiliate) {
    priorityScore += 15;
    opportunities.push("partner/featured potential");
  }
  if (!service.phone) {
    priorityScore += 20;
    issues.push("missing phone");
  }
  if (!service.website) {
    priorityScore += 20;
    issues.push("missing website");
  }
  const descriptionWords = wordCount(service.description || "");
  if (descriptionWords < 12) {
    priorityScore += 20;
    issues.push("thin description under 12 words");
  } else if (descriptionWords < 20) {
    priorityScore += 10;
    issues.push("description could be expanded");
  }
  if (!service.area || service.area === "Charlotte Metro") {
    priorityScore += 8;
    issues.push("generic service area");
  }

  return {
    service,
    slug: serviceSlug(service.name),
    categoryName: getCategoryName(service.category),
    descriptionWords,
    priorityScore,
    issues,
    opportunities,
  };
}

function buildSuggestedDescription(service: Service, categoryName: string): string {
  const area = service.area || "Charlotte Metro";
  const base = service.description?.replace(/\s+/g, " ").trim();
  return `${service.name} is listed in Settle CLT's ${categoryName.toLowerCase()} directory for ${area}. ${base} Use this listing to confirm services, service area, contact details, website, and whether the business is a good fit before calling or requesting an estimate.`;
}

function buildReport() {
  const scored = SERVICES.map(scoreListing).sort((a, b) => b.priorityScore - a.priorityScore || a.service.name.localeCompare(b.service.name));
  const top = scored.filter(item => item.priorityScore > 0).slice(0, 100);
  const byCategory = new Map<string, { total: number; flagged: number; missingPhone: number; missingWebsite: number; thin: number }>();

  for (const item of scored) {
    const current = byCategory.get(item.service.category) || { total: 0, flagged: 0, missingPhone: 0, missingWebsite: 0, thin: 0 };
    current.total += 1;
    if (item.priorityScore > 0) current.flagged += 1;
    if (!item.service.phone) current.missingPhone += 1;
    if (!item.service.website) current.missingWebsite += 1;
    if (item.descriptionWords < 20) current.thin += 1;
    byCategory.set(item.service.category, current);
  }

  const categoryRows = Array.from(byCategory.entries())
    .map(([category, stats]) => ({ category, categoryName: getCategoryName(category), ...stats }))
    .sort((a, b) => b.flagged - a.flagged || a.categoryName.localeCompare(b.categoryName))
    .slice(0, 30);

  const lines: string[] = [];
  lines.push("# Settle CLT Listing Enrichment Priorities");
  lines.push("");
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push("");
  lines.push("This report prioritizes directory listings that should be enriched first for SEO, trust, and monetization.");
  lines.push("");
  lines.push("## Operating rule");
  lines.push("");
  lines.push("Enrich listings in this order:");
  lines.push("");
  lines.push("1. Money categories: movers, plumbers, electricians, HVAC, roofing, handyman, cleaning, pest, lawn, legal, tax, insurance, beauty, weddings.");
  lines.push("2. Listings missing phone or website.");
  lines.push("3. Listings with thin descriptions.");
  lines.push("4. Listings with generic area `Charlotte Metro` that can be localized.");
  lines.push("5. Claimed/featured/affiliate candidates.");
  lines.push("");
  lines.push("## Category summary");
  lines.push("");
  lines.push("| Category | Total | Flagged | Missing Phone | Missing Website | Thin/Could Expand |");
  lines.push("|---|---:|---:|---:|---:|---:|");
  for (const row of categoryRows) {
    lines.push(`| ${row.categoryName} | ${row.total} | ${row.flagged} | ${row.missingPhone} | ${row.missingWebsite} | ${row.thin} |`);
  }
  lines.push("");
  lines.push("## Top 100 listing priorities");
  lines.push("");
  lines.push("| Priority | Business | Category | Area | Issues | Directory URL |");
  lines.push("|---:|---|---|---|---|---|");
  for (const item of top) {
    lines.push(`| ${item.priorityScore} | ${item.service.name} | ${item.categoryName} | ${item.service.area || ""} | ${item.issues.join(", ") || item.opportunities.join(", ")} | /directory/${item.slug} |`);
  }
  lines.push("");
  lines.push("## Rewrite template");
  lines.push("");
  lines.push("Use this pattern when expanding thin descriptions:");
  lines.push("");
  lines.push("> [Business Name] is listed in Settle CLT's [Category] directory for [Area]. [What they do]. Use this listing to confirm services, service area, contact details, website, reviews, hours, and whether the business is a good fit before calling or requesting an estimate.");
  lines.push("");
  lines.push("## Suggested rewrites for top 20");
  lines.push("");
  for (const item of top.slice(0, 20)) {
    lines.push(`### ${item.service.name}`);
    lines.push("");
    lines.push(`- Category: ${item.categoryName}`);
    lines.push(`- URL: /directory/${item.slug}`);
    lines.push(`- Issues: ${item.issues.join(", ") || "none"}`);
    lines.push("- Suggested description:");
    lines.push("");
    lines.push(buildSuggestedDescription(item.service, item.categoryName));
    lines.push("");
  }

  return { markdown: lines.join("\n"), scoredCount: scored.length, flaggedCount: top.length };
}

const outputPath = resolve("docs/seo/LISTING_ENRICHMENT_PRIORITIES.md");
const report = buildReport();
await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, report.markdown, "utf8");
console.log(`Wrote ${outputPath}`);
console.log(`listings_scored=${report.scoredCount}`);
console.log(`top_priorities=${report.flaggedCount}`);
