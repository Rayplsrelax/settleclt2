import { createHash } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
// @ts-ignore JavaScript release utility intentionally has no TypeScript surface.
import {
  classifyDatabaseFailure,
  databaseTargetSha256,
  requireExpectedDatabaseTargetSha256,
  safeDatabaseError,
  validateGateRuntimeMetadata,
} from "../scripts/release-database-safety-lib.mjs";
// @ts-ignore JavaScript release utility intentionally has no TypeScript surface.
import { preflightMigrationState } from "../scripts/preflight-migration-state.mjs";
// @ts-ignore JavaScript release utility intentionally has no TypeScript surface.
import { readMigrationPlan } from "../scripts/migration-ledger-lib.mjs";
// @ts-ignore JavaScript release utility intentionally has no TypeScript surface.
import { REQUIRED_SCHEMA_DESCRIPTOR } from "../scripts/migration-schema-lib.mjs";

const sentinelUrl = "mysql://db-user:sentinel-password@secret-host.invalid/sentinel_schema";
const sentinelUuid = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
const sentinelSchema = "sentinel_schema";
const sentinelSql = "ALTER TABLE sentinel_schema.secrets ADD COLUMN password varchar(255)";
const expectedTarget = createHash("sha256")
  .update(`database-target-v1\n${sentinelUuid}\n${sentinelSchema}`)
  .digest("hex");

const eventColumns = REQUIRED_SCHEMA_DESCRIPTOR.eventPromotions.columns.map(
  ([columnName, columnType, isNullable, columnDefault, extra]: unknown[]) => ({
    columnName, columnType, isNullable, columnDefault, extra,
  })
);
const eventIndexes = REQUIRED_SCHEMA_DESCRIPTOR.eventPromotions.indexes.map(
  ([indexName, nonUnique, seqInIndex, columnName, subPart, collation, indexType, isVisible, expression, nullable, packed, comment, indexComment]: unknown[]) => ({
    indexName, nonUnique, seqInIndex, columnName, subPart, collation, indexType, isVisible, expression, nullable, packed, comment, indexComment,
  })
);
const foreignKeys = REQUIRED_SCHEMA_DESCRIPTOR.eventPromotions.foreignKeys.map(
  ([constraintName, columnName, referencedTableName, referencedColumnName, updateRule, deleteRule, matchOption, uniqueConstraintSchema, uniqueConstraintName]: unknown[]) => ({
    constraintName, columnName, referencedTableName, referencedColumnName, updateRule, deleteRule, matchOption, uniqueConstraintSchema, uniqueConstraintName,
  })
);
const constraints = REQUIRED_SCHEMA_DESCRIPTOR.eventPromotions.tableConstraints.map(
  ([constraintName, constraintType, checkClause]: unknown[]) => ({ constraintName, constraintType, checkClause })
);
const claimIndex = REQUIRED_SCHEMA_DESCRIPTOR.businessClaimsIdentityIndex.map(
  ([indexName, nonUnique, seqInIndex, columnName, subPart, collation, indexType, isVisible, expression, nullable, packed, comment, indexComment]: unknown[]) => ({
    indexName, nonUnique, seqInIndex, columnName, subPart, collation, indexType, isVisible, expression, nullable, packed, comment, indexComment,
  })
);

