import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { registerOAuthNonce, consumeOAuthNonce } from "./oauth-nonce-store";
import { createOAuthState, verifyOAuthState, normalizeOAuthReturnPath } from "./oauth-state";
import { getConfiguredPublicOrigin } from "../public-origin";
import { getSessionCookieOptions } from "./cookies";

const TEST_SECRET = "test-secret-for-oauth-security-tests-min-32-chars-long!!";

describe("OAuth Security: Nonce Replay Prevention", () => {
  it("a nonce can be consumed exactly once", () => {
    registerOAuthNonce("nonce-1", 60000);
    expect(consumeOAuthNonce("nonce-1")).toBe(true);
    expect(consumeOAuthNonce("nonce-1")).toBe(false);
  });

  it("a nonce that was never registered cannot be consumed", () => {
    expect(consumeOAuthNonce("never-registered")).toBe(false);
  });

  it("different nonces are independent", () => {
    registerOAuthNonce("nonce-a", 60000);
    registerOAuthNonce("nonce-b", 60000);
    expect(consumeOAuthNonce("nonce-a")).toBe(true);
    expect(consumeOAuthNonce("nonce-b")).toBe(true);
    expect(consumeOAuthNonce("nonce-a")).toBe(false);
    expect(consumeOAuthNonce("nonce-b")).toBe(false);
  });
});

describe("OAuth Security: State Tamper Rejection", () => {
  it("creates and verifies a valid state", async () => {
    const state = await createOAuthState(
      { returnTo: "/dashboard", nonce: "test-nonce-123" },
      { secret: TEST_SECRET }
    );
    const result = await verifyOAuthState(state, {
      secret: TEST_SECRET,
      expectedNonce: "test-nonce-123",
    });
    expect(result.returnTo).toBe("/dashboard");
    expect(result.nonce).toBe("test-nonce-123");
  });

  it("rejects state with wrong secret", async () => {
    const state = await createOAuthState(
      { returnTo: "/", nonce: "nonce-wrong-secret" },
      { secret: TEST_SECRET }
    );
    await expect(
      verifyOAuthState(state, { secret: "wrong-secret", expectedNonce: "nonce-wrong-secret" })
    ).rejects.toThrow();
  });

  it("rejects state with wrong nonce", async () => {
    const state = await createOAuthState(
      { returnTo: "/", nonce: "original-nonce" },
      { secret: TEST_SECRET }
    );
    await expect(
      verifyOAuthState(state, { secret: TEST_SECRET, expectedNonce: "different-nonce" })
    ).rejects.toThrow();
  });

  it("rejects tampered state string", async () => {
    const state = await createOAuthState(
      { returnTo: "/", nonce: "tamper-test" },
      { secret: TEST_SECRET }
    );
    // Tamper with the JWT
    const tampered = state.slice(0, -5) + "XXXXX";
    await expect(
      verifyOAuthState(tampered, { secret: TEST_SECRET, expectedNonce: "tamper-test" })
    ).rejects.toThrow();
  });

  it("rejects empty state", async () => {
    await expect(
      verifyOAuthState("", { secret: TEST_SECRET, expectedNonce: "test" })
    ).rejects.toThrow();
  });
});

describe("OAuth Security: Return Path Normalization", () => {
  it("accepts a simple relative path", () => {
    expect(normalizeOAuthReturnPath("/dashboard")).toBe("/dashboard");
  });

  it("accepts root path", () => {
    expect(normalizeOAuthReturnPath("/")).toBe("/");
  });

  it("rejects protocol-relative URLs", () => {
    expect(normalizeOAuthReturnPath("//evil.com")).toBe("/");
  });

  it("rejects absolute URLs", () => {
    expect(normalizeOAuthReturnPath("https://evil.com")).toBe("/");
  });

  it("rejects non-string values", () => {
    expect(normalizeOAuthReturnPath(null)).toBe("/");
    expect(normalizeOAuthReturnPath(undefined)).toBe("/");
    expect(normalizeOAuthReturnPath(123)).toBe("/");
  });

  it("rejects paths with control characters", () => {
    expect(normalizeOAuthReturnPath("/\x00evil")).toBe("/");
    expect(normalizeOAuthReturnPath("/\x1ftest")).toBe("/");
  });

  it("rejects paths with hash fragments", () => {
    expect(normalizeOAuthReturnPath("/page#fragment")).toBe("/");
  });

  it("preserves query strings", () => {
    expect(normalizeOAuthReturnPath("/page?tab=analytics")).toBe("/page?tab=analytics");
  });
});

