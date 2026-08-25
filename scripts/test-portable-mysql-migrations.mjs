#!/usr/bin/env node
import { spawn } from "node:child_process";
import { createHash, randomBytes } from "node:crypto";
import {
  createWriteStream,
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { buildSync } from "esbuild";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import { finished } from "node:stream/promises";
import { setTimeout as delay } from "node:timers/promises";
import { fileURLToPath } from "node:url";
import { createArtifactManifest } from "./artifact-manifest-lib.mjs";
import { readMigrationPlan } from "./migration-ledger-lib.mjs";
import { REQUIRED_SCHEMA_FINGERPRINT } from "./migration-schema-lib.mjs";
import { databaseTargetSha256 } from "./release-database-safety-lib.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const MYSQL_VERSION = process.env.MYSQL_PORTABLE_VERSION ?? "8.4.11";
const MYSQL_ZIP = `mysql-${MYSQL_VERSION}-winx64.zip`;
const MYSQL_URL =
  process.env.MYSQL_PORTABLE_URL ??
  `https://dev.mysql.com/get/Downloads/MySQL-8.4/${MYSQL_ZIP}`;
const MAX_DOWNLOAD_BYTES = 1_100_000_000;
const DOWNLOAD_TIMEOUT_MS = 12 * 60 * 1000;
const PROCESS_TIMEOUT_MS = 3 * 60 * 1000;
const START_TIMEOUT_MS = 90_000;
const EVIDENCE_PATH = resolve(
  process.env.MYSQL_MIGRATION_EVIDENCE_PATH ??
    join(tmpdir(), "settleclt-phase0-portable-mysql-evidence.json")
);
let disposableTargetDigest;

function nativePath(path) {
  return resolve(path).replaceAll("\\", "/");
}

function waitForExit(child, timeoutMs) {
  if (child.exitCode !== null) return Promise.resolve(child.exitCode);
  return new Promise((resolveExit, reject) => {
    const timeout = setTimeout(
      () => reject(new Error(`process ${child.pid} did not exit within ${timeoutMs}ms`)),
      timeoutMs
    );
    child.once("exit", code => {
      clearTimeout(timeout);
      resolveExit(code);
    });
    child.once("error", error => {
      clearTimeout(timeout);
      reject(error);
    });
  });
}

async function runBounded(command, args, options = {}) {
  const child = spawn(command, args, {
    cwd: options.cwd,
    env: options.env ?? process.env,
    windowsHide: true,
    stdio: ["ignore", "pipe", "pipe"],
  });
  let stdout = "";
  let stderr = "";
  child.stdout.on("data", chunk => {
    stdout = `${stdout}${chunk}`.slice(-64_000);
  });
  child.stderr.on("data", chunk => {
    stderr = `${stderr}${chunk}`.slice(-64_000);
  });
  const timeout = setTimeout(() => child.kill("SIGKILL"), options.timeoutMs ?? PROCESS_TIMEOUT_MS);
  const code = await waitForExit(child, (options.timeoutMs ?? PROCESS_TIMEOUT_MS) + 10_000);
  clearTimeout(timeout);
  if (code !== 0) {
    throw new Error(`${basename(command)} exited ${code}: ${(stderr || stdout).slice(-4000)}`);
  }
  return { stdout, stderr };
}

async function downloadBounded(url, destination) {
  const response = await fetch(url, { signal: AbortSignal.timeout(DOWNLOAD_TIMEOUT_MS) });
  if (!response.ok || !response.body) {
    throw new Error(`official download returned HTTP ${response.status}`);
  }
  const declared = Number(response.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > MAX_DOWNLOAD_BYTES) {
    throw new Error("official MySQL ZIP exceeds the harness download limit");
  }
  mkdirSync(dirname(destination), { recursive: true });
  const output = createWriteStream(destination, { flags: "wx" });
  let received = 0;
  const reader = response.body.getReader();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      received += value.byteLength;
      if (received > MAX_DOWNLOAD_BYTES) {
        throw new Error("official MySQL ZIP exceeded the harness download limit");
      }
      if (!output.write(value)) await new Promise(resolveDrain => output.once("drain", resolveDrain));
    }
    output.end();
    await finished(output);
  } catch (error) {
    output.destroy();
    rmSync(destination, { force: true });
    throw error;
  }
}

