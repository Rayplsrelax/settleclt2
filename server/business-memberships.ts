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
