/**
 * Premium listing tier definitions for Settle CLT directory.
 * Products and prices are created on-demand in Stripe when first needed.
 */

export const PREMIUM_TIERS = {
  featured: {
    name: "Featured Listing",
    description: "Stand out with a Featured badge, priority placement, photo gallery (up to 5), and detailed click analytics.",
    monthlyPrice: 2900, // $29/mo in cents
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
    description: "Maximum visibility with Premium badge, top of search results, expanded photo gallery (up to 15), lead generation analytics, and monthly performance reports.",
    monthlyPrice: 7900, // $79/mo in cents
    features: [
      "Everything in Featured",
      "Premium badge + highlight",
      "Top of search results",
      "Photo gallery (up to 15 photos)",
      "Lead generation analytics",
      "Monthly performance report",
    ],
  },
  pro: {
    name: "Business Pro",
    description: "Full AI-powered business management — 24/7 AI assistant, smart scheduling, social content drafts, reputation monitoring, and a one-page web presence.",
    monthlyPrice: 14900, // $149/mo in cents
    features: [
      "Everything in Premium",
      "AI Business Assistant (24/7 chat widget)",
      "Smart scheduling capture",
      "Social content draft generation",
      "Reputation autopilot (review response drafts)",
      "One-page web presence",
      "Photo gallery (up to 30 photos)",
    ],
  },
} as const;

export type PremiumTierKey = keyof typeof PREMIUM_TIERS;
