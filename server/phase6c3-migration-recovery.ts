import type { Connection, RowDataPacket } from "mysql2/promise";

export const PHASE6C3_PREMIUM_INDEXES = [
  "premium_listings_service_key_unique",
  "premium_listings_stripe_customer_unique",
  "premium_listings_stripe_subscription_unique",
] as const;

function expectedIndexSignature(
  name: string,
  columns: ReadonlyArray<readonly [name: string, nullable: boolean]>
): string {
  return JSON.stringify({
    name,
    nonUnique: 0,
    indexType: "BTREE",
    visible: "YES",
    comment: "",
    indexComment: "",
    parts: columns.map(([column, nullable]) => ({
      column,
      subPart: null,
      expression: null,
      collation: "A",
      packed: null,
      nullable: nullable ? "YES" : "",
    })),
  });
}

const EXPECTED_PREMIUM_INDEX_SIGNATURES: Record<
  (typeof PHASE6C3_PREMIUM_INDEXES)[number],
  string
> = {
  premium_listings_service_key_unique: expectedIndexSignature(
    "premium_listings_service_key_unique",
    [["serviceKey", false]]
  ),
  premium_listings_stripe_customer_unique: expectedIndexSignature(
    "premium_listings_stripe_customer_unique",
    [["stripeCustomerId", true]]
  ),
  premium_listings_stripe_subscription_unique: expectedIndexSignature(
    "premium_listings_stripe_subscription_unique",
    [["stripeSubscriptionId", true]]
  ),
};

export type Phase6c3RecoveryState = {
  migrationRecorded: boolean;
  artifactMismatches: string[];
  businessMemberships: {
    exists: boolean;
    rowCount: number;
    unexpectedRowCount: number;
  };
  stripeReconciliations: {
    exists: boolean;
    rowCount: number;
  };
  premiumIndexes: string[];
};

export type Phase6c3RecoveryAction =
  | {
      kind: "drop-table";
      name: "business_memberships" | "stripe_checkout_reconciliations";
    }
  | { kind: "drop-index"; name: (typeof PHASE6C3_PREMIUM_INDEXES)[number] };

export type Phase6c3RecoveryPlan = {
  status: "already-applied" | "ready" | "recoverable" | "blocked";
  actions: Phase6c3RecoveryAction[];
  reasons: string[];
};

export type Phase6c3ApplyConfirmation = {
  confirmedDatabase: string | undefined;
  confirmedMigration: string | undefined;
  writeQuiescenceConfirmed: boolean;
};

export function validatePhase6c3ApplyConfirmation(
  databaseName: string,
  confirmation: Phase6c3ApplyConfirmation
): void {
  if (confirmation.confirmedDatabase !== databaseName) {
    throw new Error(
      "Phase 6C3 database confirmation does not match the connected database"
    );
  }
  if (confirmation.confirmedMigration !== "0018_fearless_bedlam") {
    throw new Error(
      "Phase 6C3 migration confirmation must equal 0018_fearless_bedlam"
    );
  }
  if (!confirmation.writeQuiescenceConfirmed) {
    throw new Error("Phase 6C3 write quiescence must be confirmed");
  }
}

const PHASE6C3_MIGRATION_TIMESTAMP = 1785619131415;

type CountRow = RowDataPacket & { count: number };

async function tableExists(
  connection: Connection,
  name: string
): Promise<boolean> {
  const [rows] = await connection.query<CountRow[]>(
    "SELECT COUNT(*) AS count FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_TYPE = 'BASE TABLE' AND TABLE_NAME = ?",
    [name]
  );
  return Number(rows[0]?.count ?? 0) === 1;
}

async function tableRowCount(
  connection: Connection,
  table: string
): Promise<number> {
  const allowedTables = new Set([
    "business_memberships",
    "stripe_checkout_reconciliations",
  ]);
  if (!allowedTables.has(table))
    throw new Error(`Unsupported Phase 6C3 table: ${table}`);
  const [rows] = await connection.query<CountRow[]>(
    `SELECT COUNT(*) AS count FROM \`${table}\``
  );
  return Number(rows[0]?.count ?? 0);
}

