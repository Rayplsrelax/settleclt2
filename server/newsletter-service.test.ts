import { beforeEach, describe, expect, it, vi } from "vitest";

const requestPendingNewsletterSubscription = vi.fn();
const confirmPendingNewsletterSubscription = vi.fn();
const unsubscribeNewsletterByToken = vi.fn();
const releaseNewsletterConfirmationThrottle = vi.fn();
const sendUserEmail = vi.fn();

vi.mock("./db", () => ({
  requestPendingNewsletterSubscription: (...args: unknown[]) =>
    requestPendingNewsletterSubscription(...args),
  confirmPendingNewsletterSubscription: (...args: unknown[]) =>
    confirmPendingNewsletterSubscription(...args),
  unsubscribeNewsletterByToken: (...args: unknown[]) =>
    unsubscribeNewsletterByToken(...args),
  releaseNewsletterConfirmationThrottle: (...args: unknown[]) =>
    releaseNewsletterConfirmationThrottle(...args),
}));

vi.mock("./email-notifications", () => ({
  sendUserEmail: (...args: unknown[]) => sendUserEmail(...args),
}));

vi.mock("./_core/env", () => ({
  ENV: {
    publicAppOrigin: "https://settleclt.com",
    resendApiKey: "test-key",
    authFromEmail: "Settle CLT <hello@settleclt.com>",
    isProduction: false,
  },
  assertEmailAuthConfiguration: vi.fn(),
}));

import {
  confirmNewsletterSubscription,
  NEWSLETTER_CONSENT_VERSION,
  requestNewsletterSubscription,
  unsubscribeNewsletterSubscription,
} from "./newsletter-service";

describe("newsletter service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requestPendingNewsletterSubscription.mockResolvedValue({
      status: "pending",
      shouldSendConfirmation: true,
    });
    confirmPendingNewsletterSubscription.mockResolvedValue(true);
    unsubscribeNewsletterByToken.mockResolvedValue(true);
    releaseNewsletterConfirmationThrottle.mockResolvedValue(undefined);
    sendUserEmail.mockResolvedValue(true);
  });

  it("normalizes email and persists only token hashes before sending confirmation", async () => {
    await requestNewsletterSubscription({
      email: " Neighbor@Example.COM ",
      source: "homepage",
    });

    expect(requestPendingNewsletterSubscription).toHaveBeenCalledOnce();
    const persisted = requestPendingNewsletterSubscription.mock.calls[0][0];
    expect(persisted.email).toBe("neighbor@example.com");
    expect(persisted.consentVersion).toBe(NEWSLETTER_CONSENT_VERSION);
    expect(persisted.confirmationTokenHash).toMatch(/^[a-f0-9]{64}$/);
    expect(persisted.unsubscribeTokenHash).toMatch(/^[a-f0-9]{64}$/);
    expect(sendUserEmail).toHaveBeenCalledOnce();

    const [recipient, template] = sendUserEmail.mock.calls[0];
    expect(recipient).toBe("neighbor@example.com");
    expect(template.html).toContain("/api/newsletter/confirm?token=");
    expect(template.html).toContain("/api/newsletter/unsubscribe?token=");
    expect(template.html).not.toContain(persisted.confirmationTokenHash);
    expect(template.html).not.toContain(persisted.unsubscribeTokenHash);
  });

  it.each(["active", "bounced", "complained"])(
    "does not send confirmation for %s subscribers",
    async status => {
      requestPendingNewsletterSubscription.mockResolvedValue({
        status,
        shouldSendConfirmation: false,
      });

      await requestNewsletterSubscription({
        email: "neighbor@example.com",
        source: "homepage",
      });

      expect(sendUserEmail).not.toHaveBeenCalled();
    }
  );

  it("hashes public tokens before confirmation and unsubscribe lookups", async () => {
    const confirmationToken = "A".repeat(43);
    const unsubscribeToken = "B".repeat(43);
    await confirmNewsletterSubscription(confirmationToken);
    await unsubscribeNewsletterSubscription(unsubscribeToken);

    expect(confirmPendingNewsletterSubscription).toHaveBeenCalledWith(
      expect.stringMatching(/^[a-f0-9]{64}$/)
    );
    expect(unsubscribeNewsletterByToken).toHaveBeenCalledWith(
      expect.stringMatching(/^[a-f0-9]{64}$/)
    );
    expect(confirmPendingNewsletterSubscription).not.toHaveBeenCalledWith(
      confirmationToken
    );
    expect(unsubscribeNewsletterByToken).not.toHaveBeenCalledWith(
      unsubscribeToken
    );
  });

  it("rejects empty public tokens without querying storage", async () => {
    await expect(confirmNewsletterSubscription("")).resolves.toBe(false);
    await expect(unsubscribeNewsletterSubscription("")).resolves.toBe(false);
    expect(confirmPendingNewsletterSubscription).not.toHaveBeenCalled();
    expect(unsubscribeNewsletterByToken).not.toHaveBeenCalled();
  });

  it("rejects malformed public tokens without querying storage", async () => {
    await expect(confirmNewsletterSubscription("short")).resolves.toBe(false);
    await expect(
      unsubscribeNewsletterSubscription("not a token")
    ).resolves.toBe(false);
    expect(confirmPendingNewsletterSubscription).not.toHaveBeenCalled();
    expect(unsubscribeNewsletterByToken).not.toHaveBeenCalled();
  });

  it("does not reveal provider delivery failures through the signup result", async () => {
    sendUserEmail.mockRejectedValueOnce(new Error("provider unavailable"));

    await expect(
      requestNewsletterSubscription({
        email: "neighbor@example.com",
        source: "homepage",
      })
    ).resolves.toBeUndefined();
    expect(releaseNewsletterConfirmationThrottle).toHaveBeenCalledWith(
      expect.stringMatching(/^[a-f0-9]{64}$/)
    );
  });

  it("releases resend throttling when delivery reports false", async () => {
    sendUserEmail.mockResolvedValueOnce(false);

    await requestNewsletterSubscription({
      email: "neighbor@example.com",
      source: "homepage",
    });

    expect(releaseNewsletterConfirmationThrottle).toHaveBeenCalledOnce();
  });

  it("does not resend while a pending confirmation is throttled", async () => {
    requestPendingNewsletterSubscription.mockResolvedValue({
      status: "pending",
      shouldSendConfirmation: false,
    });

    await requestNewsletterSubscription({
      email: "neighbor@example.com",
      source: "homepage",
    });

    expect(sendUserEmail).not.toHaveBeenCalled();
  });
});
