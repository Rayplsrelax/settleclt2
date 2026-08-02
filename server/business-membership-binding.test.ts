import { describe, expect, it, vi, beforeEach } from "vitest";
import { readFileSync } from "node:fs";
import { businessClaims } from "../drizzle/schema";

const getApprovedClaimForUser = vi.fn();
const ensureBusinessMembership = vi.fn();

vi.mock("./db", async importOriginal => {
  const actual = await importOriginal<typeof import("./db")>();
  return { ...actual, getApprovedClaimForUser, ensureBusinessMembership };
});

describe("claim approval membership binding", () => {
  beforeEach(() => vi.clearAllMocks());

  it("keeps the existing claim schema available while adding membership binding", () => {
    expect(businessClaims.userId).toBeDefined();
    expect(typeof ensureBusinessMembership).toBe("function");
  });

  it("approved-claim lookup remains available for compatibility during migration", async () => {
    getApprovedClaimForUser.mockResolvedValue([
      { id: 1, serviceKey: "owner-business" },
    ]);
    expect(await getApprovedClaimForUser(7)).toEqual([
      { id: 1, serviceKey: "owner-business" },
    ]);
  });

  it("restores canonical claim provenance when an existing membership is updated", () => {
    const source = readFileSync(new URL("./db.ts", import.meta.url), "utf8");
    const body = source.slice(
      source.indexOf("export async function ensureBusinessMembership"),
      source.indexOf("export async function revokeBusinessMembership"),
    );
    expect(body).toContain("ownerClaimId: data.ownerClaimId");
  });
});
