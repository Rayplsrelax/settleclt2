import { COOKIE_NAME } from "@shared/const";
import {
  EVENT_PROMOTION_PACKAGES,
  EVENT_PROMOTION_LEVEL_SCHEMA,
} from "@shared/event-promotions";
import { TRPCError } from "@trpc/server";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import {
  publicProcedure,
  protectedProcedure,
  router,
  adminProcedure,
} from "./_core/trpc";
import { z } from "zod";
import { recommendBusinessMatches } from "./business-referral-matching";
import { requestNewsletterSubscription } from "./newsletter-service";
import {
  insertBusinessSubmission,
  getBusinessSubmissions,
  getBusinessSubmissionCount,
  updateBusinessSubmissionStatus,
  deleteBusinessSubmission,
  upsertEnrichedService,
  getEnrichedService,
  getAllEnrichedServices,
  addPassportEntry,
  getPassportEntries,
  deletePassportEntry,
  getActiveBingoCards,
  getBingoProgress,
  upsertBingoProgress,
  addWishlistEntry,
  removeWishlistEntry,
  getWishlistEntries,
  updateWishlistNotes,
  addComment,
  getComments,
  deleteComment,
  voteComment,
  getUserVotes,
  createBlogPost,
  updateBlogPost,
  deleteBlogPost,
  getPublishedBlogPosts,
  getAllBlogPosts,
  getStaleBlogPosts,
  getBlogPostBySlug,
  getLeaderboardByStamps,
  getLeaderboardByBingo,
  getLeaderboardByNeighborhoods,
  createEvent,
  updateEvent,
  deleteEvent,
  getPublishedEvents,
  getAllEvents,
  getEventBySlug,
  getEventById,
  createEventPromotion,
  getActivePromotionsForEvent,
  getPromotionsForUser,
  getActivePromotionsPublic,
  sweepExpiredEventPromotions,
  queueDueEventPromotionSocialPosts,
  createTag,
  getAllTags,
  getTagBySlug,
  addContentTag,
  removeContentTag,
  getContentTags,
  getContentByTag,
  bulkAddContentTags,
  getRecentActivity,
  addDirectoryListing,
  getDirectoryListings,
  getAllDirectoryListings,
  updateDirectoryListing,
  deleteDirectoryListing,
  updateUserNewsletter,
  trackTagEngagement,
  getTrendingTags,
  bulkTrackTagEngagement,
  trackSearchQuery,
  getPopularSearches,
  getSearchAnalytics,
  getTagAnalytics,
  updateUserTagPreference,
  getUserTagPreferences,
  getRecommendedContent,
  getNewListings,
  getUpcomingEvents,
  getRecentBlogPosts,
  getNewsletterRecipients,
  createReview,
  getReviews,
  getReviewStats,
  getBulkReviewStats,
  getVisibleDirectoryReviewForService,
  deleteReview,
  toggleReviewVisibility,
  getAllReviews,
  submitReferral,
  getReferrals,
  updateReferralStatus,
  getReferralStats,
  submitBusinessClaim,
  getBusinessClaims,
  updateBusinessClaimStatus,
  approveBusinessClaimAndCreateOwnerMembership,
  getBusinessClaimStats,
  hasExistingClaim,
  getListingOverride,
  upsertListingOverride,
  getBusinessMembershipsForUser,
  getActiveOwnerMembership,
  getPremiumListing,
  getPremiumBillingForCheckout,
  upsertPremiumListing,
  upsertCanonicalPremiumListingForAdmin,
  getAllPremiumListings,
  incrementListingAnalytics,
  deleteUserAccount,
  createBusinessLead,
  getBusinessLeadsForService,
  getBusinessLeadById,
  updateBusinessLeadStatus,
  updateBusinessLeadDetails,
  createBusinessPromotion,
  getActivePromotions,
  getPromotionsForBusiness,
  updatePromotionStatus,
  createEventSponsorship,
  getSponsorshipsForBusiness,
  createBusinessReferral,
  getBusinessReferralsForService,
  getBusinessReferralById,
  updateBusinessReferralStatus,
  updateBusinessReferralMatch,
  createBusinessReferralInvitation,
  getReferralInvitationsForBusiness,
  getReferralInvitationById,
  updateReferralInvitationStatus,
  getBusinessReferralAnalytics,
  getDailyAnalytics,
  snapshotDailyAnalytics,
  getBusinessFaqs,
  createBusinessFaq,
  deleteBusinessFaq,
  createNotification,
  getUserNotifications,
  getUnreadNotificationCount,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  getNotificationPreferences,
  upsertNotificationPreference,
  isNotificationEnabled,
  savePushSubscription,
  getUserPushSubscriptions,
  removePushSubscription,
  type NotificationCategory,
} from "./db";
import {
  makeRequest,
  type PlacesSearchResult,
  type PlaceDetailsResult,
} from "./_core/map";
import { notifyOwner } from "./_core/notification";
import { storagePut } from "./storage";
import { createCheckoutSession, createPortalSession } from "./stripe-helpers";
import {
  permissionsForBusinessRole,
  requireApprovedBusinessClaim,
  requireBusinessPermission,
} from "./business-authorization";
import { selectEffectiveClaimId } from "./business-memberships";
import {
  notifyClaimApproved,
  notifyClaimRejected,
  notifyNewReview,
  notifyBingoComplete,
  notifyWelcome,
  notifyUser,
} from "./notification-service";
import {
  buildHermesRevenueOpsSummary,
  createHermesRevenueDraft,
  generateHermesRevenueTasks,
} from "../shared/hermesRevenueOps";
import { operationsRouter } from "./operationsRouter";
import { directoryOpsRouter } from "./directoryOpsRouter";
import { eventOpsRouter } from "./eventOpsRouter";
import { editorialOpsRouter } from "./editorialOpsRouter";
import { communityOpsRouter } from "./communityOpsRouter";
import { sourceRegistryRouter } from "./sourceRegistryRouter";
import {
  requireActivePremium,
  requirePremiumLeadAccess,
} from "./premium-access";
import { createPremiumLeadWithNotification } from "./premium-lead-service";
import { askBusinessAssistant } from "./business-assistant";
import { generateBusinessContentPrompts } from "./business-content-prompts";
import { generateBusinessReviewResponse } from "./business-review-drafts";
import { getBusinessGrowthSuggestions } from "./business-growth-suggestions";
import { assertFeatureEnabled } from "./feature-flags";

const SETTLE_CLT_MICROSITES = [
  {
    domain: "movingtocharlotteguide.com",
    campaign: "relocation",
    status: "ready_for_dns",
    primaryFunnel: "/find-your-home",
  },
  {
    domain: "charlotteweekendevents.com",
    campaign: "events",
    status: "ready_for_dns",
    primaryFunnel: "/events",
  },
  {
    domain: "charlottejobmarket.com",
    campaign: "jobs",
    status: "ready_for_dns",
    primaryFunnel: "/jobs",
  },
  {
    domain: "charlotteneighborhoodsguide.com",
    campaign: "neighborhoods",
    status: "ready_for_dns",
    primaryFunnel: "/neighborhoods",
  },
  {
    domain: "charlottehomepros.org",
    campaign: "home_pros",
    status: "ready_for_dns",
    primaryFunnel: "/directory",
  },
];

const NEWCOMER_ATTRIBUTE_VALUES = new Set([
  "family-friendly",
  "new-mover-favorite",
  "budget-friendly",
  "english-spanish",
  "walkable",
  "quick-service",
  "veteran-owned",
  "woman-owned",
  "locally-grown",
  "kid-friendly",
  "pet-friendly",
  "open-weekends",
]);

