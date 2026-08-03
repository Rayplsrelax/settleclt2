import { TRPCError } from "@trpc/server";

type ApprovedBusinessClaim = {
  id: number;
  serviceKey: string;
};

export type BusinessMembership = {
  serviceKey: string;
  userId: number;
  role: "owner" | "manager" | "editor" | "viewer";
  status: "active" | "revoked";
};

export type BusinessPermission =
  | "edit_listing"
  | "publish_listing"
  | "manage_billing"
  | "manage_team"
  | "view_analytics";

const PERMISSIONS: Record<
  BusinessMembership["role"],
  readonly BusinessPermission[]
> = {
  owner: [
    "edit_listing",
    "publish_listing",
    "manage_billing",
    "manage_team",
    "view_analytics",
  ],
  manager: ["edit_listing", "publish_listing", "view_analytics"],
  editor: ["edit_listing"],
  viewer: ["view_analytics"],
};

export function canManageBusinessPermission(
  membership: BusinessMembership,
  permission: BusinessPermission
): boolean {
  return (
    membership.status === "active" &&
    PERMISSIONS[membership.role].includes(permission)
  );
}

export function permissionsForBusinessRole(
  role: BusinessMembership["role"]
): readonly BusinessPermission[] {
  return PERMISSIONS[role];
}

export function requireBusinessPermission<T extends BusinessMembership>(
  memberships: readonly T[],
  serviceKey: string,
  permission: BusinessPermission
): T {
  const membership = memberships.find(
    candidate =>
      candidate.serviceKey === serviceKey &&
      canManageBusinessPermission(candidate, permission)
  );
  if (!membership) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You do not have permission to manage this business.",
    });
  }
  return membership;
}

export function requireApprovedBusinessClaim<T extends ApprovedBusinessClaim>(
  claims: readonly T[],
  serviceKey: string,
  claimId?: number
): T {
  const claim = claims.find(
    candidate =>
      candidate.serviceKey === serviceKey &&
      (claimId === undefined || candidate.id === claimId)
  );

  if (!claim) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You do not have an approved claim for this business.",
    });
  }

  return claim;
}
