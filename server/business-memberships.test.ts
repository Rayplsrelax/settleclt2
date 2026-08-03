import { describe, expect, it } from "vitest";
import {
  activeMembershipForUser,
  type MembershipRecord,
} from "./business-memberships";
import { getTableConfig } from "drizzle-orm/mysql-core";
import { businessMemberships } from "../drizzle/schema";

const records: MembershipRecord[] = [
  {
    id: 1,
    serviceKey: "owner-business",
    userId: 7,
    role: "owner",
    status: "active",
    createdBy: 7,
    revokedAt: null,
  },
  {
    id: 2,
    serviceKey: "revoked-business",
    userId: 7,
    role: "owner",
    status: "revoked",
    createdBy: 7,
    revokedAt: new Date(),
  },
  {
    id: 3,
    serviceKey: "other-business",
    userId: 8,
    role: "manager",
    status: "active",
    createdBy: 7,
    revokedAt: null,
  },
];

describe("activeMembershipForUser", () => {
  it("enforces one membership row per business and user", () => {
    const config = getTableConfig(businessMemberships);
    expect(
      config.indexes.some(
        index => index.config.unique && index.config.columns.length === 2
      )
    ).toBe(true);
  });

  it("enforces a single active owner per business", () => {
    const config = getTableConfig(businessMemberships);
    expect(
      config.indexes.some(
        index =>
          index.config.unique &&
          index.config.columns.length === 1 &&
          index.config.columns[0]?.name === "activeOwnerKey"
      )
    ).toBe(true);
  });

  it("returns only an active membership for the requested user", () => {
    expect(activeMembershipForUser(records, 7, "owner-business")?.id).toBe(1);
  });

  it("does not treat revoked or other-user memberships as authority", () => {
    expect(activeMembershipForUser(records, 7, "revoked-business")).toBeNull();
    expect(activeMembershipForUser(records, 7, "other-business")).toBeNull();
  });
});