export const appRouter = router({
  system: systemRouter,
  operations: operationsRouter,
  directoryOps: directoryOpsRouter,
  eventOps: eventOpsRouter,
  editorialOps: editorialOpsRouter,
  communityOps: communityOpsRouter,
  sourceRegistry: sourceRegistryRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
    deleteAccount: protectedProcedure
      .input(z.object({ confirmText: z.literal("DELETE MY ACCOUNT") }))
      .mutation(async ({ ctx }) => {
        const deleted = await deleteUserAccount(ctx.user.id);
        if (!deleted)
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to delete account",
          });
        // Clear session cookie
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
        // Notify owner
        notifyOwner({
          title: "Account Deleted",
          content: `User ${ctx.user.name || ctx.user.email || ctx.user.id} deleted their account.`,
        }).catch(() => {});
        return { success: true } as const;
      }),
  }),

  leads: router({
    submitBusiness: publicProcedure
      .input(
        z.object({
          name: z.string().min(1),
          email: z.string().email(),
          businessName: z.string().min(1),
          category: z.string().min(1),
          phone: z.string().optional(),
          website: z.string().optional(),
          area: z.string().optional(),
          description: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const result = await insertBusinessSubmission({
          name: input.name,
          email: input.email,
          businessName: input.businessName,
          category: input.category,
          phone: input.phone ?? null,
          website: input.website ?? null,
          area: input.area ?? null,
          description: input.description ?? null,
        });
        // Notify owner of new business submission
        notifyOwner({
          title: "🏪 New Business Listing Submitted",
          content: `${input.name} (${input.email}) submitted "${input.businessName}" in ${input.category}.${input.area ? ` Area: ${input.area}.` : ""}${input.website ? ` Website: ${input.website}` : ""}`,
        }).catch(() => {}); // fire-and-forget
        return result;
      }),

    // Admin: List all submissions with pagination
    adminList: adminProcedure
      .input(
        z.object({
          status: z.enum(["pending", "approved", "rejected"]).optional(),
          limit: z.number().min(1).max(100).default(20),
          offset: z.number().min(0).default(0),
        })
      )
      .query(async ({ input }) => {
        const [submissions, total] = await Promise.all([
          getBusinessSubmissions(input.status, input.limit, input.offset),
          getBusinessSubmissionCount(input.status),
        ]);
        return { submissions, total, limit: input.limit, offset: input.offset };
      }),

    // Admin: Update submission status
    updateStatus: adminProcedure
      .input(
        z.object({
          id: z.number(),
          status: z.enum(["pending", "approved", "rejected"]),
        })
      )
      .mutation(async ({ input }) => {
        return updateBusinessSubmissionStatus(input.id, input.status);
      }),

    // Admin: Delete submission
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return deleteBusinessSubmission(input.id);
      }),
  }),

  // --- Admin: Google Places enrichment ---
  admin: router({
    searchPlaces: adminProcedure
      .input(
        z.object({
          query: z.string().min(1),
          location: z.string().optional(),
        })
      )
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
      .input(z.object({ placeId: z.string().min(1) }))
      .mutation(async ({ input }) => {
        const result = await makeRequest<PlaceDetailsResult>(
          "/maps/api/place/details/json",
          {
            place_id: input.placeId,
            fields:
              "name,formatted_address,formatted_phone_number,international_phone_number,website,rating,user_ratings_total,reviews,opening_hours,geometry,price_level,types",
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
      .input(
        z.object({
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
        })
      )
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
          verified: "verified",
          enrichedBy: ctx.user.id,
        });
      }),

    getEnrichment: adminProcedure
      .input(z.object({ serviceKey: z.string() }))
      .query(async ({ input }) => {
        return getEnrichedService(input.serviceKey) ?? null;
      }),

    getAllEnrichments: adminProcedure.query(async () => {
      return getAllEnrichedServices();
    }),

    // Admin directory listing management (add new businesses via Google Places)
    addNewListing: adminProcedure
      .input(
        z.object({
          name: z.string().min(1),
          category: z.string().min(1),
          description: z.string().optional(),
          area: z.string().default("Charlotte Metro"),
          phone: z.string().optional(),
          website: z.string().optional(),
          googlePlaceId: z.string().optional(),
          googleRating: z.string().optional(),
          reviewCount: z.number().optional(),
          verifiedAddress: z.string().optional(),
          hoursJson: z.string().optional(),
          googleTypes: z.string().optional(),
          priceLevel: z.number().optional(),
          featured: z.boolean().default(false),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const serviceKey = input.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "");
        const result = await addDirectoryListing({
          serviceKey,
          name: input.name,
          category: input.category,
          description: input.description ?? null,
          area: input.area,
          phone: input.phone ?? null,
          website: input.website ?? null,
          googlePlaceId: input.googlePlaceId ?? null,
          googleRating: input.googleRating ?? null,
          reviewCount: input.reviewCount ?? null,
          verifiedAddress: input.verifiedAddress ?? null,
          hoursJson: input.hoursJson ?? null,
          googleTypes: input.googleTypes ?? null,
          priceLevel: input.priceLevel ?? null,
          featured: input.featured,
          addedBy: ctx.user.id,
        });
        return { success: true, serviceKey };
      }),

    getDirectoryListings: adminProcedure.query(async () => {
      return getAllDirectoryListings();
    }),

    updateListing: adminProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().optional(),
          category: z.string().optional(),
          description: z.string().optional(),
          area: z.string().optional(),
          phone: z.string().optional(),
          website: z.string().optional(),
          featured: z.boolean().optional(),
          active: z.boolean().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return updateDirectoryListing(id, data);
      }),

    deleteListing: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return deleteDirectoryListing(input.id);
      }),

    // Admin blog management
    getAllBlogPosts: adminProcedure.query(async () => {
      return getAllBlogPosts();
    }),
    // Surface stale published blog posts (not updated in N days, default 90).
    // Used by the admin dashboard "needs refresh" panel and the monthly digest job.
    getStaleBlogPosts: adminProcedure
      .input(
        z
          .object({ staleAfterDays: z.number().min(7).max(365).optional() })
          .optional()
      )
      .query(async ({ input }) => {
        return getStaleBlogPosts(input?.staleAfterDays ?? 90);
      }),

    createBlogPost: adminProcedure
      .input(
        z.object({
          title: z.string().min(1),
          slug: z.string().min(1),
          excerpt: z.string().optional(),
          content: z.string().min(1),
          category: z.string().optional(),
          coverImage: z.string().optional(),
          status: z.enum(["draft", "published"]).optional(),
          readTime: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        return createBlogPost({
          title: input.title,
          slug: input.slug,
          excerpt: input.excerpt ?? null,
          content: input.content,
          category: input.category ?? null,
          coverImage: input.coverImage ?? null,
          authorId: ctx.user.id,
          status: input.status ?? "draft",
          readTime: input.readTime ?? null,
          publishedAt: input.status === "published" ? new Date() : null,
        });
      }),

    updateBlogPost: adminProcedure
      .input(
        z.object({
          id: z.number(),
          title: z.string().optional(),
          slug: z.string().optional(),
          excerpt: z.string().optional(),
          content: z.string().optional(),
          category: z.string().optional(),
          coverImage: z.string().optional(),
          status: z.enum(["draft", "published"]).optional(),
          readTime: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        const updateData: Record<string, any> = {};
        if (data.title !== undefined) updateData.title = data.title;
        if (data.slug !== undefined) updateData.slug = data.slug;
        if (data.excerpt !== undefined) updateData.excerpt = data.excerpt;
        if (data.content !== undefined) updateData.content = data.content;
        if (data.category !== undefined) updateData.category = data.category;
        if (data.coverImage !== undefined)
          updateData.coverImage = data.coverImage;
        if (data.status !== undefined) {
          updateData.status = data.status;
          if (data.status === "published") updateData.publishedAt = new Date();
        }
        if (data.readTime !== undefined) updateData.readTime = data.readTime;
        return updateBlogPost(id, updateData);
      }),

    deleteBlogPost: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return deleteBlogPost(input.id);
      }),

    // Admin event management
    getAllEvents: adminProcedure.query(async () => {
      return getAllEvents();
    }),

    createEvent: adminProcedure
      .input(
        z.object({
          title: z.string().min(1),
          slug: z.string().min(1),
          description: z.string().optional(),
          startDate: z.date(),
          endDate: z.date().optional(),
          venueName: z.string().optional(),
          venueAddress: z.string().optional(),
          neighborhood: z.string().optional(),
          externalUrl: z.string().optional(),
          imageUrl: z.string().optional(),
          category: z.enum([
            "concerts",
            "food-drink",
            "sports",
            "arts-culture",
            "festivals",
            "family",
            "nightlife",
            "free",
            "markets",
            "community",
          ]),
          isFeatured: z.enum(["yes", "no"]).optional(),
          isRecurring: z.enum(["yes", "no"]).optional(),
          status: z.enum(["draft", "published", "archived"]).optional(),
          tagIds: z.array(z.number()).optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const { tagIds, ...eventData } = input;
        const result = await createEvent({
          ...eventData,
          description: eventData.description ?? null,
          endDate: eventData.endDate ?? null,
          venueName: eventData.venueName ?? null,
          venueAddress: eventData.venueAddress ?? null,
          neighborhood: eventData.neighborhood ?? null,
          externalUrl: eventData.externalUrl ?? null,
          imageUrl: eventData.imageUrl ?? null,
          isFeatured: eventData.isFeatured ?? "no",
          isRecurring: eventData.isRecurring ?? "no",
          status: eventData.status ?? "draft",
          submittedBy: ctx.user.id,
        });
        return result;
      }),

    updateEvent: adminProcedure
      .input(
        z.object({
          id: z.number(),
          title: z.string().optional(),
          slug: z.string().optional(),
          description: z.string().optional(),
          startDate: z.date().optional(),
          endDate: z.date().optional(),
          venueName: z.string().optional(),
          venueAddress: z.string().optional(),
          neighborhood: z.string().optional(),
          externalUrl: z.string().optional(),
          imageUrl: z.string().optional(),
          category: z
            .enum([
              "concerts",
              "food-drink",
              "sports",
              "arts-culture",
              "festivals",
              "family",
              "nightlife",
              "free",
              "markets",
              "community",
            ])
            .optional(),
          isFeatured: z.enum(["yes", "no"]).optional(),
          isRecurring: z.enum(["yes", "no"]).optional(),
          status: z.enum(["draft", "published", "archived"]).optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        const updateData: Record<string, any> = {};
        for (const [key, val] of Object.entries(data)) {
          if (val !== undefined) updateData[key] = val;
        }
        return updateEvent(id, updateData);
      }),

    deleteEvent: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return deleteEvent(input.id);
      }),

    // Admin tag management
    createTag: adminProcedure
      .input(
        z.object({
          name: z.string().min(1),
          slug: z.string().min(1),
          category: z.enum([
            "neighborhood",
            "activity",
            "audience",
            "season",
            "content-type",
          ]),
        })
      )
      .mutation(async ({ input }) => {
        return createTag(input);
      }),

    addContentTag: adminProcedure
      .input(
        z.object({
          tagId: z.number(),
          contentType: z.enum(["event", "directory", "blog", "neighborhood"]),
          contentId: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        return addContentTag(input);
      }),

    removeContentTag: adminProcedure
      .input(
        z.object({
          tagId: z.number(),
          contentType: z.string(),
          contentId: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        return removeContentTag(
          input.tagId,
          input.contentType,
          input.contentId
        );
      }),

    bulkAddContentTags: adminProcedure
      .input(
        z.object({
          items: z.array(
            z.object({
              tagId: z.number(),
              contentType: z.enum([
                "event",
                "directory",
                "blog",
                "neighborhood",
              ]),
              contentId: z.string(),
            })
          ),
        })
      )
      .mutation(async ({ input }) => {
        return bulkAddContentTags(input.items);
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

  // --- Passport (protected) ---
  passport: router({
    getEntries: protectedProcedure.query(async ({ ctx }) => {
      return getPassportEntries(ctx.user.id);
    }),
    addEntry: protectedProcedure
      .input(
        z.object({
          serviceKey: z.string().optional(),
          customPlaceName: z.string().optional(),
          eventSlug: z.string().optional(),
          neighborhoodId: z.string().optional(),
          notes: z.string().optional(),
          visitedAt: z.date().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        return addPassportEntry({
          userId: ctx.user.id,
          serviceKey: input.serviceKey ?? null,
          customPlaceName: input.customPlaceName ?? null,
          eventSlug: input.eventSlug ?? null,
          neighborhoodId: input.neighborhoodId ?? null,
          notes: input.notes ?? null,
          visitedAt: input.visitedAt ?? new Date(),
        });
      }),
    deleteEntry: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        return deletePassportEntry(input.id, ctx.user.id);
      }),
  }),

  // --- Bingo (public read, protected write) ---
  bingo: router({
    getCards: publicProcedure.query(async () => {
      return getActiveBingoCards();
    }),
    getProgress: protectedProcedure.query(async ({ ctx }) => {
      return getBingoProgress(ctx.user.id);
    }),
    updateProgress: protectedProcedure
      .input(
        z.object({
          cardId: z.number(),
          completedSquaresJson: z.string(),
          completedAt: z.date().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const result = await upsertBingoProgress({
          userId: ctx.user.id,
          cardId: input.cardId,
          completedSquaresJson: input.completedSquaresJson,
          completedAt: input.completedAt ?? null,
        });
        // Notify owner when a bingo card is completed
        if (input.completedAt) {
          notifyOwner({
            title: "🎰 Bingo Card Completed!",
            content: `User ${ctx.user.name ?? ctx.user.id} completed bingo card #${input.cardId}! Time to celebrate a CLT explorer!`,
          }).catch(() => {}); // fire-and-forget
          // Notify the user in-app
          notifyBingoComplete(ctx.user.id, `Card #${input.cardId}`).catch(
            () => {}
          );
        }
        return result;
      }),
  }),

  // --- Wishlist (protected) ---
  wishlist: router({
    getEntries: protectedProcedure.query(async ({ ctx }) => {
      return getWishlistEntries(ctx.user.id);
    }),
    add: protectedProcedure
      .input(
        z.object({
          serviceKey: z.string().min(1),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        return addWishlistEntry({
          userId: ctx.user.id,
          serviceKey: input.serviceKey,
          notes: input.notes ?? null,
        });
      }),
    remove: protectedProcedure
      .input(z.object({ serviceKey: z.string().min(1) }))
      .mutation(async ({ input, ctx }) => {
        return removeWishlistEntry(input.serviceKey, ctx.user.id);
      }),
    updateNotes: protectedProcedure
      .input(z.object({ id: z.number(), notes: z.string() }))
      .mutation(async ({ input, ctx }) => {
        return updateWishlistNotes(input.id, ctx.user.id, input.notes);
      }),
  }),

  // --- Comments (public read, protected write) ---
  comments: router({
    getByTarget: publicProcedure
      .input(
        z.object({
          targetType: z.string(),
          targetId: z.string(),
        })
      )
      .query(async ({ input }) => {
        return getComments(input.targetType, input.targetId);
      }),
    getUserVotes: protectedProcedure
      .input(z.object({ commentIds: z.array(z.number()) }))
      .query(async ({ input, ctx }) => {
        return getUserVotes(ctx.user.id, input.commentIds);
      }),
    add: protectedProcedure
      .input(
        z.object({
          targetType: z.string(),
          targetId: z.string(),
          parentId: z.number().optional(),
          content: z.string().min(1).max(2000),
        })
      )
      .mutation(async ({ input, ctx }) => {
        return addComment({
          userId: ctx.user.id,
          targetType: input.targetType,
          targetId: input.targetId,
          parentId: input.parentId ?? null,
          content: input.content,
        });
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        return deleteComment(input.id, ctx.user.id);
      }),
    vote: protectedProcedure
      .input(
        z.object({
          commentId: z.number(),
          voteType: z.enum(["up", "down"]),
        })
      )
      .mutation(async ({ input, ctx }) => {
        return voteComment(ctx.user.id, input.commentId, input.voteType);
      }),
  }),

  // --- Blog (public read) ---
  blog: router({
    getPublished: publicProcedure.query(async () => {
      return getPublishedBlogPosts();
    }),
    getRecent: publicProcedure
      .input(z.object({ limit: z.number().min(1).max(10).optional() }))
      .query(async ({ input }) => {
        return getRecentBlogPosts(input?.limit ?? 3);
      }),
    getBySlug: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => {
        const post = await getBlogPostBySlug(input.slug);
        return post?.status === "published" ? post : null;
      }),
  }),

  // --- Leaderboard (public) ---
  leaderboard: router({
    byStamps: publicProcedure.query(async () => {
      return getLeaderboardByStamps(20);
    }),
    byBingo: publicProcedure.query(async () => {
      return getLeaderboardByBingo(20);
    }),
    byNeighborhoods: publicProcedure.query(async () => {
      return getLeaderboardByNeighborhoods(20);
    }),
  }),

  // --- Events (public read, admin write) ---
  events: router({
    getPublished: publicProcedure
      .input(
        z
          .object({
            category: z.string().optional(),
            neighborhood: z.string().optional(),
            fromDate: z.date().optional(),
            toDate: z.date().optional(),
            limit: z.number().optional(),
            featured: z.boolean().optional(),
            includeExpired: z.boolean().optional(),
          })
          .optional()
      )
      .query(async ({ input }) => {
        const allEvents = await getPublishedEvents(input ?? undefined);
        // Public listings hide stale events. Events without an end date are
        // treated as lasting 24 hours from their start so in-progress events
        // stay visible; undated events are hidden unless includeExpired.
        if (input?.includeExpired) return allEvents;
        const now = new Date();
        const DEFAULT_EVENT_DURATION_MS = 24 * 60 * 60 * 1000;
        return allEvents.filter(evt => {
          const start = evt.startDate ? new Date(evt.startDate) : null;
          const end = evt.endDate ? new Date(evt.endDate) : null;
          const eventEnd =
            end && !Number.isNaN(end.getTime())
              ? end
              : start && !Number.isNaN(start.getTime())
                ? new Date(start.getTime() + DEFAULT_EVENT_DURATION_MS)
                : null;
          return eventEnd !== null && eventEnd >= now;
        });
      }),
    getBySlug: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => {
        return getEventBySlug(input.slug);
      }),
    getThisWeek: publicProcedure.query(async () => {
      const now = new Date();
      const dayOfWeek = now.getDay();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - dayOfWeek);
      startOfWeek.setHours(0, 0, 0, 0);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 7);
      endOfWeek.setHours(23, 59, 59, 999);
      const thisWeek = await getPublishedEvents({
        fromDate: startOfWeek,
        toDate: endOfWeek,
        limit: 6,
      });
      // If no events this week, fall back to next 30 days of upcoming events
      if (thisWeek.length === 0) {
        return getUpcomingEvents(30).then(events => events.slice(0, 6));
      }
      return thisWeek;
    }),
    submitEvent: protectedProcedure
      .input(
        z.object({
          title: z.string().min(1).max(255),
          description: z.string().min(10).max(5000),
          startDate: z.date(),
          endDate: z.date().optional(),
          venueName: z.string().min(1).max(255),
          venueAddress: z.string().max(500).optional(),
          neighborhood: z.string().max(100).optional(),
          externalUrl: z.string().url().max(500).optional(),
          category: z.enum([
            "concerts",
            "food-drink",
            "sports",
            "arts-culture",
            "festivals",
            "family",
            "nightlife",
            "free",
            "markets",
            "community",
          ]),
          isRecurring: z.enum(["yes", "no"]).optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        assertFeatureEnabled("eventSubmissions");
        const slug =
          input.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "") +
          "-" +
          Date.now().toString(36);
        await createEvent({
          title: input.title,
          slug,
          description: input.description ?? null,
          startDate: input.startDate,
          endDate: input.endDate ?? null,
          venueName: input.venueName ?? null,
          venueAddress: input.venueAddress ?? null,
          neighborhood: input.neighborhood ?? null,
          externalUrl: input.externalUrl ?? null,
          imageUrl: null,
          category: input.category,
          isFeatured: "no",
          isRecurring: input.isRecurring ?? "no",
          status: "draft", // requires admin approval
          submittedBy: ctx.user.id,
        });
        // Notify owner of new event submission
        notifyOwner({
          title: "📅 New Event Submitted",
          content: `${ctx.user.name ?? "A user"} submitted event "${input.title}" at ${input.venueName}${input.neighborhood ? ` in ${input.neighborhood}` : ""}. Category: ${input.category}. Review in admin panel.`,
        }).catch(() => {}); // fire-and-forget
        return { success: true };
      }),

    // --- Event Promotions (Plan A) ---
    createPromotionCheckout: protectedProcedure
      .input(
        z.object({
          eventId: z.number().int().positive(),
          level: EVENT_PROMOTION_LEVEL_SCHEMA,
        })
      )
      .mutation(async ({ input, ctx }) => {
        assertFeatureEnabled("eventPromotions");
        const event = await getEventById(input.eventId);
        if (!event) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Event not found",
          });
        }
        // Ownership: submitter of the event, or admin
        const isOwner = event.submittedBy === ctx.user.id;
        const isAdmin = ctx.user.role === "admin";
        if (!isOwner && !isAdmin) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only the event organizer can promote this event",
          });
        }
        // One active/pending promotion per event at a time
        const existing = await getActivePromotionsForEvent(input.eventId);
        if (existing.length > 0) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "This event already has an active promotion",
          });
        }
        const pkg = EVENT_PROMOTION_PACKAGES[input.level];
        const { id: promotionId } = await createEventPromotion({
          eventId: input.eventId,
          userId: ctx.user.id,
          level: input.level,
          status: "pending",
          priceCents: pkg.priceCents,
          socialPostsDue: pkg.socialPosts,
        });
        const { createEventPromotionCheckout } = await import(
          "./event-promotion-checkout"
        );
        const { url } = await createEventPromotionCheckout({
          level: input.level,
          eventId: input.eventId,
          eventName: event.title ?? event.name ?? `Event #${input.eventId}`,
          promotionId,
          userId: ctx.user.id,
          userEmail: ctx.user.email ?? "",
        });
        return { url, promotionId };
      }),

    myPromotions: protectedProcedure.query(async ({ ctx }) => {
      return getPromotionsForUser(ctx.user.id);
    }),

    /** Public: active event promotions for badge + boost rendering. */
    promoted: publicProcedure.query(async () => {
      return getActivePromotionsPublic();
    }),

    /** Admin: run the Plan A maintenance sweep (expiry + social queue). */
    sweepPromotions: protectedProcedure.mutation(async ({ ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admin only" });
      }
      const expired = await sweepExpiredEventPromotions();
      const social = await queueDueEventPromotionSocialPosts();
      return { ...expired, socialQueued: social.queued };
    }),
  }),

  // --- Activity Feed ---
  activity: router({
    recent: publicProcedure
      .input(
        z.object({ limit: z.number().min(1).max(50).optional() }).optional()
      )
      .query(async ({ input }) => {
        return getRecentActivity(input?.limit ?? 20);
      }),
  }),

  // --- Tags (public read, admin write) ---
  tags: router({
    getAll: publicProcedure
      .input(z.object({ category: z.string().optional() }).optional())
      .query(async ({ input }) => {
        return getAllTags(input?.category);
      }),
    getBySlug: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => {
        return getTagBySlug(input.slug);
      }),
    getContentTags: publicProcedure
      .input(z.object({ contentType: z.string(), contentId: z.string() }))
      .query(async ({ input }) => {
        return getContentTags(input.contentType, input.contentId);
      }),
    getContentByTag: publicProcedure
      .input(
        z.object({ tagId: z.number(), contentType: z.string().optional() })
      )
      .query(async ({ input }) => {
        return getContentByTag(input.tagId, input.contentType);
      }),
  }),

  newsletter: router({
    subscribe: publicProcedure
      .input(
        z.object({
          email: z.string().email(),
          source: z
            .enum(["homepage", "blog", "profile", "registration"])
            .default("homepage"),
        })
      )
      .mutation(async ({ input }) => {
        await requestNewsletterSubscription(input);
        notifyOwner({
          title: "📬 Newsletter Confirmation Requested",
          content: `Newsletter confirmation requested from source: ${input.source}`,
        }).catch(() => {});
        return {
          success: true,
          message: "Your subscription request was received.",
        };
      }),
    toggleOptIn: protectedProcedure
      .input(z.object({ optIn: z.boolean() }))
      .mutation(async ({ ctx, input }) => {
        if (input.optIn && ctx.user.email) {
          await requestNewsletterSubscription({
            email: ctx.user.email,
            source: "profile",
          });
        } else if (!input.optIn && ctx.user.email) {
          await updateUserNewsletter(ctx.user.id, false);
          const { unsubscribeNewsletterByEmail } = await import("./db");
          await unsubscribeNewsletterByEmail(ctx.user.email);
        }
        return { success: true, pendingConfirmation: input.optIn };
      }),
  }),

  // --- Trending Tags (public read, public track) ---
  trending: router({
    getTrending: publicProcedure
      .input(
        z
          .object({
            limit: z.number().min(1).max(20).optional(),
            days: z.number().min(1).max(90).optional(),
          })
          .optional()
      )
      .query(async ({ input }) => {
        return getTrendingTags(input?.limit ?? 10, input?.days ?? 7);
      }),

    track: publicProcedure
      .input(
        z.object({
          tagId: z.number(),
          engagementType: z.enum(["view", "click", "stamp", "share"]),
          contentType: z.string().optional(),
          contentId: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        await trackTagEngagement({
          tagId: input.tagId,
          engagementType: input.engagementType,
          userId: ctx.user?.id ?? null,
          contentType: input.contentType ?? null,
          contentId: input.contentId ?? null,
        });
        return { success: true };
      }),

    trackBatch: publicProcedure
      .input(
        z.object({
          entries: z.array(
            z.object({
              tagId: z.number(),
              engagementType: z.enum(["view", "click", "stamp", "share"]),
              contentType: z.string().optional(),
              contentId: z.string().optional(),
            })
          ),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const entries = input.entries.map(e => ({
          tagId: e.tagId,
          engagementType: e.engagementType,
          userId: ctx.user?.id ?? null,
          contentType: e.contentType ?? null,
          contentId: e.contentId ?? null,
        }));
        await bulkTrackTagEngagement(entries);
        return { success: true };
      }),
  }),

  // --- Search Tracking ---
  search: router({
    track: publicProcedure
      .input(
        z.object({
          query: z.string().min(1).max(512),
          resultCount: z.number().min(0),
          source: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        await trackSearchQuery({
          query: input.query,
          resultCount: input.resultCount,
          userId: ctx.user?.id,
          source: input.source,
        });
        return { success: true };
      }),
    popular: publicProcedure
      .input(
        z
          .object({
            limit: z.number().min(1).max(50).optional(),
            days: z.number().min(1).max(365).optional(),
          })
          .optional()
      )
      .query(async ({ input }) => {
        return getPopularSearches(input?.limit ?? 10, input?.days ?? 30);
      }),
  }),

  // --- Admin Analytics ---
  analytics: router({
    tags: adminProcedure
      .input(
        z.object({ days: z.number().min(1).max(365).optional() }).optional()
      )
      .query(async ({ input }) => {
        return getTagAnalytics(input?.days ?? 30);
      }),
    searches: adminProcedure
      .input(
        z.object({ days: z.number().min(1).max(365).optional() }).optional()
      )
      .query(async ({ input }) => {
        return getSearchAnalytics(input?.days ?? 30);
      }),
    popularSearches: adminProcedure
      .input(
        z
          .object({
            limit: z.number().min(1).max(100).optional(),
            days: z.number().min(1).max(365).optional(),
          })
          .optional()
      )
      .query(async ({ input }) => {
        return getPopularSearches(input?.limit ?? 20, input?.days ?? 30);
      }),
  }),

  // --- Hermes Revenue + Lead Operations Agent ---
  hermesRevenueOps: router({
    snapshot: adminProcedure.query(async () => {
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
      const tasks = generateHermesRevenueTasks(input);
      const summary = buildHermesRevenueOpsSummary(input);
      return { summary, tasks };
    }),
    tasks: adminProcedure.query(async () => {
      const [referrals, claims, premiumListings] = await Promise.all([
        getReferrals({ limit: 100 }),
        getBusinessClaims(),
        getAllPremiumListings(),
      ]);
      return generateHermesRevenueTasks({
        referrals: referrals as any[],
        claims: claims as any[],
        premiumListings: premiumListings as any[],
        microsites: SETTLE_CLT_MICROSITES as any[],
      });
    }),
    draft: adminProcedure
      .input(z.object({ taskId: z.string().min(1) }))
      .query(async ({ input }) => {
        const [referrals, claims, premiumListings] = await Promise.all([
          getReferrals({ limit: 100 }),
          getBusinessClaims(),
          getAllPremiumListings(),
        ]);
        const tasks = generateHermesRevenueTasks({
          referrals: referrals as any[],
          claims: claims as any[],
          premiumListings: premiumListings as any[],
          microsites: SETTLE_CLT_MICROSITES as any[],
        });
        const task = tasks.find(item => item.id === input.taskId);
        if (!task)
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Hermes revenue task not found",
          });
        return createHermesRevenueDraft(task);
      }),
  }),

  // --- Personalized Recommendations ---
  // --- Monthly Digest ---
  digest: router({
    preview: adminProcedure.query(async () => {
      const [newListings, upcomingEvents, recentPosts, trending, recipients] =
        await Promise.all([
          getNewListings(30),
          getUpcomingEvents(30),
          getRecentBlogPosts(30),
          getTrendingTags(5, 30),
          getNewsletterRecipients(),
        ]);
      const totalRecipients = new Set(recipients.subscribers.map(s => s.email))
        .size;
      return {
        newListings,
        upcomingEvents,
        recentPosts,
        trending,
        totalRecipients,
      };
    }),
    generate: adminProcedure.mutation(async () => {
      const { invokeLLM } = await import("./_core/llm");
      const [newListings, upcomingEvents, recentPosts, trending] =
        await Promise.all([
          getNewListings(30),
          getUpcomingEvents(30),
          getRecentBlogPosts(30),
          getTrendingTags(5, 30),
        ]);
      const dataContext = [
        `New Directory Listings (${newListings.length}):`,
        ...newListings
          .slice(0, 10)
          .map(l => `- ${l.name} (${l.category}, ${l.area})`),
        `\nUpcoming Events (${upcomingEvents.length}):`,
        ...upcomingEvents
          .slice(0, 10)
          .map(
            e =>
              `- ${e.title || e.name || "Untitled Event"} on ${e.startDate ? new Date(e.startDate).toLocaleDateString() : "TBD"} at ${e.venueName || "TBA"}`
          ),
        `\nRecent Blog Posts (${recentPosts.length}):`,
        ...recentPosts
          .slice(0, 5)
          .map(p => `- ${p.title} (${p.category || "General"})`),
        `\nTrending Tags:`,
        ...trending.map(
          (t: any) => `- ${t.name} (${t.engagementCount} engagements)`
        ),
      ].join("\n");
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content:
              "You are a friendly newsletter writer for Settle CLT, a guide for people moving to Charlotte, NC. Write a warm, engaging monthly digest email in HTML format. Use inline CSS for styling. Keep it concise but informative. Include sections for new businesses, upcoming events, trending topics, and recent blog posts. Use the Settle CLT brand colors: teal (#2A9D8F) for headers and gold (#E9C46A) for accents.",
          },
          {
            role: "user",
            content: `Generate a "What\'s New This Month in Charlotte" newsletter digest email based on this data:\n\n${dataContext}\n\nMake it friendly, useful for newcomers, and include a call-to-action to visit settleclt.com for more details.`,
          },
        ],
      });
      const rawContent = response.choices?.[0]?.message?.content;
      const htmlContent: string =
        typeof rawContent === "string" ? rawContent : "";
      return {
        html: htmlContent,
        stats: {
          listings: newListings.length,
          events: upcomingEvents.length,
          posts: recentPosts.length,
        },
      };
    }),
    send: adminProcedure
      .input(z.object({ html: z.string(), subject: z.string().optional() }))
      .mutation(async () => {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Newsletter broadcast delivery is not enabled yet.",
        });
      }),
  }),

  // --- Community Reviews ---
  reviews: router({
    getByTarget: publicProcedure
      .input(
        z.object({
          targetType: z.enum(["neighborhood", "directory"]),
          targetId: z.string(),
        })
      )
      .query(async ({ input }) => {
        const [reviewsList, stats] = await Promise.all([
          getReviews(input.targetType, input.targetId),
          getReviewStats(input.targetType, input.targetId),
        ]);
        return { reviews: reviewsList, stats };
      }),
    stats: publicProcedure
      .input(
        z.object({
          targetType: z.enum(["neighborhood", "directory"]),
          targetId: z.string(),
        })
      )
      .query(async ({ input }) => {
        return getReviewStats(input.targetType, input.targetId);
      }),
    bulkStats: publicProcedure
      .input(z.object({ targetType: z.enum(["neighborhood", "directory"]) }))
      .query(async ({ input }) => {
        return getBulkReviewStats(input.targetType);
      }),
    create: protectedProcedure
      .input(
        z.object({
          targetType: z.enum(["neighborhood", "directory"]),
          targetId: z.string(),
          rating: z.number().min(1).max(5),
          tip: z.string().min(5).max(500),
          aspect: z
            .enum([
              "vibe",
              "food",
              "safety",
              "transit",
              "nightlife",
              "cost",
              "general",
            ])
            .optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        await createReview({
          targetType: input.targetType,
          targetId: input.targetId,
          userId: ctx.user.id,
          rating: input.rating,
          tip: input.tip,
          aspect: input.aspect || "general",
        });
        // Notify business owner if this is a directory review on a claimed business
        if (input.targetType === "directory") {
          try {
            const claims = await getBusinessClaims();
            const ownerClaim = claims.find(
              (c: any) =>
                c.serviceKey === input.targetId &&
                c.status === "approved" &&
                c.userId
            );
            if (
              ownerClaim &&
              ownerClaim.userId &&
              ownerClaim.userId !== ctx.user.id
            ) {
              notifyNewReview(
                ownerClaim.userId,
                ownerClaim.businessName,
                input.rating,
                input.targetId
              ).catch(() => {});
            }
          } catch (e) {
            /* non-critical */
          }
        }
        return { success: true };
      }),
    delete: protectedProcedure
      .input(z.object({ reviewId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        await deleteReview(
          input.reviewId,
          ctx.user.id,
          ctx.user.role === "admin"
        );
        return { success: true };
      }),
    toggleVisibility: adminProcedure
      .input(z.object({ reviewId: z.number() }))
      .mutation(async ({ input }) => {
        await toggleReviewVisibility(input.reviewId);
        return { success: true };
      }),
    adminList: adminProcedure.query(async () => {
      return getAllReviews(100);
    }),
  }),

  recommendations: router({
    getForUser: protectedProcedure.query(async ({ ctx }) => {
      return getRecommendedContent(ctx.user.id);
    }),
    myPreferences: protectedProcedure.query(async ({ ctx }) => {
      return getUserTagPreferences(ctx.user.id, 15);
    }),
    updatePreference: protectedProcedure
      .input(
        z.object({
          tagId: z.number(),
          engagementType: z.enum(["view", "click", "stamp", "share"]),
        })
      )
      .mutation(async ({ input, ctx }) => {
        await updateUserTagPreference(
          ctx.user.id,
          input.tagId,
          input.engagementType
        );
        return { success: true };
      }),
  }),

  // --- Referrals ---
  referrals: router({
    submit: publicProcedure
      .input(
        z.object({
          name: z.string().min(1),
          email: z.string().email(),
          phone: z.string().optional(),
          referralType: z.enum([
            "buying",
            "selling",
            "renting",
            "relocating",
            "investing",
          ]),
          budget: z.string().optional(),
          neighborhoods: z.string().optional(),
          timeline: z.string().optional(),
          notes: z.string().optional(),
          currentCity: z.string().optional(),
          referralSource: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const result = await submitReferral({
          ...input,
          userId: ctx.user?.id ?? null,
        });
        // Notify owner of new referral lead
        const typeLabels: Record<string, string> = {
          buying: "Buying a Home",
          selling: "Selling a Home",
          renting: "Renting an Apartment",
          relocating: "Relocating to Charlotte",
          investing: "Real Estate Investing",
        };
        const lines = [
          `NEW LEAD — ${typeLabels[input.referralType] || input.referralType}`,
          ``,
          `Name: ${input.name}`,
          `Email: ${input.email}`,
          `Phone: ${input.phone || "Not provided"}`,
          ``,
          `Service: ${typeLabels[input.referralType] || input.referralType}`,
          `Budget: ${input.budget || "Not specified"}`,
          `Timeline: ${input.timeline || "Not specified"}`,
          `Preferred Neighborhoods: ${input.neighborhoods || "Not specified"}`,
          input.currentCity ? `Moving From: ${input.currentCity}` : "",
          input.notes ? `\nNotes: ${input.notes}` : "",
          input.referralSource ? `Source: ${input.referralSource}` : "",
          ``,
          `⏰ Respond within 48 business hours as promised on Settle CLT.`,
        ]
          .filter(Boolean)
          .join("\n");
        await notifyOwner({
          title: `🏠 New Referral Lead: ${input.name} — ${typeLabels[input.referralType] || input.referralType}`,
          content: lines,
        });
        return result;
      }),
    list: adminProcedure
      .input(
        z
          .object({
            status: z.string().optional(),
            limit: z.number().optional(),
          })
          .optional()
      )
      .query(async ({ input }) => {
        return getReferrals(input);
      }),
    updateStatus: adminProcedure
      .input(
        z.object({
          id: z.number(),
          status: z.enum(["new", "contacted", "matched", "closed", "lost"]),
          adminNotes: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        return updateReferralStatus(input.id, input.status, input.adminNotes);
      }),
    stats: adminProcedure.query(async () => {
      return getReferralStats();
    }),
  }),

  // --- Business Claims ---
  claims: router({
    submit: protectedProcedure
      .input(
        z.object({
          serviceKey: z.string().min(1),
          businessName: z.string().min(1),
          claimantName: z.string().min(1),
          claimantEmail: z.string().email(),
          claimantPhone: z.string().optional(),
          claimantRole: z.string().min(1),
          verificationMethod: z.enum([
            "owner",
            "manager",
            "employee",
            "authorized_rep",
          ]),
          message: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        // Check for existing claim
        const exists = await hasExistingClaim(
          input.serviceKey,
          input.claimantEmail
        );
        if (exists) {
          return {
            success: false,
            error: "You have already submitted a claim for this business.",
          };
        }
        const result = await submitBusinessClaim({
          ...input,
          userId: ctx.user.id,
        });
        // Notify owner
        const roleLabels: Record<string, string> = {
          owner: "Owner",
          manager: "Manager",
          employee: "Employee",
          authorized_rep: "Authorized Representative",
        };
        await notifyOwner({
          title: `🏢 New Business Claim: ${input.businessName}`,
          content: [
            `Business: ${input.businessName} (${input.serviceKey})`,
            `Claimant: ${input.claimantName} (${input.claimantEmail})`,
            input.claimantPhone ? `Phone: ${input.claimantPhone}` : "",
            `Role: ${roleLabels[input.verificationMethod] || input.verificationMethod}`,
            input.message ? `Message: ${input.message}` : "",
          ]
            .filter(Boolean)
            .join("\n"),
        }).catch(() => {});
        return { success: true, id: result.id };
      }),
    checkClaimed: publicProcedure
      .input(z.object({ serviceKey: z.string() }))
      .query(async ({ input }) => {
        const claims = await getBusinessClaims({
          serviceKey: input.serviceKey,
        });
        const approved = claims.find((c: any) => c.status === "approved");
        const pending = claims.find((c: any) => c.status === "pending");
        return { claimed: !!approved, pending: !!pending };
      }),
    list: adminProcedure
      .input(z.object({ status: z.string().optional() }).optional())
      .query(async ({ input }) => {
        return getBusinessClaims(input);
      }),
    updateStatus: adminProcedure
      .input(
        z.object({
          id: z.number(),
          status: z.enum(["pending", "approved", "rejected"]),
          adminNotes: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        // Get the claim details before updating for notification
        const claims = await getBusinessClaims();
        const claim = claims.find((c: any) => c.id === input.id);
        const result =
          input.status === "approved"
            ? await approveBusinessClaimAndCreateOwnerMembership(
                input.id,
                ctx.user.id,
                input.adminNotes
              )
            : await updateBusinessClaimStatus(
                input.id,
                input.status,
                input.adminNotes
              );
        // Notify owner about status change
        if (claim && input.status !== "pending") {
          const statusLabel =
            input.status === "approved" ? "✅ Approved" : "❌ Rejected";
          await notifyOwner({
            title: `Business Claim ${statusLabel}: ${claim.businessName}`,
            content: [
              `Claim for "${claim.businessName}" has been ${input.status}.`,
              `Claimant: ${claim.claimantName} (${claim.claimantEmail})`,
              input.adminNotes ? `Admin Notes: ${input.adminNotes}` : "",
              input.status === "approved"
                ? "The business owner can now manage their listing."
                : "",
            ]
              .filter(Boolean)
              .join("\n"),
          }).catch(() => {});
          // Notify the claimant about their claim status
          if (claim.userId) {
            if (input.status === "approved") {
              notifyClaimApproved(
                claim.userId,
                claim.businessName,
                claim.serviceKey
              ).catch(() => {});
            } else if (input.status === "rejected") {
              notifyClaimRejected(
                claim.userId,
                claim.businessName,
                input.adminNotes
              ).catch(() => {});
            }
          }
        }
        return result;
      }),
    stats: adminProcedure.query(async () => {
      return getBusinessClaimStats();
    }),
  }),

  // ============ Business Owner Portal ============
  businessPortal: router({
    getPublicProfile: publicProcedure
      .input(z.object({ serviceKey: z.string().min(1) }))
      .query(async ({ input }) => {
        const override = await getListingOverride(input.serviceKey);
        if (!override) return null;
        const listing = await getPremiumListing(input.serviceKey);
        const tier = listing?.tier ?? "basic";
        const isActive = listing?.paymentStatus === "active";
        const isFeaturedPlus =
          isActive &&
          (tier === "featured" || tier === "premium" || tier === "pro");
        const isPremiumPlus =
          isActive && (tier === "premium" || tier === "pro");
        return {
          serviceKey: override.serviceKey,
          displayName: override.displayName,
          description: override.description,
          phone: override.phone,
          website: override.website,
          hours: override.hours,
          photoUrls: override.photoUrls
            ? override.photoUrls.split(",").filter(Boolean)
            : [],
          socialLinks: override.socialLinks,
          tagline: override.tagline,
          serviceMenu: isFeaturedPlus
            ? (() => {
                try {
                  const parsed = JSON.parse(override.serviceMenu || "[]");
                  return Array.isArray(parsed) ? parsed : [];
                } catch {
                  return [];
                }
              })()
            : [],
          bookingProvider: isPremiumPlus ? override.bookingProvider : null,
          bookingUrl: isPremiumPlus ? override.bookingUrl : null,
          newcomerAttributes: (() => {
            try {
              const parsed = JSON.parse(override.newcomerAttributes || "[]");
              return Array.isArray(parsed) ? parsed : [];
            } catch {
              return [];
            }
          })(),
        };
      }),
    myMemberships: protectedProcedure.query(async ({ ctx }) => {
      const memberships = await getBusinessMembershipsForUser(ctx.user.id);
      return memberships
        .filter(membership => membership.status === "active")
        .map(membership => ({
          id: membership.id,
          serviceKey: membership.serviceKey,
          role: membership.role,
          permissions: permissionsForBusinessRole(membership.role),
        }));
    }),
    getOverride: protectedProcedure
      .input(z.object({ serviceKey: z.string() }))
      .query(async ({ input, ctx }) => {
        const memberships = await getBusinessMembershipsForUser(
          ctx.user.id,
          input.serviceKey
        );
        requireBusinessPermission(
          memberships,
          input.serviceKey,
          "edit_listing"
        );
        return getListingOverride(input.serviceKey);
      }),
    updateListing: protectedProcedure
      .input(
        z.object({
          serviceKey: z.string(),
          displayName: z.string().optional(),
          description: z.string().optional(),
          phone: z.string().optional(),
          website: z.string().optional(),
          email: z.string().optional(),
          hours: z.string().optional(),
          tagline: z.string().optional(),
          socialLinks: z.string().optional(),
          serviceMenu: z
            .string()
            .max(20000)
            .refine(value => {
              try {
                return Array.isArray(JSON.parse(value));
              } catch {
                return false;
              }
            }, "Service menu must be a valid JSON array"),
          bookingProvider: z
            .enum([
              "Booksy",
              "Square Appointments",
              "Calendly",
              "Acuity",
              "Google booking",
              "Stripe Payment Links",
              "QuickBooks",
              "Other",
            ])
            .optional()
            .or(z.literal("")),
          bookingUrl: z.string().url().max(512).optional().or(z.literal("")),
          newcomerAttributes: z
            .string()
            .max(5000)
            .refine(value => {
              try {
                const parsed = JSON.parse(value);
                return (
                  Array.isArray(parsed) &&
                  parsed.every(
                    item =>
                      typeof item === "string" &&
                      NEWCOMER_ATTRIBUTE_VALUES.has(item)
                  )
                );
              } catch {
                return false;
              }
            }, "Newcomer attributes must be an allowed JSON string array")
            .optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const memberships = await getBusinessMembershipsForUser(
          ctx.user.id,
          input.serviceKey
        );
        const membership = requireBusinessPermission(
          memberships,
          input.serviceKey,
          "edit_listing"
        );
        const { serviceKey, ...data } = input;
        const effectiveClaimId = selectEffectiveClaimId(
          membership.ownerClaimId
        );

        // Tier-gate service menu (Featured+) and booking link (Premium+)
        const premiumListing = await getPremiumListing(serviceKey);
        const tier = premiumListing?.tier ?? "basic";
        const isActive = premiumListing?.paymentStatus === "active";
        const isFeaturedPlus =
          isActive &&
          (tier === "featured" || tier === "premium" || tier === "pro");
        const isPremiumPlus =
          isActive && (tier === "premium" || tier === "pro");

        if (data.serviceMenu !== undefined && !isFeaturedPlus) {
          // Allow clearing (empty array) but block setting non-empty values
          try {
            const parsed = JSON.parse(data.serviceMenu || "[]");
            if (Array.isArray(parsed) && parsed.length > 0) {
              throw new TRPCError({
                code: "FORBIDDEN",
                message:
                  "Service menu is a Featured-tier feature. Upgrade to Featured ($29/mo) or higher to display services.",
              });
            }
          } catch (e) {
            if (e instanceof TRPCError) throw e;
            // Invalid JSON — block it
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Service menu must be a valid JSON array.",
            });
          }
        }
        if (
          (data.bookingProvider !== undefined ||
            data.bookingUrl !== undefined) &&
          !isPremiumPlus
        ) {
          // Allow clearing (empty string) but block setting non-empty values
          const provider = (data.bookingProvider ?? "").trim();
          const url = (data.bookingUrl ?? "").trim();
          if (provider || url) {
            throw new TRPCError({
              code: "FORBIDDEN",
              message:
                "External booking links are a Premium-tier feature. Upgrade to Premium ($79/mo) or higher.",
            });
          }
        }

        return upsertListingOverride(serviceKey, effectiveClaimId, data);
      }),
    uploadPhoto: protectedProcedure
      .input(
        z.object({
          serviceKey: z.string(),
          photoUrl: z.string().url(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const memberships = await getBusinessMembershipsForUser(
          ctx.user.id,
          input.serviceKey
        );
        const membership = requireBusinessPermission(
          memberships,
          input.serviceKey,
          "edit_listing"
        );
        const effectiveClaimId = selectEffectiveClaimId(
          membership.ownerClaimId
        );
        const existing = await getListingOverride(input.serviceKey);
        const currentPhotos = existing?.photoUrls
          ? existing.photoUrls.split(",").filter(Boolean)
          : [];

        // Tier-based photo limit enforcement
        const premiumListing = await getPremiumListing(input.serviceKey);
        const tier = premiumListing?.tier ?? "basic";
        const isActive = premiumListing?.paymentStatus === "active";
        const { canUploadPhoto, getPhotoLimit } = await import(
          "../shared/premium-limits"
        );
        if (!canUploadPhoto(tier, isActive, currentPhotos.length)) {
          const limit = getPhotoLimit(tier, isActive);
          throw new TRPCError({
            code: "FORBIDDEN",
            message: `Photo limit reached. Your ${tier === "basic" ? "free" : tier} tier allows ${limit} photo${limit !== 1 ? "s" : ""}.${tier === "basic" ? " Upgrade to Featured ($29/mo) for 5 photos or Premium ($79/mo) for 15 photos." : ""}`,
          });
        }

        currentPhotos.push(input.photoUrl);
        await upsertListingOverride(input.serviceKey, effectiveClaimId, {
          photoUrls: currentPhotos.join(","),
        });
        return { success: true, photos: currentPhotos };
      }),
    uploadPhotoFile: protectedProcedure
      .input(
        z.object({
          serviceKey: z.string(),
          fileName: z.string().min(1).max(255),
          contentType: z.enum([
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/gif",
          ]),
          data: z.string().min(1),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const memberships = await getBusinessMembershipsForUser(
          ctx.user.id,
          input.serviceKey
        );
        const membership = requireBusinessPermission(
          memberships,
          input.serviceKey,
          "edit_listing"
        );
        const effectiveClaimId = selectEffectiveClaimId(
          membership.ownerClaimId
        );
        const existing = await getListingOverride(input.serviceKey);
        const currentPhotos = existing?.photoUrls
          ? existing.photoUrls.split(",").filter(Boolean)
          : [];

        // Tier-based photo limit enforcement
        const premiumListing = await getPremiumListing(input.serviceKey);
        const tier = premiumListing?.tier ?? "basic";
        const isActive = premiumListing?.paymentStatus === "active";
        const { canUploadPhoto, getPhotoLimit } = await import(
          "../shared/premium-limits"
        );
        if (!canUploadPhoto(tier, isActive, currentPhotos.length)) {
          const limit = getPhotoLimit(tier, isActive);
          throw new TRPCError({
            code: "FORBIDDEN",
            message: `Photo limit reached. Your ${tier === "basic" ? "free" : tier} tier allows ${limit} photo${limit !== 1 ? "s" : ""}.${tier === "basic" ? " Upgrade to Featured ($29/mo) for 5 photos or Premium ($79/mo) for 15 photos." : ""}`,
          });
        }

        // Decode base64 and validate server-side file size (5MB max)
        const buffer = Buffer.from(input.data, "base64");
        const MAX_FILE_SIZE = 5 * 1024 * 1024;
        if (buffer.byteLength > MAX_FILE_SIZE) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Image must be under 5MB.",
          });
        }

        // Validate image magic bytes to prevent disguised non-image uploads
        const ALLOWED_MAGIC: Record<string, number[]> = {
          "image/jpeg": [0xff, 0xd8, 0xff],
          "image/png": [0x89, 0x50, 0x4e, 0x47],
          "image/gif": [0x47, 0x49, 0x46],
          "image/webp": [0x52, 0x49, 0x46, 0x46], // RIFF header (WebP starts with RIFF)
        };
        const expectedMagic = ALLOWED_MAGIC[input.contentType];
        if (
          expectedMagic &&
          !expectedMagic.every((byte, i) => buffer[i] === byte)
        ) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "File content does not match the declared image type.",
          });
        }

        // Generate unique storage key with random suffix to prevent collisions
        const safeFileName = input.fileName.replace(/[^a-zA-Z0-9._-]/g, "-");
        const randomSuffix = Math.random().toString(36).slice(2, 10);
        const storageKey = `business-photos/${input.serviceKey}/${Date.now()}-${randomSuffix}-${safeFileName}`;
        const { url } = await storagePut(storageKey, buffer, input.contentType);

        currentPhotos.push(url);
        await upsertListingOverride(input.serviceKey, effectiveClaimId, {
          photoUrls: currentPhotos.join(","),
        });
        return { success: true, photos: currentPhotos };
      }),
    removePhoto: protectedProcedure
      .input(
        z.object({
          serviceKey: z.string(),
          photoUrl: z.string(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const memberships = await getBusinessMembershipsForUser(
          ctx.user.id,
          input.serviceKey
        );
        const membership = requireBusinessPermission(
          memberships,
          input.serviceKey,
          "edit_listing"
        );
        const effectiveClaimId = selectEffectiveClaimId(
          membership.ownerClaimId
        );
        const existing = await getListingOverride(input.serviceKey);
        const currentPhotos = existing?.photoUrls
          ? existing.photoUrls.split(",").filter(Boolean)
          : [];
        const filtered = currentPhotos.filter(p => p !== input.photoUrl);
        await upsertListingOverride(input.serviceKey, effectiveClaimId, {
          photoUrls: filtered.join(","),
        });
        return { success: true, photos: filtered };
      }),
  }),

  // ============ Premium Listings ============
  premium: router({
    getTier: publicProcedure
      .input(z.object({ serviceKey: z.string() }))
      .query(async ({ input }) => {
        const listing = await getPremiumListing(input.serviceKey);
        return listing
          ? { tier: listing.tier, active: listing.paymentStatus === "active" }
          : { tier: "basic" as const, active: false };
      }),
    getPhotoLimit: publicProcedure
      .input(z.object({ serviceKey: z.string() }))
      .query(async ({ input }) => {
        const listing = await getPremiumListing(input.serviceKey);
        const tier = listing?.tier ?? "basic";
        const active = listing?.paymentStatus === "active";
        const { getPhotoLimit } = await import("../shared/premium-limits");
        return {
          limit: getPhotoLimit(
            tier as "basic" | "featured" | "premium" | "pro",
            active
          ),
          tier,
          active,
        };
      }),
    getActiveTiers: publicProcedure.query(async () => {
      const all = await getAllPremiumListings();
      const active = all.filter(
        (l: any) => l.paymentStatus === "active" && l.tier !== "basic"
      );
      return active.map((l: any) => ({
        serviceKey: l.serviceKey,
        tier: l.tier,
      }));
    }),
    getAnalytics: protectedProcedure
      .input(z.object({ serviceKey: z.string() }))
      .query(async ({ input, ctx }) => {
        if (ctx.user.role !== "admin") {
          const memberships = await getBusinessMembershipsForUser(
            ctx.user.id,
            input.serviceKey
          );
          requireBusinessPermission(
            memberships,
            input.serviceKey,
            "view_analytics"
          );
        }
        const listing = await getPremiumListing(input.serviceKey);
        return listing
          ? {
              views: listing.viewsThisPeriod,
              clicks: listing.clicksThisPeriod,
              leads: listing.leadsThisPeriod,
              tier: listing.tier,
              periodEnd: listing.currentPeriodEnd,
            }
          : null;
      }),
    getGrowthSuggestions: protectedProcedure
      .input(z.object({ serviceKey: z.string() }))
      .query(async ({ input, ctx }) => {
        if (ctx.user.role !== "admin") {
          const memberships = await getBusinessMembershipsForUser(
            ctx.user.id,
            input.serviceKey
          );
          requireBusinessPermission(
            memberships,
            input.serviceKey,
            "view_analytics"
          );
        }

        const [listing, override, enriched, leads] = await Promise.all([
          getPremiumListing(input.serviceKey),
          getListingOverride(input.serviceKey),
          getEnrichedService(input.serviceKey),
          getBusinessLeadsForService(input.serviceKey, { limit: 100 }),
        ]);
        if (
          !listing ||
          listing.tier !== "pro" ||
          listing.paymentStatus !== "active"
        )
          return [];

        let hours: Record<string, unknown> = {};
        try {
          hours = JSON.parse(override?.hours || "{}");
        } catch {
          hours = {};
        }

        const photoCount =
          override?.photoUrls?.split(",").filter(Boolean).length ?? 0;
        const hasHours = Object.values(hours).some(value => Boolean(value));
        const openLeadCount = leads.filter(
          lead => lead.status === "new" || lead.status === "contacted"
        ).length;

        return getBusinessGrowthSuggestions({
          businessName: override?.displayName || input.serviceKey,
          category: enriched?.googleTypes || "local business",
          views: listing.viewsThisPeriod ?? 0,
          clicks: listing.clicksThisPeriod ?? 0,
          leads: listing.leadsThisPeriod ?? 0,
          openLeadCount,
          photoCount,
          hasPhone: Boolean(override?.phone || enriched?.verifiedPhone),
          hasWebsite: Boolean(override?.website),
          hasHours,
        });
      }),
    generateContentPrompts: protectedProcedure
      .input(z.object({ serviceKey: z.string() }))
      .mutation(async ({ input, ctx }) => {
        const memberships = await getBusinessMembershipsForUser(
          ctx.user.id,
          input.serviceKey
        );
        requireBusinessPermission(
          memberships,
          input.serviceKey,
          "view_analytics"
        );
        const [listing, override, enriched] = await Promise.all([
          getPremiumListing(input.serviceKey),
          getListingOverride(input.serviceKey),
          getEnrichedService(input.serviceKey),
        ]);
        if (
          !listing ||
          listing.tier !== "pro" ||
          listing.paymentStatus !== "active"
        )
          return [];
        return generateBusinessContentPrompts({
          serviceKey: input.serviceKey,
          displayName: override?.displayName ?? null,
          description: override?.description ?? null,
          phone: override?.phone ?? enriched?.verifiedPhone ?? null,
          website: override?.website ?? null,
          hours: override?.hours ?? enriched?.hoursJson ?? null,
          tagline: override?.tagline ?? null,
          category: enriched?.googleTypes ?? "local business",
          googleRating: enriched?.googleRating ?? null,
          reviewCount: enriched?.reviewCount ?? null,
          verifiedAddress: enriched?.verifiedAddress ?? null,
        });
      }),
    generateReviewResponse: protectedProcedure
      .input(
        z.object({
          reviewId: z.number().int().positive(),
          serviceKey: z.string(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const memberships = await getBusinessMembershipsForUser(
          ctx.user.id,
          input.serviceKey
        );
        requireBusinessPermission(
          memberships,
          input.serviceKey,
          "view_analytics"
        );
        const [listing, override, enriched, review] = await Promise.all([
          getPremiumListing(input.serviceKey),
          getListingOverride(input.serviceKey),
          getEnrichedService(input.serviceKey),
          getVisibleDirectoryReviewForService(input.reviewId, input.serviceKey),
        ]);
        if (
          !listing ||
          listing.tier !== "pro" ||
          listing.paymentStatus !== "active"
        )
          return { draft: "" };
        if (!review)
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Visible review not found for this business.",
          });
        return {
          draft: await generateBusinessReviewResponse(
            {
              serviceKey: input.serviceKey,
              displayName: override?.displayName ?? null,
              description: override?.description ?? null,
              phone: override?.phone ?? enriched?.verifiedPhone ?? null,
              website: override?.website ?? null,
              hours: override?.hours ?? enriched?.hoursJson ?? null,
              tagline: override?.tagline ?? null,
              category: enriched?.googleTypes ?? "local business",
              googleRating: enriched?.googleRating ?? null,
              reviewCount: enriched?.reviewCount ?? null,
              verifiedAddress: enriched?.verifiedAddress ?? null,
            },
            review
          ),
        };
      }),
    trackView: publicProcedure
      .input(z.object({ serviceKey: z.string() }))
      .mutation(async ({ input }) => {
        await incrementListingAnalytics(input.serviceKey, "viewsThisPeriod");
        return { success: true };
      }),
    trackClick: publicProcedure
      .input(z.object({ serviceKey: z.string() }))
      .mutation(async ({ input }) => {
        await incrementListingAnalytics(input.serviceKey, "clicksThisPeriod");
        return { success: true };
      }),
    trackLead: publicProcedure
      .input(
        z.object({
          serviceKey: z.string(),
          name: z.string().min(1).max(255),
          email: z.string().email(),
          phone: z.string().max(32).optional(),
          message: z.string().min(1).max(2000),
          source: z.string().max(128).optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        // Only allow leads on active premium-tier businesses
        const listing = await getPremiumListing(input.serviceKey);
        requireActivePremium(listing);
        const leadId = await createPremiumLeadWithNotification(
          {
            serviceKey: input.serviceKey,
            name: input.name,
            email: input.email,
            phone: input.phone ?? null,
            message: input.message,
            userId: ctx.user?.id ?? null,
            source: input.source ?? "listing_inquiry",
          },
          {
            createLead: createBusinessLead,
            getOwner: getActiveOwnerMembership,
            notify: notifyUser,
          }
        );
        return { success: true as const, leadId };
      }),
    getLeads: protectedProcedure
      .input(
        z.object({
          serviceKey: z.string(),
          limit: z.number().min(1).max(100).default(50),
          offset: z.number().min(0).default(0),
        })
      )
      .query(async ({ input, ctx }) => {
        const listing = await getPremiumListing(input.serviceKey);
        if (ctx.user.role !== "admin") {
          const memberships = await getBusinessMembershipsForUser(
            ctx.user.id,
            input.serviceKey
          );
          requirePremiumLeadAccess(memberships, input.serviceKey, listing);
        } else {
          requireActivePremium(listing);
        }
        return getBusinessLeadsForService(input.serviceKey, input);
      }),
    getLeadAnalytics: protectedProcedure
      .input(z.object({ serviceKey: z.string() }))
      .query(async ({ input, ctx }) => {
        if (ctx.user.role !== "admin") {
          const memberships = await getBusinessMembershipsForUser(
            ctx.user.id,
            input.serviceKey
          );
          requirePremiumLeadAccess(
            memberships,
            input.serviceKey,
            await getPremiumListing(input.serviceKey)
          );
        } else {
          requireActivePremium(await getPremiumListing(input.serviceKey));
        }
        const leads = await getBusinessLeadsForService(input.serviceKey, {
          limit: 100,
        });
        const total = leads.length;
        const byStatus = leads.reduce<Record<string, number>>((acc, l) => {
          acc[l.status] = (acc[l.status] ?? 0) + 1;
          return acc;
        }, {});
        const bySource = leads.reduce<Record<string, number>>((acc, l) => {
          const source = l.source || "listing_inquiry";
          acc[source] = (acc[source] ?? 0) + 1;
          return acc;
        }, {});
        const totalEstimatedValueCents = leads.reduce(
          (sum, l) => sum + (l.estimatedValueCents ?? 0),
          0
        );
        const openLeads = leads.filter(
          l => l.status === "new" || l.status === "contacted"
        );
        const openValueCents = openLeads.reduce(
          (sum, l) => sum + (l.estimatedValueCents ?? 0),
          0
        );
        const closedWon = leads.filter(l => l.status === "closed");
        const closedValueCents = closedWon.reduce(
          (sum, l) => sum + (l.estimatedValueCents ?? 0),
          0
        );
        const needsFollowUp = leads.filter(
          l =>
            (l.status === "new" || l.status === "contacted") &&
            l.followUpAt &&
            new Date(l.followUpAt).getTime() <= Date.now()
        ).length;
        return {
          total,
          byStatus,
          bySource,
          totalEstimatedValueCents,
          openValueCents,
          closedValueCents,
          needsFollowUp,
          sourcesList: Object.entries(bySource)
            .sort((a, b) => b[1] - a[1])
            .map(([source, count]) => ({
              source,
              count,
              pct: total > 0 ? Math.round((count / total) * 100) : 0,
            })),
        };
      }),
    getReport: protectedProcedure
      .input(z.object({ serviceKey: z.string() }))
      .query(async ({ input, ctx }) => {
        if (ctx.user.role !== "admin") {
          const memberships = await getBusinessMembershipsForUser(
            ctx.user.id,
            input.serviceKey
          );
          requireBusinessPermission(
            memberships,
            input.serviceKey,
            "view_analytics"
          );
        }
        const listing = await getPremiumListing(input.serviceKey);
        if (!listing) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "No premium listing found for this business.",
          });
        }
        if (listing.tier !== "premium" || listing.paymentStatus !== "active") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message:
              "Monthly performance reports are only available for active Premium listings.",
          });
        }
        const leads = await getBusinessLeadsForService(input.serviceKey, {
          limit: 100,
        });
        const dailyAnalytics = await getDailyAnalytics(input.serviceKey, 30);
        const views = listing.viewsThisPeriod ?? 0;
        const clicks = listing.clicksThisPeriod ?? 0;
        const leadCount = listing.leadsThisPeriod ?? 0;
        const ctr = views > 0 ? ((clicks / views) * 100).toFixed(1) : "0.0";
        const conversionRate =
          clicks > 0 ? ((leadCount / clicks) * 100).toFixed(1) : "0.0";
        return {
          serviceKey: input.serviceKey,
          tier: listing.tier,
          periodStart: listing.currentPeriodStart,
          periodEnd: listing.currentPeriodEnd,
          metrics: {
            views,
            clicks,
            leads: leadCount,
            clickThroughRate: `${ctr}%`,
            leadConversionRate: `${conversionRate}%`,
          },
          daily: dailyAnalytics,
          leads: leads.map(l => ({
            id: l.id,
            name: l.name,
            email: l.email,
            phone: l.phone,
            message: l.message.substring(0, 200),
            status: l.status,
            createdAt: l.createdAt,
          })),
          generatedAt: new Date().toISOString(),
        };
      }),
    updateLeadStatus: protectedProcedure
      .input(
        z.object({
          leadId: z.number(),
          status: z.enum([
            "new",
            "contacted",
            "qualified",
            "closed",
            "archived",
          ]),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const lead = await getBusinessLeadById(input.leadId);
        if (!lead)
          throw new TRPCError({ code: "NOT_FOUND", message: "Lead not found" });
        const listing = await getPremiumListing(lead.serviceKey);
        if (ctx.user.role !== "admin") {
          const memberships = await getBusinessMembershipsForUser(
            ctx.user.id,
            lead.serviceKey
          );
          requirePremiumLeadAccess(memberships, lead.serviceKey, listing);
        } else {
          requireActivePremium(listing);
        }
        await updateBusinessLeadStatus(input.leadId, input.status);
        return { success: true as const };
      }),
    updateLeadDetails: protectedProcedure
      .input(
        z.object({
          leadId: z.number(),
          status: z
            .enum(["new", "contacted", "qualified", "closed", "archived"])
            .optional(),
          followUpAt: z.coerce.date().nullable().optional(),
          notes: z.string().max(5000).nullable().optional(),
          source: z.string().max(128).nullable().optional(),
          estimatedValueCents: z
            .number()
            .int()
            .min(0)
            .max(100_000_000)
            .nullable()
            .optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const lead = await getBusinessLeadById(input.leadId);
        if (!lead)
          throw new TRPCError({ code: "NOT_FOUND", message: "Lead not found" });
        const listing = await getPremiumListing(lead.serviceKey);
        if (ctx.user.role !== "admin") {
          const memberships = await getBusinessMembershipsForUser(
            ctx.user.id,
            lead.serviceKey
          );
          requirePremiumLeadAccess(memberships, lead.serviceKey, listing);
        } else {
          requireActivePremium(listing);
        }
        const { leadId, ...details } = input;
        await updateBusinessLeadDetails(leadId, details);
        return { success: true as const };
      }),
    createCheckout: protectedProcedure
      .input(
        z.object({
          tier: z.enum(["featured", "premium", "pro"]),
          serviceKey: z.string(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const memberships = await getBusinessMembershipsForUser(
          ctx.user.id,
          input.serviceKey
        );
        const membership = requireBusinessPermission(
          memberships,
          input.serviceKey,
          "manage_billing"
        );
        assertFeatureEnabled("businessCheckout");
        const claimId = selectEffectiveClaimId(membership.ownerClaimId);
        const claim = (
          await getBusinessClaims({ serviceKey: input.serviceKey })
        ).find(c => c.id === claimId && c.status === "approved");
        if (!claim) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Business ownership record is unavailable.",
          });
        }
        const existingBilling = await getPremiumBillingForCheckout(
          input.serviceKey
        );
        if (
          existingBilling?.stripeCustomerId ||
          existingBilling?.stripeSubscriptionId
        ) {
          throw new TRPCError({
            code: "CONFLICT",
            message:
              "Existing billing must be resolved before starting another checkout.",
          });
        }
        const result = await createCheckoutSession({
          tier: input.tier,
          serviceKey: input.serviceKey,
          businessName: claim.businessName,
          claimId,
          userId: ctx.user.id,
          userEmail: ctx.user.email || "",
          userName: ctx.user.name || "",
        });
        return result;
      }),
    manageSubscription: protectedProcedure
      .input(
        z.object({
          serviceKey: z.string(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const memberships = await getBusinessMembershipsForUser(
          ctx.user.id,
          input.serviceKey
        );
        const membership = requireBusinessPermission(
          memberships,
          input.serviceKey,
          "manage_billing"
        );
        const claimId = selectEffectiveClaimId(membership.ownerClaimId);
        const listing = await getPremiumListing(input.serviceKey);
        if (!listing?.stripeCustomerId) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "No active subscription found.",
          });
        }
        if (listing.claimId !== claimId) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Billing account does not belong to the current owner.",
          });
        }
        return createPortalSession({
          stripeCustomerId: listing.stripeCustomerId,
        });
      }),
    // ─── Promotions (pay-to-show, all tiers) ───
    getPromotions: protectedProcedure
      .input(z.object({ serviceKey: z.string() }))
      .query(async ({ input, ctx }) => {
        const memberships = await getBusinessMembershipsForUser(
          ctx.user.id,
          input.serviceKey
        );
        requireBusinessPermission(
          memberships,
          input.serviceKey,
          "edit_listing"
        );
        return getPromotionsForBusiness(input.serviceKey);
      }),
    createPromotion: protectedProcedure
      .input(
        z.object({
          serviceKey: z.string(),
          type: z.enum([
            "directory_boost",
            "category_spotlight",
            "neighborhood_spotlight",
          ]),
          headline: z.string().min(1).max(255),
          subtitle: z.string().max(500).optional(),
          targetCategory: z.string().max(128).optional(),
          targetNeighborhood: z.string().max(128).optional(),
          priceCents: z.number().int().min(0),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const memberships = await getBusinessMembershipsForUser(
          ctx.user.id,
          input.serviceKey
        );
        requireBusinessPermission(
          memberships,
          input.serviceKey,
          "manage_billing"
        );
        const now = new Date();
        const endsAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30-day promotion
        return createBusinessPromotion({
          serviceKey: input.serviceKey,
          type: input.type,
          headline: input.headline,
          subtitle: input.subtitle ?? null,
          targetCategory: input.targetCategory ?? null,
          targetNeighborhood: input.targetNeighborhood ?? null,
          // Activation must happen after a verified payment/webhook.
          status: "pending",
          priceCents: input.priceCents,
          startsAt: now,
          endsAt,
          userId: ctx.user.id,
        });
      }),
    getActiveDirectoryPromotions: publicProcedure.query(async () => {
      const promos = await getActivePromotions();
      const now = Date.now();
      return promos
        .filter(
          p =>
            (!p.startsAt || new Date(p.startsAt).getTime() <= now) &&
            (!p.endsAt || new Date(p.endsAt).getTime() >= now)
        )
        .map(p => ({
          serviceKey: p.serviceKey,
          type: p.type,
          headline: p.headline,
          subtitle: p.subtitle,
          targetCategory: p.targetCategory,
          targetNeighborhood: p.targetNeighborhood,
        }));
    }),
    // ─── Event Sponsorships ───
    getSponsorships: protectedProcedure
      .input(z.object({ serviceKey: z.string() }))
      .query(async ({ input, ctx }) => {
        const memberships = await getBusinessMembershipsForUser(
          ctx.user.id,
          input.serviceKey
        );
        requireBusinessPermission(
          memberships,
          input.serviceKey,
          "edit_listing"
        );
        return getSponsorshipsForBusiness(input.serviceKey);
      }),
    createSponsorship: protectedProcedure
      .input(
        z.object({
          serviceKey: z.string(),
          eventId: z.number(),
          level: z.enum(["gold", "silver", "bronze"]),
          message: z.string().max(500).optional(),
          priceCents: z.number().int().min(0),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const memberships = await getBusinessMembershipsForUser(
          ctx.user.id,
          input.serviceKey
        );
        requireBusinessPermission(
          memberships,
          input.serviceKey,
          "manage_billing"
        );
        return createEventSponsorship({
          serviceKey: input.serviceKey,
          eventId: input.eventId,
          level: input.level,
          message: input.message ?? null,
          // Activation must happen after a verified payment/webhook.
          status: "pending",
          priceCents: input.priceCents,
          userId: ctx.user.id,
        });
      }),
    getEventSponsors: publicProcedure
      .input(z.object({ eventId: z.number() }))
      .query(async ({ input }) => {
        // Sponsorships remain intentionally hidden until organizer payout and payment routing are approved.
        return [];
      }),
    // ─── Business Referrals (general) ───
    submitBizReferral: publicProcedure
      .input(
        z.object({
          serviceKey: z.string().optional(),
          category: z.string().max(128).optional(),
          name: z.string().min(1).max(255),
          email: z.string().email(),
          phone: z.string().max(32).optional(),
          need: z.string().min(1).max(500),
          source: z.string().max(128).optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const matches = await recommendBusinessMatches(
          input.need,
          input.category,
          input.serviceKey
        );
        const referral = await createBusinessReferral({
          serviceKey: input.serviceKey ?? null,
          category: input.category ?? null,
          name: input.name,
          email: input.email,
          phone: input.phone ?? null,
          need: input.need,
          source: input.source ?? "referral_network",
          matchStatus: matches.length > 0 ? "suggested" : "unmatched",
          matchedServiceKey: matches[0]?.serviceKey ?? null,
          matchReason: matches[0]?.reason ?? null,
          attributionToken: `ref-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
          attributionType: input.serviceKey ? "direct" : "matched",
          userId: ctx.user?.id ?? null,
        });
        if (referral?.id && matches[0]) {
          await updateBusinessReferralMatch(referral.id, {
            matchStatus: "suggested",
            matchedServiceKey: matches[0].serviceKey,
            matchReason: matches[0].reason,
            attributionType: input.serviceKey ? "direct" : "matched",
          });
        }
        return { referralId: referral?.id ?? null, matches };
      }),
    getBizReferrals: protectedProcedure
      .input(z.object({ serviceKey: z.string() }))
      .query(async ({ input, ctx }) => {
        const memberships = await getBusinessMembershipsForUser(
          ctx.user.id,
          input.serviceKey
        );
        requireBusinessPermission(
          memberships,
          input.serviceKey,
          "view_analytics"
        );
        return getBusinessReferralsForService(input.serviceKey);
      }),
    updateBizReferralStatus: protectedProcedure
      .input(
        z.object({
          referralId: z.number(),
          status: z.enum([
            "new",
            "referred",
            "connected",
            "completed",
            "archived",
          ]),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const referral = await getBusinessReferralById(input.referralId);
        if (!referral)
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Referral not found.",
          });
        if (!referral?.serviceKey)
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "This referral has not been assigned to a business.",
          });
        const memberships = await getBusinessMembershipsForUser(
          ctx.user.id,
          referral.serviceKey
        );
        requireBusinessPermission(
          memberships,
          referral.serviceKey,
          "view_analytics"
        );
        await updateBusinessReferralStatus(input.referralId, input.status);
        return { success: true as const };
      }),
    getBizReferralAnalytics: protectedProcedure
      .input(z.object({ serviceKey: z.string() }))
      .query(async ({ input, ctx }) => {
        const memberships = await getBusinessMembershipsForUser(
          ctx.user.id,
          input.serviceKey
        );
        requireBusinessPermission(
          memberships,
          input.serviceKey,
          "view_analytics"
        );
        return getBusinessReferralAnalytics(input.serviceKey);
      }),
    getBizReferralInvitations: protectedProcedure
      .input(z.object({ serviceKey: z.string() }))
      .query(async ({ input, ctx }) => {
        const memberships = await getBusinessMembershipsForUser(
          ctx.user.id,
          input.serviceKey
        );
        requireBusinessPermission(
          memberships,
          input.serviceKey,
          "view_analytics"
        );
        return getReferralInvitationsForBusiness(input.serviceKey);
      }),
    inviteBusinessToReferral: protectedProcedure
      .input(
        z.object({
          referralId: z.number(),
          fromServiceKey: z.string(),
          toServiceKey: z.string(),
          message: z.string().max(500).optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const memberships = await getBusinessMembershipsForUser(
          ctx.user.id,
          input.fromServiceKey
        );
        requireBusinessPermission(
          memberships,
          input.fromServiceKey,
          "view_analytics"
        );
        const referral = await getBusinessReferralById(input.referralId);
        if (!referral)
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Referral not found.",
          });
        if (referral.serviceKey !== input.fromServiceKey)
          throw new TRPCError({
            code: "FORBIDDEN",
            message:
              "You can only invite partners for referrals assigned to your business.",
          });
        const invitation = await createBusinessReferralInvitation({
          referralId: referral.id,
          fromServiceKey: input.fromServiceKey,
          toServiceKey: input.toServiceKey,
          message: input.message ?? null,
          status: "pending",
        });
        return invitation;
      }),
    respondToReferralInvitation: protectedProcedure
      .input(
        z.object({
          invitationId: z.number(),
          serviceKey: z.string(),
          status: z.enum(["accepted", "declined"]),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const memberships = await getBusinessMembershipsForUser(
          ctx.user.id,
          input.serviceKey
        );
        requireBusinessPermission(
          memberships,
          input.serviceKey,
          "view_analytics"
        );
        const invitation = await getReferralInvitationById(input.invitationId);
        if (!invitation || invitation.toServiceKey !== input.serviceKey) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Referral invitation not found.",
          });
        }
        await updateReferralInvitationStatus(input.invitationId, input.status);
        if (input.status === "accepted") {
          await updateBusinessReferralMatch(invitation.referralId, {
            matchStatus: "accepted",
            matchedServiceKey: input.serviceKey,
            matchReason: "Accepted by invited business",
            attributionType: "business_invitation",
          });
        }
        return { success: true as const };
      }),
    adminListPremium: adminProcedure.query(async () => {
      return getAllPremiumListings();
    }),
    adminUpdate: adminProcedure
      .input(
        z.object({
          serviceKey: z.string(),
          tier: z.enum(["basic", "featured", "premium", "pro"]),
          billingEmail: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        return upsertCanonicalPremiumListingForAdmin(input.serviceKey, {
          tier: input.tier,
          billingEmail: input.billingEmail,
        });
      }),
  }),

  // ─── Notifications ─────────────────────────────────────────────
  notifications: router({
    /** Get notifications for the current user */
    list: protectedProcedure
      .input(
        z.object({
          limit: z.number().min(1).max(100).optional().default(30),
          offset: z.number().min(0).optional().default(0),
          unreadOnly: z.boolean().optional().default(false),
        })
      )
      .query(async ({ ctx, input }) => {
        return getUserNotifications(ctx.user.id, input);
      }),

    /** Get unread count */
    unreadCount: protectedProcedure.query(async ({ ctx }) => {
      return { count: await getUnreadNotificationCount(ctx.user.id) };
    }),

    /** Mark a single notification as read */
    markRead: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        return markNotificationRead(input.id, ctx.user.id);
      }),

    /** Mark all notifications as read */
    markAllRead: protectedProcedure.mutation(async ({ ctx }) => {
      return markAllNotificationsRead(ctx.user.id);
    }),

    /** Delete a notification */
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        return deleteNotification(input.id, ctx.user.id);
      }),

    /** Get notification preferences */
    getPreferences: protectedProcedure.query(async ({ ctx }) => {
      return getNotificationPreferences(ctx.user.id);
    }),

    /** Update a notification preference */
    updatePreference: protectedProcedure
      .input(
        z.object({
          category: z.enum([
            "claim",
            "review",
            "payment",
            "event",
            "community",
            "system",
          ]),
          inApp: z.boolean().optional(),
          email: z.boolean().optional(),
          push: z.boolean().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        return upsertNotificationPreference({
          userId: ctx.user.id,
          category: input.category,
          inApp: input.inApp,
          email: input.email,
          push: input.push,
        });
      }),

    /** Save a push subscription */
    savePushSubscription: protectedProcedure
      .input(
        z.object({
          endpoint: z.string(),
          p256dh: z.string(),
          auth: z.string(),
          userAgent: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        return savePushSubscription({
          userId: ctx.user.id,
          endpoint: input.endpoint,
          p256dh: input.p256dh,
          auth: input.auth,
          userAgent: input.userAgent,
        });
      }),

    /** Remove a push subscription */
    removePushSubscription: protectedProcedure
      .input(z.object({ endpoint: z.string() }))
      .mutation(async ({ ctx, input }) => {
        return removePushSubscription(input.endpoint);
      }),

    /** Admin: send a notification to a specific user */
    adminSend: adminProcedure
      .input(
        z.object({
          userId: z.number(),
          category: z.enum([
            "claim",
            "review",
            "payment",
            "event",
            "community",
            "system",
          ]),
          title: z.string().min(1).max(255),
          body: z.string().min(1),
          actionUrl: z.string().optional(),
          icon: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        return createNotification(input);
      }),

    /** Admin: broadcast a notification to all users */
    adminBroadcast: adminProcedure
      .input(
        z.object({
          category: z.enum([
            "claim",
            "review",
            "payment",
            "event",
            "community",
            "system",
          ]),
          title: z.string().min(1).max(255),
          body: z.string().min(1),
          actionUrl: z.string().optional(),
          icon: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { getDb } = await import("./db");
        const { users } = await import("../drizzle/schema");
        const db = await getDb();
        if (!db) return { sent: 0 };
        const allUsers = await db.select({ id: users.id }).from(users);
        let sent = 0;
        for (const user of allUsers) {
          const enabled = await isNotificationEnabled(
            user.id,
            input.category,
            "inApp"
          );
          if (enabled) {
            await createNotification({ ...input, userId: user.id });
            sent++;
          }
        }
        return { sent };
      }),
  }),

  // ─── AI Business Assistant ──────────────────────────────────
  businessAssistant: router({
    ask: publicProcedure
      .input(
        z.object({
          serviceKey: z.string().min(1),
          question: z.string().min(1).max(500),
          history: z
            .array(
              z.object({
                role: z.enum(["user", "assistant"]),
                content: z.string(),
              })
            )
            .max(10)
            .default([]),
        })
      )
      .mutation(async ({ input }) => {
        // Verify the business has an active Pro tier
        const listing = await getPremiumListing(input.serviceKey);
        if (
          !listing ||
          listing.tier !== "pro" ||
          listing.paymentStatus !== "active"
        ) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message:
              "AI assistant is only available for Business Pro listings.",
          });
        }

        // Gather business context
        const override = await getListingOverride(input.serviceKey);
        const enriched = await getEnrichedService(input.serviceKey);
        const faqs = await getBusinessFaqs(input.serviceKey);

        const businessContext = {
          serviceKey: input.serviceKey,
          displayName: override?.displayName ?? null,
          description:
            override?.description ?? enriched?.verifiedAddress ?? null,
          phone: override?.phone ?? enriched?.verifiedPhone ?? null,
          website: override?.website ?? null,
          hours: override?.hours ?? enriched?.hoursJson ?? null,
          tagline: override?.tagline ?? null,
          category: enriched?.googleTypes ?? "local business",
          googleRating: enriched?.googleRating ?? null,
          reviewCount: enriched?.reviewCount ?? null,
          verifiedAddress: enriched?.verifiedAddress ?? null,
        };

        const faqEntries = faqs.map(f => ({
          question: f.question,
          answer: f.answer,
        }));

        const result = await askBusinessAssistant(
          businessContext,
          faqEntries,
          input.question,
          input.history
        );

        return result;
      }),

    getStatus: publicProcedure
      .input(z.object({ serviceKey: z.string() }))
      .query(async ({ input }) => {
        const listing = await getPremiumListing(input.serviceKey);
        return {
          enabled:
            listing?.tier === "pro" && listing.paymentStatus === "active",
        };
      }),
  }),

  // ─── Business FAQ Management (owner) ────────────────────────
  businessFaqs: router({
    list: protectedProcedure
      .input(z.object({ serviceKey: z.string() }))
      .query(async ({ input, ctx }) => {
        const memberships = await getBusinessMembershipsForUser(
          ctx.user.id,
          input.serviceKey
        );
        requireBusinessPermission(
          memberships,
          input.serviceKey,
          "edit_listing"
        );
        const listing = await getPremiumListing(input.serviceKey);
        if (
          !listing ||
          listing.tier !== "pro" ||
          listing.paymentStatus !== "active"
        ) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message:
              "AI assistant memory is available for active Business Pro listings only.",
          });
        }
        return getBusinessFaqs(input.serviceKey);
      }),

    create: protectedProcedure
      .input(
        z.object({
          serviceKey: z.string(),
          question: z.string().min(1).max(500),
          answer: z.string().min(1).max(2000),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const memberships = await getBusinessMembershipsForUser(
          ctx.user.id,
          input.serviceKey
        );
        requireBusinessPermission(
          memberships,
          input.serviceKey,
          "edit_listing"
        );
        const listing = await getPremiumListing(input.serviceKey);
        if (
          !listing ||
          listing.tier !== "pro" ||
          listing.paymentStatus !== "active"
        ) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message:
              "AI assistant memory is available for active Business Pro listings only.",
          });
        }
        const id = await createBusinessFaq({
          serviceKey: input.serviceKey,
          question: input.question,
          answer: input.answer,
        });
        return { id };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number(), serviceKey: z.string() }))
      .mutation(async ({ input, ctx }) => {
        const memberships = await getBusinessMembershipsForUser(
          ctx.user.id,
          input.serviceKey
        );
        requireBusinessPermission(
          memberships,
          input.serviceKey,
          "edit_listing"
        );
        const listing = await getPremiumListing(input.serviceKey);
        if (
          !listing ||
          listing.tier !== "pro" ||
          listing.paymentStatus !== "active"
        ) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message:
              "AI assistant memory is available for active Business Pro listings only.",
          });
        }
        await deleteBusinessFaq(input.id, input.serviceKey);
        return { success: true };
      }),
  }),
});
export type AppRouter = typeof appRouter;
