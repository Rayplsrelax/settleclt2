import { describe, expect, it, vi } from "vitest";
// @ts-ignore JavaScript release utility intentionally has no TypeScript surface.
import { inspectRequiredSchema } from "../scripts/migration-schema-lib.mjs";

const eventColumns = [
  ["id", "int", "NO", null, "auto_increment"],
  ["eventId", "int", "NO", null, ""],
  ["userId", "int", "NO", null, ""],
  ["level", "enum('boost','spotlight','headliner')", "NO", null, ""],
  ["status", "enum('pending','active','expired','canceled')", "NO", "pending", ""],
  ["stripePaymentRef", "varchar(255)", "YES", null, ""],
  ["priceCents", "int", "NO", "0", ""],
  ["startsAt", "timestamp", "YES", null, ""],
  ["endsAt", "timestamp", "YES", null, ""],
  ["customHeadline", "varchar(255)", "YES", null, ""],
  ["sponsorMessage", "varchar(500)", "YES", null, ""],
  ["organizerLogoUrl", "varchar(1024)", "YES", null, ""],
  ["socialPostsDue", "int", "NO", "0", ""],
  ["socialPostsSent", "int", "NO", "0", ""],
  ["createdAt", "timestamp", "NO", "CURRENT_TIMESTAMP", "DEFAULT_GENERATED"],
  ["updatedAt", "timestamp", "NO", "CURRENT_TIMESTAMP", "DEFAULT_GENERATED on update CURRENT_TIMESTAMP"],
].map(([columnName, columnType, isNullable, columnDefault, extra]) => ({
  columnName,
  columnType,
  isNullable,
  columnDefault,
  extra,
}));

const eventIndexes = [
  ["PRIMARY", 0, 1, "id"],
  ["event_promotions_event_idx", 1, 1, "eventId"],
  ["event_promotions_status_idx", 1, 1, "status"],
  ["event_promotions_ends_idx", 1, 1, "endsAt"],
  ["event_promotions_user_id_fk", 1, 1, "userId"],
].map(([indexName, nonUnique, seqInIndex, columnName]) => ({
  indexName,
  nonUnique,
  seqInIndex,
  columnName,
  subPart: null,
  collation: "A",
  indexType: "BTREE",
  isVisible: "YES",
  expression: null,
  nullable: columnName === "endsAt" ? "YES" : "",
  packed: null,
  comment: "",
  indexComment: "",
}));

const foreignKeys = [
  ["event_promotions_event_id_fk", "eventId", "events", "id", "NO ACTION", "NO ACTION", "NONE", "DATABASE", "PRIMARY"],
  ["event_promotions_user_id_fk", "userId", "users", "id", "NO ACTION", "NO ACTION", "NONE", "DATABASE", "PRIMARY"],
].map(([constraintName, columnName, referencedTableName, referencedColumnName, updateRule, deleteRule, matchOption, uniqueConstraintSchema, uniqueConstraintName]) => ({
  constraintName,
  columnName,
  referencedTableName,
  referencedColumnName,
  updateRule,
  deleteRule,
  matchOption,
  uniqueConstraintSchema,
  uniqueConstraintName,
}));

const tableConstraints = [
  ["event_promotions_event_id_fk", "FOREIGN KEY", null],
  ["event_promotions_user_id_fk", "FOREIGN KEY", null],
  ["PRIMARY", "PRIMARY KEY", null],
].map(([constraintName, constraintType, checkClause]) => ({
  constraintName,
  constraintType,
  checkClause,
}));

const claimIndexes = [
  ["business_claims_service_user_unique", 0, 1, "serviceKey"],
  ["business_claims_service_user_unique", 0, 2, "userId"],
].map(([indexName, nonUnique, seqInIndex, columnName]) => ({
  indexName,
  nonUnique,
  seqInIndex,
  columnName,
  subPart: null,
  collation: "A",
  indexType: "BTREE",
  isVisible: "YES",
  expression: null,
  nullable: columnName === "userId" ? "YES" : "",
  packed: null,
  comment: "",
  indexComment: "",
}));

