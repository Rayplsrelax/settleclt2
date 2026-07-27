import { and, eq, or } from "drizzle-orm";
import { getDb } from "../server/db";
import { referrals } from "../drizzle/schema";
import { scoreRealtorLead } from "../shared/realtorLeadOps";

const recomputeAll = process.argv.includes("--all");
const dryRun = process.argv.includes("--dry-run");

function dueDateFromDays(days: number): Date {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

const db = await getDb();
if (!db) {
  throw new Error("DATABASE_URL is required to backfill referral lead operations fields.");
}

const rows = recomputeAll
  ? await db.select().from(referrals)
  : await db
      .select()
      .from(referrals)
      .where(or(eq(referrals.nextAction, null as any), eq(referrals.leadScore, 0)));

let updated = 0;
let skippedClosed = 0;

for (const row of rows) {
  if (["closed", "lost"].includes(row.status)) {
    skippedClosed += 1;
    continue;
  }

  const ops = scoreRealtorLead(row);
  const nextActionDueAt = dueDateFromDays(ops.nextActionDueDays);

  if (!dryRun) {
    await db
      .update(referrals)
      .set({
        leadScore: ops.leadScore,
        leadPriority: ops.leadPriority,
        nextAction: ops.nextAction,
        nextActionDueAt,
      })
      .where(eq(referrals.id, row.id));
  }

  updated += 1;
}

console.log(`referrals_scanned=${rows.length}`);
console.log(`referrals_updated=${updated}`);
console.log(`referrals_skipped_closed_or_lost=${skippedClosed}`);
console.log(`dry_run=${dryRun ? "yes" : "no"}`);
console.log(`mode=${recomputeAll ? "all" : "missing_ops_only"}`);