type ColumnMetadataRow = RowDataPacket & {
  COLUMN_NAME: string;
  COLUMN_TYPE: string;
  IS_NULLABLE: "YES" | "NO";
  COLUMN_DEFAULT: string | number | null;
  EXTRA: string;
};

type IndexMetadataRow = RowDataPacket & {
  INDEX_NAME: string;
  NON_UNIQUE: number;
  SEQ_IN_INDEX: number;
  COLUMN_NAME: string | null;
  SUB_PART: number | null;
  EXPRESSION: string | null;
  COLLATION: string | null;
  PACKED: string | null;
  NULLABLE: string;
  INDEX_TYPE: string;
  IS_VISIBLE: string;
  COMMENT: string;
  INDEX_COMMENT: string;
};

type ConstraintMetadataRow = RowDataPacket & {
  CONSTRAINT_NAME: string;
  CONSTRAINT_TYPE: string;
};

const EXPECTED_TABLE_DEFINITIONS = {
  business_memberships: {
    columns: [
      "id|int|NO|<null>|auto_increment|",
      "serviceKey|varchar(255)|NO|<null>||",
      "userId|int|NO|<null>||",
      "ownerClaimId|int|YES|<null>||",
      "activeOwnerKey|varchar(255)|YES|<null>||",
      "role|enum('owner','manager','editor','viewer')|NO|<null>||",
      "status|enum('active','revoked')|NO|active||",
      "createdBy|int|NO|<null>||",
      "createdAt|timestamp|NO|current_timestamp||",
      "updatedAt|timestamp|NO|current_timestamp||on_update_current_timestamp",
      "revokedAt|timestamp|YES|<null>||",
    ],
    indexes: [
      expectedIndexSignature("PRIMARY", [["id", false]]),
      expectedIndexSignature("business_memberships_active_owner_unique", [
        ["activeOwnerKey", true],
      ]),
      expectedIndexSignature("business_memberships_service_user_unique", [
        ["serviceKey", false],
        ["userId", false],
      ]),
    ],
    constraints: [
      "PRIMARY|PRIMARY KEY",
      "business_memberships_active_owner_unique|UNIQUE",
      "business_memberships_service_user_unique|UNIQUE",
    ],
  },
  stripe_checkout_reconciliations: {
    columns: [
      "id|int|NO|<null>|auto_increment|",
      "stripeEventId|varchar(255)|NO|<null>||",
      "checkoutSessionId|varchar(255)|NO|<null>||",
      "stripeSubscriptionId|varchar(255)|NO|<null>||",
      "stripeCustomerId|varchar(255)|YES|<null>||",
      "serviceKey|varchar(255)|YES|<null>||",
      "claimId|int|YES|<null>||",
      "reason|varchar(64)|NO|<null>||",
      "status|enum('pending','succeeded','failed')|NO|pending||",
      "attemptCount|int|NO|1||",
      "leaseToken|varchar(64)|YES|<null>||",
      "leaseExpiresAt|timestamp|YES|<null>||",
      "lastError|text|YES|<null>||",
      "completedAt|timestamp|YES|<null>||",
      "createdAt|timestamp|NO|current_timestamp||",
      "updatedAt|timestamp|NO|current_timestamp||on_update_current_timestamp",
    ],
    indexes: [
      expectedIndexSignature("PRIMARY", [["id", false]]),
      expectedIndexSignature("stripe_checkout_reconciliations_event_unique", [
        ["stripeEventId", false],
      ]),
      expectedIndexSignature("stripe_checkout_reconciliations_session_unique", [
        ["checkoutSessionId", false],
      ]),
    ],
    constraints: [
      "PRIMARY|PRIMARY KEY",
      "stripe_checkout_reconciliations_event_unique|UNIQUE",
      "stripe_checkout_reconciliations_session_unique|UNIQUE",
    ],
  },
} as const;

