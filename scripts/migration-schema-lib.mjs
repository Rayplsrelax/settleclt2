import { createHash } from "node:crypto";

export const BUSINESS_CLAIM_INDEX = "business_claims_service_user_unique";

export const REQUIRED_SCHEMA_DESCRIPTOR = Object.freeze({
  eventPromotions: {
    columns: [
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
    ],
    indexes: [
      ["PRIMARY", 0, 1, "id", null, "A", "BTREE", "YES", null, "", null, "", ""],
      ["event_promotions_event_idx", 1, 1, "eventId", null, "A", "BTREE", "YES", null, "", null, "", ""],
      ["event_promotions_status_idx", 1, 1, "status", null, "A", "BTREE", "YES", null, "", null, "", ""],
      ["event_promotions_ends_idx", 1, 1, "endsAt", null, "A", "BTREE", "YES", null, "YES", null, "", ""],
      ["event_promotions_user_id_fk", 1, 1, "userId", null, "A", "BTREE", "YES", null, "", null, "", ""],
    ],
    foreignKeys: [
      ["event_promotions_event_id_fk", "eventId", "events", "id", "NO ACTION", "NO ACTION", "NONE", "DATABASE", "PRIMARY"],
      ["event_promotions_user_id_fk", "userId", "users", "id", "NO ACTION", "NO ACTION", "NONE", "DATABASE", "PRIMARY"],
    ],
    tableConstraints: [
      ["event_promotions_event_id_fk", "FOREIGN KEY", null],
      ["event_promotions_user_id_fk", "FOREIGN KEY", null],
      ["PRIMARY", "PRIMARY KEY", null],
    ],
    triggers: [],
    tableOptions: ["InnoDB", "DEFAULT", "DATABASE_DEFAULT", ""],
  },
  businessClaimsIdentityIndex: [
    [BUSINESS_CLAIM_INDEX, 0, 1, "serviceKey", null, "A", "BTREE", "YES", null, "", null, "", ""],
    [BUSINESS_CLAIM_INDEX, 0, 2, "userId", null, "A", "BTREE", "YES", null, "YES", null, "", ""],
  ],
});

export function sha256Json(value) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

export const REQUIRED_SCHEMA_FINGERPRINT = sha256Json(REQUIRED_SCHEMA_DESCRIPTOR);

function normalizeDefault(value) {
  if (value === null || value === undefined) return null;
  const text = String(value);
  return /^current_timestamp(?:\(\))?$/i.test(text) ? "CURRENT_TIMESTAMP" : text;
}

