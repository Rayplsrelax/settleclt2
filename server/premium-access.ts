import { TRPCError } from "@trpc/server";
import type { BusinessMembership, PremiumListing } from "../drizzle/schema";
import { requireBusinessPermission } from "./business-authorization";

type PremiumState = Pick<PremiumListing, "tier" | "paymentStatus"> | null | undefined;

export function requireActivePremium(listing: PremiumState): void {
  if (!listing || listing.tier !== "premium" || listing.paymentStatus !== "active") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "This feature is only available for active Premium listings.",
    });
  }
}

export function requirePremiumLeadAccess(
  memberships: BusinessMembership[],
  serviceKey: string,
  listing: PremiumState,
): void {
  requireBusinessPermission(memberships, serviceKey, "view_analytics");
  requireActivePremium(listing);
}
