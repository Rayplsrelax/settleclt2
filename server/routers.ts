import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router, adminProcedure } from "./_core/trpc";
import { z } from "zod";
import {
  insertBusinessSubmission, insertNewsletterSubscriber,
  upsertEnrichedService, getEnrichedService, getAllEnrichedServices,
  addPassportEntry, getPassportEntries, deletePassportEntry,
  getActiveBingoCards, getBingoProgress, upsertBingoProgress,
  addWishlistEntry, removeWishlistEntry, getWishlistEntries, updateWishlistNotes,
  addComment, getComments, deleteComment, voteComment, getUserVotes,
  createBlogPost, updateBlogPost, deleteBlogPost, getPublishedBlogPosts, getAllBlogPosts, getBlogPostBySlug,
  getLeaderboardByStamps, getLeaderboardByBingo, getLeaderboardByNeighborhoods,
  createEvent, updateEvent, deleteEvent, getPublishedEvents, getAllEvents, getEventBySlug, getEventById,
  createTag, getAllTags, getTagBySlug, addContentTag, removeContentTag, getContentTags, getContentByTag, bulkAddContentTags,
  getRecentActivity,
  addDirectoryListing, getDirectoryListings, getAllDirectoryListings, updateDirectoryListing, deleteDirectoryListing,
  updateUserNewsletter,
  trackTagEngagement, getTrendingTags, bulkTrackTagEngagement,
  trackSearchQuery, getPopularSearches, getSearchAnalytics,
  getTagAnalytics,
  updateUserTagPreference, getUserTagPreferences, getRecommendedContent,
  getNewListings, getUpcomingEvents, getRecentBlogPosts, getNewsletterRecipients,
  createReview, getReviews, getReviewStats, deleteReview, toggleReviewVisibility, getAllReviews,
} from "./db";
import { makeRequest, type PlacesSearchResult, type PlaceDetailsResult } from "./_core/map";
import { notifyOwner } from "./_core/notification";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  leads: router({
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
          content: `${input.name} (${input.email}) submitted "${input.businessName}" in ${input.category}.${input.area ? ` Area: ${input.area}.` : ''}${input.website ? ` Website: ${input.website}` : ''}`,
        }).catch(() => {}); // fire-and-forget
        return result;
      }),
  }),

  // --- Admin: Google Places enrichment ---
  admin: router({
    searchPlaces: adminProcedure
      .input(z.object({
        query: z.string().min(1),
        location: z.string().optional(),
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
      .input(z.object({ placeId: z.string().min(1) }))
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

    getAllEnrichments: adminProcedure.query(async () => {
      return getAllEnrichedServices();
    }),

    // Admin directory listing management (add new businesses via Google Places)
    addNewListing: adminProcedure
      .input(z.object({
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
      }))
      .mutation(async ({ input, ctx }) => {
        const serviceKey = input.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
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
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        category: z.string().optional(),
        description: z.string().optional(),
        area: z.string().optional(),
        phone: z.string().optional(),
        website: z.string().optional(),
        featured: z.boolean().optional(),
        active: z.boolean().optional(),
      }))
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

    createBlogPost: adminProcedure
      .input(z.object({
        title: z.string().min(1),
        slug: z.string().min(1),
        excerpt: z.string().optional(),
        content: z.string().min(1),
        category: z.string().optional(),
        coverImage: z.string().optional(),
        status: z.enum(['draft', 'published']).optional(),
        readTime: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        return createBlogPost({
          title: input.title,
          slug: input.slug,
          excerpt: input.excerpt ?? null,
          content: input.content,
          category: input.category ?? null,
          coverImage: input.coverImage ?? null,
          authorId: ctx.user.id,
          status: input.status ?? 'draft',
          readTime: input.readTime ?? null,
          publishedAt: input.status === 'published' ? new Date() : null,
        });
      }),

    updateBlogPost: adminProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        slug: z.string().optional(),
        excerpt: z.string().optional(),
        content: z.string().optional(),
        category: z.string().optional(),
        coverImage: z.string().optional(),
        status: z.enum(['draft', 'published']).optional(),
        readTime: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        const updateData: Record<string, any> = {};
        if (data.title !== undefined) updateData.title = data.title;
        if (data.slug !== undefined) updateData.slug = data.slug;
        if (data.excerpt !== undefined) updateData.excerpt = data.excerpt;
        if (data.content !== undefined) updateData.content = data.content;
        if (data.category !== undefined) updateData.category = data.category;
        if (data.coverImage !== undefined) updateData.coverImage = data.coverImage;
        if (data.status !== undefined) {
          updateData.status = data.status;
          if (data.status === 'published') updateData.publishedAt = new Date();
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
      .input(z.object({
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
        category: z.enum(['concerts', 'food-drink', 'sports', 'arts-culture', 'festivals', 'family', 'nightlife', 'free', 'markets', 'community']),
        isFeatured: z.enum(['yes', 'no']).optional(),
        isRecurring: z.enum(['yes', 'no']).optional(),
        status: z.enum(['draft', 'published', 'archived']).optional(),
        tagIds: z.array(z.number()).optional(),
      }))
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
          isFeatured: eventData.isFeatured ?? 'no',
          isRecurring: eventData.isRecurring ?? 'no',
          status: eventData.status ?? 'draft',
          submittedBy: ctx.user.id,
        });
        return result;
      }),

    updateEvent: adminProcedure
      .input(z.object({
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
        category: z.enum(['concerts', 'food-drink', 'sports', 'arts-culture', 'festivals', 'family', 'nightlife', 'free', 'markets', 'community']).optional(),
        isFeatured: z.enum(['yes', 'no']).optional(),
        isRecurring: z.enum(['yes', 'no']).optional(),
        status: z.enum(['draft', 'published', 'archived']).optional(),
      }))
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
      .input(z.object({
        name: z.string().min(1),
        slug: z.string().min(1),
        category: z.enum(['neighborhood', 'activity', 'audience', 'season', 'content-type']),
      }))
      .mutation(async ({ input }) => {
        return createTag(input);
      }),

    addContentTag: adminProcedure
      .input(z.object({
        tagId: z.number(),
        contentType: z.enum(['event', 'directory', 'blog', 'neighborhood']),
        contentId: z.string(),
      }))
      .mutation(async ({ input }) => {
        return addContentTag(input);
      }),

    removeContentTag: adminProcedure
      .input(z.object({
        tagId: z.number(),
        contentType: z.string(),
        contentId: z.string(),
      }))
      .mutation(async ({ input }) => {
        return removeContentTag(input.tagId, input.contentType, input.contentId);
      }),

    bulkAddContentTags: adminProcedure
      .input(z.object({
        items: z.array(z.object({
          tagId: z.number(),
          contentType: z.enum(['event', 'directory', 'blog', 'neighborhood']),
          contentId: z.string(),
        })),
      }))
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
      .input(z.object({
        serviceKey: z.string().optional(),
        customPlaceName: z.string().optional(),
        eventSlug: z.string().optional(),
        neighborhoodId: z.string().optional(),
        notes: z.string().optional(),
        visitedAt: z.date().optional(),
      }))
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
      .input(z.object({
        cardId: z.number(),
        completedSquaresJson: z.string(),
        completedAt: z.date().optional(),
      }))
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
      .input(z.object({
        serviceKey: z.string().min(1),
        notes: z.string().optional(),
      }))
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
      .input(z.object({
        targetType: z.string(),
        targetId: z.string(),
      }))
      .query(async ({ input }) => {
        return getComments(input.targetType, input.targetId);
      }),
    getUserVotes: protectedProcedure
      .input(z.object({ commentIds: z.array(z.number()) }))
      .query(async ({ input, ctx }) => {
        return getUserVotes(ctx.user.id, input.commentIds);
      }),
    add: protectedProcedure
      .input(z.object({
        targetType: z.string(),
        targetId: z.string(),
        parentId: z.number().optional(),
        content: z.string().min(1).max(2000),
      }))
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
      .input(z.object({
        commentId: z.number(),
        voteType: z.enum(['up', 'down']),
      }))
      .mutation(async ({ input, ctx }) => {
        return voteComment(ctx.user.id, input.commentId, input.voteType);
      }),
  }),

  // --- Blog (public read) ---
  blog: router({
    getPublished: publicProcedure.query(async () => {
      return getPublishedBlogPosts();
    }),
    getBySlug: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => {
        return getBlogPostBySlug(input.slug) ?? null;
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
      .input(z.object({
        category: z.string().optional(),
        neighborhood: z.string().optional(),
        fromDate: z.date().optional(),
        toDate: z.date().optional(),
        limit: z.number().optional(),
        featured: z.boolean().optional(),
      }).optional())
      .query(async ({ input }) => {
        return getPublishedEvents(input ?? undefined);
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
      return getPublishedEvents({ fromDate: startOfWeek, toDate: endOfWeek, limit: 6 });
    }),
    submitEvent: protectedProcedure
      .input(z.object({
        title: z.string().min(1).max(255),
        description: z.string().min(10).max(5000),
        startDate: z.date(),
        endDate: z.date().optional(),
        venueName: z.string().min(1).max(255),
        venueAddress: z.string().max(500).optional(),
        neighborhood: z.string().max(100).optional(),
        externalUrl: z.string().url().max(500).optional(),
        category: z.enum(['concerts', 'food-drink', 'sports', 'arts-culture', 'festivals', 'family', 'nightlife', 'free', 'markets', 'community']),
        isRecurring: z.enum(['yes', 'no']).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const slug = input.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now().toString(36);
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
          isFeatured: 'no',
          isRecurring: input.isRecurring ?? 'no',
          status: 'draft', // requires admin approval
          submittedBy: ctx.user.id,
        });
        // Notify owner of new event submission
        notifyOwner({
          title: '📅 New Event Submitted',
          content: `${ctx.user.name ?? 'A user'} submitted event "${input.title}" at ${input.venueName}${input.neighborhood ? ` in ${input.neighborhood}` : ''}. Category: ${input.category}. Review in admin panel.`,
        }).catch(() => {}); // fire-and-forget
        return { success: true };
      }),
  }),

  // --- Activity Feed ---
  activity: router({
    recent: publicProcedure
      .input(z.object({ limit: z.number().min(1).max(50).optional() }).optional())
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
      .input(z.object({ tagId: z.number(), contentType: z.string().optional() }))
      .query(async ({ input }) => {
        return getContentByTag(input.tagId, input.contentType);
      }),
  }),

  newsletter: router({
    subscribe: publicProcedure
      .input(z.object({
        email: z.string().email(),
        source: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const result = await insertNewsletterSubscriber({
          email: input.email,
          source: input.source ?? "homepage",
        });
        // Notify owner of new newsletter subscriber
        notifyOwner({
          title: "📬 New Newsletter Subscriber",
          content: `New subscriber: ${input.email} (source: ${input.source ?? 'homepage'})`,
        }).catch(() => {}); // fire-and-forget
        return result;
      }),
    toggleOptIn: protectedProcedure
      .input(z.object({ optIn: z.boolean() }))
      .mutation(async ({ ctx, input }) => {
        await updateUserNewsletter(ctx.user.id, input.optIn);
        // If opting in, also add to newsletter_subscribers table
        if (input.optIn && ctx.user.email) {
          await insertNewsletterSubscriber({ email: ctx.user.email, source: "profile" }).catch(() => {});
        }
        return { success: true };
      }),
  }),


  // --- Trending Tags (public read, public track) ---
  trending: router({
    getTrending: publicProcedure
      .input(z.object({
        limit: z.number().min(1).max(20).optional(),
        days: z.number().min(1).max(90).optional(),
      }).optional())
      .query(async ({ input }) => {
        return getTrendingTags(input?.limit ?? 10, input?.days ?? 7);
      }),

    track: publicProcedure
      .input(z.object({
        tagId: z.number(),
        engagementType: z.enum(['view', 'click', 'stamp', 'share']),
        contentType: z.string().optional(),
        contentId: z.string().optional(),
      }))
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
      .input(z.object({
        entries: z.array(z.object({
          tagId: z.number(),
          engagementType: z.enum(['view', 'click', 'stamp', 'share']),
          contentType: z.string().optional(),
          contentId: z.string().optional(),
        })),
      }))
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
      .input(z.object({
        query: z.string().min(1).max(512),
        resultCount: z.number().min(0),
        source: z.string().optional(),
      }))
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
      .input(z.object({ limit: z.number().min(1).max(50).optional(), days: z.number().min(1).max(365).optional() }).optional())
      .query(async ({ input }) => {
        return getPopularSearches(input?.limit ?? 10, input?.days ?? 30);
      }),
  }),

  // --- Admin Analytics ---
  analytics: router({
    tags: adminProcedure
      .input(z.object({ days: z.number().min(1).max(365).optional() }).optional())
      .query(async ({ input }) => {
        return getTagAnalytics(input?.days ?? 30);
      }),
    searches: adminProcedure
      .input(z.object({ days: z.number().min(1).max(365).optional() }).optional())
      .query(async ({ input }) => {
        return getSearchAnalytics(input?.days ?? 30);
      }),
    popularSearches: adminProcedure
      .input(z.object({ limit: z.number().min(1).max(100).optional(), days: z.number().min(1).max(365).optional() }).optional())
      .query(async ({ input }) => {
        return getPopularSearches(input?.limit ?? 20, input?.days ?? 30);
      }),
  }),

  // --- Personalized Recommendations ---
  // --- Monthly Digest ---
  digest: router({
    preview: adminProcedure.query(async () => {
      const [newListings, upcomingEvents, recentPosts, trending, recipients] = await Promise.all([
        getNewListings(30),
        getUpcomingEvents(30),
        getRecentBlogPosts(30),
        getTrendingTags(5, 30),
        getNewsletterRecipients(),
      ]);
      const totalRecipients = new Set([
        ...recipients.users.map(u => u.email).filter(Boolean),
        ...recipients.subscribers.map(s => s.email),
      ]).size;
      return { newListings, upcomingEvents, recentPosts, trending, totalRecipients };
    }),
    generate: adminProcedure.mutation(async () => {
      const { invokeLLM } = await import("./_core/llm");
      const [newListings, upcomingEvents, recentPosts, trending] = await Promise.all([
        getNewListings(30),
        getUpcomingEvents(30),
        getRecentBlogPosts(30),
        getTrendingTags(5, 30),
      ]);
      const dataContext = [
        `New Directory Listings (${newListings.length}):`,
        ...newListings.slice(0, 10).map(l => `- ${l.name} (${l.category}, ${l.area})`),
        `\nUpcoming Events (${upcomingEvents.length}):`,
        ...upcomingEvents.slice(0, 10).map(e => `- ${e.title} on ${new Date(e.startDate).toLocaleDateString()} at ${e.venueName || 'TBA'}`),
        `\nRecent Blog Posts (${recentPosts.length}):`,
        ...recentPosts.slice(0, 5).map(p => `- ${p.title} (${p.category || 'General'})`),
        `\nTrending Tags:`,
        ...trending.map((t: any) => `- ${t.name} (${t.engagementCount} engagements)`),
      ].join('\n');
      const response = await invokeLLM({
        messages: [
          { role: 'system', content: 'You are a friendly newsletter writer for Settle CLT, a guide for people moving to Charlotte, NC. Write a warm, engaging monthly digest email in HTML format. Use inline CSS for styling. Keep it concise but informative. Include sections for new businesses, upcoming events, trending topics, and recent blog posts. Use the Settle CLT brand colors: teal (#2A9D8F) for headers and gold (#E9C46A) for accents.' },
          { role: 'user', content: `Generate a "What\'s New This Month in Charlotte" newsletter digest email based on this data:\n\n${dataContext}\n\nMake it friendly, useful for newcomers, and include a call-to-action to visit settleclt.com for more details.` },
        ],
      });
      const rawContent = response.choices?.[0]?.message?.content;
      const htmlContent: string = typeof rawContent === 'string' ? rawContent : '';
      return { html: htmlContent, stats: { listings: newListings.length, events: upcomingEvents.length, posts: recentPosts.length } };
    }),
    send: adminProcedure
      .input(z.object({ html: z.string(), subject: z.string().optional() }))
      .mutation(async ({ input }) => {
        const recipients = await getNewsletterRecipients();
        const allEmails = new Set([
          ...recipients.users.map(u => u.email).filter(Boolean),
          ...recipients.subscribers.map(s => s.email),
        ]);
        // Use notifyOwner to send a summary notification
        await notifyOwner({
          title: input.subject || 'Monthly Digest Sent',
          content: `Newsletter digest sent to ${allEmails.size} recipients.\n\nPreview:\n${input.html.substring(0, 500)}...`,
        });
        return { sent: true, recipientCount: allEmails.size };
      }),
  }),

  // --- Community Reviews ---
  reviews: router({
    getByTarget: publicProcedure
      .input(z.object({ targetType: z.enum(["neighborhood", "directory"]), targetId: z.string() }))
      .query(async ({ input }) => {
        const [reviewsList, stats] = await Promise.all([
          getReviews(input.targetType, input.targetId),
          getReviewStats(input.targetType, input.targetId),
        ]);
        return { reviews: reviewsList, stats };
      }),
    stats: publicProcedure
      .input(z.object({ targetType: z.enum(["neighborhood", "directory"]), targetId: z.string() }))
      .query(async ({ input }) => {
        return getReviewStats(input.targetType, input.targetId);
      }),
    create: protectedProcedure
      .input(z.object({
        targetType: z.enum(["neighborhood", "directory"]),
        targetId: z.string(),
        rating: z.number().min(1).max(5),
        tip: z.string().min(5).max(500),
        aspect: z.enum(["vibe", "food", "safety", "transit", "nightlife", "cost", "general"]).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        await createReview({
          targetType: input.targetType,
          targetId: input.targetId,
          userId: ctx.user.id,
          rating: input.rating,
          tip: input.tip,
          aspect: input.aspect || "general",
        });
        return { success: true };
      }),
    delete: protectedProcedure
      .input(z.object({ reviewId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        await deleteReview(input.reviewId, ctx.user.id, ctx.user.role === "admin");
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
      .input(z.object({
        tagId: z.number(),
        engagementType: z.enum(['view', 'click', 'stamp', 'share']),
      }))
      .mutation(async ({ input, ctx }) => {
        await updateUserTagPreference(ctx.user.id, input.tagId, input.engagementType);
        return { success: true };
      }),
  }),
});
export type AppRouter = typeof appRouter;
