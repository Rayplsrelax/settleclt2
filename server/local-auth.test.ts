import { describe, expect, it } from "vitest";
import { hashPassword, normalizeReturnPath, verifyPassword } from "./local-auth";

describe("local authentication primitives", () => {
  it("hashes passwords and verifies the correct password", async () => {
    const encoded = await hashPassword("a-secure-password-123");
    expect(encoded).not.toContain("a-secure-password-123");
    await expect(verifyPassword("a-secure-password-123", encoded)).resolves.toBe(true);
    await expect(verifyPassword("wrong-password-123", encoded)).resolves.toBe(false);
  });

  it("rejects weak passwords", async () => {
    await expect(hashPassword("short")).rejects.toThrow(/at least 12/);
  });

  it("allows only local return paths", () => {
    expect(normalizeReturnPath("/profile?tab=1")).toBe("/profile?tab=1");
    expect(normalizeReturnPath("https://evil.example/steal")).toBe("/");
    expect(normalizeReturnPath("//evil.example/steal")).toBe("/");
    expect(normalizeReturnPath("/\\evil.example")).toBe("/");
  });
});

// This RED suite intentionally establishes the contract for the next auth slice:
// registration, verification, login, password reset, and Google OAuth callbacks
// must be server-owned and fail closed. Route tests are added with the first
// implementation slice.
