import { describe, expect, it } from "vitest";
import { consumeOAuthNonce, registerOAuthNonce } from "./oauth-nonce-store";

describe("OAuth nonce store", () => {
  it("registers and consumes a nonce exactly once", () => {
    const nonce = "test-nonce-abc123";
    registerOAuthNonce(nonce, 60_000);
    expect(consumeOAuthNonce(nonce)).toBe(true);
    // Second consumption must fail — replay prevented
    expect(consumeOAuthNonce(nonce)).toBe(false);
  });

  it("rejects an unregistered nonce", () => {
    expect(consumeOAuthNonce("never-registered")).toBe(false);
  });

  it("rejects an expired nonce", () => {
    const nonce = "expired-nonce";
    registerOAuthNonce(nonce, 0); // TTL of 0 = already expired
    expect(consumeOAuthNonce(nonce)).toBe(false);
  });
});
