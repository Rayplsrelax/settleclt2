import { getStripe } from "./stripe-helpers";
import { getConfiguredPublicOrigin } from "./public-origin";
import {
  EVENT_PROMOTION_PACKAGES,
  type EventPromotionLevel,
} from "@shared/event-promotions";

/**
 * Plan A: create a one-time Stripe Checkout Session for an event promotion.
 * Uses inline price_data (no pre-created Price objects needed).
 */
export async function createEventPromotionCheckout(opts: {
  level: EventPromotionLevel;
  eventId: number;
  eventName: string;
  promotionId: number;
  userId: number;
  userEmail: string;
}): Promise<{ url: string }> {
  const stripe = getStripe();
  const publicOrigin = getConfiguredPublicOrigin();
  const pkg = EVENT_PROMOTION_PACKAGES[opts.level];

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: pkg.priceCents,
          product_data: {
            name: `Event Promotion — ${pkg.name}`,
            description: `${pkg.durationDays}-day promotion for "${opts.eventName}" on settleclt.com`,
          },
        },
      },
    ],
    customer_email: opts.userEmail,
    client_reference_id: opts.userId.toString(),
    metadata: {
      kind: "event_promotion",
      promotion_id: opts.promotionId.toString(),
      event_id: opts.eventId.toString(),
      user_id: opts.userId.toString(),
      level: opts.level,
    },
    success_url: `${publicOrigin}/my-events?promotion=success`,
    cancel_url: `${publicOrigin}/my-events?promotion=canceled`,
  });

  return { url: session.url! };
}