function normalizeColumnDefault(value: string | number | null): string {
  if (value === null) return "<null>";
  const normalized = String(value).toLowerCase();
  return normalized === "now()" || normalized === "current_timestamp()"
    ? "current_timestamp"
    : normalized;
}

function columnSignature(row: ColumnMetadataRow): string {
  const extra = row.EXTRA.toLowerCase();
  return [
    row.COLUMN_NAME,
    row.COLUMN_TYPE.toLowerCase(),
    row.IS_NULLABLE,
    normalizeColumnDefault(row.COLUMN_DEFAULT),
    extra.includes("auto_increment") ? "auto_increment" : "",
    extra.includes("on update current_timestamp")
      ? "on_update_current_timestamp"
      : "",
  ].join("|");
}

function indexSignatures(rows: IndexMetadataRow[]): string[] {
  const indexes = new Map<
    string,
    {
      nonUnique: number;
      indexType: string;
      visible: string;
      comment: string;
      indexComment: string;
      parts: Array<{
        column: string | null;
        subPart: number | null;
        expression: string | null;
        collation: string | null;
        packed: string | null;
        nullable: string;
      }>;
    }
  >();
  for (const row of rows) {
    const index = indexes.get(row.INDEX_NAME) ?? {
      nonUnique: row.NON_UNIQUE,
      indexType: row.INDEX_TYPE,
      visible: row.IS_VISIBLE,
      comment: row.COMMENT,
      indexComment: row.INDEX_COMMENT,
      parts: [],
    };
    index.parts[row.SEQ_IN_INDEX - 1] = {
      column: row.COLUMN_NAME,
      subPart: row.SUB_PART,
      expression: row.EXPRESSION,
      collation: row.COLLATION,
      packed: row.PACKED,
      nullable: row.NULLABLE,
    };
    indexes.set(row.INDEX_NAME, index);
  }
  return Array.from(indexes.entries())
    .map(([name, index]) => JSON.stringify({ name, ...index }))
    .sort();
}

function sameStrings(actual: string[], expected: readonly string[]): boolean {
  return (
    actual.length === expected.length &&
    actual.every((value, index) => value === expected[index])
  );
}

async function tableDefinitionMatches(
  connection: Connection,
  table: keyof typeof EXPECTED_TABLE_DEFINITIONS
): Promise<boolean> {
  const [columns] = await connection.query<ColumnMetadataRow[]>(
    "SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT, EXTRA FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? ORDER BY ORDINAL_POSITION",
    [table]
  );
  const [indexes] = await connection.query<IndexMetadataRow[]>(
    "SELECT INDEX_NAME, NON_UNIQUE, SEQ_IN_INDEX, COLUMN_NAME, SUB_PART, EXPRESSION, COLLATION, PACKED, NULLABLE, INDEX_TYPE, IS_VISIBLE, COMMENT, INDEX_COMMENT FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? ORDER BY INDEX_NAME, SEQ_IN_INDEX",
    [table]
  );
  const [constraints] = await connection.query<ConstraintMetadataRow[]>(
    "SELECT CONSTRAINT_NAME, CONSTRAINT_TYPE FROM information_schema.TABLE_CONSTRAINTS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? ORDER BY CONSTRAINT_NAME",
    [table]
  );
  const [triggers] = await connection.query<CountRow[]>(
    "SELECT COUNT(*) AS count FROM information_schema.TRIGGERS WHERE TRIGGER_SCHEMA = DATABASE() AND EVENT_OBJECT_TABLE = ?",
    [table]
  );
  const expected = EXPECTED_TABLE_DEFINITIONS[table];
  return (
    sameStrings(columns.map(columnSignature), expected.columns) &&
    sameStrings(indexSignatures(indexes), [...expected.indexes].sort()) &&
    sameStrings(
      constraints
        .map(row => `${row.CONSTRAINT_NAME}|${row.CONSTRAINT_TYPE}`)
        .sort(),
      [...expected.constraints].sort()
    ) &&
    Number(triggers[0]?.count ?? 0) === 0
  );
}

