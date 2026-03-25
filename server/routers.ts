import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, adminProcedure } from "./_core/trpc";
import { z } from "zod";
import { insertMovingQuote, insertBusinessSubmission, insertNewsletterSubscriber, upsertEnrichedService, getEnrichedService, getAllEnrichedServices } from "./db";
import { makeRequest, type PlacesSearchResult, type PlaceDetailsResult } from "./_core/map";

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

  // --- Admin: Google Places enrichment ---
  admin: router({
    searchPlaces: adminProcedure
      .input(z.object({
        query: z.string().min(1),
        location: z.string().optional(), // "35.2271,-80.8431" for Charlotte center
      }))
      .mutation(async ({ input }) => {
        const params: Record<string, unknown> = {
          query: `${input.query} Charlotte NC`,
          location: input.location ?? "35.2271,-80.8431",
          radius: 50000,
        };
        const result = await makeRequest<PlacesSearchResult>(
          "/maps/api/place/textsearch/json",
          params
        );
        return {
          results: result.results.map(r => ({
            placeId: r.place_id,
            name: r.name,
            address: r.formatted_address,
            rating: r.rating,
            reviewCount: r.user_ratings_total,
            types: r.types,
            businessStatus: r.business_status,
            location: r.geometry?.location,
          })),
          status: result.status,
        };
      }),

    getPlaceDetails: adminProcedure
      .input(z.object({
        placeId: z.string().min(1),
      }))
      .mutation(async ({ input }) => {
        const result = await makeRequest<PlaceDetailsResult>(
          "/maps/api/place/details/json",
          {
            place_id: input.placeId,
            fields: "name,formatted_address,formatted_phone_number,international_phone_number,website,rating,user_ratings_total,reviews,opening_hours,geometry,price_level,types",
          }
        );
        return {
          placeId: result.result.place_id,
          name: result.result.name,
          address: result.result.formatted_address,
          phone: result.result.formatted_phone_number,
          internationalPhone: result.result.international_phone_number,
          website: result.result.website,
          rating: result.result.rating,
          reviewCount: result.result.user_ratings_total,
          reviews: result.result.reviews?.slice(0, 5),
          hours: result.result.opening_hours?.weekday_text,
          openNow: result.result.opening_hours?.open_now,
          location: result.result.geometry?.location,
          priceLevel: (result.result as any).price_level,
          types: (result.result as any).types,
          status: result.status,
        };
      }),

    applyEnrichment: adminProcedure
      .input(z.object({
        serviceKey: z.string().min(1),
        googlePlaceId: z.string().optional(),
        googleRating: z.string().optional(),
        reviewCount: z.number().optional(),
        verifiedAddress: z.string().optional(),
        verifiedPhone: z.string().optional(),
        hoursJson: z.string().optional(),
        photosJson: z.string().optional(),
        googleTypes: z.string().optional(),
        priceLevel: z.number().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        return upsertEnrichedService({
          serviceKey: input.serviceKey,
          googlePlaceId: input.googlePlaceId ?? null,
          googleRating: input.googleRating ?? null,
          reviewCount: input.reviewCount ?? null,
          verifiedAddress: input.verifiedAddress ?? null,
          verifiedPhone: input.verifiedPhone ?? null,
          hoursJson: input.hoursJson ?? null,
          photosJson: input.photosJson ?? null,
          googleTypes: input.googleTypes ?? null,
          priceLevel: input.priceLevel ?? null,
          verified: 'verified',
          enrichedBy: ctx.user.id,
        });
      }),

    getEnrichment: adminProcedure
      .input(z.object({ serviceKey: z.string() }))
      .query(async ({ input }) => {
        return getEnrichedService(input.serviceKey) ?? null;
      }),

    getAllEnrichments: adminProcedure
      .query(async () => {
        return getAllEnrichedServices();
      }),
  }),

  // --- Public: enrichment data for directory ---
  enrichment: router({
    getAll: publicProcedure.query(async () => {
      return getAllEnrichedServices();
    }),
    getByKey: publicProcedure
      .input(z.object({ serviceKey: z.string() }))
      .query(async ({ input }) => {
        return getEnrichedService(input.serviceKey) ?? null;
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
