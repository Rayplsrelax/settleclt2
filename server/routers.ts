import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { insertMovingQuote, insertBusinessSubmission, insertNewsletterSubscriber } from "./db";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  leads: router({
    submitQuote: publicProcedure
      .input(z.object({
        name: z.string().min(1),
        email: z.string().email(),
        fromCity: z.string().optional(),
        moveDate: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return insertMovingQuote({
          name: input.name,
          email: input.email,
          fromCity: input.fromCity ?? null,
          moveDate: input.moveDate ?? null,
        });
      }),
    submitBusiness: publicProcedure
      .input(z.object({
        name: z.string().min(1),
        email: z.string().email(),
        businessName: z.string().min(1),
        category: z.string().min(1),
        phone: z.string().optional(),
        website: z.string().optional(),
        area: z.string().optional(),
        description: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return insertBusinessSubmission({
          name: input.name,
          email: input.email,
          businessName: input.businessName,
          category: input.category,
          phone: input.phone ?? null,
          website: input.website ?? null,
          area: input.area ?? null,
          description: input.description ?? null,
        });
      }),
  }),

  newsletter: router({
    subscribe: publicProcedure
      .input(z.object({
        email: z.string().email(),
        source: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return insertNewsletterSubscriber({
          email: input.email,
          source: input.source ?? "homepage",
        });
      }),
  }),
});

export type AppRouter = typeof appRouter;
