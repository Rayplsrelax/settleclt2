import { z } from "zod";
import { adminProcedure, router } from "./_core/trpc";
import {
  getBlogOpsSummary,
  getStalePosts,
  getDraftPosts,
  getPostsByCategory,
} from "./editorial-ops";

export const editorialOpsRouter = router({
  summary: adminProcedure.query(async () => {
    return getBlogOpsSummary();
  }),
  stalePosts: adminProcedure
    .input(z.object({
      daysSinceUpdate: z.number().min(1).max(365).default(90),
      limit: z.number().min(1).max(200).default(50),
    }))
    .query(async ({ input }) => {
      return getStalePosts(input);
    }),
  drafts: adminProcedure
    .input(z.object({ limit: z.number().min(1).max(100).default(50) }))
    .query(async ({ input }) => {
      return getDraftPosts(input);
    }),
  byCategory: adminProcedure
    .input(z.object({
      category: z.string().optional(),
      limit: z.number().min(1).max(100).default(50),
    }))
    .query(async ({ input }) => {
      return getPostsByCategory(input);
    }),
});