function completePreflightConnection(plan: ReturnType<typeof readMigrationPlan>, target = {
  serverUuid: sentinelUuid,
  databaseName: sentinelSchema,
}) {
  return {
    query: vi.fn(async (sql: string) => {
      if (sql.includes("@@server_uuid")) return [[target]];
      if (sql.includes("@@read_only")) return [[{ readOnly: 0, superReadOnly: 0 }]];
      if (sql.includes("__drizzle_migrations")) {
        return [plan.map(entry => ({ hash: entry.hash, createdAt: entry.when }))];
      }
      if (sql.includes("duplicate_groups")) return [[{ count: 0 }]];
      if (sql.includes("information_schema.COLUMNS")) return [eventColumns];
      if (sql.includes("KEY_COLUMN_USAGE")) return [foreignKeys];
      if (sql.includes("TABLE_CONSTRAINTS")) return [constraints];
      if (sql.includes("TRIGGERS")) return [[]];
      if (sql.includes("information_schema.TABLES")) return [[{
        engine: "InnoDB", rowFormat: "Dynamic", tableCollation: "utf8mb4_0900_ai_ci",
        createOptions: "", schemaDefaultCollation: "utf8mb4_0900_ai_ci", defaultRowFormat: "dynamic",
      }]];
      if (sql.includes("information_schema.STATISTICS")) {
        return [sql.includes("event_promotions") ? eventIndexes : claimIndex];
      }
      throw Object.assign(new Error(`${sentinelUrl} ${sentinelUuid} ${sentinelSchema} ${sentinelSql}`), { code: "ER_PARSE_ERROR" });
    }),
    end: vi.fn(async () => undefined),
  };
}

describe("database-target release binding", () => {
  it("canonicalizes an exact server UUID and schema into a stable non-secret SHA-256", () => {
    expect(databaseTargetSha256(`  ${sentinelUuid.toUpperCase()}  `, `  ${sentinelSchema}  `)).toBe(expectedTarget);
  });

  it.each([undefined, "", "A".repeat(64), "0".repeat(63), "g".repeat(64)])(
    "rejects missing or malformed protected target digest %s",
    value => expect(() => requireExpectedDatabaseTargetSha256(value)).toThrow(/EXPECTED_DATABASE_TARGET_SHA256/)
  );

  it.each([
    ["wrong server", { serverUuid: "ffffffff-bbbb-4ccc-8ddd-eeeeeeeeeeee", databaseName: sentinelSchema }],
    ["wrong schema", { serverUuid: sentinelUuid, databaseName: "other_schema" }],
  ])("standalone preflight rejects %s without exposing target identity", async (_label, target) => {
    const plan = readMigrationPlan(process.cwd());
    const connection = completePreflightConnection(plan, target);
    let thrown = "";
    try {
      await preflightMigrationState({
        connectionString: sentinelUrl,
        expectedDatabaseTargetSha256: expectedTarget,
        migrationsRoot: process.cwd(),
        connectionFactory: async () => connection,
      });
    } catch (error) {
      thrown = String(error);
    }
    expect(thrown).toMatch(/database target.*mismatch/i);
    for (const secret of [sentinelUrl, sentinelUuid, sentinelSchema, sentinelSql, "sentinel-password", target.serverUuid, target.databaseName]) {
      expect(thrown).not.toContain(secret);
    }
  });

  it("standalone preflight fails closed when the protected digest is absent", async () => {
    const plan = readMigrationPlan(process.cwd());
    await expect(preflightMigrationState({
      connectionString: sentinelUrl,
      migrationsRoot: process.cwd(),
      connectionFactory: async () => completePreflightConnection(plan),
    })).rejects.toThrow(/EXPECTED_DATABASE_TARGET_SHA256/);
  });

  it.each([
    ["wrong", "0".repeat(64), /database target.*mismatch/i],
    ["malformed", "A".repeat(64), /EXPECTED_DATABASE_TARGET_SHA256/i],
  ])("standalone preflight rejects a %s protected digest", async (_label, digest, expected) => {
    const plan = readMigrationPlan(process.cwd());
    await expect(preflightMigrationState({
      connectionString: sentinelUrl,
      expectedDatabaseTargetSha256: digest,
      migrationsRoot: process.cwd(),
      connectionFactory: async () => completePreflightConnection(plan),
    })).rejects.toThrow(expected);
  });
});