type SchemaState = {
  eventIndexes?: typeof eventIndexes;
  triggers?: Array<Record<string, unknown>>;
  tableConstraints?: typeof tableConstraints;
  tableOptions?: Record<string, unknown>[];
  foreignKeys?: typeof foreignKeys;
};

function fakeSchemaConnection(state: SchemaState = {}) {
  const queries: string[] = [];
  const query = vi.fn(async (sql: string) => {
    queries.push(sql);
    if (sql.includes("information_schema.COLUMNS")) return [eventColumns];
    if (sql.includes("information_schema.KEY_COLUMN_USAGE")) return [state.foreignKeys ?? foreignKeys];
    if (sql.includes("information_schema.TABLE_CONSTRAINTS")) {
      return [state.tableConstraints ?? tableConstraints];
    }
    if (sql.includes("information_schema.TRIGGERS")) return [state.triggers ?? []];
    if (sql.includes("information_schema.TABLES")) {
      return [state.tableOptions ?? [{
        engine: "InnoDB",
        rowFormat: "Dynamic",
        tableCollation: "utf8mb4_0900_ai_ci",
        createOptions: "",
        schemaDefaultCollation: "utf8mb4_0900_ai_ci",
        defaultRowFormat: "dynamic",
      }]];
    }
    if (sql.includes("information_schema.STATISTICS")) {
      return [sql.includes("business_claims") ? claimIndexes : (state.eventIndexes ?? eventIndexes)];
    }
    throw new Error(`Unexpected schema query: ${sql}`);
  });
  return { query, queries };
}

