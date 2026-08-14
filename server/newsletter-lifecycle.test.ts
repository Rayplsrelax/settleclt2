import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

function readProjectFile(path: string) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

describe("newsletter lifecycle contracts", () => {
  it("stores explicit consent and lifecycle state in one canonical subscriber table", () => {
    const schema = readProjectFile("drizzle/schema.ts");
    const migration = readProjectFile(
      "drizzle/0031_newsletter_subscription_lifecycle.sql"
    );

    expect(schema).toContain(
      'mysqlEnum("status", ["pending", "active", "unsubscribed", "bounced", "complained"])'
    );
    expect(schema).toContain('consentVersion: varchar("consentVersion"');
    expect(schema).toContain('consentedAt: timestamp("consentedAt")');
    expect(schema).toContain(
      'confirmationTokenHash: varchar("confirmationTokenHash"'
    );
    expect(schema).toContain(
      'confirmationSentAt: timestamp("confirmationSentAt")'
    );
    expect(schema).toContain(
      'unsubscribeTokenHash: varchar("unsubscribeTokenHash"'
    );
    expect(schema).toContain('confirmedAt: timestamp("confirmedAt")');
    expect(schema).toContain('unsubscribedAt: timestamp("unsubscribedAt")');
    expect(schema).toContain(
      'updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()'
    );
    expect(migration).toContain(
      "ALTER TABLE `users` MODIFY COLUMN `newsletterOptIn` boolean NOT NULL DEFAULT false"
    );
    const duplicateCleanup = migration.indexOf(
      "DELETE `duplicate` FROM `newsletter_subscribers` AS `duplicate`"
    );
    const firstAlter = migration.indexOf("ALTER TABLE `users`");
    expect(duplicateCleanup).toBeGreaterThanOrEqual(0);
    expect(duplicateCleanup).toBeLessThan(firstAlter);
    expect(migration).toContain("UPDATE `newsletter_subscribers`");
    expect(migration).toContain(
      "COALESCE(NULLIF(TRIM(`source`), ''), 'homepage')"
    );
    expect(migration).toContain("SET `email` = LOWER(TRIM(`email`))");
    expect(migration).toContain("'active'");
    expect(migration).toContain("SET `newsletterOptIn` = false");
    expect(migration).not.toContain("'account-legacy'");
  });

  it("uses hashed expiring tokens and generic public signup responses", () => {
    const service = readProjectFile("server/newsletter-service.ts");
    const router = readProjectFile("server/routers.ts");

    expect(service).toContain("randomBytes");
    expect(service).toContain('createHash("sha256")');
    expect(service).toContain("confirmationExpiresAt");
    expect(service).not.toMatch(
      /console\.(?:log|warn|error)\([^\n]*(?:email|to)/i
    );
    expect(router).toContain("requestNewsletterSubscription");
    expect(router).toContain(
      'message: "Your subscription request was received."'
    );
    expect(router).not.toContain("alreadySubscribed");
  });

  it("supports idempotent public confirmation and unsubscribe without a login", () => {
    const routes = readProjectFile("server/newsletter-routes.ts");
    const service = readProjectFile("server/newsletter-service.ts");

    expect(routes).toContain('app.get("/api/newsletter/confirm"');
    expect(routes).toContain('app.get("/api/newsletter/unsubscribe"');
    expect(service).toContain("confirmNewsletterSubscription");
    expect(service).toContain("unsubscribeNewsletterSubscription");
    const database = readProjectFile("server/db.ts");
    expect(database).toContain('status: "active"');
    expect(database).toContain('status: "unsubscribed"');
    expect(database).toContain(
      "eq(newsletterSubscribers.confirmationTokenHash, confirmationTokenHash)"
    );
    expect(database).toContain(
      "eq(newsletterSubscribers.unsubscribeTokenHash, unsubscribeTokenHash)"
    );
  });

  it("selects only active canonical subscribers for future campaigns", () => {
    const database = readProjectFile("server/db.ts");

    expect(database).toContain('eq(newsletterSubscribers.status, "active")');
    expect(database).not.toContain("optedInUsers");
  });

  it("does not opt new accounts in by default or claim the fake digest was sent", () => {
    const schema = readProjectFile("drizzle/schema.ts");
    const profile = readProjectFile("client/src/pages/Profile.tsx");
    const digest = readProjectFile("client/src/pages/AdminDigest.tsx");
    const router = readProjectFile("server/routers.ts");

    expect(schema).toContain(
      'newsletterOptIn: boolean("newsletterOptIn").default(false).notNull()'
    );
    expect(profile).toContain("newsletterOptIn ?? false");
    expect(digest).not.toContain("Digest notification sent!");
    expect(digest).not.toContain("Send to ${data?.totalRecipients");
    expect(router).not.toContain("Newsletter digest sent to ${allEmails.size}");
  });

  it("updates homepage copy for double opt-in and keeps analytics free of addresses and tokens", () => {
    const home = readProjectFile("client/src/pages/Home.tsx");
    const analytics = readProjectFile("client/src/lib/mixpanel.ts");

    expect(home).toContain("Your subscription request was received");
    expect(home).toContain("By subscribing, you agree to receive");
    expect(analytics).not.toMatch(
      /Newsletter[^\n]{0,100}(email|subscriber|token)/i
    );
  });

  it("offers optional unchecked newsletter consent during local registration", () => {
    const auth = readProjectFile("client/src/pages/Auth.tsx");
    const routes = readProjectFile("server/local-auth-routes.ts");

    expect(auth).toContain("newsletterOptIn");
    expect(auth).toContain("useState(false)");
    expect(auth).toContain("Receive the Settle CLT newsletter");
    expect(routes).toContain("requestNewsletterSubscription");
    expect(routes).toContain('source: "registration"');
  });

  it("uses neutral delivery copy, scanner-safe response headers, and explicit profile consent", () => {
    const home = readProjectFile("client/src/pages/Home.tsx");
    const profile = readProjectFile("client/src/pages/Profile.tsx");
    const routes = readProjectFile("server/newsletter-routes.ts");

    expect(home).toContain("Your subscription request was received");
    expect(home).not.toContain("Check your email to confirm your subscription");
    expect(profile).toContain("Enabling this requests the newsletter");
    expect(routes).toContain('res.setHeader("Cache-Control", "no-store")');
    expect(routes).toContain('res.setHeader("Referrer-Policy", "no-referrer")');
  });

  it("documents an allowlisted recovery path for partial MySQL DDL", () => {
    const recovery = readProjectFile(
      "drizzle/recovery/0031_newsletter_subscription_lifecycle_partial.sql"
    );

    expect(recovery).toContain(
      "newsletter_subscribers_confirmation_token_unique"
    );
    expect(recovery).toContain(
      "newsletter_subscribers_unsubscribe_token_unique"
    );
    expect(recovery).toContain("legacy-2026-08");
    expect(recovery).toContain("INFORMATION_SCHEMA.COLUMNS");
    expect(recovery).toContain("settleclt_0031_expected_database");
    expect(recovery).toContain("settleclt_0031_confirm_writes_stopped");
    expect(recovery).toContain(
      "BINARY @settleclt_0031_confirm_writes_stopped = BINARY 'WRITES_STOPPED'"
    );
    expect(recovery).toContain("__drizzle_migrations");
    expect(recovery).toContain("LOCK TABLES");
    expect(recovery).toContain("WHERE @settleclt_0031_guard_ok");
    expect(recovery).toContain(
      "@settleclt_0031_guard_ok AND @settleclt_0031_final_column_count = 11"
    );
    expect(recovery).toContain("BINARY email <> BINARY LOWER(TRIM(email))");
    expect(recovery).toContain("BINARY source <> BINARY TRIM(source)");
    expect(recovery).toContain("COLUMN_TYPE = 'timestamp'");
    expect(recovery).toContain("consentVersion IS NULL");
    expect(recovery).toContain("confirmationTokenHash IS NULL");
    expect(recovery).toContain("NON_UNIQUE = 0");
    expect(recovery).toContain("SUB_PART IS NULL");
    expect(recovery).toContain("COLLATION = 'A'");
    expect(recovery).toContain("settleclt_0031_recovery_complete");
  });
});
