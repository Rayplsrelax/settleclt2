import { z } from "zod";
import { adminProcedure, router } from "./_core/trpc";
import {
  getSubmissionQueue,
  getSubmissionStats,
  getReviewQueue,
  getHiddenReviews,
  getCommentQueue,
  getDeletedComments,
  getModerationSummary,
} from "./community-ops";

export const communityOpsRouter = router({
  summary: adminProcedure.query(async () => {
    return getModerationSummary();
  }),
  submissions: adminProcedure
    .input(z.object({
      status: z.enum(["pending", "approved", "rejected"]).optional(),
      limit: z.number().min(1).max(100).default(50),
      offset: z.number().min(0).default(0),
    }))
    .query(async ({ input }) => {
      return getSubmissionQueue(input);
    }),
  submissionStats: adminProcedure.query(async () => {
    return getSubmissionStats();
  }),
  reviews: adminProcedure
    .input(z.object({
      visibleOnly: z.boolean().optional(),
      limit: z.number().min(1).max(100).default(50),
      offset: z.number().min(0).default(0),
    }))
    .query(async ({ input }) => {
      return getReviewQueue(input);
    }),
  hiddenReviews: adminProcedure
    .input(z.object({ limit: z.number().min(1).max(100).default(50) }))
    .query(async ({ input }) => {
      return getHiddenReviews(input);
    }),
  comments: adminProcedure
    .input(z.object({
      includeDeleted: z.boolean().default(false),
      limit: z.number().min(1).max(100).default(50),
      offset: z.number().min(0).default(0),
    }))
    .query(async ({ input }) => {
      return getCommentQueue(input);
    }),
  deletedComments: adminProcedure
    .input(z.object({ limit: z.number().min(1).max(100).default(50) }))
    .query(async ({ input }) => {
      return getDeletedComments(input);
    }),
});