function normalizeExtra(value) {
  return String(value ?? "")
    .replace(/default_generated/gi, "DEFAULT_GENERATED")
    .replace(/on update current_timestamp(?:\(\))?/gi, "on update CURRENT_TIMESTAMP")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeIndexRows(rows) {
  return rows.map(row => [
    String(row.indexName),
    Number(row.nonUnique),
    Number(row.seqInIndex),
    row.columnName === null ? null : String(row.columnName),
    row.subPart === null
      ? null
      : row.subPart === undefined
        ? "__MISSING__"
        : Number(row.subPart),
    row.collation === null ? null : String(row.collation),
    String(row.indexType),
    row.isVisible === undefined ? "__MISSING__" : String(row.isVisible),
    row.expression === null
      ? null
      : row.expression === undefined
        ? "__MISSING__"
        : String(row.expression),
    row.nullable === undefined ? "__MISSING__" : String(row.nullable),
    row.packed === undefined
      ? "__MISSING__"
      : row.packed === null
        ? null
        : String(row.packed),
    row.comment === undefined ? "__MISSING__" : String(row.comment),
    row.indexComment === undefined ? "__MISSING__" : String(row.indexComment),
  ]);
}

export function hasExactBusinessClaimIdentityUniqueIndex(rows) {
  return (
    Array.isArray(rows) &&
    JSON.stringify(normalizeIndexRows(rows)) ===
      JSON.stringify(REQUIRED_SCHEMA_DESCRIPTOR.businessClaimsIdentityIndex)
  );
}

function normalizeTableOptions(rows) {
  if (rows.length !== 1) return rows.map(() => "__INVALID_TABLE_OPTION_ROW__");
  const row = rows[0];
  const rowFormat = String(row.rowFormat ?? "");
  const defaultRowFormat = String(row.defaultRowFormat ?? "");
  const tableCollation = String(row.tableCollation ?? "");
  const schemaDefaultCollation = String(row.schemaDefaultCollation ?? "");
  return [
    String(row.engine),
    rowFormat.toLowerCase() === defaultRowFormat.toLowerCase()
      ? "DEFAULT"
      : rowFormat,
    tableCollation.toLowerCase() === schemaDefaultCollation.toLowerCase()
      ? "DATABASE_DEFAULT"
      : tableCollation,
    String(row.createOptions ?? "").replace(/\s+/g, " ").trim().toLowerCase(),
  ];
}

export async function inspectRequiredSchema(connection) {
  const [columnRows] = await connection.query(
    "SELECT COLUMN_NAME AS columnName, COLUMN_TYPE AS columnType, IS_NULLABLE AS isNullable, COLUMN_DEFAULT AS columnDefault, EXTRA AS extra FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'event_promotions' ORDER BY ORDINAL_POSITION"
  );
  const [eventIndexRows] = await connection.query(
    "SELECT INDEX_NAME AS indexName, NON_UNIQUE AS nonUnique, SEQ_IN_INDEX AS seqInIndex, COLUMN_NAME AS columnName, SUB_PART AS subPart, COLLATION AS collation, INDEX_TYPE AS indexType, IS_VISIBLE AS isVisible, EXPRESSION AS expression, NULLABLE AS nullable, PACKED AS packed, COMMENT AS comment, INDEX_COMMENT AS indexComment FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'event_promotions' ORDER BY CASE INDEX_NAME WHEN 'PRIMARY' THEN 0 WHEN 'event_promotions_event_idx' THEN 1 WHEN 'event_promotions_status_idx' THEN 2 WHEN 'event_promotions_ends_idx' THEN 3 ELSE 4 END, INDEX_NAME, SEQ_IN_INDEX"
  );
  const [foreignKeyRows] = await connection.query(
    "SELECT kcu.CONSTRAINT_NAME AS constraintName, kcu.COLUMN_NAME AS columnName, kcu.REFERENCED_TABLE_NAME AS referencedTableName, kcu.REFERENCED_COLUMN_NAME AS referencedColumnName, rc.UPDATE_RULE AS updateRule, rc.DELETE_RULE AS deleteRule, rc.MATCH_OPTION AS matchOption, CASE WHEN rc.UNIQUE_CONSTRAINT_SCHEMA = DATABASE() THEN 'DATABASE' ELSE rc.UNIQUE_CONSTRAINT_SCHEMA END AS uniqueConstraintSchema, rc.UNIQUE_CONSTRAINT_NAME AS uniqueConstraintName FROM information_schema.KEY_COLUMN_USAGE kcu JOIN information_schema.REFERENTIAL_CONSTRAINTS rc ON rc.CONSTRAINT_SCHEMA = kcu.CONSTRAINT_SCHEMA AND rc.CONSTRAINT_NAME = kcu.CONSTRAINT_NAME AND rc.TABLE_NAME = kcu.TABLE_NAME WHERE kcu.TABLE_SCHEMA = DATABASE() AND kcu.TABLE_NAME = 'event_promotions' AND kcu.REFERENCED_TABLE_NAME IS NOT NULL ORDER BY kcu.CONSTRAINT_NAME, kcu.ORDINAL_POSITION"
  );
  const [tableConstraintRows] = await connection.query(
    "SELECT tc.CONSTRAINT_NAME AS constraintName, tc.CONSTRAINT_TYPE AS constraintType, cc.CHECK_CLAUSE AS checkClause FROM information_schema.TABLE_CONSTRAINTS tc LEFT JOIN information_schema.CHECK_CONSTRAINTS cc ON cc.CONSTRAINT_SCHEMA = tc.CONSTRAINT_SCHEMA AND cc.CONSTRAINT_NAME = tc.CONSTRAINT_NAME WHERE tc.TABLE_SCHEMA = DATABASE() AND tc.TABLE_NAME = 'event_promotions' ORDER BY tc.CONSTRAINT_NAME"
  );
  const [triggerRows] = await connection.query(
    "SELECT TRIGGER_NAME AS triggerName, ACTION_TIMING AS actionTiming, EVENT_MANIPULATION AS eventManipulation, ACTION_STATEMENT AS actionStatement, ACTION_ORIENTATION AS actionOrientation FROM information_schema.TRIGGERS WHERE TRIGGER_SCHEMA = DATABASE() AND EVENT_OBJECT_TABLE = 'event_promotions' ORDER BY TRIGGER_NAME"
  );
  const [tableOptionRows] = await connection.query(
    "SELECT t.ENGINE AS engine, t.ROW_FORMAT AS rowFormat, t.TABLE_COLLATION AS tableCollation, t.CREATE_OPTIONS AS createOptions, s.DEFAULT_COLLATION_NAME AS schemaDefaultCollation, @@innodb_default_row_format AS defaultRowFormat FROM information_schema.TABLES t JOIN information_schema.SCHEMATA s ON s.SCHEMA_NAME = t.TABLE_SCHEMA WHERE t.TABLE_SCHEMA = DATABASE() AND t.TABLE_NAME = 'event_promotions'"
  );
  const [claimIndexRows] = await connection.query(
    "SELECT INDEX_NAME AS indexName, NON_UNIQUE AS nonUnique, SEQ_IN_INDEX AS seqInIndex, COLUMN_NAME AS columnName, SUB_PART AS subPart, COLLATION AS collation, INDEX_TYPE AS indexType, IS_VISIBLE AS isVisible, EXPRESSION AS expression, NULLABLE AS nullable, PACKED AS packed, COMMENT AS comment, INDEX_COMMENT AS indexComment FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'business_claims' AND INDEX_NAME = ? ORDER BY SEQ_IN_INDEX",
    [BUSINESS_CLAIM_INDEX]
  );

  const descriptor = {
    eventPromotions: {
      columns: columnRows.map(row => [
        String(row.columnName),
        String(row.columnType).toLowerCase(),
        String(row.isNullable),
        normalizeDefault(row.columnDefault),
        normalizeExtra(row.extra),
      ]),
      indexes: normalizeIndexRows(eventIndexRows),
      foreignKeys: foreignKeyRows.map(row => [
        String(row.constraintName),
        String(row.columnName),
        String(row.referencedTableName),
        String(row.referencedColumnName),
        row.updateRule === undefined ? "__MISSING__" : String(row.updateRule),
        row.deleteRule === undefined ? "__MISSING__" : String(row.deleteRule),
        row.matchOption === undefined ? "__MISSING__" : String(row.matchOption),
        row.uniqueConstraintSchema === undefined ? "__MISSING__" : String(row.uniqueConstraintSchema),
        row.uniqueConstraintName === undefined ? "__MISSING__" : String(row.uniqueConstraintName),
      ]),
      tableConstraints: tableConstraintRows.map(row => [
        String(row.constraintName),
        String(row.constraintType),
        row.checkClause === null ? null : String(row.checkClause),
      ]),
      triggers: triggerRows.map(row => [
        String(row.triggerName),
        String(row.actionTiming),
        String(row.eventManipulation),
        String(row.actionStatement),
        String(row.actionOrientation),
      ]),
      tableOptions: normalizeTableOptions(tableOptionRows),
    },
    businessClaimsIdentityIndex: normalizeIndexRows(claimIndexRows),
  };
  return {
    descriptor,
    fingerprint: sha256Json(descriptor),
    exact:
      JSON.stringify(descriptor) === JSON.stringify(REQUIRED_SCHEMA_DESCRIPTOR),
    eventPromotionsExact:
      JSON.stringify(descriptor.eventPromotions) ===
      JSON.stringify(REQUIRED_SCHEMA_DESCRIPTOR.eventPromotions),
    businessClaimsIdentityIndexExact:
      JSON.stringify(descriptor.businessClaimsIdentityIndex) ===
      JSON.stringify(REQUIRED_SCHEMA_DESCRIPTOR.businessClaimsIdentityIndex),
  };
}
