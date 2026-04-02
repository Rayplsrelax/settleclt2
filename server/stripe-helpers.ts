import Stripe from "stripe";
import { PREMIUM_TIERS, type PremiumTierKey } from "./stripe-products";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY is not configured");
    _stripe = new Stripe(key, { apiVersion: "2025-03-31.basil" as any });
  }
  return _stripe;
}

/**
 * Ensure a Stripe product + price exist for the given tier.
 * Uses metadata to find existing products to avoid duplicates.
 */
async function ensureProduct(tier: PremiumTierKey): Promise<{ productId: string; priceId: string }> {
  const stripe = getStripe();
  const tierConfig = PREMIUM_TIERS[tier];

  // Search for existing product by metadata
  const products = await stripe.products.search({
    query: `metadata["settle_tier"]:"${tier}"`,
  });

  let productId: string;
  if (products.data.length > 0) {
    productId = products.data[0].id;
  } else {
    const product = await stripe.products.create({
      name: `Settle CLT - ${tierConfig.name}`,
      description: tierConfig.description,
      metadata: { settle_tier: tier },
    });
    productId = product.id;
  }

  // Search for existing price
  const prices = await stripe.prices.list({
    product: productId,
    active: true,
    type: "recurring",
    limit: 1,
  });

  let priceId: string;
  if (prices.data.length > 0 && prices.data[0].unit_amount === tierConfig.monthlyPrice) {
    priceId = prices.data[0].id;
  } else {
    const price = await stripe.prices.create({
      product: productId,
      unit_amount: tierConfig.monthlyPrice,
      currency: "usd",
      recurring: { interval: "month" },
      metadata: { settle_tier: tier },
    });
    priceId = price.id;
  }

  return { productId, priceId };
}

/**
 * Create a Stripe Checkout Session for a premium listing subscription.
 */
export async function createCheckoutSession(opts: {
  tier: PremiumTierKey;
  serviceKey: string;
  businessName: string;
  claimId: number;
  userId: number;
  userEmail: string;
  userName: string;
  origin: string;
}): Promise<{ url: string }> {
  const stripe = getStripe();
  const { priceId } = await ensureProduct(opts.tier);

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    customer_email: opts.userEmail,
    client_reference_id: opts.userId.toString(),
    allow_promotion_codes: true,
    metadata: {
      user_id: opts.userId.toString(),
      customer_email: opts.userEmail,
      customer_name: opts.userName,
      service_key: opts.serviceKey,
      business_name: opts.businessName,
      claim_id: opts.claimId.toString(),
      tier: opts.tier,
    },
    success_url: `${opts.origin}/my-business?upgrade=success&tier=${opts.tier}`,
    cancel_url: `${opts.origin}/my-business?upgrade=canceled`,
  });

  return { url: session.url! };
}

/**
 * Create a Stripe Customer Portal session for managing subscriptions.
 */
export async function createPortalSession(opts: {
  stripeCustomerId: string;
  origin: string;
}): Promise<{ url: string }> {
  const stripe = getStripe();
  const session = await stripe.billingPortal.sessions.create({
    customer: opts.stripeCustomerId,
    return_url: `${opts.origin}/my-business`,
  });
  return { url: session.url };
}

/**
 * Verify and construct a Stripe webhook event.
 */
export function constructWebhookEvent(payload: Buffer, sig: string): Stripe.Event {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) throw new Error("STRIPE_WEBHOOK_SECRET is not configured");
  return stripe.webhooks.constructEvent(payload, sig, secret);
}
