export function reconcileSelectedMembership<T extends { id: number }>(
  memberships: readonly T[] | null | undefined,
  selectedMembershipId: number | null,
): T | null {
  if (!memberships?.length) return null;
  if (selectedMembershipId === null) return memberships[0];
  return memberships.find(membership => membership.id === selectedMembershipId) ?? memberships[0];
}

export function getPortalPermissionScopeKey(
  membershipId: number | null | undefined,
  permissions: readonly string[],
): string {
  return `${membershipId ?? "none"}:${[...permissions].sort().join(",")}`;
}

export type RequestedUpgradeTier = "featured" | "premium" | "pro";

export function getUpgradeBillingAction(
  currentTier: "basic" | RequestedUpgradeTier,
  isActive: boolean,
): "checkout" | "portal" {
  return isActive && currentTier !== "basic" ? "portal" : "checkout";
}

export function getRequestedUpgradeTier(search: string): RequestedUpgradeTier | null {
  const requestedTier = new URLSearchParams(search).get("upgrade");
  return requestedTier === "featured" || requestedTier === "premium" || requestedTier === "pro"
    ? requestedTier
    : null;
}

export function getDefaultPortalTab(
  permissions: readonly string[],
  requestedUpgradeTier: RequestedUpgradeTier | null = null,
): string | null {
  if (requestedUpgradeTier && permissions.includes("manage_billing")) return "upgrade";
  if (permissions.includes("edit_listing")) return "details";
  if (permissions.includes("view_analytics")) return "analytics";
  if (permissions.includes("manage_billing")) return "upgrade";
  return null;
}

export function getScopedPortalValue<T>(
  scopedValue: { scopeKey: string | null; value: T },
  currentScopeKey: string | null | undefined,
): T | null {
  if (!currentScopeKey || scopedValue.scopeKey !== currentScopeKey) return null;
  return scopedValue.value;
}
