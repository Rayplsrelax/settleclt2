#!/usr/bin/env node
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
import { resolveExpectedMigration } from "./migration-ledger-lib.mjs";

export { resolveExpectedMigration } from "./migration-ledger-lib.mjs";

export async function verifyMigrationLedger({
  connectionString = process.env.DATABASE_URL,
  migrationsRoot = process.env.MIGRATIONS_ROOT ??
    resolve(import.meta.dirname, ".."),
} = {}) {
  if (!connectionString) throw new Error("DATABASE_URL is required");

  const expected = resolveExpectedMigration(migrationsRoot);
  const { createConnection } = await import("mysql2/promise");
  const connection = await createConnection(connectionString);
  try {
    const [rows] = await connection.query(
      "SELECT hash, created_at AS createdAt FROM __drizzle_migrations WHERE created_at = (SELECT MAX(created_at) FROM __drizzle_migrations)"
    );
    if (rows.length === 0) throw new Error("__drizzle_migrations has no rows");
    if (rows.length !== 1) {
      throw new Error(
        "migration ledger has multiple rows at the latest timestamp"
      );
    }
    const actual = rows[0];
    if (Number(actual.createdAt) !== expected.when) {
      throw new Error(
        `migration ledger tip timestamp ${actual.createdAt} does not match journal ${expected.when}`
      );
    }
    if (String(actual.hash) !== expected.hash) {
      throw new Error(
        "migration ledger tip hash does not match the journal migration"
      );
    }
    console.log(`migration ledger verified: ${expected.tag}`);
  } finally {
    await connection.end();
  }
}

const invokedPath = process.argv[1]
  ? pathToFileURL(resolve(process.argv[1])).href
  : undefined;
if (invokedPath === import.meta.url) {
  await verifyMigrationLedger();
}
