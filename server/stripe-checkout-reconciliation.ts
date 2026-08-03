export type CheckoutRejection = {
  stripeEventId: string;
  checkoutSessionId: string;
  stripeSubscriptionId: string;
  reason: string;
  serviceKey?: string;
  claimId?: number;
  stripeCustomerId?: string;
};

type Reservation = {
  status: "pending" | "failed" | "succeeded";
  acquired: boolean;
  leaseToken?: string;
};

type ReconciliationDependencies = {
  reserve(details: CheckoutRejection): Promise<Reservation>;
  cancelSubscription(subscriptionId: string): Promise<unknown>;
  markSucceeded(stripeEventId: string, checkoutSessionId: string, leaseToken: string): Promise<unknown>;
  markFailed(stripeEventId: string, checkoutSessionId: string, leaseToken: string, error: string): Promise<unknown>;
};

export async function cancelSubscriptionIfActive(
  subscriptionId: string,
  stripe: {
    retrieve(id: string): Promise<{ status: string }>;
    cancel(id: string): Promise<unknown>;
  },
) {
  const subscription = await stripe.retrieve(subscriptionId);
  if (subscription.status !== "canceled") {
    await stripe.cancel(subscriptionId);
  }
}

export async function reconcileRejectedCheckout(
  details: CheckoutRejection,
  deps: ReconciliationDependencies,
) {
  const reservation = await deps.reserve(details);
  if (reservation.status === "succeeded") {
    return { reconciled: true as const, alreadyCompleted: true as const };
  }
  if (!reservation.acquired || !reservation.leaseToken) {
    throw new Error("Checkout reconciliation is already in progress");
  }

  try {
    await deps.cancelSubscription(details.stripeSubscriptionId);
    await deps.markSucceeded(details.stripeEventId, details.checkoutSessionId, reservation.leaseToken);
    return { reconciled: true as const };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Stripe cancellation failed";
    await deps.markFailed(details.stripeEventId, details.checkoutSessionId, reservation.leaseToken, message);
    throw error;
  }
}
