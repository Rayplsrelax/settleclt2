import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
// @ts-ignore JavaScript release utility intentionally has no TypeScript surface.
import { readMigrationPlan } from "../scripts/migration-ledger-lib.mjs";
// @ts-ignore JavaScript release utility intentionally has no TypeScript surface.
import {
  inspectMigrationDatabase,
  preflightMigrationState,
} from "../scripts/preflight-migration-state.mjs";
// @ts-ignore JavaScript release utility intentionally has no TypeScript surface.
import {
  REQUIRED_SCHEMA_DESCRIPTOR,
  hasExactBusinessClaimIdentityUniqueIndex,
} from "../scripts/migration-schema-lib.mjs";
// @ts-ignore JavaScript release utility intentionally has no TypeScript surface.
import { databaseTargetSha256 } from "../scripts/release-database-safety-lib.mjs";

const indexName = "business_claims_service_user_unique";
const serverUuid = "11111111-2222-4333-8444-555555555555";
const databaseName = "settleclt_test";
const expectedDatabaseTargetSha256 = databaseTargetSha256(serverUuid, databaseName);
const exactIndexRows = [
  { indexName, nonUnique: 0, seqInIndex: 1, columnName: "serviceKey", subPart: null, collation: "A", indexType: "BTREE", isVisible: "YES", expression: null, nullable: "", packed: null, comment: "", indexComment: "" },
  { indexName, nonUnique: 0, seqInIndex: 2, columnName: "userId", subPart: null, collation: "A", indexType: "BTREE", isVisible: "YES", expression: null, nullable: "YES", packed: null, comment: "", indexComment: "" },
];

type FakeState = {
  duplicateCount?: number;
  eventPromotionsExists?: boolean;
  indexRows?: typeof exactIndexRows;
  ledgerRows?: Array<{ hash: string; createdAt: number }>;
  readOnly?: number;
  superReadOnly?: number;
  eventIndexRows?: Record<string, unknown>[];
  triggerRows?: Record<string, unknown>[];
  constraintRows?: Record<string, unknown>[];
  tableOptionRows?: Record<string, unknown>[];
};

const eventColumns = REQUIRED_SCHEMA_DESCRIPTOR.eventPromotions.columns.map(
  ([columnName, columnType, isNullable, columnDefault, extra]: unknown[]) => ({
    columnName, columnType, isNullable, columnDefault, extra,
  })
);
const eventIndexRows = REQUIRED_SCHEMA_DESCRIPTOR.eventPromotions.indexes.map(
  ([indexName, nonUnique, seqInIndex, columnName, subPart, collation, indexType, isVisible, expression, nullable, packed, comment, indexComment]: unknown[]) => ({
    indexName, nonUnique, seqInIndex, columnName, subPart, collation, indexType, isVisible, expression, nullable, packed, comment, indexComment,
  })
);
const foreignKeyRows = REQUIRED_SCHEMA_DESCRIPTOR.eventPromotions.foreignKeys.map(
  ([constraintName, columnName, referencedTableName, referencedColumnName, updateRule, deleteRule, matchOption, uniqueConstraintSchema, uniqueConstraintName]: unknown[]) => ({
    constraintName, columnName, referencedTableName, referencedColumnName, updateRule, deleteRule, matchOption, uniqueConstraintSchema, uniqueConstraintName,
  })
);
const constraintRows = REQUIRED_SCHEMA_DESCRIPTOR.eventPromotions.tableConstraints.map(
  ([constraintName, constraintType, checkClause]: unknown[]) => ({
    constraintName, constraintType, checkClause,
  })
);

