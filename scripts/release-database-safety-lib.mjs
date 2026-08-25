import { createHash } from "node:crypto";

const SHA256 = /^[0-9a-f]{64}$/;
const ENGINE_VERSION = /^[A-Za-z0-9][A-Za-z0-9._+:-]{0,127}$/;
const SQL_MODE_TOKEN = /^[A-Z][A-Z0-9_]{0,63}$/;

const SAFE_CODE_CLASSIFICATIONS = new Map([
  ["ER_ACCESS_DENIED_ERROR", "access-denied"],
  ["ER_DBACCESS_DENIED_ERROR", "access-denied"],
  ["ER_BAD_DB_ERROR", "database-unavailable"],
  ["ER_NO_SUCH_TABLE", "schema-state"],
  ["ER_BAD_FIELD_ERROR", "schema-state"],
  ["ER_PARSE_ERROR", "query-rejected"],
  ["ER_DUP_ENTRY", "constraint-violation"],
  ["ER_NO_REFERENCED_ROW_2", "constraint-violation"],
  ["ER_ROW_IS_REFERENCED_2", "constraint-violation"],
  ["ER_LOCK_WAIT_TIMEOUT", "lock-timeout"],
  ["ER_LOCK_DEADLOCK", "deadlock"],
  ["ER_QUERY_TIMEOUT", "query-timeout"],
  ["PROTOCOL_CONNECTION_LOST", "connection-lost"],
  ["ECONNREFUSED", "connection-unavailable"],
  ["ECONNRESET", "connection-lost"],
  ["ETIMEDOUT", "connection-timeout"],
  ["ENOTFOUND", "connection-unavailable"],
]);

function providerCode(error) {
  if (!error || typeof error !== "object") return "";
  const code = error.code;
  return typeof code === "string" && /^[A-Z0-9_]{1,64}$/.test(code)
    ? code
    : "";
}

export function classifyDatabaseFailure(error) {
  return SAFE_CODE_CLASSIFICATIONS.get(providerCode(error)) ?? "database-failure";
}

export function safeDatabaseError(stage, error, {
  migrationTag,
  statementIndex,
} = {}) {
  if (typeof stage !== "string" || !/^[a-z][a-z-]{0,31}$/.test(stage)) {
    throw new Error("safe database error stage is invalid");
  }
  const context = [];
  if (migrationTag !== undefined) {
    const tag = String(migrationTag);
    if (!/^[0-9a-z][0-9a-z_-]{0,127}$/i.test(tag)) {
      throw new Error("safe migration tag is invalid");
    }
    context.push(tag);
  }
  if (statementIndex !== undefined) {
    if (!Number.isInteger(statementIndex) || statementIndex < 1 || statementIndex > 100000) {
      throw new Error("safe migration statement index is invalid");
    }
    context.push(`statement ${statementIndex}`);
  }
  const suffix = context.length > 0 ? ` [${context.join(" ")}]` : "";
  return new Error(`database ${stage} failed${suffix}: ${classifyDatabaseFailure(error)}`);
}

function canonicalTargetPart(value, label, maxLength, pattern) {
  if (typeof value !== "string") throw new Error(`database target ${label} is unavailable`);
  const normalized = value.normalize("NFC").trim();
  if (!normalized || normalized.length > maxLength || !pattern.test(normalized)) {
    throw new Error(`database target ${label} is invalid`);
  }
  return normalized;
}

export function databaseTargetSha256(serverUuid, databaseName) {
  const canonicalUuid = canonicalTargetPart(
    serverUuid,
    "server identity",
    128,
    /^[A-Za-z0-9][A-Za-z0-9._:-]*$/
  ).toLowerCase();
  const canonicalDatabase = canonicalTargetPart(
    databaseName,
    "schema identity",
    64,
    /^[\p{L}\p{N}$_-][\p{L}\p{N}$_ -]*$/u
  );
  return createHash("sha256")
    .update(`database-target-v1\n${canonicalUuid}\n${canonicalDatabase}`)
    .digest("hex");
}

export function requireExpectedDatabaseTargetSha256(value) {
  if (typeof value !== "string" || !SHA256.test(value)) {
    throw new Error("EXPECTED_DATABASE_TARGET_SHA256 must be 64 lowercase hexadecimal characters");
  }
  return value;
}

export async function readAndVerifyDatabaseTarget(connection, expectedDigest) {
  const expected = requireExpectedDatabaseTargetSha256(expectedDigest);
  let rows;
  try {
    [rows] = await connection.query(
      "SELECT @@server_uuid AS serverUuid, DATABASE() AS databaseName"
    );
  } catch (error) {
    throw safeDatabaseError("target-inspection", error);
  }
  if (!Array.isArray(rows) || rows.length !== 1) {
    throw new Error("database target identity is unavailable");
  }
  const actual = databaseTargetSha256(rows[0]?.serverUuid, rows[0]?.databaseName);
  if (actual !== expected) throw new Error("database target digest mismatch");
  return actual;
}

export function canonicalSqlMode(value) {
  if (typeof value !== "string" || value.length < 1 || value.length > 1024) {
    throw new Error("sqlMode must be a nonempty bounded string");
  }
  const tokens = value.split(",");
  if (
    tokens.some(token => !SQL_MODE_TOKEN.test(token)) ||
    new Set(tokens).size !== tokens.length
  ) {
    throw new Error("sqlMode must contain unique uppercase MySQL mode tokens");
  }
  return [...tokens].sort().join(",");
}

export function validateGateRuntimeMetadata(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("gate runtime metadata is invalid");
  }
  if (typeof value.engineVersion !== "string" || !ENGINE_VERSION.test(value.engineVersion)) {
    throw new Error("engineVersion must be a nonempty bounded safe string");
  }
  const sqlMode = canonicalSqlMode(value.sqlMode);
  if (sqlMode !== value.sqlMode) {
    throw new Error("sqlMode must be canonical and sorted");
  }
  return { engineVersion: value.engineVersion, sqlMode };
}