async function freePort() {
  return new Promise((resolvePort, reject) => {
    const server = createServer();
    server.unref();
    server.once("error", reject);
    server.listen({ host: "127.0.0.1", port: 0 }, () => {
      const address = server.address();
      const port = typeof address === "object" && address ? address.port : 0;
      server.close(error => (error ? reject(error) : resolvePort(port)));
    });
  });
}

function sqlHash(sql) {
  return createHash("sha256").update(sql).digest("hex");
}

async function applyThrough0031(connection, databaseName) {
  await connection.query(`CREATE DATABASE \`${databaseName}\``);
  await connection.query(`USE \`${databaseName}\``);
  await connection.query(
    "CREATE TABLE __drizzle_migrations (id SERIAL PRIMARY KEY, hash text NOT NULL, created_at bigint NOT NULL)"
  );
  const journal = JSON.parse(readFileSync(resolve(ROOT, "drizzle/meta/_journal.json"), "utf8"));
  const entries = journal.entries.filter(entry => entry.idx <= 31);
  for (const entry of entries) {
    const sql = readFileSync(resolve(ROOT, `drizzle/${entry.tag}.sql`), "utf8");
    await connection.query(sql.replaceAll("--> statement-breakpoint", "\n"));
    await connection.query(
      "INSERT INTO __drizzle_migrations (hash, created_at) VALUES (?, ?)",
      [sqlHash(sql), entry.when]
    );
  }
  return entries.length;
}

async function packageMigrations(workspace, releaseGitSha) {
  const dist = resolve(workspace, "dist");
  const artifact = resolve(workspace, "artifact");
  mkdirSync(dist, { recursive: true });
  writeFileSync(resolve(dist, "release-manifest.json"), JSON.stringify({
    schemaVersion: 1,
    app: "settle-clt",
    version: "0.0.0-test",
    gitSha: releaseGitSha,
    builtAt: "2026-08-24T00:00:00.000Z",
    deployable: true,
    manifestPurpose: "clean-release-package",
  }));
  mkdirSync(resolve(artifact, "ops/release"), { recursive: true });
  writeFileSync(resolve(artifact, "ops/release/test-fixture.txt"), "non-deployable migration harness fixture\n");
  mkdirSync(resolve(artifact, "migrations"), { recursive: true });
  cpSync(dist, resolve(artifact, "dist"), { recursive: true });
  const files = [];
  const copyInput = (source, relativePath) => {
    const destination = resolve(artifact, "migrations", relativePath);
    mkdirSync(dirname(destination), { recursive: true });
    cpSync(source, destination);
    files.push({ path: relativePath, sha256: sqlHash(readFileSync(destination)) });
  };
  const plan = readMigrationPlan(ROOT);
  for (const migration of plan) copyInput(migration.path, `drizzle/${migration.tag}.sql`);
  copyInput(resolve(ROOT, "drizzle/meta/_journal.json"), "drizzle/meta/_journal.json");
  for (const script of [
    "apply-release-migrations.mjs", "artifact-manifest-lib.mjs", "migration-artifact-lib.mjs",
    "migration-ledger-lib.mjs", "migration-schema-lib.mjs", "release-database-safety-lib.mjs", "preflight-migration-state.mjs",
    "preflight-release.mjs", "verify-migration-ledger.mjs", "verify-release-artifact.mjs",
  ]) copyInput(resolve(ROOT, "scripts", script), `scripts/${script}`);
  copyInput(resolve(ROOT, "package.json"), "package.json");
  copyInput(resolve(ROOT, "pnpm-lock.yaml"), "pnpm-lock.yaml");
  const runner = resolve(artifact, "migrations/bin/apply-release-migrations.mjs");
  mkdirSync(dirname(runner), { recursive: true });
  buildSync({
    entryPoints: [resolve(ROOT, "scripts/apply-release-migrations.mjs")], outfile: runner,
    bundle: true, platform: "node", format: "esm", target: "node20", packages: "bundle",
    banner: { js: 'import { createRequire as __createRequire } from "node:module"; const require = __createRequire(import.meta.url);' },
    logLevel: "silent",
  });
  files.push({ path: "bin/apply-release-migrations.mjs", sha256: sqlHash(readFileSync(runner)) });
  const preflightRunner = resolve(artifact, "migrations/bin/preflight-release.mjs");
  buildSync({
    entryPoints: [resolve(ROOT, "scripts/preflight-release.mjs")], outfile: preflightRunner,
    bundle: true, platform: "node", format: "esm", target: "node20", packages: "bundle",
    banner: { js: 'import { createRequire as __createRequire } from "node:module"; const require = __createRequire(import.meta.url);' },
    logLevel: "silent",
  });
  files.push({ path: "bin/preflight-release.mjs", sha256: sqlHash(readFileSync(preflightRunner)) });
  files.sort((left, right) => left.path.localeCompare(right.path));
  const tip = plan.at(-1);
  writeFileSync(resolve(artifact, "migrations/manifest.json"), JSON.stringify({
    schemaVersion: 1,
    releaseGitSha,
    journalTip: { tag: tip.tag, when: tip.when, hash: tip.hash },
    requiredSchemaFingerprint: REQUIRED_SCHEMA_FINGERPRINT,
    files,
  }));
  createArtifactManifest(artifact, releaseGitSha);
  return resolve(artifact, "migrations");
}

