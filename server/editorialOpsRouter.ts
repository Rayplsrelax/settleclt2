import { z } from "zod";
import { operationsProcedure, router } from "./_core/trpc";
import {
  getBlogOpsSummary,
  getStalePosts,
  getDraftPosts,
  getPostsByCategory,
} from "./editorial-ops";

export const editorialOpsRouter = router({
  summary: operationsProcedure.query(async () => {
    return getBlogOpsSummary();
  }),
  stalePosts: operationsProcedure
    .input(z.object({
      daysSinceUpdate: z.number().min(1).max(365).default(90),
      limit: z.number().min(1).max(200).default(50),
    }))
    .query(async ({ input }) => {
      return getStalePosts(input);
    }),
  drafts: operationsProcedure
    .input(z.object({ limit: z.number().min(1).max(100).default(50) }))
    .query(async ({ input }) => {
      return getDraftPosts(input);
    }),
  byCategory: operationsProcedure
    .input(z.object({
      category: z.string().optional(),
      limit: z.number().min(1).max(100).default(50),
    }))
    .query(async ({ input }) => {
      return getPostsByCategory(input);
    }),
});
