import { describe, expect, it } from "vitest";
import {
  createOAuthState,
  normalizeOAuthReturnPath,
  verifyOAuthState,
} from "./oauth-state";

const secret = "test-secret-that-is-long-enough";
const now = new Date("2026-07-31T22:00:00.000Z");

describe("OAuth state", () => {
  it("round-trips an allowlisted return path and nonce", async () => {
    const state = await createOAuthState(
      { returnTo: "/my-business", nonce: "nonce-123" },
      { secret, now }
    );

    await expect(
      verifyOAuthState(state, { secret, expectedNonce: "nonce-123", now })
    ).resolves.toEqual({
      returnTo: "/my-business",
      nonce: "nonce-123",
    });
  });

  it("allows only local application return paths", () => {
    expect(normalizeOAuthReturnPath("/my-business?claim=owner-business")).toBe(
      "/my-business?claim=owner-business"
    );
    expect(
      normalizeOAuthReturnPath("https://attacker.example/my-business")
    ).toBe("/");
    expect(normalizeOAuthReturnPath("//attacker.example/my-business")).toBe(
      "/"
    );
    expect(normalizeOAuthReturnPath("/\\attacker.example/my-business")).toBe(
      "/"
    );
  });

  it("normalizes the return path before signing it", async () => {
    const state = await createOAuthState(
      { returnTo: "https://attacker.example/my-business", nonce: "nonce-123" },
      { secret, now }
    );

    await expect(
      verifyOAuthState(state, { secret, expectedNonce: "nonce-123", now })
    ).resolves.toEqual({
      returnTo: "/",
      nonce: "nonce-123",
    });
  });
});
