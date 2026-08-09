import type { CheckoutRejection } from "./stripe-checkout-reconciliation";

type CheckoutSession = {
  id: string;
  customer?: unknown;
  subscription?: unknown;
  metadata?: Record<string, string | undefined> | null;
};

type CanonicalCheckoutInput = {
  serviceKey: string;
  tier: "featured" | "premium" | "pro";
  claimId: number;
  userId: number;
  billingEmail?: string;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
};

type CheckoutCompletionDependencies = {
  activateCanonicalCheckout(input: CanonicalCheckoutInput): Promise<{ accepted: boolean }>;
  reconcileRejectedCheckout(details: CheckoutRejection): Promise<unknown>;
};

function reconciliationReason(error: unknown): string {
  if (typeof error === "object" && error !== null && "code" in error && error.code === "ER_DUP_ENTRY") {
    return "billing_uniqueness_failure";
  }
  if (error instanceof Error && error.message === "Existing Stripe billing conflicts with checkout completion") {
    return "conflicting_checkout_identifiers";
  }
  return "activation_rejected";
}

export async function processCheckoutCompletion(
  stripeEventId: string,
  session: CheckoutSession,
  deps: CheckoutCompletionDependencies,
) {
  const metadata = session.metadata;
  const claimId = Number(metadata?.claim_id);
  const userId = Number(metadata?.user_id);
  const tier = metadata?.tier;
  const serviceKey = metadata?.service_key;
  const stripeCustomerId = typeof session.customer === "string" ? session.customer : "";
  const stripeSubscriptionId = typeof session.subscription === "string" ? session.subscription : "";

  if (!stripeSubscriptionId) {
    throw new Error("Checkout session is missing a Stripe subscription");
  }

  const reconcile = async (reason: string) => {
    await deps.reconcileRejectedCheckout({
      stripeEventId,
      checkoutSessionId: session.id,
      stripeSubscriptionId,
      stripeCustomerId: stripeCustomerId || undefined,
      serviceKey: serviceKey || undefined,
      claimId: Number.isSafeInteger(claimId) && claimId > 0 ? claimId : undefined,
      reason,
    });
    return { accepted: false as const, reconciledSubscriptionId: stripeSubscriptionId };
  };

  if (
    !serviceKey ||
    (tier !== "featured" && tier !== "premium" && tier !== "pro") ||
    !Number.isSafeInteger(claimId) || claimId <= 0 ||
    !Number.isSafeInteger(userId) || userId <= 0 ||
    !stripeCustomerId
  ) {
    return reconcile("malformed_metadata");
  }

  let activation: { accepted: boolean };
  try {
    activation = await deps.activateCanonicalCheckout({
      serviceKey,
      tier,
      claimId,
      userId,
      billingEmail: metadata?.customer_email,
      stripeCustomerId,
      stripeSubscriptionId,
    });
  } catch (error) {
    return reconcile(reconciliationReason(error));
  }

  if (!activation.accepted) {
    return reconcile("canonical_owner_changed");
  }

  return { accepted: true as const, userId, tier, serviceKey };
}