describe("release database failure redaction", () => {
  it.each([
    ["ER_ACCESS_DENIED_ERROR", "access-denied"],
    ["ER_LOCK_WAIT_TIMEOUT", "lock-timeout"],
    ["ER_DUP_ENTRY", "constraint-violation"],
    ["PROTOCOL_CONNECTION_LOST", "connection-lost"],
    ["UNTRUSTED_PROVIDER_CODE_WITH_SECRETS", "database-failure"],
  ])("maps provider code %s to safe classification %s", (code, expected) => {
    const provider = Object.assign(new Error(`${sentinelUrl} ${sentinelUuid} ${sentinelSchema} ${sentinelSql}`), {
      code,
      sql: sentinelSql,
      host: "secret-host.invalid",
      password: "sentinel-password",
    });
    expect(classifyDatabaseFailure(provider)).toBe(expected);
    const safe = safeDatabaseError("inspection", provider, { migrationTag: "0033_safe-tag", statementIndex: 2 });
    expect(safe.message).toBe(`database inspection failed [0033_safe-tag statement 2]: ${expected}`);
    expect((safe as Error & { cause?: unknown }).cause).toBeUndefined();
    const exposed = `${safe.name} ${safe.message} ${String(safe.stack)}`;
    for (const secret of [sentinelUrl, sentinelUuid, sentinelSchema, sentinelSql, "sentinel-password", "secret-host.invalid", code]) {
      expect(exposed).not.toContain(secret);
    }
  });

  it("redacts connection, inspection, and cleanup provider messages from standalone preflight", async () => {
    const providerFailure = Object.assign(new Error(`${sentinelUrl} ${sentinelUuid} ${sentinelSchema} ${sentinelSql}`), {
      code: "ER_ACCESS_DENIED_ERROR",
      sql: sentinelSql,
    });
    for (const scenario of ["connect", "inspect", "cleanup"] as const) {
      const plan = readMigrationPlan(process.cwd());
      const connection = completePreflightConnection(plan);
      if (scenario === "inspect") connection.query.mockRejectedValueOnce(providerFailure);
      if (scenario === "cleanup") connection.end.mockRejectedValueOnce(providerFailure);
      let exposed = "";
      try {
        await preflightMigrationState({
          connectionString: sentinelUrl,
          expectedDatabaseTargetSha256: expectedTarget,
          migrationsRoot: process.cwd(),
          connectionFactory: async () => {
            if (scenario === "connect") throw providerFailure;
            return connection;
          },
        });
      } catch (error) {
        exposed = String(error);
      }
      expect(exposed).toMatch(/database (connection|target-inspection|inspection|cleanup) failed/i);
      for (const secret of [sentinelUrl, sentinelUuid, sentinelSchema, sentinelSql, "sentinel-password", "secret-host.invalid", "ER_ACCESS_DENIED_ERROR"]) {
        expect(exposed).not.toContain(secret);
      }
    }
  });
});

describe("migration gate runtime metadata contract", () => {
  it.each([
    [{}, "engineVersion"],
    [{ engineVersion: "" }, "engineVersion"],
    [{ engineVersion: "8.4.11\nsecret" }, "engineVersion"],
    [{ engineVersion: "8.4.11", sqlMode: "" }, "sqlMode"],
    [{ engineVersion: "8.4.11", sqlMode: "strict_trans_tables" }, "sqlMode"],
    [{ engineVersion: "8.4.11", sqlMode: "STRICT_TRANS_TABLES,,NO_ENGINE_SUBSTITUTION" }, "sqlMode"],
  ])("rejects invalid bounded metadata %#", (metadata, field) => {
    expect(() => validateGateRuntimeMetadata(metadata)).toThrow(new RegExp(field, "i"));
  });

  it("accepts and canonicalizes bounded engine version and SQL mode", () => {
    expect(validateGateRuntimeMetadata({
      engineVersion: "8.4.11-commercial",
      sqlMode: "NO_ENGINE_SUBSTITUTION,STRICT_TRANS_TABLES",
    })).toEqual({
      engineVersion: "8.4.11-commercial",
      sqlMode: "NO_ENGINE_SUBSTITUTION,STRICT_TRANS_TABLES",
    });
  });
});
