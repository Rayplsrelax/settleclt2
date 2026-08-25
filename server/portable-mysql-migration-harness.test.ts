import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("portable real MySQL migration harness contract", () => {
  it("is explicit, bounded, disposable, and not part of the default suite", () => {
    const packageJson = JSON.parse(readFileSync(resolve("package.json"), "utf8"));
    const source = readFileSync(
      resolve("scripts/test-portable-mysql-migrations.mjs"),
      "utf8"
    );
    expect(packageJson.scripts["test:migrations:mysql"]).toBe(
      "node scripts/test-portable-mysql-migrations.mjs"
    );
    expect(packageJson.scripts.test).not.toContain("test:migrations:mysql");
    expect(source).toContain("dev.mysql.com/get/Downloads/MySQL-8.4");
    expect(source).toContain("--initialize-insecure");
    expect(source).toContain("--bind-address=127.0.0.1");
    expect(source).toContain("await waitForExit");
    expect(source).toContain("finally");
    expect(source).toContain("SKIP:");
    expect(source).toContain("0032_event_promotions");
    expect(source).toContain("0033_business_claim_identity_unique");
    expect(source).toContain("read_only");
    expect(source).toContain("duplicate");
    expect(source).toContain("partial-DDL/manual reconciliation");
    expect(source).toContain("deterministic repeated stop");
    expect(source).not.toContain("exact-state recovery");
    expect(source).toContain("EXPRESSION expression");
    expect(source).toContain("NULLABLE nullable");
    expect(source).toContain("PACKED packed");
    expect(source).toContain("COMMENT comment");
    expect(source).toContain("INDEX_COMMENT indexComment");
    expect(source).toContain("index-comment");
    expect(source).toContain("nullable-metadata");
    expect(source).toContain("ON UPDATE CASCADE");
    expect(source).toContain("ON DELETE CASCADE");
    expect(source).toContain("UNIQUE_CONSTRAINT_NAME");
    expect(source).toContain("UNIQUE_CONSTRAINT_SCHEMA");
    expect(source).toContain("event_promotions_extra_idx");
    expect(source).toContain("CREATE TRIGGER event_promotions_mutate");
    expect(source).toContain("event_promotions_price_check");
    expect(source).toContain("ROW_FORMAT=COMPACT");
    expect(source).toContain("ordinary event_promotions rows after applied migration");
    expect(source).toContain("runMigrationPreflight");
    expect(source).toContain("@@server_uuid serverUuid");
    expect(source).toContain("databaseTargetSha256");
    expect(source).toContain("wrong-server");
    expect(source).toContain("wrong-schema");
    expect(source).toContain("wrong-digest");
    expect(source).toContain("missing-digest");
    expect(source).toContain("malformed-digest");
    expect(source).toContain("target-bound canonical gate metadata");
  });
});
