/**
 * Premium listing tier definitions for Settle CLT directory.
 * Products and prices are created on-demand in Stripe when first needed.
 */

export const PREMIUM_TIERS = {
  featured: {
    name: "Featured Listing",
    description: "Stand out with a Featured badge, priority placement, photo gallery (up to 5), and detailed click analytics.",
    monthlyPrice: 2900, // $29/mo in cents
    trialDays: 14,
    features: [
      "Featured badge on listing",
      "Priority placement in category",
      "Photo gallery (up to 5 photos)",
      "Detailed click analytics",
      "Verified owner badge",
    ],
  },
  premium: {
    name: "Premium Listing",
    description: "Maximum directory visibility with Premium badge, top of search results, expanded photo gallery (up to 15), lead inbox, lead analytics, and monthly performance reports.",
    monthlyPrice: 7900, // $79/mo in cents
    trialDays: 14,
    features: [
      "Everything in Featured",
      "Premium badge + highlight",
      "Top of search results",
      "Photo gallery (up to 15 photos)",
      "Lead inbox",
      "Lead generation analytics",
      "Monthly performance report",
    ],
  },
  pro: {
    name: "Business Pro",
    description: "AI-assisted business growth — 24/7 assistant, inquiry capture, data-informed recommendations, and practical post-topic suggestions without automatic publishing.",
    monthlyPrice: 14900, // $149/mo in cents
    trialDays: 7,
    features: [
      "Everything in Premium",
      "AI Business Assistant (24/7 chat widget)",
      "Smart inquiry and booking-request capture",
      "Data-informed post-topic suggestions",
      "Profile and lead follow-up recommendations",
      "Photo gallery (up to 30 photos)",
    ],
  },
} as const;

export type PremiumTierKey = keyof typeof PREMIUM_TIERS;
