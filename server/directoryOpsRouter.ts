import { z } from "zod";
import { adminProcedure, operationsProcedure, router } from "./_core/trpc";
import {
  getDirectoryGapAnalysis,
  recordListingVerification,
  getListingVerifications,
  getLastVerification,
  getStaleListings,
  getClosureCandidates,
  archiveListing,
  getBrokenLinkCandidates,
  getProfileCompleteness,
} from "./directory-ops";

export const directoryOpsRouter = router({
  /** Item 4: Directory gap analysis — category counts and thin categories. */
  gapAnalysis: operationsProcedure.query(async () => {
    return getDirectoryGapAnalysis();
  }),

  /** Item 5-6: Record a listing verification check. */
  recordVerification: operationsProcedure
    .input(
      z.object({
        serviceKey: z.string().min(1),
        checkType: z.enum([
          "website",
          "phone",
          "address",
          "hours",
          "closure",
          "category",
          "general",
        ]),
        result: z.enum([
          "ok",
          "changed",
          "broken_link",
          "parked_domain",
          "redirect_changed",
          "closed",
          "moved",
          "rebranded",
          "conflicting",
          "inconclusive",
        ]),
        evidenceLevel: z.enum([
          "official_verified",
          "owner_confirmed",
          "government_verified",
          "source_identified",
          "third_party_clue",
          "conflicting",
          "stale",
          "removed_confirmed",
        ]),
        sourceUrl: z.string().optional(),
        beforeValue: z.string().optional(),
        afterValue: z.string().optional(),
        checkedBy: z.enum([
          "manager",
          "directory_curator",
          "events_editor",
          "content_editor",
          "community_moderator",
          "business_success",
          "analyst",
          "reliability_watchdog",
        ]),
        notes: z.string().optional(),
        taskId: z.number().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const id = await recordListingVerification(input);
      return { id };
    }),

  /** Item 7: Get listing verification history. */
  verificationHistory: operationsProcedure
    .input(
      z.object({
        serviceKey: z.string().optional(),
        result: z.string().optional(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      }),
    )
    .query(async ({ input }) => {
      return getListingVerifications(input);
    }),

  /** Item 7: Get stale listings needing freshness checks. */
  staleListings: operationsProcedure
    .input(
      z.object({
        daysSinceUpdate: z.number().min(1).max(365).default(90),
        limit: z.number().min(1).max(500).default(100),
      }),
    )
    .query(async ({ input }) => {
      return getStaleListings(input);
    }),

  /** Item 8: Get closure candidates — listings with closure signals. */
  closureCandidates: operationsProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
      }),
    )
    .query(async ({ input }) => {
      return getClosureCandidates(input);
    }),

  /** Item 8: Archive a listing (R3 — requires admin). */
  archiveListing: adminProcedure
    .input(
      z.object({
        serviceKey: z.string().min(1),
        reason: z.string().min(1),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      await archiveListing(input.serviceKey, input.reason, ctx.user.id);
      return { success: true as const };
    }),

  /** Item 19: Get broken link candidates. */
  brokenLinks: operationsProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(200).default(100),
      }),
    )
    .query(async ({ input }) => {
      return getBrokenLinkCandidates(input);
    }),

  /** Item 10: Get profile completeness for a listing. */
  profileCompleteness: operationsProcedure
    .input(z.object({ serviceKey: z.string().min(1) }))
    .query(async ({ input }) => {
      return getProfileCompleteness(input.serviceKey);
    }),
});
