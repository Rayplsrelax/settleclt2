import { describe, expect, it } from "vitest";
import {
  canManageBusinessPermission,
  type BusinessMembership,
} from "./business-authorization";

describe("membership permission boundaries", () => {
  it("keeps billing owner-only while managers can publish", () => {
    const manager: BusinessMembership = {
      serviceKey: "business",
      userId: 7,
      role: "manager",
      status: "active",
    };
    expect(canManageBusinessPermission(manager, "publish_listing")).toBe(true);
    expect(canManageBusinessPermission(manager, "manage_billing")).toBe(false);
    expect(canManageBusinessPermission(manager, "manage_team")).toBe(false);
  });
});
