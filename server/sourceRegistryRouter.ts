import { z } from "zod";
import { adminProcedure, operationsProcedure, router } from "./_core/trpc";
import {
  addSource,
  getSources,
  getSourceById,
  updateSourceCheckResult,
  deactivateSource,
  getSourcesNeedingCheck,
  getSourceStats,
} from "./source-registry";

export const sourceRegistryRouter = router({
  stats: operationsProcedure.query(async () => {
    return getSourceStats();
  }),
  list: operationsProcedure
    .input(z.object({
      sourceType: z.string().optional(),
      active: z.boolean().optional(),
      priority: z.string().optional(),
      trustLevel: z.string().optional(),
      limit: z.number().min(1).max(200).default(100),
      offset: z.number().min(0).default(0),
    }))
    .query(async ({ input }) => {
      return getSources(input);
    }),
  getById: operationsProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return getSourceById(input.id);
    }),
  add: adminProcedure
    .input(z.object({
      sourceType: z.enum([
        "business_discovery",
        "event_discovery",
        "blog_research",
        "charlotte_news",
        "government",
        "license_verification",
      ]),
      name: z.string().min(1).max(255),
      url: z.string().url(),
      sourceCategory: z.string().max(128).optional(),
      priority: z.enum(["high", "medium", "low"]).default("medium"),
      trustLevel: z.enum(["official", "aggregator", "third_party"]).default("third_party"),
      checkFrequency: z.enum(["daily", "weekly", "biweekly", "monthly", "quarterly"]).default("weekly"),
      notes: z.string().optional(),
      addedBy: z.string().max(255).optional(),
    }))
    .mutation(async ({ input }) => {
      const id = await addSource(input);
      return { id };
    }),
  updateCheckResult: adminProcedure
    .input(z.object({
      id: z.number(),
      result: z.enum(["ok", "changed", "broken", "blocked", "inconclusive"]),
    }))
    .mutation(async ({ input }) => {
      await updateSourceCheckResult(input.id, input.result);
      return { success: true as const };
    }),
  deactivate: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await deactivateSource(input.id);
      return { success: true as const };
    }),
  needingCheck: operationsProcedure
    .input(z.object({
      sourceType: z.string().optional(),
      limit: z.number().min(1).max(200).default(100),
    }))
    .query(async ({ input }) => {
      return getSourcesNeedingCheck(input);
    }),
});