describe("applied 0032 required schema fingerprint", () => {
  it("accepts the exact reviewed schema and normalizes inherited table defaults", async () => {
    const connection = fakeSchemaConnection();
    const result = await inspectRequiredSchema(connection);

    expect(result.exact).toBe(true);
    expect(result.eventPromotionsExact).toBe(true);
    expect(result.descriptor.eventPromotions).toMatchObject({
      triggers: [],
      tableConstraints: [
        ["event_promotions_event_id_fk", "FOREIGN KEY", null],
        ["event_promotions_user_id_fk", "FOREIGN KEY", null],
        ["PRIMARY", "PRIMARY KEY", null],
      ],
      tableOptions: ["InnoDB", "DEFAULT", "DATABASE_DEFAULT", ""],
    });
    expect(connection.queries.every(sql => /^\s*SELECT\b/i.test(sql))).toBe(true);
    expect(connection.queries.some(sql => /COUNT\s*\(/i.test(sql))).toBe(false);
  });

  it("inspects every event_promotions index and rejects an extra index", async () => {
    const extra = {
      ...eventIndexes[1],
      indexName: "event_promotions_unreviewed_idx",
      columnName: "userId",
    };
    const connection = fakeSchemaConnection({ eventIndexes: [...eventIndexes, extra] });
    const result = await inspectRequiredSchema(connection);

    const query = connection.queries.find(sql =>
      sql.includes("information_schema.STATISTICS") && sql.includes("event_promotions")
    );
    expect(query).not.toMatch(/INDEX_NAME\s+IN\s*\(/i);
    expect(result.eventPromotionsExact).toBe(false);
  });

  it.each(["nullable", "packed", "comment", "indexComment"] as const)(
    "rejects event_promotions %s index metadata drift and missing metadata",
    async field => {
      const drifted = eventIndexes.map((row, index) =>
        index === 1 ? { ...row, [field]: field === "nullable" ? "YES" : "drift" } : row
      );
      expect((await inspectRequiredSchema(fakeSchemaConnection({ eventIndexes: drifted }))).eventPromotionsExact).toBe(false);
      const missing = eventIndexes.map((row, index) =>
        index === 1 ? { ...row, [field]: undefined } : row
      );
      expect((await inspectRequiredSchema(fakeSchemaConnection({ eventIndexes: missing }))).eventPromotionsExact).toBe(false);
    }
  );

  it.each([
    ["update rule", { updateRule: "CASCADE" }],
    ["delete rule", { deleteRule: "SET NULL" }],
    ["match option", { matchOption: "FULL" }],
    ["referenced schema", { uniqueConstraintSchema: "other_database" }],
    ["referenced constraint", { uniqueConstraintName: "other_unique" }],
    ["missing relationship metadata", { uniqueConstraintName: undefined }],
  ])("rejects same-name FK %s drift", async (_label, change) => {
    const drifted = foreignKeys.map((row, index) => index === 0 ? { ...row, ...change } : row);
    expect((await inspectRequiredSchema(fakeSchemaConnection({ foreignKeys: drifted as typeof foreignKeys }))).eventPromotionsExact).toBe(false);
  });

  it("queries all reviewed index and referential-constraint metadata", async () => {
    const connection = fakeSchemaConnection();
    await inspectRequiredSchema(connection);
    const indexQueries = connection.queries.filter(sql => sql.includes("information_schema.STATISTICS"));
    for (const query of indexQueries) {
      expect(query).toMatch(/NULLABLE\s+AS\s+nullable/i);
      expect(query).toMatch(/PACKED\s+AS\s+packed/i);
      expect(query).toMatch(/COMMENT\s+AS\s+comment/i);
      expect(query).toMatch(/INDEX_COMMENT\s+AS\s+indexComment/i);
    }
    const fkQuery = connection.queries.find(sql => sql.includes("information_schema.KEY_COLUMN_USAGE"));
    expect(fkQuery).toMatch(/REFERENTIAL_CONSTRAINTS/i);
    expect(fkQuery).toMatch(/UPDATE_RULE\s+AS\s+updateRule/i);
    expect(fkQuery).toMatch(/DELETE_RULE\s+AS\s+deleteRule/i);
    expect(fkQuery).toMatch(/MATCH_OPTION\s+AS\s+matchOption/i);
    expect(fkQuery).toMatch(/UNIQUE_CONSTRAINT_SCHEMA/i);
    expect(fkQuery).toMatch(/AS\s+uniqueConstraintSchema/i);
    expect(fkQuery).toMatch(/UNIQUE_CONSTRAINT_NAME\s+AS\s+uniqueConstraintName/i);
  });

  it.each([
    ["trigger", { triggers: [{ triggerName: "event_promotions_mutate", actionTiming: "BEFORE", eventManipulation: "INSERT", actionStatement: "SET NEW.priceCents = 1", actionOrientation: "ROW" }] }],
    ["check constraint", { tableConstraints: [...tableConstraints, { constraintName: "event_promotions_price_check", constraintType: "CHECK", checkClause: "(`priceCents` >= 0)" }] }],
    ["wrong engine", { tableOptions: [{ engine: "MyISAM", rowFormat: "Fixed", tableCollation: "utf8mb4_0900_ai_ci", createOptions: "", schemaDefaultCollation: "utf8mb4_0900_ai_ci", defaultRowFormat: "dynamic" }] }],
    ["explicit row format", { tableOptions: [{ engine: "InnoDB", rowFormat: "Compact", tableCollation: "utf8mb4_0900_ai_ci", createOptions: "row_format=COMPACT", schemaDefaultCollation: "utf8mb4_0900_ai_ci", defaultRowFormat: "dynamic" }] }],
    ["collation drift", { tableOptions: [{ engine: "InnoDB", rowFormat: "Dynamic", tableCollation: "utf8mb4_unicode_ci", createOptions: "", schemaDefaultCollation: "utf8mb4_0900_ai_ci", defaultRowFormat: "dynamic" }] }],
  ])("rejects applied 0032 %s drift", async (_label, state) => {
    const result = await inspectRequiredSchema(fakeSchemaConnection(state));
    expect(result.eventPromotionsExact).toBe(false);
  });
});
