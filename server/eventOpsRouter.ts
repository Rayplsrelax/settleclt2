import { z } from "zod";
import { adminProcedure, operationsProcedure, router } from "./_core/trpc";
import {
  getExpiredEvents,
  getUpcomingEventsForCheck,
  archiveEvent,
  updateEventStatus,
  getRecurringEvents,
  getRecurringEventsNeedingRefresh,
  getRecurringEventsWithStaleDates,
  getUnverifiedEvents,
  getEventsWithBrokenSources,
  getEventOpsSummary,
} from "./event-ops";

export const eventOpsRouter = router({
  /** Item 12: Event operations summary for cockpit. */
  summary: operationsProcedure.query(async () => {
    return getEventOpsSummary();
  }),

  /** Item 12: Get expired events needing archive. */
  expiredEvents: operationsProcedure
    .input(
      z.object({
        gracePeriodDays: z.number().min(0).max(30).default(3),
        limit: z.number().min(1).max(200).default(100),
      }),
    )
    .query(async ({ input }) => {
      return getExpiredEvents(input);
    }),

  /** Item 12: Get upcoming events for source verification. */
  upcomingForCheck: operationsProcedure
    .input(
      z.object({
        daysAhead: z.number().min(1).max(30).default(7),
        limit: z.number().min(1).max(100).default(50),
      }),
    )
    .query(async ({ input }) => {
      return getUpcomingEventsForCheck(input);
    }),

  /** Item 12: Archive an expired/cancelled event (R3). */
  archiveEvent: adminProcedure
    .input(
      z.object({
        eventId: z.number(),
        reason: z.string().min(1),
      }),
    )
    .mutation(async ({ input }) => {
      await archiveEvent(input.eventId, input.reason);
      return { success: true as const };
    }),

  /** Item 12: Update event status. */
  updateStatus: adminProcedure
    .input(
      z.object({
        eventId: z.number(),
        status: z.enum(["draft", "published", "archived"]),
      }),
    )
    .mutation(async ({ input }) => {
      await updateEventStatus(input.eventId, input.status);
      return { success: true as const };
    }),

  /** Item 13: Get all recurring events. */
  recurringEvents: operationsProcedure.query(async () => {
    return getRecurringEvents();
  }),

  /** Item 13: Get recurring events needing refresh (not updated in N days). */
  recurringStale: operationsProcedure
    .input(
      z.object({
        daysSinceUpdate: z.number().min(1).max(365).default(30),
        limit: z.number().min(1).max(100).default(50),
      }),
    )
    .query(async ({ input }) => {
      return getRecurringEventsNeedingRefresh(input);
    }),

  /** Item 13: Get recurring events with past dates that need updating. */
  recurringStaleDates: operationsProcedure.query(async () => {
    return getRecurringEventsWithStaleDates();
  }),

  /** Item 11: Get unverified events (no source verification). */
  unverifiedEvents: operationsProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
      }),
    )
    .query(async ({ input }) => {
      return getUnverifiedEvents(input);
    }),

  /** Item 19: Get events with source URLs that need link checking. */
  eventsWithSources: operationsProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(200).default(100),
      }),
    )
    .query(async ({ input }) => {
      return getEventsWithBrokenSources(input);
    }),
});
