type StripeReference = string | { id?: unknown } | null | undefined;

type SubscriptionItemLike = {
  current_period_start?: unknown;
  current_period_end?: unknown;
  price?: {
    id?: unknown;
    metadata?: Record<string, unknown> | null;
  } | null;
};

type SubscriptionLike = {
  status?: unknown;
  current_period_start?: unknown;
  current_period_end?: unknown;
  items?: { data?: SubscriptionItemLike[] | null } | null;
};

type InvoiceLike = {
  subscription?: StripeReference;
  parent?: {
    subscription_details?: { subscription?: StripeReference } | null;
  } | null;
};

type BillingStatus = "active" | "past_due" | "canceled" | "trialing";
type PaidTier = "featured" | "premium" | "pro";

function referenceId(reference: StripeReference): string | null {
  if (typeof reference === "string" && reference) return reference;
  if (reference && typeof reference === "object" && typeof reference.id === "string") {
    return reference.id;
  }
  return null;
}

function timestampDate(value: unknown): Date | undefined {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? new Date(value * 1000)
    : undefined;
}

export function getSubscriptionBillingUpdate(subscription: SubscriptionLike): {
  paymentStatus: BillingStatus;
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
  stripePriceId?: string;
  tier?: PaidTier;
} {
  const statuses: BillingStatus[] = ["active", "past_due", "canceled", "trialing"];
  const paymentStatus = statuses.includes(subscription.status as BillingStatus)
    ? subscription.status as BillingStatus
    : "past_due";
  const item = subscription.items?.data?.[0];
  const currentPeriodStart = timestampDate(item?.current_period_start ?? subscription.current_period_start);
  const currentPeriodEnd = timestampDate(item?.current_period_end ?? subscription.current_period_end);
  const stripePriceId = typeof item?.price?.id === "string" ? item.price.id : undefined;
  const candidateTier = item?.price?.metadata?.settle_tier;
  const tier = candidateTier === "featured" || candidateTier === "premium" || candidateTier === "pro"
    ? candidateTier
    : undefined;

  return {
    paymentStatus,
    ...(currentPeriodStart ? { currentPeriodStart } : {}),
    ...(currentPeriodEnd ? { currentPeriodEnd } : {}),
    ...(stripePriceId ? { stripePriceId } : {}),
    ...(tier ? { tier } : {}),
  };
}

export function getInvoiceSubscriptionId(invoice: InvoiceLike): string | null {
  return referenceId(invoice.parent?.subscription_details?.subscription)
    ?? referenceId(invoice.subscription);
}