async function runMigrationRunner({ databaseUrl, migrationsRoot, releaseGitSha, gatePath, expectedDatabaseTargetSha256 = disposableTargetDigest, interrupt }) {
  const env = {
    ...process.env,
    DATABASE_URL: databaseUrl,
    MIGRATIONS_ROOT: migrationsRoot,
    RELEASE_ARTIFACT_ROOT: resolve(migrationsRoot, ".."),
    RELEASE_GIT_SHA: releaseGitSha,
    MIGRATION_GATE_PATH: gatePath,
  };
  if (typeof expectedDatabaseTargetSha256 === "string") {
    env.EXPECTED_DATABASE_TARGET_SHA256 = expectedDatabaseTargetSha256;
  } else {
    delete env.EXPECTED_DATABASE_TARGET_SHA256;
  }
  if (interrupt) env.MIGRATION_TEST_INTERRUPT_AFTER_DDL = interrupt;
  return runBounded(process.execPath, [resolve(migrationsRoot, "bin/apply-release-migrations.mjs")], {
    cwd: ROOT,
    env,
  });
}

async function runMigrationPreflight({ databaseUrl, migrationsRoot, releaseGitSha, expectedDatabaseTargetSha256 = disposableTargetDigest }) {
  const env = {
    ...process.env,
    DATABASE_URL: databaseUrl,
    MIGRATIONS_ROOT: migrationsRoot,
    RELEASE_ARTIFACT_ROOT: resolve(migrationsRoot, ".."),
    RELEASE_GIT_SHA: releaseGitSha,
  };
  if (typeof expectedDatabaseTargetSha256 === "string") {
    env.EXPECTED_DATABASE_TARGET_SHA256 = expectedDatabaseTargetSha256;
  } else {
    delete env.EXPECTED_DATABASE_TARGET_SHA256;
  }
  return runBounded(
    process.execPath,
    [resolve(migrationsRoot, "bin/preflight-release.mjs")],
    {
      cwd: ROOT,
      env,
    }
  );
}

async function expectFailure(action, pattern) {
  try {
    await action();
  } catch (error) {
    if (!pattern.test(String(error.message))) throw error;
    return String(error.message).replace(/mysql:\/\/[^\s]+/g, "[redacted]");
  }
  throw new Error(`expected failure matching ${pattern}`);
}

async function resetTo0031(connection, when0032) {
  await connection.query("SET GLOBAL read_only = OFF");
  await connection.query("DROP TABLE IF EXISTS event_promotions");
  const [indexRows] = await connection.query(
    "SELECT COUNT(*) count FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'business_claims' AND INDEX_NAME = 'business_claims_service_user_unique'"
  );
  if (Number(indexRows[0].count) > 0) {
    await connection.query(
      "ALTER TABLE business_claims DROP INDEX business_claims_service_user_unique"
    );
  }
  await connection.query("DELETE FROM business_claims WHERE serviceKey = '__phase0_harness_duplicate__'");
  await connection.query("DELETE FROM __drizzle_migrations WHERE created_at >= ?", [when0032]);
}

async function ledgerTip(connection) {
  const [rows] = await connection.query(
    "SELECT created_at AS createdAt FROM __drizzle_migrations ORDER BY created_at DESC LIMIT 1"
  );
  return Number(rows[0].createdAt);
}

async function stageThrough0032(connection, entry0032) {
  const sql = readFileSync(resolve(ROOT, `drizzle/${entry0032.tag}.sql`), "utf8");
  await connection.query(sql.replaceAll("--> statement-breakpoint", "\n"));
  await connection.query(
    "INSERT INTO __drizzle_migrations (hash, created_at) VALUES (?, ?)",
    [sqlHash(sql), entry0032.when]
  );
}