export async function inspectPhase6c3RecoveryState(
  connection: Connection
): Promise<Phase6c3RecoveryState> {
  const journalExists = await tableExists(connection, "__drizzle_migrations");
  let migrationRecorded = false;
  if (journalExists) {
    const [rows] = await connection.query<CountRow[]>(
      "SELECT COUNT(*) AS count FROM `__drizzle_migrations` WHERE `created_at` >= ?",
      [PHASE6C3_MIGRATION_TIMESTAMP]
    );
    migrationRecorded = Number(rows[0]?.count ?? 0) > 0;
  }

  const artifactMismatches: string[] = [];

  const membershipsExist = await tableExists(
    connection,
    "business_memberships"
  );
  const membershipsMatch = membershipsExist
    ? await tableDefinitionMatches(connection, "business_memberships")
    : false;
  if (membershipsExist && !membershipsMatch) {
    artifactMismatches.push(
      "business_memberships definition does not match migration 0018"
    );
  }
  let membershipRowCount = 0;
  let unexpectedRowCount = 0;
  if (membershipsExist) {
    membershipRowCount = await tableRowCount(
      connection,
      "business_memberships"
    );
    if (membershipsMatch) {
      const [rows] = await connection.query<CountRow[]>(`
      SELECT COUNT(*) AS count
      FROM \`business_memberships\` AS membership
      LEFT JOIN \`business_claims\` AS claim
        ON claim.id = membership.ownerClaimId
       AND claim.serviceKey = membership.serviceKey
       AND claim.userId = membership.userId
       AND claim.status = 'approved'
      WHERE claim.id IS NULL
         OR NOT (membership.activeOwnerKey <=> membership.serviceKey)
         OR membership.role <> 'owner'
         OR membership.status <> 'active'
         OR membership.createdBy <> membership.userId
         OR membership.revokedAt IS NOT NULL
    `);
      unexpectedRowCount = Number(rows[0]?.count ?? 0);
    }
  }

  const reconciliationsExist = await tableExists(
    connection,
    "stripe_checkout_reconciliations"
  );
  if (
    reconciliationsExist &&
    !(await tableDefinitionMatches(
      connection,
      "stripe_checkout_reconciliations"
    ))
  ) {
    artifactMismatches.push(
      "stripe_checkout_reconciliations definition does not match migration 0018"
    );
  }
  const reconciliationRowCount = reconciliationsExist
    ? await tableRowCount(connection, "stripe_checkout_reconciliations")
    : 0;

  const [indexRows] = await connection.query<IndexMetadataRow[]>(
    "SELECT INDEX_NAME, NON_UNIQUE, SEQ_IN_INDEX, COLUMN_NAME, SUB_PART, EXPRESSION, COLLATION, PACKED, NULLABLE, INDEX_TYPE, IS_VISIBLE, COMMENT, INDEX_COMMENT FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'premium_listings' AND INDEX_NAME IN (?, ?, ?) ORDER BY INDEX_NAME, SEQ_IN_INDEX",
    [...PHASE6C3_PREMIUM_INDEXES]
  );
  const premiumIndexes = Array.from(
    new Set(indexRows.map(row => row.INDEX_NAME))
  );
  for (const name of PHASE6C3_PREMIUM_INDEXES) {
    const rows = indexRows.filter(row => row.INDEX_NAME === name);
    if (
      rows.length > 0 &&
      !sameStrings(indexSignatures(rows), [
        EXPECTED_PREMIUM_INDEX_SIGNATURES[name],
      ])
    ) {
      artifactMismatches.push(
        `${name} definition does not match migration 0018`
      );
    }
  }

  return {
    migrationRecorded,
    artifactMismatches,
    businessMemberships: {
      exists: membershipsExist,
      rowCount: membershipRowCount,
      unexpectedRowCount,
    },
    stripeReconciliations: {
      exists: reconciliationsExist,
      rowCount: reconciliationRowCount,
    },
    premiumIndexes,
  };
}

