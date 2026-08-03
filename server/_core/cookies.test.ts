import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { Request } from "express";
import { getSessionCookieOptions } from "./cookies";

function mockRequest(overrides: Partial<Request> = {}): Request {
  return {
    protocol: "https",
    headers: {},
    ...overrides,
  } as unknown as Request;
}

const originalNodeEnv = process.env.NODE_ENV;

describe("getSessionCookieOptions", () => {
  beforeEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  it("sets secure cookies when the request is HTTPS", () => {
    const options = getSessionCookieOptions(mockRequest({ protocol: "https" }));
    expect(options.secure).toBe(true);
    expect(options.httpOnly).toBe(true);
    expect(options.sameSite).toBe("lax");
    expect(options.path).toBe("/");
  });

  it("does not set secure cookies over plain HTTP in development", () => {
    process.env.NODE_ENV = "development";
    const options = getSessionCookieOptions(mockRequest({ protocol: "http" }));
    expect(options.secure).toBe(false);
  });

  it("always sets secure=true in production regardless of forwarded headers", () => {
    process.env.NODE_ENV = "production";
    // Even if x-forwarded-proto says http, production must be secure
    const options = getSessionCookieOptions(
      mockRequest({
        protocol: "http",
        headers: { "x-forwarded-proto": "http" },
      })
    );
    expect(options.secure).toBe(true);
  });
});