async function stageThrough0033(connection, entry0032, entry0033) {
  await stageThrough0032(connection, entry0032);
  const sql = readFileSync(resolve(ROOT, `drizzle/${entry0033.tag}.sql`), "utf8");
  await connection.query(sql.replaceAll("--> statement-breakpoint", "\n"));
  await connection.query(
    "INSERT INTO __drizzle_migrations (hash, created_at) VALUES (?, ?)",
    [sqlHash(sql), entry0033.when]
  );
}

async function assertRepeatedManualStop({ databaseUrl, migrationsRoot, releaseGitSha, gatePath }) {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    await expectFailure(
      () => runMigrationRunner({ databaseUrl, migrationsRoot, releaseGitSha, gatePath }),
      /partial-DDL\/manual reconciliation/i
    );
    if (existsSync(gatePath)) {
      throw new Error("partial-DDL/manual reconciliation stop wrote a migration gate");
    }
  }
}

async function main() {
  if (process.platform !== "win32") {
    console.log("SKIP: portable MySQL Community Server ZIP harness requires Windows");
    return;
  }

  const workspace = mkdtempSync(join(tmpdir(), "settleclt-mysql-phase0-"));
  const cacheRoot = resolve(
    process.env.MYSQL_PORTABLE_CACHE_DIR ??
      join(process.env.LOCALAPPDATA ?? tmpdir(), "settleclt", "mysql-portable-cache")
  );
  const zipPath = resolve(cacheRoot, MYSQL_ZIP);
  const extractRoot = resolve(workspace, "mysql");
  const dataRoot = resolve(workspace, "data");
  const releaseGitSha = "f".repeat(40);
  const databaseName = `settleclt_phase0_${randomBytes(6).toString("hex")}`;
  const port = await freePort();
  if (port === 3306) throw new Error("harness selected the default MySQL port");
  let daemon;
  let mysqlAdmin;
  let adminConnection;
  let skipReason;
  const evidence = {
    schemaVersion: 1,
    status: "failed",
    mysqlVersion: null,
    sqlMode: null,
    migrationsThrough0031: 0,
    scenarios: [],
  };

  try {
    if (!existsSync(zipPath)) {
      try {
        await downloadBounded(MYSQL_URL, zipPath);
      } catch (error) {
        skipReason = `official MySQL download unavailable or environment forbids network: ${error.message}`;
        evidence.status = "skipped";
        evidence.skipReason = skipReason;
        console.log(`SKIP: ${skipReason}`);
        return;
      }
    }
    if (statSync(zipPath).size > MAX_DOWNLOAD_BYTES) {
      throw new Error("cached MySQL ZIP exceeds the harness size limit");
    }
    mkdirSync(extractRoot, { recursive: true });
    await runBounded(resolve(process.env.WINDIR ?? "C:/Windows", "System32/tar.exe"), ["-xf", nativePath(zipPath), "-C", nativePath(extractRoot)], {
      timeoutMs: PROCESS_TIMEOUT_MS,
    });
    const directories = readdirSync(extractRoot, { withFileTypes: true }).filter(entry => entry.isDirectory());
    if (directories.length !== 1) throw new Error("MySQL ZIP did not contain one server root");
    const basedir = resolve(extractRoot, directories[0].name);
    const mysqld = resolve(basedir, "bin/mysqld.exe");
    mysqlAdmin = resolve(basedir, "bin/mysqladmin.exe");
    if (!existsSync(mysqld) || !existsSync(mysqlAdmin)) {
      throw new Error("official MySQL ZIP is missing required server binaries");
    }
    mkdirSync(dataRoot, { recursive: true });
    await runBounded(
      mysqld,
      [
        `--basedir=${nativePath(basedir)}`,
        `--datadir=${nativePath(dataRoot)}`,
        "--initialize-insecure",
        "--console",
      ],
      { timeoutMs: PROCESS_TIMEOUT_MS }
    );

    const stdoutPath = resolve(workspace, "mysqld.stdout.log");
    const stderrPath = resolve(workspace, "mysqld.stderr.log");
    daemon = spawn(
      mysqld,
      [
        `--basedir=${nativePath(basedir)}`,
        `--datadir=${nativePath(dataRoot)}`,
        "--bind-address=127.0.0.1",
        `--port=${port}`,
        "--skip-log-bin",
        "--mysqlx=0",
        "--sql-mode=STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION",
        "--console",
      ],
      {
        windowsHide: true,
        stdio: ["ignore", "pipe", "pipe"],
      }
    );
    daemon.stdout.pipe(createWriteStream(stdoutPath));
    daemon.stderr.pipe(createWriteStream(stderrPath));

    const { createConnection } = await import("mysql2/promise");
    const deadline = Date.now() + START_TIMEOUT_MS;
    let lastStartError;
    while (Date.now() < deadline) {
      if (daemon.exitCode !== null) {
        throw new Error(`mysqld exited during startup with code ${daemon.exitCode}`);
      }
      try {
        adminConnection = await createConnection({
          host: "127.0.0.1",
          port,
          user: "root",
          multipleStatements: true,
        });
        break;
      } catch (error) {
        lastStartError = error;
        await delay(500);
      }
    }
    if (!adminConnection) throw new Error(`mysqld readiness timeout: ${lastStartError?.message}`);

    const [serverRows] = await adminConnection.query(
      "SELECT VERSION() version, @@SESSION.sql_mode sqlMode, @@server_uuid serverUuid"
    );
    const server = serverRows[0];
    if (!String(server.version).startsWith("8.4.")) {
      throw new Error(`expected MySQL 8.4, received ${server.version}`);
    }
    const modes = new Set(String(server.sqlMode).split(","));
    for (const required of [
      "STRICT_TRANS_TABLES",
      "ERROR_FOR_DIVISION_BY_ZERO",
      "NO_ENGINE_SUBSTITUTION",
    ]) {
      if (!modes.has(required)) throw new Error(`required SQL mode missing: ${required}`);
    }
    evidence.mysqlVersion = String(server.version);
    evidence.sqlMode = String(server.sqlMode);

    evidence.migrationsThrough0031 = await applyThrough0031(adminConnection, databaseName);
    await adminConnection.query(`USE \`${databaseName}\``);
    const journal = JSON.parse(readFileSync(resolve(ROOT, "drizzle/meta/_journal.json"), "utf8"));
    const entry0031 = journal.entries.find(entry => entry.tag === "0031_newsletter_subscription_lifecycle");
    const entry0032 = journal.entries.find(entry => entry.tag === "0032_event_promotions");
    const entry0033 = journal.entries.find(entry => entry.tag === "0033_business_claim_identity_unique");
    const migrationsRoot = await packageMigrations(workspace, releaseGitSha);
    const databaseUrl = `mysql://root@127.0.0.1:${port}/${databaseName}`;
    disposableTargetDigest = databaseTargetSha256(server.serverUuid, databaseName);

    for (const [label, digest] of [
      ["wrong-server", databaseTargetSha256("ffffffff-ffff-4fff-8fff-ffffffffffff", databaseName)],
      ["wrong-schema", databaseTargetSha256(server.serverUuid, `${databaseName}_other`)],
      ["wrong-digest", "0".repeat(64)],
      ["missing-digest", null],
      ["malformed-digest", "A".repeat(64)],
    ]) {
      await expectFailure(
        () => runMigrationPreflight({
          databaseUrl,
          migrationsRoot,
          releaseGitSha,
          expectedDatabaseTargetSha256: digest,
        }),
        /database target digest mismatch|EXPECTED_DATABASE_TARGET_SHA256/i
      );
    }
    evidence.scenarios.push("database target wrong-server/wrong-schema/wrong-digest/missing/malformed fail closed");

    const cleanGatePath = resolve(workspace, "gate-clean.json");
    await runMigrationRunner({
      databaseUrl,
      migrationsRoot,
      releaseGitSha,
      gatePath: cleanGatePath,
    });
    const cleanGate = JSON.parse(readFileSync(cleanGatePath, "utf8"));
    const expectedCanonicalSqlMode = String(server.sqlMode).split(",").sort().join(",");
    if (
      cleanGate.databaseTargetSha256 !== disposableTargetDigest ||
      cleanGate.engineVersion !== String(server.version) ||
      cleanGate.sqlMode !== expectedCanonicalSqlMode ||
      Object.hasOwn(cleanGate, "databaseName") ||
      Object.hasOwn(cleanGate, "serverUuid") ||
      Object.hasOwn(cleanGate, "databaseUrl")
    ) {
      throw new Error("clean migration gate database target/runtime metadata contract failed");
    }
    const [uniqueRows] = await adminConnection.query(
      "SELECT INDEX_NAME indexName, NON_UNIQUE nonUnique, SEQ_IN_INDEX seqInIndex, COLUMN_NAME columnName, SUB_PART subPart, COLLATION collation, INDEX_TYPE indexType, IS_VISIBLE isVisible, EXPRESSION expression, NULLABLE nullable, PACKED packed, COMMENT comment, INDEX_COMMENT indexComment FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'business_claims' AND INDEX_NAME = 'business_claims_service_user_unique' ORDER BY SEQ_IN_INDEX"
    );
    if (
      uniqueRows.length !== 2 ||
      uniqueRows.some((row, index) =>
        row.indexName !== "business_claims_service_user_unique" ||
        Number(row.nonUnique) !== 0 ||
        Number(row.seqInIndex) !== index + 1 ||
        row.columnName !== ["serviceKey", "userId"][index] ||
        row.subPart !== null ||
        row.collation !== "A" ||
        row.indexType !== "BTREE" ||
        row.isVisible !== "YES" ||
        row.expression !== null ||
        row.nullable !== ["", "YES"][index] ||
        row.packed !== null ||
        row.comment !== "" ||
        row.indexComment !== ""
      )
    ) {
      throw new Error("0033 exact full-column unique index assertion failed");
    }
    evidence.scenarios.push("clean apply, exact unique index, and target-bound canonical gate metadata");

    await adminConnection.query("SET FOREIGN_KEY_CHECKS = 0");
    try {
      await adminConnection.query(
        "INSERT INTO event_promotions (eventId,userId,level) VALUES (2147483001,2147483002,'boost')"
      );
    } finally {
      await adminConnection.query("SET FOREIGN_KEY_CHECKS = 1");
    }
    await runMigrationPreflight({ databaseUrl, migrationsRoot, releaseGitSha });
    await runMigrationRunner({
      databaseUrl,
      migrationsRoot,
      releaseGitSha,
      gatePath: resolve(workspace, "gate-ordinary-rows.json"),
    });
    evidence.scenarios.push("ordinary event_promotions rows after applied migration remain allowed");

    await resetTo0031(adminConnection, entry0032.when);
    await adminConnection.query(
      "INSERT INTO business_claims (serviceKey,businessName,claimantName,claimantEmail,claimantRole,verificationMethod,userId) VALUES ('__phase0_harness_duplicate__','A','A','a@example.invalid','owner','owner',900001),('__phase0_harness_duplicate__','B','B','b@example.invalid','owner','owner',900001)"
    );
    await expectFailure(
      () =>
        runMigrationRunner({
          databaseUrl,
          migrationsRoot,
          releaseGitSha,
          gatePath: resolve(workspace, "gate-duplicate.json"),
        }),
      /duplicate non-null business claim identity/i
    );
    const [permanent0033] = await adminConnection.query(
      "SELECT COUNT(*) count FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'business_claims' AND INDEX_NAME = 'business_claims_service_user_unique'"
    );
    if (Number(permanent0033[0].count) !== 0) {
      throw new Error("duplicate preflight allowed permanent 0033 DDL");
    }
    evidence.scenarios.push("duplicate identity preflight before permanent 0033 DDL");

    await resetTo0031(adminConnection, entry0032.when);
    await expectFailure(
      () =>
        runMigrationRunner({
          databaseUrl,
          migrationsRoot,
          releaseGitSha,
          gatePath: resolve(workspace, "gate-interrupt-0032.json"),
          interrupt: "0032",
        }),
      /intentional test interruption after 0032/i
    );
    if ((await ledgerTip(adminConnection)) !== Number(entry0031.when)) {
      throw new Error("0032 interruption unexpectedly advanced the ledger");
    }
    await assertRepeatedManualStop({
      databaseUrl,
      migrationsRoot,
      releaseGitSha,
      gatePath: resolve(workspace, "gate-retry-0032.json"),
    });
    if ((await ledgerTip(adminConnection)) !== Number(entry0031.when)) {
      throw new Error("0032 deterministic repeated stop advanced the ledger");
    }
    evidence.scenarios.push("0032 DDL interruption, deterministic repeated stop for manual reconciliation");

    await resetTo0031(adminConnection, entry0032.when);
    await expectFailure(
      () =>
        runMigrationRunner({
          databaseUrl,
          migrationsRoot,
          releaseGitSha,
          gatePath: resolve(workspace, "gate-interrupt-0033.json"),
          interrupt: "0033",
        }),
      /intentional test interruption after 0033/i
    );
    if ((await ledgerTip(adminConnection)) !== Number(entry0032.when)) {
      throw new Error("0033 interruption did not preserve the expected 0032 ledger tip");
    }
    await assertRepeatedManualStop({
      databaseUrl,
      migrationsRoot,
      releaseGitSha,
      gatePath: resolve(workspace, "gate-retry-0033.json"),
    });
    if ((await ledgerTip(adminConnection)) !== Number(entry0032.when)) {
      throw new Error("0033 deterministic repeated stop advanced the ledger");
    }
    evidence.scenarios.push("0033 ALTER interruption, deterministic repeated stop for manual reconciliation");

    const adversarialIndexes = [
      ["prefix", "CREATE UNIQUE INDEX business_claims_service_user_unique ON business_claims (serviceKey(12), userId)"],
      ["wrong-order", "CREATE UNIQUE INDEX business_claims_service_user_unique ON business_claims (userId, serviceKey)"],
      ["extra-columns", "CREATE UNIQUE INDEX business_claims_service_user_unique ON business_claims (serviceKey, userId, id)"],
      ["wrong-type", "CREATE FULLTEXT INDEX business_claims_service_user_unique ON business_claims (serviceKey)"],
      ["visibility", "CREATE UNIQUE INDEX business_claims_service_user_unique ON business_claims (serviceKey, userId) INVISIBLE"],
      ["expression", "CREATE INDEX business_claims_service_user_unique ON business_claims ((LOWER(serviceKey)), userId)"],
      ["index-comment", "CREATE UNIQUE INDEX business_claims_service_user_unique ON business_claims (serviceKey, userId) COMMENT 'drift'"],
    ];
    for (const [label, ddl] of adversarialIndexes) {
      await resetTo0031(adminConnection, entry0032.when);
      await stageThrough0032(adminConnection, entry0032);
      await adminConnection.query(ddl);
      const sql0033 = readFileSync(resolve(ROOT, `drizzle/${entry0033.tag}.sql`), "utf8");
      await adminConnection.query(
        "INSERT INTO __drizzle_migrations (hash, created_at) VALUES (?, ?)",
        [sqlHash(sql0033), entry0033.when]
      );
      const gatePath = resolve(workspace, `gate-adversarial-${label}.json`);
      await expectFailure(
        () => runMigrationRunner({ databaseUrl, migrationsRoot, releaseGitSha, gatePath }),
        /0033 is ledgered but its exact unique index is missing/i
      );
      if (existsSync(gatePath)) throw new Error(`${label} adversarial index wrote a migration gate`);
    }
    evidence.scenarios.push("applied 0033 adversarial prefix/order/columns/type/visibility/expression/index-comment fingerprints");

    await resetTo0031(adminConnection, entry0032.when);
    await stageThrough0033(adminConnection, entry0032, entry0033);
    await adminConnection.query("ALTER TABLE business_claims MODIFY serviceKey varchar(255) NULL");
    await expectFailure(
      () => runMigrationRunner({ databaseUrl, migrationsRoot, releaseGitSha, gatePath: resolve(workspace, "gate-adversarial-nullable-metadata.json") }),
      /0033 is ledgered but its exact unique index is missing/i
    );
    await adminConnection.query("ALTER TABLE business_claims MODIFY serviceKey varchar(255) NOT NULL");
    evidence.scenarios.push("applied 0033 nullable-metadata drift");

    const adversarialEventSchemas = [
      ["extra-index", "CREATE INDEX event_promotions_extra_idx ON event_promotions (userId)"],
      ["trigger", "CREATE TRIGGER event_promotions_mutate BEFORE INSERT ON event_promotions FOR EACH ROW SET NEW.priceCents = NEW.priceCents"],
      ["check", "ALTER TABLE event_promotions ADD CONSTRAINT event_promotions_price_check CHECK (priceCents >= 0)"],
      ["row-format", "ALTER TABLE event_promotions ROW_FORMAT=COMPACT"],
      ["fk-update-rule", "ALTER TABLE event_promotions DROP FOREIGN KEY event_promotions_event_id_fk; ALTER TABLE event_promotions ADD CONSTRAINT event_promotions_event_id_fk FOREIGN KEY (eventId) REFERENCES events(id) ON UPDATE CASCADE"],
      ["fk-delete-rule", "ALTER TABLE event_promotions DROP FOREIGN KEY event_promotions_event_id_fk; ALTER TABLE event_promotions ADD CONSTRAINT event_promotions_event_id_fk FOREIGN KEY (eventId) REFERENCES events(id) ON DELETE CASCADE"],
    ];
    for (const [label, ddl] of adversarialEventSchemas) {
      await resetTo0031(adminConnection, entry0032.when);
      await stageThrough0033(adminConnection, entry0032, entry0033);
      await adminConnection.query(ddl);
      await expectFailure(
        () => runMigrationPreflight({ databaseUrl, migrationsRoot, releaseGitSha }),
        /0032 is ledgered but event_promotions schema is not exact/i
      );
      const gatePath = resolve(workspace, `gate-adversarial-0032-${label}.json`);
      await expectFailure(
        () => runMigrationRunner({ databaseUrl, migrationsRoot, releaseGitSha, gatePath }),
        /0032 is ledgered but event_promotions schema is not exact/i
      );
      if (existsSync(gatePath)) {
        throw new Error(`${label} adversarial event_promotions schema wrote a migration gate`);
      }
    }
    evidence.scenarios.push("applied 0032 extra-index/trigger/check/table-option/FK update-delete drift blocks preflight and gate");

    const otherDatabase = `${databaseName}_referenced`;
    await adminConnection.query(`CREATE DATABASE \`${otherDatabase}\``);
    await adminConnection.query(`CREATE TABLE \`${otherDatabase}\`.events (id int NOT NULL, CONSTRAINT alternate_events_unique UNIQUE (id)) ENGINE=InnoDB`);
    await resetTo0031(adminConnection, entry0032.when);
    await stageThrough0033(adminConnection, entry0032, entry0033);
    await adminConnection.query(
      `ALTER TABLE event_promotions DROP FOREIGN KEY event_promotions_event_id_fk; ALTER TABLE event_promotions ADD CONSTRAINT event_promotions_event_id_fk FOREIGN KEY (eventId) REFERENCES \`${otherDatabase}\`.events(id)`
    );
    const [relationshipRows] = await adminConnection.query(
      "SELECT UNIQUE_CONSTRAINT_SCHEMA, UNIQUE_CONSTRAINT_NAME FROM information_schema.REFERENTIAL_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'event_promotions' AND CONSTRAINT_NAME = 'event_promotions_event_id_fk'"
    );
    if (relationshipRows[0]?.UNIQUE_CONSTRAINT_SCHEMA !== otherDatabase || relationshipRows[0]?.UNIQUE_CONSTRAINT_NAME !== "alternate_events_unique") {
      throw new Error("portable MySQL did not preserve referenced constraint relationship metadata");
    }
    await expectFailure(
      () => runMigrationRunner({ databaseUrl, migrationsRoot, releaseGitSha, gatePath: resolve(workspace, "gate-adversarial-referenced-constraint.json") }),
      /0032 is ledgered but event_promotions schema is not exact/i
    );
    evidence.scenarios.push("applied 0032 UNIQUE_CONSTRAINT_SCHEMA and UNIQUE_CONSTRAINT_NAME relationship drift");

    await resetTo0031(adminConnection, entry0032.when);
    await adminConnection.query("SET GLOBAL read_only = ON");
    await expectFailure(
      () =>
        runMigrationRunner({
          databaseUrl,
          migrationsRoot,
          releaseGitSha,
          gatePath: resolve(workspace, "gate-read-only.json"),
        }),
      /read-only/i
    );
    await adminConnection.query("SET GLOBAL read_only = OFF");
    evidence.scenarios.push("read_only preflight detection");

    evidence.status = "passed";
    evidence.completedAt = new Date().toISOString();
    mkdirSync(dirname(EVIDENCE_PATH), { recursive: true });
    writeFileSync(EVIDENCE_PATH, `${JSON.stringify(evidence, null, 2)}\n`, { mode: 0o600 });
    console.log(`Portable MySQL Phase 0 harness passed; non-secret evidence: ${EVIDENCE_PATH}`);
  } finally {
    if (adminConnection) {
      try {
        await adminConnection.end();
      } catch {}
    }
    if (daemon && daemon.exitCode === null && mysqlAdmin) {
      try {
        await runBounded(
          mysqlAdmin,
          ["--protocol=tcp", "--host=127.0.0.1", `--port=${port}`, "--user=root", "shutdown"],
          { timeoutMs: 30_000 }
        );
      } catch {
        daemon.kill("SIGKILL");
      }
    }
    if (daemon) {
      try {
        await waitForExit(daemon, 30_000);
      } catch {
        if (daemon.exitCode === null) daemon.kill("SIGKILL");
        await waitForExit(daemon, 30_000);
      }
    }
    rmSync(workspace, { recursive: true, force: true });
  }
}

await main();