export async function executePhase6c3RecoveryPlan(
  connection: Connection,
  plan: Phase6c3RecoveryPlan
): Promise<void> {
  if (plan.status === "blocked") {
    throw new Error(
      `Phase 6C3 recovery is blocked: ${plan.reasons.join("; ")}`
    );
  }
  if (plan.status !== "recoverable") return;

  for (const action of plan.actions) {
    const currentPlan = buildPhase6c3RecoveryPlan(
      await inspectPhase6c3RecoveryState(connection)
    );
    const currentAction = currentPlan.actions[0];
    if (
      currentPlan.status !== "recoverable" ||
      currentAction?.kind !== action.kind ||
      currentAction?.name !== action.name
    ) {
      const detail = currentPlan.reasons.length
        ? `: ${currentPlan.reasons.join("; ")}`
        : "";
      throw new Error(
        `Phase 6C3 recovery state changed after planning${detail}`
      );
    }
    if (action.kind === "drop-index") {
      if (
        !(PHASE6C3_PREMIUM_INDEXES as readonly string[]).includes(action.name)
      ) {
        throw new Error(`Unsupported Phase 6C3 index: ${action.name}`);
      }
      await connection.query(
        `ALTER TABLE \`premium_listings\` DROP INDEX \`${action.name}\``
      );
      continue;
    }
    if (
      action.name !== "business_memberships" &&
      action.name !== "stripe_checkout_reconciliations"
    ) {
      throw new Error(`Unsupported Phase 6C3 table: ${action.name}`);
    }
    await connection.query(`DROP TABLE \`${action.name}\``);
  }
}

function countLabel(count: number, singular: string): string {
  return `${count} ${count === 1 ? singular : `${singular}s`}`;
}

export function buildPhase6c3RecoveryPlan(
  state: Phase6c3RecoveryState
): Phase6c3RecoveryPlan {
  if (state.migrationRecorded) {
    const reasons = [...state.artifactMismatches];
    if (!state.businessMemberships.exists) {
      reasons.push(
        "migration journal records 0018 but business_memberships is missing"
      );
    }
    if (!state.stripeReconciliations.exists) {
      reasons.push(
        "migration journal records 0018 but stripe_checkout_reconciliations is missing"
      );
    }
    for (const index of PHASE6C3_PREMIUM_INDEXES) {
      if (!state.premiumIndexes.includes(index)) {
        reasons.push(`migration journal records 0018 but ${index} is missing`);
      }
    }
    if (reasons.length > 0) {
      return { status: "blocked", actions: [], reasons };
    }
    return { status: "already-applied", actions: [], reasons: [] };
  }

  const reasons: string[] = [...state.artifactMismatches];
  if (state.businessMemberships.unexpectedRowCount > 0) {
    reasons.push(
      `business_memberships contains ${countLabel(
        state.businessMemberships.unexpectedRowCount,
        "non-backfill row"
      )}`
    );
  }
  if (state.stripeReconciliations.rowCount > 0) {
    reasons.push(
      `stripe_checkout_reconciliations contains ${countLabel(
        state.stripeReconciliations.rowCount,
        "row"
      )}`
    );
  }
  if (reasons.length > 0) {
    return { status: "blocked", actions: [], reasons };
  }

  const actions: Phase6c3RecoveryAction[] = [];
  if (state.stripeReconciliations.exists) {
    actions.push({
      kind: "drop-table",
      name: "stripe_checkout_reconciliations",
    });
  }
  for (const name of [...PHASE6C3_PREMIUM_INDEXES].reverse()) {
    if (state.premiumIndexes.includes(name)) {
      actions.push({ kind: "drop-index", name });
    }
  }
  if (state.businessMemberships.exists) {
    actions.push({ kind: "drop-table", name: "business_memberships" });
  }

  return {
    status: actions.length > 0 ? "recoverable" : "ready",
    actions,
    reasons: [],
  };
}
