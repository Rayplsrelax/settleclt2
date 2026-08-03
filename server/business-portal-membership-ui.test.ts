import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  new URL("../client/src/pages/MyBusiness.tsx", import.meta.url),
  "utf8",
);
const routerSource = readFileSync(new URL("./routers.ts", import.meta.url), "utf8");

describe("membership-driven My Business portal", () => {
  it("loads portal access from memberships instead of approved claims", () => {
    expect(source).toContain("businessPortal.myMemberships.useQuery");
    expect(source).not.toContain("businessPortal.myClaims.useQuery");
    expect(source).toContain("selectedMembership");
    expect(source).not.toContain("selectedClaim");
    expect(source).toContain("reconcileSelectedMembership(memberships, selectedMembershipId)");
    expect(source).toContain("membershipsFetching");
    expect(routerSource).not.toContain("myClaims:");
  });

  it("gates edit, analytics, and billing controls with server-derived permissions", () => {
    expect(source).toContain('permissions.includes("edit_listing")');
    expect(source).toContain('permissions.includes("view_analytics")');
    expect(source).toContain('permissions.includes("manage_billing")');
    expect(source).toContain("key={portalPermissionScopeKey}");
    expect(source).toContain("if (canEdit && override");
    expect(source).toContain("canViewAnalytics && analytics");
    expect(source).toContain("getScopedPortalValue(formState, selectedMembership?.serviceKey)");
    expect(source).toContain("!canEdit || !formIsCurrent");
    expect(source).toContain("updateListing.isPending || !formIsCurrent");
    expect(source).not.toContain("Verified Owner");
  });
});
