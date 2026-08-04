import { z } from "zod";
import { operationsProcedure, router } from "./_core/trpc";
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
  summary: operationsProcedure.query(async () => {
    return getModerationSummary();
  }),
  submissions: operationsProcedure
    .input(z.object({
      status: z.enum(["pending", "approved", "rejected"]).optional(),
      limit: z.number().min(1).max(100).default(50),
      offset: z.number().min(0).default(0),
    }))
    .query(async ({ input }) => {
      return getSubmissionQueue(input);
    }),
  submissionStats: operationsProcedure.query(async () => {
    return getSubmissionStats();
  }),
  reviews: operationsProcedure
    .input(z.object({
      visibleOnly: z.boolean().optional(),
      limit: z.number().min(1).max(100).default(50),
      offset: z.number().min(0).default(0),
    }))
    .query(async ({ input }) => {
      return getReviewQueue(input);
    }),
  hiddenReviews: operationsProcedure
    .input(z.object({ limit: z.number().min(1).max(100).default(50) }))
    .query(async ({ input }) => {
      return getHiddenReviews(input);
    }),
  comments: operationsProcedure
    .input(z.object({
      includeDeleted: z.boolean().default(false),
      limit: z.number().min(1).max(100).default(50),
      offset: z.number().min(0).default(0),
    }))
    .query(async ({ input }) => {
      return getCommentQueue(input);
    }),
  deletedComments: operationsProcedure
    .input(z.object({ limit: z.number().min(1).max(100).default(50) }))
    .query(async ({ input }) => {
      return getDeletedComments(input);
    }),
});
