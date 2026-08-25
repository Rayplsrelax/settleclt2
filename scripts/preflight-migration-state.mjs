#!/usr/bin/env node
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
import {
  inspectMigrationState,
  readMigrationPlan,
} from "./migration-ledger-lib.mjs";
import {
  REQUIRED_SCHEMA_FINGERPRINT,
  inspectRequiredSchema,
} from "./migration-schema-lib.mjs";
import { verifyPackagedMigrationInputs } from "./migration-artifact-lib.mjs";
import {
  readAndVerifyDatabaseTarget,
  requireExpectedDatabaseTargetSha256,
  safeDatabaseError,
} from "./release-database-safety-lib.mjs";

export { inspectMigrationState } from "./migration-ledger-lib.mjs";

function requireSingleCount(rows, label) {
  if (!Array.isArray(rows) || rows.length !== 1) {
    throw new Error(`could not determine ${label} count`);
  }
  const count = Number(rows[0]?.count);
  if (!Number.isInteger(count) || count < 0) {
    throw new Error(`invalid count result for ${label}`);
  }
  return count;
}

export async function inspectMigrationDatabase(connection, plan) {
  if (!Array.isArray(plan) || plan.length === 0) {
    throw new Error("local migration plan is empty");
  }

  const [readOnlyRows] = await connection.query(
    "SELECT @@read_only AS readOnly, @@super_read_only AS superReadOnly"
  );
  if (
    !Array.isArray(readOnlyRows) ||
    readOnlyRows.length !== 1 ||
    Number(readOnlyRows[0]?.readOnly) !== 0 ||
    Number(readOnlyRows[0]?.superReadOnly) !== 0
  ) {
    throw new Error("migration target is read-only or read-only state is unknown");
  }

  const [ledgerRows] = await connection.query(
    "SELECT hash, created_at AS createdAt FROM __drizzle_migrations ORDER BY created_at ASC"
  );
  if (!Array.isArray(ledgerRows) || ledgerRows.length === 0) {
    throw new Error("__drizzle_migrations has no rows");
  }
  if (ledgerRows.length > plan.length) {
    throw new Error(
      "migration ledger contains entries beyond the local journal"
    );
  }

  const appliedTags = ledgerRows.map((row, index) => {
    const expected = plan[index];
    if (
      !expected ||
      Number(row.createdAt) !== expected.when ||
      String(row.hash) !== expected.hash
    ) {
      throw new Error(
        `__drizzle_migrations diverges from the local journal at index ${index}`
      );
    }
    return expected.tag;
  });

  const [duplicateRows] = await connection.query(
    "SELECT COUNT(*) AS count FROM (SELECT 1 FROM business_claims WHERE serviceKey IS NOT NULL AND userId IS NOT NULL GROUP BY serviceKey, userId HAVING COUNT(*) > 1) AS duplicate_groups"
  );
  const duplicateBusinessClaimIdentityGroupCount = requireSingleCount(
    duplicateRows,
    "duplicate non-null business claim identity groups"
  );
  if (duplicateBusinessClaimIdentityGroupCount > 0) {
    throw new Error("duplicate non-null business claim identity groups exist");
  }

  const schema = await inspectRequiredSchema(connection);
  const eventPromotionsExists =
    schema.descriptor.eventPromotions.columns.length > 0;
  const eventMigrationApplied = appliedTags.includes("0032_event_promotions");
  if (eventMigrationApplied && !schema.eventPromotionsExact) {
    throw new Error("0032 is ledgered but event_promotions schema is not exact");
  }

  const identityMigrationApplied = appliedTags.includes(
    "0033_business_claim_identity_unique"
  );
  const identityIndexExists =
    schema.descriptor.businessClaimsIdentityIndex.length > 0;
  if (!identityMigrationApplied && identityIndexExists) {
    throw new Error(
      "0033 partial-DDL/manual reconciliation required: business_claims_service_user_unique exists without its migration ledger row"
    );
  }
  if (
    identityMigrationApplied &&
    !schema.businessClaimsIdentityIndexExact
  ) {
    throw new Error(
      "0033 is ledgered but business_claims_service_user_unique is missing or drifted"
    );
  }

  return inspectMigrationState({
    planTags: plan.map(entry => entry.tag),
    appliedTags,
    eventPromotionsExists,
    businessClaimIdentityUniqueExists:
      schema.businessClaimsIdentityIndexExact,
    duplicateBusinessClaimIdentityGroupCount,
  });
}

export async function preflightMigrationState({
  connectionString = process.env.DATABASE_URL,
  expectedDatabaseTargetSha256 = process.env.EXPECTED_DATABASE_TARGET_SHA256,
  migrationsRoot = process.env.MIGRATIONS_ROOT ??
    resolve(import.meta.dirname, ".."),
  releaseGitSha = process.env.RELEASE_GIT_SHA,
  connectionFactory,
} = {}) {
  if (!connectionString) throw new Error("DATABASE_URL is required");

  const plan = releaseGitSha
    ? verifyPackagedMigrationInputs({
        migrationsRoot,
        releaseGitSha,
        requiredSchemaFingerprint: REQUIRED_SCHEMA_FINGERPRINT,
      }).plan
    : readMigrationPlan(migrationsRoot);
  const expectedTarget = requireExpectedDatabaseTargetSha256(
    expectedDatabaseTargetSha256
  );
  let createConnection = connectionFactory;
  if (!createConnection) {
    ({ createConnection } = await import("mysql2/promise"));
  }
  let connection;
  try {
    connection = await createConnection(connectionString);
  } catch (error) {
    throw safeDatabaseError("connection", error);
  }
  try {
    await readAndVerifyDatabaseTarget(connection, expectedTarget);
    const redactedConnection = {
      query: async (...args) => {
        try {
          return await connection.query(...args);
        } catch (error) {
          throw safeDatabaseError("inspection", error);
        }
      },
    };
    const result = await inspectMigrationDatabase(redactedConnection, plan);
    console.log(JSON.stringify(result));
    return result;
  } finally {
    try {
      await connection.end();
    } catch (error) {
      throw safeDatabaseError("cleanup", error);
    }
  }
}

const invokedPath = process.argv[1]
  ? pathToFileURL(resolve(process.argv[1])).href
  : undefined;
if (invokedPath === import.meta.url) {
  await preflightMigrationState();
}
