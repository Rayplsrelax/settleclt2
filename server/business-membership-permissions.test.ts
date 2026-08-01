import { describe, expect, it } from "vitest";
import {
  canManageBusinessPermission,
  requireBusinessPermission,
  type BusinessMembership,
  type BusinessPermission,
} from "./business-authorization";

const membership = (
  role: BusinessMembership["role"],
  status: BusinessMembership["status"] = "active"
): BusinessMembership => ({
  serviceKey: "owner-business",
  userId: 7,
  role,
  status,
});

describe("business membership permissions", () => {
  const cases: Array<
    [BusinessMembership["role"], BusinessPermission, boolean]
  > = [
    ["owner", "edit_listing", true],
    ["owner", "publish_listing", true],
    ["owner", "manage_billing", true],
    ["owner", "manage_team", true],
    ["manager", "edit_listing", true],
    ["manager", "publish_listing", true],
    ["manager", "manage_billing", false],
    ["manager", "manage_team", false],
    ["editor", "edit_listing", true],
    ["editor", "publish_listing", false],
    ["editor", "view_analytics", false],
    ["viewer", "view_analytics", true],
    ["viewer", "edit_listing", false],
  ];

  it.each(cases)("%s has %s = %s", (role, permission, expected) => {
    expect(canManageBusinessPermission(membership(role), permission)).toBe(
      expected
    );
  });

  it("revoked memberships have no permissions", () => {
    expect(
      canManageBusinessPermission(
        membership("owner", "revoked"),
        "manage_billing"
      )
    ).toBe(false);
  });

  it("returns an authorized membership and rejects missing authority", () => {
    expect(
      requireBusinessPermission(
        [membership("owner")],
        "owner-business",
        "manage_billing"
      ).role
    ).toBe("owner");
    expect(() =>
      requireBusinessPermission(
        [membership("viewer")],
        "owner-business",
        "edit_listing"
      )
    ).toThrow("You do not have permission to manage this business.");
  });
});