function fakeConnection(
  plan: ReturnType<typeof readMigrationPlan>,
  state: FakeState = {}
) {
  const queries: string[] = [];
  const query = vi.fn(async (sql: string) => {
    queries.push(sql);
    if (sql.includes("@@server_uuid")) return [[{ serverUuid, databaseName }]];
    if (sql.includes("@@read_only")) {
      return [[
        {
          readOnly: state.readOnly ?? 0,
          superReadOnly: state.superReadOnly ?? 0,
        },
      ]];
    }
    if (sql.includes("FROM __drizzle_migrations")) {
      return [
        state.ledgerRows ??
          plan.map(entry => ({ hash: entry.hash, createdAt: entry.when })),
      ];
    }
    if (sql.includes("duplicate_groups")) {
      return [[{ count: state.duplicateCount ?? 0 }]];
    }
    if (sql.includes("information_schema.COLUMNS")) return [eventColumns];
    if (sql.includes("information_schema.KEY_COLUMN_USAGE")) return [foreignKeyRows];
    if (sql.includes("information_schema.TABLE_CONSTRAINTS")) {
      return [state.constraintRows ?? constraintRows];
    }
    if (sql.includes("information_schema.TRIGGERS")) {
      return [state.triggerRows ?? []];
    }
    if (sql.includes("information_schema.TABLES") && /COUNT\s*\(/i.test(sql)) {
      return [[{ count: state.eventPromotionsExists === false ? 0 : 1 }]];
    }
    if (sql.includes("information_schema.TABLES")) {
      return [state.eventPromotionsExists === false ? [] : (state.tableOptionRows ?? [{
        engine: "InnoDB",
        rowFormat: "Dynamic",
        tableCollation: "utf8mb4_0900_ai_ci",
        createOptions: "",
        schemaDefaultCollation: "utf8mb4_0900_ai_ci",
        defaultRowFormat: "dynamic",
      }])];
    }
    if (sql.includes("information_schema.STATISTICS")) {
      return [sql.includes("event_promotions")
        ? (state.eventIndexRows ?? eventIndexRows)
        : (state.indexRows ?? exactIndexRows)];
    }
    throw new Error(`Unexpected SELECT in test: ${sql}`);
  });
  return { query, queries, end: vi.fn(async () => undefined) };
}

describe("migration database preflight", () => {
  it("runs the standalone preflight through a DB mock without locks or writes", async () => {
    const plan = readMigrationPlan(process.cwd());
    const connection = fakeConnection(plan);
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);
    try {
      await expect(preflightMigrationState({
        connectionString: "mysql://protected.invalid/mock",
        expectedDatabaseTargetSha256,
        migrationsRoot: process.cwd(),
        connectionFactory: async () => connection,
      })).resolves.toMatchObject({ status: "current", pending: [] });
    } finally {
      log.mockRestore();
    }
    expect(connection.end).toHaveBeenCalledOnce();
    expect(connection.queries.length).toBeGreaterThan(0);
    expect(connection.queries.every(sql => /^\s*SELECT\b/i.test(sql))).toBe(true);
    expect(connection.queries.join("\n")).not.toMatch(/GET_LOCK|RELEASE_LOCK|FOR\s+UPDATE|(?:^|;)\s*(?:INSERT|UPDATE|DELETE|ALTER|CREATE|DROP)\b/im);
  });

  it("statically audits every preflight query call as SELECT-only", () => {
    const sources = [
      "scripts/preflight-migration-state.mjs",
      "scripts/migration-schema-lib.mjs",
      "scripts/release-database-safety-lib.mjs",
    ].map(path => readFileSync(path, "utf8"));
    const queries = sources.flatMap(source =>
      [...source.matchAll(/\.query\(\s*(["'`])([\s\S]*?)\1/g)].map(match => match[2])
    );
    expect(queries.length).toBeGreaterThanOrEqual(10);
    expect(queries.every(sql => /^\s*SELECT\b/i.test(sql))).toBe(true);
    expect(queries.join("\n")).not.toMatch(/GET_LOCK|RELEASE_LOCK|FOR\s+UPDATE|(?:^|;)\s*(?:INSERT|UPDATE|DELETE|ALTER|CREATE|DROP)\b/im);
  });

  it("uses SELECT-only queries and verifies the exact index fingerprint", async () => {
    const plan = readMigrationPlan(process.cwd());
    const connection = fakeConnection(plan);

    await expect(
      inspectMigrationDatabase(connection, plan)
    ).resolves.toMatchObject({
      status: "current",
      pending: [],
    });

    expect(connection.queries).toHaveLength(10);
    expect(connection.queries.every(sql => /^\s*SELECT\b/i.test(sql))).toBe(
      true
    );
    const duplicateQuery = connection.queries.find(sql =>
      sql.includes("duplicate_groups")
    );
    expect(duplicateQuery).toMatch(/serviceKey\s+IS\s+NOT\s+NULL/i);
    expect(duplicateQuery).toMatch(/userId\s+IS\s+NOT\s+NULL/i);
    expect(duplicateQuery).toMatch(/GROUP\s+BY\s+serviceKey\s*,\s*userId/i);
    expect(duplicateQuery).toMatch(/HAVING\s+COUNT\(\*\)\s*>\s*1/i);

    const indexQuery = connection.queries.find(sql =>
      sql.includes("information_schema.STATISTICS") &&
      sql.includes("business_claims")
    );
    expect(indexQuery).toMatch(/INDEX_NAME\s+AS\s+indexName/i);
    expect(indexQuery).toMatch(/NON_UNIQUE\s+AS\s+nonUnique/i);
    expect(indexQuery).toMatch(/SEQ_IN_INDEX\s+AS\s+seqInIndex/i);
    expect(indexQuery).toMatch(/COLUMN_NAME\s+AS\s+columnName/i);
    expect(indexQuery).toMatch(/SUB_PART\s+AS\s+subPart/i);
    expect(indexQuery).toMatch(/COLLATION\s+AS\s+collation/i);
    expect(indexQuery).toMatch(/INDEX_TYPE\s+AS\s+indexType/i);
    expect(indexQuery).toMatch(/IS_VISIBLE\s+AS\s+isVisible/i);
    expect(indexQuery).toMatch(/EXPRESSION\s+AS\s+expression/i);
    expect(indexQuery).toMatch(/NULLABLE\s+AS\s+nullable/i);
    expect(indexQuery).toMatch(/PACKED\s+AS\s+packed/i);
    expect(indexQuery).toMatch(/COMMENT\s+AS\s+comment/i);
    expect(indexQuery).toMatch(/INDEX_COMMENT\s+AS\s+indexComment/i);
    expect(indexQuery).toMatch(/ORDER\s+BY\s+SEQ_IN_INDEX/i);
  });

  it.each([
    ["extra index", { eventIndexRows: [...eventIndexRows, { ...eventIndexRows[1], indexName: "event_promotions_extra_idx" }] }],
    ["trigger", { triggerRows: [{ triggerName: "event_promotions_mutate", actionTiming: "BEFORE", eventManipulation: "INSERT", actionStatement: "SET NEW.priceCents = 1", actionOrientation: "ROW" }] }],
    ["check constraint", { constraintRows: [...constraintRows, { constraintName: "event_promotions_price_check", constraintType: "CHECK", checkClause: "(`priceCents` >= 0)" }] }],
    ["wrong engine", { tableOptionRows: [{ engine: "MyISAM", rowFormat: "Fixed", tableCollation: "utf8mb4_0900_ai_ci", createOptions: "", schemaDefaultCollation: "utf8mb4_0900_ai_ci", defaultRowFormat: "dynamic" }] }],
  ])("uses the shared required-schema inspector and blocks applied 0032 %s drift", async (_label, state) => {
    const plan = readMigrationPlan(process.cwd());
    const connection = fakeConnection(plan, state);
    await expect(inspectMigrationDatabase(connection, plan)).rejects.toThrow(/0032.*schema.*exact/i);
    expect(connection.queries.some(sql => sql.includes("information_schema.COLUMNS"))).toBe(true);
    expect(connection.queries.some(sql => sql.includes("information_schema.TRIGGERS"))).toBe(true);
  });

  it.each([
    ["read_only", { readOnly: 1 }],
    ["super_read_only", { superReadOnly: 1 }],
  ])("detects a %s target before migration", async (_label, state) => {
    const plan = readMigrationPlan(process.cwd());
    await expect(
      inspectMigrationDatabase(fakeConnection(plan, state), plan)
    ).rejects.toThrow(/read.only/i);
  });

  it("fails closed on duplicate non-null claim identities before reporting ready or current", async () => {
    const plan = readMigrationPlan(process.cwd());
    const connection = fakeConnection(plan, { duplicateCount: 1 });

    await expect(inspectMigrationDatabase(connection, plan)).rejects.toThrow(
      /duplicate non-null business claim identity/i
    );
  });

  it.each([
    ["wrong order", [exactIndexRows[1], exactIndexRows[0]]],
    [
      "wrong columns",
      [
        { ...exactIndexRows[0], columnName: "userId" },
        { ...exactIndexRows[1], columnName: "serviceKey" },
      ],
    ],
    ["wrong cardinality", [exactIndexRows[0]]],
    ["non-unique", [exactIndexRows[0], { ...exactIndexRows[1], nonUnique: 1 }]],
    ["prefix", [{ ...exactIndexRows[0], subPart: 12 }, exactIndexRows[1]]],
    ["wrong collation", [{ ...exactIndexRows[0], collation: "D" }, exactIndexRows[1]]],
    ["wrong type", [{ ...exactIndexRows[0], indexType: "HASH" }, exactIndexRows[1]]],
    ["invisible", [exactIndexRows[0], { ...exactIndexRows[1], isVisible: "NO" }]],
    ["expression", [{ ...exactIndexRows[0], columnName: null, expression: "(`serviceKey`)" }, exactIndexRows[1]]],
    ["extra column", [...exactIndexRows, { ...exactIndexRows[1], seqInIndex: 3, columnName: "id" }]],
  ])("fails closed for a same-name %s index", async (_label, indexRows) => {
    const plan = readMigrationPlan(process.cwd());
    const connection = fakeConnection(plan, {
      indexRows: indexRows as typeof exactIndexRows,
    });

    await expect(inspectMigrationDatabase(connection, plan)).rejects.toThrow(
      /business_claims_service_user_unique/i
    );
  });

  it.each([
    ["prefix", [{ ...exactIndexRows[0], subPart: 10 }, exactIndexRows[1]]],
    ["wrong order", [exactIndexRows[1], exactIndexRows[0]]],
    ["extra column", [...exactIndexRows, { ...exactIndexRows[1], seqInIndex: 3, columnName: "id" }]],
    ["wrong type", [{ ...exactIndexRows[0], indexType: "HASH" }, exactIndexRows[1]]],
    ["visibility", [{ ...exactIndexRows[0], isVisible: "NO" }, exactIndexRows[1]]],
    ["expression", [{ ...exactIndexRows[0], expression: "(`serviceKey` + 0)" }, exactIndexRows[1]]],
    ["missing visibility metadata", [{ ...exactIndexRows[0], isVisible: undefined }, exactIndexRows[1]]],
    ["missing expression metadata", [{ ...exactIndexRows[0], expression: undefined }, exactIndexRows[1]]],
    ["nullable metadata", [{ ...exactIndexRows[0], nullable: "YES" }, exactIndexRows[1]]],
    ["packed metadata", [{ ...exactIndexRows[0], packed: "packed" }, exactIndexRows[1]]],
    ["comment metadata", [{ ...exactIndexRows[0], comment: "disabled" }, exactIndexRows[1]]],
    ["index comment metadata", [{ ...exactIndexRows[0], indexComment: "review drift" }, exactIndexRows[1]]],
    ["missing nullable metadata", [{ ...exactIndexRows[0], nullable: undefined }, exactIndexRows[1]]],
    ["missing packed metadata", [{ ...exactIndexRows[0], packed: undefined }, exactIndexRows[1]]],
    ["missing comment metadata", [{ ...exactIndexRows[0], comment: undefined }, exactIndexRows[1]]],
    ["missing index comment metadata", [{ ...exactIndexRows[0], indexComment: undefined }, exactIndexRows[1]]],
  ])("shares the full exact 0033 fingerprint and rejects %s", (_label, rows) => {
    expect(hasExactBusinessClaimIdentityUniqueIndex(rows)).toBe(false);
  });

  it("stops for manual reconciliation when exact 0032 or 0033 DDL exists without its ledger row", async () => {
    const plan = readMigrationPlan(process.cwd());
    const through0031 = plan.slice(0, plan.findIndex(entry => entry.tag === "0032_event_promotions"));
    const through0032 = plan.slice(0, plan.findIndex(entry => entry.tag === "0033_business_claim_identity_unique"));

    await expect(inspectMigrationDatabase(fakeConnection(plan, {
      ledgerRows: through0031.map(entry => ({ hash: entry.hash, createdAt: entry.when })),
      eventPromotionsExists: true,
      indexRows: [],
    }), plan)).rejects.toThrow(/partial-DDL.*manual reconciliation/i);

    await expect(inspectMigrationDatabase(fakeConnection(plan, {
      ledgerRows: through0032.map(entry => ({ hash: entry.hash, createdAt: entry.when })),
      eventPromotionsExists: true,
      indexRows: exactIndexRows,
    }), plan)).rejects.toThrow(/partial-DDL.*manual reconciliation/i);
  });

  it("reports an unledgered same-name index as partial DDL requiring manual reconciliation", async () => {
    const plan = readMigrationPlan(process.cwd());
    const through0032 = plan.slice(
      0,
      plan.findIndex(entry => entry.tag === "0032_event_promotions") + 1
    );
    const connection = fakeConnection(plan, {
      ledgerRows: through0032.map(entry => ({
        hash: entry.hash,
        createdAt: entry.when,
      })),
      indexRows: [
        exactIndexRows[0],
        { ...exactIndexRows[1], columnName: "id" },
      ],
    });

    await expect(inspectMigrationDatabase(connection, plan)).rejects.toThrow(
      /0033 partial-DDL\/manual reconciliation.*business_claims_service_user_unique/i
    );
  });

  it("fails closed on duplicated or diverged ledger rows", async () => {
    const plan = readMigrationPlan(process.cwd());
    const duplicated = plan.map(entry => ({
      hash: entry.hash,
      createdAt: entry.when,
    }));
    duplicated.splice(2, 0, { ...duplicated[1] });

    await expect(
      inspectMigrationDatabase(
        fakeConnection(plan, { ledgerRows: duplicated }),
        plan
      )
    ).rejects.toThrow(/diverge|beyond/i);
  });
});