describe("OAuth Security: Public Origin Validation", () => {
  it("accepts HTTPS origin in production", () => {
    expect(getConfiguredPublicOrigin("https://app.settleclt.com", true)).toBe("https://app.settleclt.com");
  });

  it("rejects HTTP origin in production", () => {
    expect(() => getConfiguredPublicOrigin("http://app.settleclt.com", true)).toThrow(
      "PUBLIC_APP_ORIGIN must use HTTPS in production"
    );
  });

  it("accepts HTTP origin in development", () => {
    expect(getConfiguredPublicOrigin("http://localhost:3000", false)).toBe("http://localhost:3000");
  });

  it("defaults to localhost in development when no origin set", () => {
    expect(getConfiguredPublicOrigin(undefined, false)).toBe("http://localhost:3000");
  });

  it("throws in production when no origin set", () => {
    expect(() => getConfiguredPublicOrigin(undefined, true)).toThrow(
      "PUBLIC_APP_ORIGIN is required in production"
    );
  });

  it("rejects origins with paths", () => {
    expect(() => getConfiguredPublicOrigin("https://app.settleclt.com/path", true)).toThrow(
      "PUBLIC_APP_ORIGIN must be an origin only"
    );
  });

  it("rejects origins with credentials", () => {
    expect(() => getConfiguredPublicOrigin("https://user:pass@app.settleclt.com", true)).toThrow(
      "PUBLIC_APP_ORIGIN must be an origin only"
    );
  });

  it("rejects non-HTTP/HTTPS protocols", () => {
    expect(() => getConfiguredPublicOrigin("ftp://app.settleclt.com", true)).toThrow(
      "PUBLIC_APP_ORIGIN must use HTTP or HTTPS"
    );
  });

  it("rejects origins with query strings", () => {
    expect(() => getConfiguredPublicOrigin("https://app.settleclt.com?q=1", true)).toThrow(
      "PUBLIC_APP_ORIGIN must be an origin only"
    );
  });

  it("rejects origins with hash fragments", () => {
    expect(() => getConfiguredPublicOrigin("https://app.settleclt.com#frag", true)).toThrow(
      "PUBLIC_APP_ORIGIN must be an origin only"
    );
  });
});

describe("OAuth Security: Production Cookie Flags", () => {
  // Mock request for testing cookie options
  function mockRequest(overrides: Partial<{ protocol: string; headers: Record<string, string>; hostname: string }> = {}) {
    return {
      protocol: "https",
      headers: {},
      hostname: "app.settleclt.com",
      ...overrides,
    } as any;
  }

  it("sets Secure flag in production regardless of request protocol", () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";
    const req = mockRequest({ protocol: "http" }); // Even if proxy is misconfigured
    const options = getSessionCookieOptions(req);
    expect(options.secure).toBe(true);
    process.env.NODE_ENV = originalEnv;
  });

  it("sets HttpOnly flag always", () => {
    const req = mockRequest();
    const options = getSessionCookieOptions(req);
    expect(options.httpOnly).toBe(true);
  });

  it("sets SameSite to lax", () => {
    const req = mockRequest();
    const options = getSessionCookieOptions(req);
    expect(options.sameSite).toBe("lax");
  });

  it("sets path to root", () => {
    const req = mockRequest();
    const options = getSessionCookieOptions(req);
    expect(options.path).toBe("/");
  });

  it("does not set Secure in development over HTTP", () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";
    const req = mockRequest({ protocol: "http", headers: {} });
    const options = getSessionCookieOptions(req);
    expect(options.secure).toBe(false);
    process.env.NODE_ENV = originalEnv;
  });

  it("sets Secure in development when request is HTTPS", () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";
    const req = mockRequest({ protocol: "https" });
    const options = getSessionCookieOptions(req);
    expect(options.secure).toBe(true);
    process.env.NODE_ENV = originalEnv;
  });

  it("sets Secure in development when x-forwarded-proto is https", () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";
    const req = mockRequest({ protocol: "http", headers: { "x-forwarded-proto": "https" } });
    const options = getSessionCookieOptions(req);
    expect(options.secure).toBe(true);
    process.env.NODE_ENV = originalEnv;
  });
});
