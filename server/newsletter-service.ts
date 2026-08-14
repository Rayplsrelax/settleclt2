import { createHash, randomBytes } from "node:crypto";
import {
  confirmPendingNewsletterSubscription,
  releaseNewsletterConfirmationThrottle,
  requestPendingNewsletterSubscription,
  unsubscribeNewsletterByToken,
} from "./db";
import { sendUserEmail } from "./email-notifications";
import { ENV, assertEmailAuthConfiguration } from "./_core/env";

export const NEWSLETTER_CONSENT_VERSION = "newsletter-v1-2026-08";
const CONFIRMATION_TTL_MS = 24 * 60 * 60 * 1000;
const NEWSLETTER_TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

function hashNewsletterToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

function createNewsletterToken() {
  const raw = randomBytes(32).toString("base64url");
  return { raw, hash: hashNewsletterToken(raw) };
}

function normalizeNewsletterEmail(email: string): string {
  return email.trim().toLowerCase();
}

function newsletterUrl(path: string, token: string): string {
  if (!ENV.publicAppOrigin) throw new Error("PUBLIC_APP_ORIGIN is required");
  const url = new URL(path, ENV.publicAppOrigin);
  url.searchParams.set("token", token);
  return url.toString();
}

function confirmationTemplate(confirmUrl: string, unsubscribeUrl: string) {
  return {
    subject: "Confirm your Settle CLT newsletter subscription",
    html: `<p>Confirm that you want to receive the Settle CLT newsletter.</p><p><a href="${confirmUrl}">Confirm subscription</a></p><p>If you did not request this, you can ignore this message or <a href="${unsubscribeUrl}">cancel the request</a>.</p><p>This confirmation link expires in 24 hours.</p>`,
  };
}

export async function requestNewsletterSubscription(input: {
  email: string;
  source: string;
}) {
  assertEmailAuthConfiguration();
  const email = normalizeNewsletterEmail(input.email);
  const confirmationToken = createNewsletterToken();
  const unsubscribeToken = createNewsletterToken();
  const confirmationExpiresAt = new Date(Date.now() + CONFIRMATION_TTL_MS);

  const subscription = await requestPendingNewsletterSubscription({
    email,
    source: input.source,
    consentVersion: NEWSLETTER_CONSENT_VERSION,
    consentedAt: new Date(),
    confirmationTokenHash: confirmationToken.hash,
    confirmationExpiresAt,
    confirmationSentAt: new Date(),
    unsubscribeTokenHash: unsubscribeToken.hash,
  });

  if (subscription.shouldSendConfirmation) {
    try {
      const delivered = await sendUserEmail(
        email,
        confirmationTemplate(
          newsletterUrl("/api/newsletter/confirm", confirmationToken.raw),
          newsletterUrl("/api/newsletter/unsubscribe", unsubscribeToken.raw)
        )
      );
      if (!delivered) {
        await releaseNewsletterConfirmationThrottle(confirmationToken.hash);
      }
    } catch {
      await releaseNewsletterConfirmationThrottle(confirmationToken.hash).catch(
        () => undefined
      );
    }
  }
}

export async function confirmNewsletterSubscription(rawToken: string) {
  if (!NEWSLETTER_TOKEN_PATTERN.test(rawToken)) return false;
  return confirmPendingNewsletterSubscription(hashNewsletterToken(rawToken));
}

export async function unsubscribeNewsletterSubscription(rawToken: string) {
  if (!NEWSLETTER_TOKEN_PATTERN.test(rawToken)) return false;
  return unsubscribeNewsletterByToken(hashNewsletterToken(rawToken));
}
