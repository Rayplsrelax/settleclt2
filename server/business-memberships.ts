export const BUSINESS_MEMBERSHIP_ROLES = [
  "owner",
  "manager",
  "editor",
  "viewer",
] as const;
export const BUSINESS_MEMBERSHIP_STATUSES = ["active", "revoked"] as const;

export type BusinessMembershipRole = (typeof BUSINESS_MEMBERSHIP_ROLES)[number];
export type BusinessMembershipStatus =
  (typeof BUSINESS_MEMBERSHIP_STATUSES)[number];

export type MembershipRecord = {
  id: number;
  serviceKey: string;
  userId: number;
  ownerClaimId?: number | null;
  role: BusinessMembershipRole;
  status: BusinessMembershipStatus;
  createdBy: number;
  revokedAt: Date | null;
};

export function selectEffectiveClaimId(ownerClaimId: number | null | undefined): number {
  if (!ownerClaimId) throw new Error("Business membership is missing an owner claim");
  return ownerClaimId;
}

type BillingOwnershipRecord = {
  claimId: number | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
};

export function assertNoConflictingBillingOwner(
  incomingClaimId: number,
  existing: BillingOwnershipRecord | null | undefined,
): void {
  if (!existing) return;
  const hasStripeBilling = Boolean(
    existing.stripeCustomerId || existing.stripeSubscriptionId,
  );
  if (hasStripeBilling && existing.claimId !== incomingClaimId) {
    throw new Error(
      "Existing Stripe billing must be resolved before ownership transfer",
    );
  }
}

export function assertCheckoutIdentifiersCompatible(
  existing: { stripeCustomerId?: string | null; stripeSubscriptionId?: string | null } | null,
  incoming: { stripeCustomerId: string; stripeSubscriptionId: string },
): void {
  if (!existing) return;
  const customerConflicts = existing.stripeCustomerId && existing.stripeCustomerId !== incoming.stripeCustomerId;
  const subscriptionConflicts = existing.stripeSubscriptionId && existing.stripeSubscriptionId !== incoming.stripeSubscriptionId;
  if (customerConflicts || subscriptionConflicts) {
    throw new Error("Existing Stripe billing conflicts with checkout completion");
  }
}

export function assertUniquePremiumServiceKeys(
  records: readonly {
    serviceKey: string;
    stripeCustomerId?: string | null;
    stripeSubscriptionId?: string | null;
  }[],
): void {
  const seen = new Set<string>();
  const seenCustomers = new Set<string>();
  const seenSubscriptions = new Set<string>();
  for (const record of records) {
    if (seen.has(record.serviceKey)) {
      throw new Error("Duplicate premium listing records require reconciliation");
    }
    seen.add(record.serviceKey);

    if (record.stripeCustomerId) {
      if (seenCustomers.has(record.stripeCustomerId)) {
        throw new Error("Duplicate Stripe customer requires reconciliation");
      }
      seenCustomers.add(record.stripeCustomerId);
    }
    if (record.stripeSubscriptionId) {
      if (seenSubscriptions.has(record.stripeSubscriptionId)) {
        throw new Error("Duplicate Stripe subscription requires reconciliation");
      }
      seenSubscriptions.add(record.stripeSubscriptionId);
    }
  }
}

export function activeMembershipForUser(
  memberships: readonly MembershipRecord[],
  userId: number,
  serviceKey?: string
): MembershipRecord | null {
  return (
    memberships.find(
      membership =>
        membership.userId === userId &&
        membership.status === "active" &&
        (serviceKey === undefined || membership.serviceKey === serviceKey)
    ) ?? null
  );
}
