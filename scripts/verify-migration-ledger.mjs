#!/usr/bin/env node
import { createConnection } from "mysql2/promise";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is required");

const migrationsRoot = resolve(
  process.env.MIGRATIONS_ROOT ?? resolve(import.meta.dirname, "..")
);
const journal = JSON.parse(
  readFileSync(resolve(migrationsRoot, "drizzle/meta/_journal.json"), "utf8")
);
const expected = journal.entries.at(-1);
if (!expected) throw new Error("migration journal is empty");

const connection = await createConnection(connectionString);
try {
  const [rows] = await connection.query(
    "SELECT hash, created_at AS createdAt FROM __drizzle_migrations ORDER BY created_at DESC LIMIT 1"
  );
  const actual = rows[0];
  if (!actual) throw new Error("__drizzle_migrations has no rows");
  if (Number(actual.createdAt) !== expected.when) {
    throw new Error(
      `migration ledger tip timestamp ${actual.createdAt} does not match journal ${expected.when}`
    );
  }

  const migrationPath = resolve(migrationsRoot, `drizzle/${expected.tag}.sql`);
  const migration = readFileSync(migrationPath, "utf8");
  const { createHash } = await import("node:crypto");
  const expectedHash = createHash("sha256").update(migration).digest("hex");
  if (String(actual.hash) !== expectedHash) {
    throw new Error(
      "migration ledger tip hash does not match the journal migration"
    );
  }
  console.log(`migration ledger verified: ${expected.tag}`);
} finally {
  await connection.end();
}
