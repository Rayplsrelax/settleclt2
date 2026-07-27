import { buildHermesRevenueOpsSummary, createHermesRevenueDraft, generateHermesRevenueTasks } from "../shared/hermesRevenueOps";
import { getAllPremiumListings, getBusinessClaims, getReferrals } from "../server/db";

const SETTLE_CLT_MICROSITES = [
  { domain: "movingtocharlotteguide.com", campaign: "relocation", status: "ready_for_dns", primaryFunnel: "/find-your-home" },
  { domain: "charlotteweekendevents.com", campaign: "events", status: "ready_for_dns", primaryFunnel: "/events" },
  { domain: "charlottejobmarket.com", campaign: "jobs", status: "ready_for_dns", primaryFunnel: "/jobs" },
  { domain: "charlotteneighborhoodsguide.com", campaign: "neighborhoods", status: "ready_for_dns", primaryFunnel: "/neighborhoods" },
  { domain: "charlottehomepros.org", campaign: "home_pros", status: "ready_for_dns", primaryFunnel: "/directory" },
];

async function main() {
  const [referrals, claims, premiumListings] = await Promise.all([
    getReferrals({ limit: 100 }),
    getBusinessClaims(),
    getAllPremiumListings(),
  ]);

  const input = {
    referrals: referrals as any[],
    claims: claims as any[],
    premiumListings: premiumListings as any[],
    microsites: SETTLE_CLT_MICROSITES as any[],
  };

  const summary = buildHermesRevenueOpsSummary(input);
  const tasks = generateHermesRevenueTasks(input);

  console.log("# Settle CLT Hermes Revenue Ops Report");
  console.log("");
  console.log(JSON.stringify(summary, null, 2));
  console.log("");
  console.log("## Due draft_only tasks");
  for (const task of tasks) {
    console.log(`- [${task.priority}] ${task.type}: ${task.title}`);
    console.log(`  sendAutomatically: ${task.sendAutomatically}`);
    console.log(`  nextAction: ${task.nextAction}`);
    const draft = createHermesRevenueDraft(task);
    console.log(`  draftSubject: ${draft.subject}`);
  }
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
