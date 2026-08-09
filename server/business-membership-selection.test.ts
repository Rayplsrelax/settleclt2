import { describe, expect, it } from "vitest";
import {
  getDefaultPortalTab,
  getPortalPermissionScopeKey,
  getRequestedUpgradeTier,
  getScopedPortalValue,
  reconcileSelectedMembership,
} from "../client/src/lib/businessMembershipSelection";

type Membership = {
  id: number;
  serviceKey: string;
  role: "owner" | "manager" | "editor" | "viewer";
  permissions: string[];
};

const membership = (
  id: number,
  role: Membership["role"],
  permissions: string[],
): Membership => ({ id, serviceKey: `business-${id}`, role, permissions });

describe("portal membership selection reconciliation", () => {
  it("uses the refreshed membership object after a role downgrade", () => {
    const staleOwner = membership(1, "owner", ["edit_listing", "manage_billing"]);
    const refreshedViewer = membership(1, "viewer", ["view_analytics"]);

    const selected = reconcileSelectedMembership([refreshedViewer], staleOwner.id);

    expect(selected).toBe(refreshedViewer);
    expect(selected?.permissions).toEqual(["view_analytics"]);
  });

  it("falls back to another active membership when the selection is revoked", () => {
    const remaining = membership(2, "editor", ["edit_listing"]);

    expect(reconcileSelectedMembership([remaining], 1)).toBe(remaining);
  });

  it("clears selection when no active memberships remain", () => {
    expect(reconcileSelectedMembership([], 1)).toBeNull();
  });

  it("selects the first active membership initially", () => {
    const first = membership(1, "manager", ["edit_listing", "view_analytics"]);
    expect(reconcileSelectedMembership([first], null)).toBe(first);
  });

  it("resets the portal scope and active tab when the same membership loses permissions", () => {
    const ownerPermissions = ["edit_listing", "view_analytics", "manage_billing"];
    const viewerPermissions = ["view_analytics"];

    expect(getPortalPermissionScopeKey(1, ownerPermissions)).not.toBe(
      getPortalPermissionScopeKey(1, viewerPermissions),
    );
    expect(getDefaultPortalTab(ownerPermissions)).toBe("details");
    expect(getDefaultPortalTab(viewerPermissions)).toBe("analytics");
  });

  it("has no active portal tab when no permission remains", () => {
    expect(getDefaultPortalTab([])).toBeNull();
  });

  it("opens billing for a valid paid-tier intent only when billing is allowed", () => {
    expect(getRequestedUpgradeTier("?upgrade=featured")).toBe("featured");
    expect(getRequestedUpgradeTier("?upgrade=premium")).toBe("premium");
    expect(getRequestedUpgradeTier("?upgrade=pro")).toBe("pro");
    expect(getRequestedUpgradeTier("?upgrade=success&tier=premium")).toBeNull();
    expect(getRequestedUpgradeTier("?upgrade=invalid")).toBeNull();
    expect(getDefaultPortalTab(["edit_listing", "manage_billing"], "premium")).toBe("upgrade");
    expect(getDefaultPortalTab(["edit_listing"], "premium")).toBe("details");
  });

  it("does not expose one business form value under another business scope", () => {
    const businessAForm = {
      scopeKey: "business-a",
      value: { displayName: "Business A" },
    };

    expect(getScopedPortalValue(businessAForm, "business-b")).toBeNull();
    expect(getScopedPortalValue(businessAForm, "business-a")).toEqual({
      displayName: "Business A",
    });
  });
});
