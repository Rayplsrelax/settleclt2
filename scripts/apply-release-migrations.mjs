#!/usr/bin/env node
import {
  closeSync,
  mkdirSync,
  lstatSync,
  openSync,

  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { createConnection } from "mysql2/promise";
import { verifyArtifactManifest } from "./artifact-manifest-lib.mjs";
import { verifyPackagedMigrationInputs as verifyImmutableMigrationInputs } from "./migration-artifact-lib.mjs";
import { requireRealDirectory } from "./migration-artifact-lib.mjs";
import {
  BUSINESS_CLAIM_INDEX,
  REQUIRED_SCHEMA_FINGERPRINT,
  inspectRequiredSchema,
} from "./migration-schema-lib.mjs";
import {
  canonicalSqlMode,
  readAndVerifyDatabaseTarget,
  requireExpectedDatabaseTargetSha256,
  safeDatabaseError,
  validateGateRuntimeMetadata,
} from "./release-database-safety-lib.mjs";

const BREAKPOINT = "--> statement-breakpoint";

async function queryDatabase(connection, stage, sql, params, context) {
  try {
    return await connection.query(sql, params);
  } catch (error) {
    throw safeDatabaseError(stage, error, context);
  }
}

export async function connectReleaseDatabase(
  connectionString,
  connectionFactory = createConnection
) {
  try {
    return await connectionFactory(connectionString);
  } catch (error) {
    throw safeDatabaseError("connection", error);
  }
}

export function verifyPackagedMigrationInputs(migrationsRoot, releaseGitSha) {
  return verifyImmutableMigrationInputs({
    migrationsRoot,
    releaseGitSha,
    requiredSchemaFingerprint: REQUIRED_SCHEMA_FINGERPRINT,
  });
}

async function readLedger(connection, plan) {
  const [rows] = await queryDatabase(connection, "ledger-read",
    "SELECT hash, created_at AS createdAt FROM __drizzle_migrations ORDER BY created_at ASC"
  );
  if (!Array.isArray(rows) || rows.length === 0 || rows.length > plan.length) {
    throw new Error("migration ledger is empty or beyond the packaged journal");
  }
  for (let index = 0; index < rows.length; index += 1) {
    const expected = plan[index];
    if (
      Number(rows[index].createdAt) !== Number(expected.when) ||
      String(rows[index].hash) !== expected.hash
    ) {
      throw new Error(`migration ledger diverges from packaged journal at index ${index}`);
    }
  }
  return rows.length;
}

async function readDuplicateCount(connection) {
  const [rows] = await queryDatabase(connection, "inspection",
    "SELECT COUNT(*) AS count FROM (SELECT 1 FROM business_claims WHERE serviceKey IS NOT NULL AND userId IS NOT NULL GROUP BY serviceKey, userId HAVING COUNT(*) > 1) duplicate_groups"
  );
  const count = Number(rows?.[0]?.count);
  if (!Number.isInteger(count) || count < 0) {
    throw new Error("could not determine duplicate business claim identities");
  }
  return count;
}

async function readServerSafety(connection) {
  const [rows] = await queryDatabase(connection, "server-inspection",
    "SELECT VERSION() AS version, @@SESSION.sql_mode AS sqlMode, @@read_only AS readOnly, @@super_read_only AS superReadOnly"
  );
  const state = rows?.[0];
  if (Number(state.readOnly) !== 0 || Number(state.superReadOnly) !== 0) {
    throw new Error("migration target is read-only");
  }
  return validateGateRuntimeMetadata({
    engineVersion: String(state.version),
    sqlMode: canonicalSqlMode(String(state.sqlMode)),
  });
}

async function insertLedger(connection, migration) {
  await queryDatabase(connection, "ledger-write",
    "INSERT INTO __drizzle_migrations (hash, created_at) VALUES (?, ?)",
    [migration.hash, migration.when],
    { migrationTag: migration.tag }
  );
}

function splitStatements(sql) {
  return sql
    .split(BREAKPOINT)
    .map(statement => statement.trim())
    .filter(Boolean);
}

async function applyMigrationSql(connection, migration) {
  const statements = splitStatements(migration.sql);
  if (statements.length === 0) throw new Error(`migration ${migration.tag} is empty`);
  for (let index = 0; index < statements.length; index += 1) {
    try {
      await queryDatabase(
        connection,
        "ddl",
        statements[index],
        undefined,
        { migrationTag: migration.tag, statementIndex: index + 1 }
      );
    } catch (error) {
      throw error;
    }
  }
}

async function classifyMigrationBoundary(connection, appliedCount, plan) {
  const eventIndex = plan.findIndex(entry => entry.tag === "0032_event_promotions");
  const claimIndex = plan.findIndex(
    entry => entry.tag === "0033_business_claim_identity_unique"
  );
  let schema;
  try {
    schema = await inspectRequiredSchema(connection);
  } catch (error) {
    throw safeDatabaseError("schema-inspection", error);
  }
  const duplicateCount = await readDuplicateCount(connection);
  if (duplicateCount > 0 && appliedCount >= claimIndex) {
    throw new Error("duplicate non-null business claim identity groups exist; stop before 0033 DDL");
  }

  const eventLedgerApplied = appliedCount > eventIndex;
  const claimLedgerApplied = appliedCount > claimIndex;
  const eventExists = schema.descriptor.eventPromotions.columns.length > 0;
  const claimIndexExists = schema.descriptor.businessClaimsIdentityIndex.length > 0;

  if (eventLedgerApplied && !schema.eventPromotionsExact) {
    throw new Error("0032 is ledgered but event_promotions schema is not exact");
  }
  if (!eventLedgerApplied && eventExists) {
    throw new Error("0032 partial-DDL/manual reconciliation required: event_promotions exists without its migration ledger row");
  }
  if (claimLedgerApplied && !schema.businessClaimsIdentityIndexExact) {
    throw new Error("0033 is ledgered but its exact unique index is missing");
  }
  if (!claimLedgerApplied && claimIndexExists) {
    throw new Error("0033 partial-DDL/manual reconciliation required: business_claims_service_user_unique exists without its migration ledger row");
  }
  if (claimIndexExists && !eventExists) {
    throw new Error("0033 schema exists without the required 0032 schema");
  }
  return { schema, eventIndex, claimIndex };
}

function writeGateEvidence(path, evidence) {
  const target = resolve(path);
  const parent = dirname(target);
  mkdirSync(parent, { recursive: true, mode: 0o700 });
  requireRealDirectory(parent, "migration gate directory");
  const existing = lstatSync(target, { throwIfNoEntry: false });
  if (existing && (existing.isSymbolicLink() || !existing.isFile())) {
    throw new Error("migration gate evidence target must be a regular non-symlink file");
  }
  const temporary = `${target}.tmp-${process.pid}`;
  rmSync(temporary, { force: true });
  const descriptor = openSync(temporary, "wx", 0o600);
  try {
    writeFileSync(descriptor, `${JSON.stringify(evidence, null, 2)}\n`, "utf8");
  } finally {
    closeSync(descriptor);
  }
  renameSync(temporary, target);
}

export async function applyReleaseMigrations({
  connectionString = process.env.DATABASE_URL,
  migrationsRoot = process.env.MIGRATIONS_ROOT,
  artifactRoot = process.env.RELEASE_ARTIFACT_ROOT ??
    (migrationsRoot ? resolve(migrationsRoot, "..") : undefined),
  releaseGitSha = process.env.RELEASE_GIT_SHA,
  expectedArtifactManifestDigest = process.env.EXPECTED_ARTIFACT_MANIFEST_DIGEST,
  expectedDatabaseTargetSha256 = process.env.EXPECTED_DATABASE_TARGET_SHA256,
  gatePath = process.env.MIGRATION_GATE_PATH,
  interruptAfterDdl = process.env.MIGRATION_TEST_INTERRUPT_AFTER_DDL,
} = {}) {
  if (!connectionString) throw new Error("DATABASE_URL is required");
  if (!migrationsRoot || !artifactRoot || !gatePath) throw new Error("packaged artifact, migration root, and gate path are required");
  if (!/^[0-9a-f]{40}$/.test(String(releaseGitSha))) {
    throw new Error("RELEASE_GIT_SHA must be a full lowercase SHA");
  }
  const { manifest: artifactManifest } = verifyArtifactManifest({
    artifactRoot,
    releaseGitSha,
  });
  if (
    expectedArtifactManifestDigest &&
    artifactManifest.artifactManifestDigest !== expectedArtifactManifestDigest
  ) {
    throw new Error("full artifact manifest digest changed before migration apply");
  }
  const { manifest, plan } = verifyPackagedMigrationInputs(
    migrationsRoot,
    releaseGitSha
  );
  const expectedTarget = requireExpectedDatabaseTargetSha256(
    expectedDatabaseTargetSha256
  );
  const connection = await connectReleaseDatabase(connectionString);
  let lockAcquired = false;
  try {
    const databaseTargetSha256 = await readAndVerifyDatabaseTarget(
      connection,
      expectedTarget
    );
    const server = await readServerSafety(connection);
    let appliedCount = await readLedger(connection, plan);
    let boundary = await classifyMigrationBoundary(connection, appliedCount, plan);
    const [lockRows] = await queryDatabase(connection, "lock-acquire",
      "SELECT GET_LOCK('settleclt_release_migrations', 10) AS acquired"
    );
    if (Number(lockRows?.[0]?.acquired) !== 1) {
      throw new Error("could not acquire the migration advisory lock");
    }
    lockAcquired = true;

    appliedCount = await readLedger(connection, plan);
    boundary = await classifyMigrationBoundary(connection, appliedCount, plan);
    while (appliedCount < plan.length) {
      const migration = plan[appliedCount];
      await applyMigrationSql(connection, migration);
      if (
        interruptAfterDdl === migration.tag ||
        interruptAfterDdl === migration.tag.slice(0, 4)
      ) {
        throw new Error(
          `intentional test interruption after ${migration.tag} DDL before ledger recording`
        );
      }
      await insertLedger(connection, migration);
      appliedCount += 1;
      boundary = await classifyMigrationBoundary(connection, appliedCount, plan);
    }

    const finalCount = await readLedger(connection, plan);
    let finalSchema;
    try {
      finalSchema = await inspectRequiredSchema(connection);
    } catch (error) {
      throw safeDatabaseError("post-inspection", error);
    }
    if (finalCount !== plan.length || !finalSchema.exact) {
      throw new Error("post-migration ledger or required schema verification failed");
    }
    const expectedTip = plan.at(-1);
    const evidence = {
      schemaVersion: 1,
      releaseGitSha,
      journalTip: {
        tag: expectedTip.tag,
        when: expectedTip.when,
        hash: expectedTip.hash,
      },
      requiredSchemaFingerprint: finalSchema.fingerprint,
      artifactManifestDigest: artifactManifest.artifactManifestDigest,
      databaseTargetSha256,
      verifiedAt: new Date().toISOString(),
      engineVersion: server.engineVersion,
      sqlMode: server.sqlMode,
    };
    if (evidence.requiredSchemaFingerprint !== manifest.requiredSchemaFingerprint) {
      throw new Error("live required schema fingerprint does not match the release manifest");
    }
    writeGateEvidence(gatePath, evidence);
    console.log(`migration gate written for ${releaseGitSha} at journal tip ${expectedTip.tag}`);
    return evidence;
  } finally {
    if (lockAcquired) {
      try {
        await queryDatabase(
          connection,
          "lock-release",
          "SELECT RELEASE_LOCK('settleclt_release_migrations')"
        );
      } catch {
        // Connection close also releases the advisory lock.
      }
    }
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
  await applyReleaseMigrations();
}
