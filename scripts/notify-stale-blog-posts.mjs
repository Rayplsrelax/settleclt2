#!/usr/bin/env node
/**
 * Monthly Stale Blog Post Digest
 *
 * Queries published blog posts whose `updatedAt` is older than `STALE_DAYS`
 * (default 90) and produces:
 *   1. A console digest (always)
 *   2. An owner notification via `notifyOwner` (only when STALE_NOTIFY=1)
 *
 * Designed for monthly invocation via cron, e.g.:
 *
 *   # 9 AM EST on the 1st of every month
 *   0 14 1 * *  cd /app && DATABASE_URL=... STALE_NOTIFY=1 \
 *                 npx tsx scripts/notify-stale-blog-posts.mjs
 *
 * Run locally without sending notifications:
 *
 *   DATABASE_URL=mysql://...  npx tsx scripts/notify-stale-blog-posts.mjs
 *
 * Env vars:
 *   - DATABASE_URL  (required)  — MySQL/TiDB connection string
 *   - STALE_DAYS    (optional, default 90)
 *   - STALE_NOTIFY  (optional)  — set to "1" to actually fire the owner email
 *   - SITE_URL      (optional, default https://settleclt.com) — for edit links
 */

import { getStaleBlogPosts } from "../server/db.ts";
import { notifyOwner } from "../server/_core/notification.ts";

const STALE_DAYS = Number.parseInt(process.env.STALE_DAYS ?? "90", 10);
const SHOULD_NOTIFY = process.env.STALE_NOTIFY === "1";
const SITE_URL = (process.env.SITE_URL ?? "https://settleclt.com").replace(/\/$/, "");

if (!process.env.DATABASE_URL) {
  console.error("ERROR: DATABASE_URL is not set. Cannot query blog posts.");
  process.exit(1);
}

function daysSince(date) {
  const ms = Date.now() - new Date(date).getTime();
  return Math.floor(ms / (24 * 60 * 60 * 1000));
}

function formatDate(date) {
  return new Date(date).toISOString().slice(0, 10);
}

async function main() {
  console.log(`\n[stale-blog-digest] Looking for posts not updated in the last ${STALE_DAYS} days...\n`);

  const posts = await getStaleBlogPosts(STALE_DAYS);

  if (!posts.length) {
    console.log("No stale posts. All published content was refreshed within the threshold.");
    return;
  }

  console.log(`Found ${posts.length} stale post${posts.length === 1 ? "" : "s"}:\n`);
  for (const p of posts) {
    const days = daysSince(p.updatedAt);
    console.log(
      `  - [${days} days] ${p.title}\n      slug: ${p.slug}    updated: ${formatDate(p.updatedAt)}    category: ${p.category ?? "—"}`
    );
  }
  console.log("");

  if (!SHOULD_NOTIFY) {
    console.log("[stale-blog-digest] STALE_NOTIFY != 1, skipping owner notification (dry-run).");
    return;
  }

  const lines = posts.slice(0, 20).map((p) => {
    const days = daysSince(p.updatedAt);
    return `• [${days} days old] <a href="${SITE_URL}/admin/blog">${escapeHtml(p.title)}</a>  (slug: <code>${escapeHtml(p.slug)}</code>)`;
  });
  const overflow = posts.length > 20 ? `<p>+ ${posts.length - 20} more not shown.</p>` : "";

  await notifyOwner({
    title: `📰 ${posts.length} blog post${posts.length === 1 ? "" : "s"} ready for a refresh`,
    content: [
      `<p>The following published posts on Settle CLT have not been updated in ${STALE_DAYS}+ days. Refreshing them helps maintain SEO rankings and keeps content current for readers.</p>`,
      `<ul>${lines.map((l) => `<li>${l}</li>`).join("")}</ul>`,
      overflow,
      `<p><a href="${SITE_URL}/admin/blog">Open the Blog Manager</a> to update them.</p>`,
    ].join(""),
  });

  console.log(`[stale-blog-digest] Sent owner notification listing ${posts.length} post${posts.length === 1 ? "" : "s"}.`);
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("[stale-blog-digest] Failed:", err);
    process.exit(1);
  });
