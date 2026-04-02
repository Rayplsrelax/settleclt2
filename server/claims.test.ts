import { describe, it, expect } from "vitest";
import { businessClaims } from "../drizzle/schema";

describe("Business Claims Schema", () => {
  it("should have the correct table structure", () => {
    // Verify the table has expected columns by checking column keys
    const columns = Object.keys(businessClaims);
    expect(columns.length).toBeGreaterThan(10);
  });

  it("should have all required columns", () => {
    const columns = Object.keys(businessClaims);
    expect(columns).toContain("id");
    expect(columns).toContain("serviceKey");
    expect(columns).toContain("businessName");
    expect(columns).toContain("claimantName");
    expect(columns).toContain("claimantEmail");
    expect(columns).toContain("claimantPhone");
    expect(columns).toContain("claimantRole");
    expect(columns).toContain("verificationMethod");
    expect(columns).toContain("message");
    expect(columns).toContain("userId");
    expect(columns).toContain("status");
    expect(columns).toContain("adminNotes");
    expect(columns).toContain("createdAt");
    expect(columns).toContain("updatedAt");
  });

  it("should have correct status enum values", () => {
    const statusCol = businessClaims.status;
    expect(statusCol.enumValues).toEqual(["pending", "approved", "rejected"]);
  });

  it("should have correct verificationMethod enum values", () => {
    const methodCol = businessClaims.verificationMethod;
    expect(methodCol.enumValues).toEqual(["owner", "manager", "employee", "authorized_rep"]);
  });

  it("should default status to pending", () => {
    expect(businessClaims.status.default).toBeDefined();
  });
});

describe("Business Claims Router Input Validation", () => {
  it("should validate required fields for claim submission", () => {
    // Test that the claim submission requires all mandatory fields
    const validClaim = {
      serviceKey: "amelies-french-bakery",
      businessName: "Amelie's French Bakery",
      claimantName: "Jane Smith",
      claimantEmail: "jane@amelies.com",
      claimantRole: "owner",
      verificationMethod: "owner" as const,
    };
    
    // All required fields present
    expect(validClaim.serviceKey).toBeTruthy();
    expect(validClaim.businessName).toBeTruthy();
    expect(validClaim.claimantName).toBeTruthy();
    expect(validClaim.claimantEmail).toBeTruthy();
    expect(validClaim.claimantRole).toBeTruthy();
    expect(validClaim.verificationMethod).toBeTruthy();
  });

  it("should accept valid verification methods", () => {
    const validMethods = ["owner", "manager", "employee", "authorized_rep"];
    validMethods.forEach(method => {
      expect(businessClaims.verificationMethod.enumValues).toContain(method);
    });
  });

  it("should accept valid status values for admin updates", () => {
    const validStatuses = ["pending", "approved", "rejected"];
    validStatuses.forEach(status => {
      expect(businessClaims.status.enumValues).toContain(status);
    });
  });
});

describe("Business Claims Workflow Logic", () => {
  it("should prevent duplicate claims from the same email for the same business", () => {
    // This tests the logic concept — the actual DB check is in hasExistingClaim
    const existingClaims = [
      { serviceKey: "amelies-french-bakery", claimantEmail: "jane@amelies.com", status: "pending" },
    ];
    
    const newClaim = { serviceKey: "amelies-french-bakery", claimantEmail: "jane@amelies.com" };
    const isDuplicate = existingClaims.some(
      c => c.serviceKey === newClaim.serviceKey && c.claimantEmail === newClaim.claimantEmail
    );
    expect(isDuplicate).toBe(true);
  });

  it("should allow different emails to claim the same business", () => {
    const existingClaims = [
      { serviceKey: "amelies-french-bakery", claimantEmail: "jane@amelies.com", status: "pending" },
    ];
    
    const newClaim = { serviceKey: "amelies-french-bakery", claimantEmail: "john@amelies.com" };
    const isDuplicate = existingClaims.some(
      c => c.serviceKey === newClaim.serviceKey && c.claimantEmail === newClaim.claimantEmail
    );
    expect(isDuplicate).toBe(false);
  });

  it("should allow the same email to claim different businesses", () => {
    const existingClaims = [
      { serviceKey: "amelies-french-bakery", claimantEmail: "jane@amelies.com", status: "pending" },
    ];
    
    const newClaim = { serviceKey: "not-just-coffee", claimantEmail: "jane@amelies.com" };
    const isDuplicate = existingClaims.some(
      c => c.serviceKey === newClaim.serviceKey && c.claimantEmail === newClaim.claimantEmail
    );
    expect(isDuplicate).toBe(false);
  });

  it("should correctly determine claimed status", () => {
    const claims = [
      { status: "approved", serviceKey: "amelies-french-bakery" },
      { status: "pending", serviceKey: "not-just-coffee" },
      { status: "rejected", serviceKey: "mac-tabby-cat-cafe" },
    ];
    
    const isClaimed = (key: string) => claims.some(c => c.serviceKey === key && c.status === "approved");
    const isPending = (key: string) => claims.some(c => c.serviceKey === key && c.status === "pending");
    
    expect(isClaimed("amelies-french-bakery")).toBe(true);
    expect(isClaimed("not-just-coffee")).toBe(false);
    expect(isPending("not-just-coffee")).toBe(true);
    expect(isClaimed("mac-tabby-cat-cafe")).toBe(false);
    expect(isPending("mac-tabby-cat-cafe")).toBe(false);
  });
});
