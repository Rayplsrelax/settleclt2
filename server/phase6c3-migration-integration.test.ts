import fs from "node:fs";
import { drizzle } from "drizzle-orm/mysql2";
import { migrate } from "drizzle-orm/mysql2/migrator";
import mysql, { type Connection } from "mysql2/promise";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import {
  buildPhase6c3RecoveryPlan,
  executePhase6c3RecoveryPlan,
  inspectPhase6c3RecoveryState,
} from "./phase6c3-migration-recovery";

const adminUrl = process.env.PHASE6C3_DATABASE_URL;
const databaseName = "settleclt_phase6c3_integration";
const describeWithDatabase = adminUrl ? describe : describe.skip;

function migrationStatements(fileName: string): string[] {
  return fs
    .readFileSync(new URL(`../drizzle/${fileName}`, import.meta.url), "utf8")
    .split("--> statement-breakpoint")
    .map(statement => statement.trim())
    .filter(Boolean);
}

async function applyThrough0017(connection: Connection): Promise<void> {
  const files = fs
    .readdirSync(new URL("../drizzle", import.meta.url))
    .filter(file => /^00(0[0-9]|1[0-7])_.*\.sql$/.test(file))
    .sort();
  for (const file of files) {
    for (const statement of migrationStatements(file)) {
      await connection.query(statement);
    }
  }
}

async function seedApprovedClaim(connection: Connection): Promise<void> {
  await connection.query(
    "INSERT INTO users(id, openId, name, email) VALUES (1, 'phase6c3-user', 'Owner', 'owner@example.test')"
  );
  await connection.query(
    "INSERT INTO business_claims(id, serviceKey, businessName, claimantName, claimantEmail, claimantRole, verificationMethod, userId, status) VALUES (1, 'phase6c3-business', 'Business', 'Owner', 'owner@example.test', 'Owner', 'owner', 1, 'approved')"
  );
}

async function markMigrationsThrough0017(
  connection: Connection
): Promise<void> {
  await connection.query(
    "CREATE TABLE `__drizzle_migrations` (`id` serial PRIMARY KEY, `hash` text NOT NULL, `created_at` bigint)"
  );
  await connection.query(
    "INSERT INTO `__drizzle_migrations` (`hash`, `created_at`) VALUES ('phase6c3-through-0017', 1785111060544)"
  );
}

let admin: Connection | undefined;
let connection: Connection | undefined;

describeWithDatabase("Phase 6C3 migration recovery on MySQL", () => {
  beforeEach(async () => {
    await connection?.end();
    await admin?.end();
    admin = await mysql.createConnection(adminUrl!);
    await admin.query(`DROP DATABASE IF EXISTS \`${databaseName}\``);
    await admin.query(
      `CREATE DATABASE \`${databaseName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci`
    );
    const url = new URL(adminUrl!);
    url.pathname = `/${databaseName}`;
    connection = await mysql.createConnection(url.toString());
    await applyThrough0017(connection);
  }, 60_000);

  afterAll(async () => {
    await connection?.end();
    if (admin) {
      await admin.query(`DROP DATABASE IF EXISTS \`${databaseName}\``);
      await admin.end();
    }
  });

  it(
    "cleans a deterministic post-backfill partial state and permits a successful retry",
    { timeout: 60000 },
    async () => {
      await seedApprovedClaim(connection!);
      const statements = migrationStatements("0018_fearless_bedlam.sql");
      for (const statement of statements.slice(0, 11)) {
        await connection!.query(statement);
      }

      const state = await inspectPhase6c3RecoveryState(connection!);
      const plan = buildPhase6c3RecoveryPlan(state);
      expect(plan).toMatchObject({
        status: "recoverable",
        actions: [{ kind: "drop-table", name: "business_memberships" }],
      });

      await executePhase6c3RecoveryPlan(connection!, plan);
      expect(await inspectPhase6c3RecoveryState(connection!)).toMatchObject({
        migrationRecorded: false,
        businessMemberships: { exists: false },
        stripeReconciliations: { exists: false },
        premiumIndexes: [],
      });

      for (const statement of statements) {
        await connection!.query(statement);
      }
      const [rows] = await connection!.query(
        "SELECT serviceKey, userId, ownerClaimId, role, status FROM business_memberships"
      );
      expect(rows).toEqual([
        {
          serviceKey: "phase6c3-business",
          userId: 1,
          ownerClaimId: 1,
          role: "owner",
          status: "active",
        },
      ]);
    }
  );

  it.each([
    [10, "membership table creation"],
    [12, "service-key index creation"],
    [13, "Stripe-customer index creation"],
    [14, "Stripe-subscription index creation"],
    [15, "reconciliation table creation"],
  ] as const)(
    "recovers an interruption after statement %i (%s)",
    { timeout: 60000 },
    async statementCount => {
      await seedApprovedClaim(connection!);
      const statements = migrationStatements("0018_fearless_bedlam.sql");
      for (const statement of statements.slice(0, statementCount)) {
        await connection!.query(statement);
      }

      const state = await inspectPhase6c3RecoveryState(connection!);
      const plan = buildPhase6c3RecoveryPlan(state);
      expect(plan.status).toBe("recoverable");
      await executePhase6c3RecoveryPlan(connection!, plan);
      expect(
        buildPhase6c3RecoveryPlan(
          await inspectPhase6c3RecoveryState(connection!)
        )
      ).toEqual({
        status: "ready",
        actions: [],
        reasons: [],
      });

      for (const statement of statements) {
        await connection!.query(statement);
      }
      expect(await inspectPhase6c3RecoveryState(connection!)).toMatchObject({
        artifactMismatches: [],
        businessMemberships: {
          exists: true,
          rowCount: 1,
          unexpectedRowCount: 0,
        },
        stripeReconciliations: { exists: true, rowCount: 0 },
      });
    }
  );

  it(
    "resumes recovery safely after the cleanup itself is interrupted",
    { timeout: 60000 },
    async () => {
      await seedApprovedClaim(connection!);
      const statements = migrationStatements("0018_fearless_bedlam.sql");
      for (const statement of statements) {
        await connection!.query(statement);
      }

      const initialPlan = buildPhase6c3RecoveryPlan(
        await inspectPhase6c3RecoveryState(connection!)
      );
      expect(initialPlan.status).toBe("recoverable");
      await executePhase6c3RecoveryPlan(connection!, {
        ...initialPlan,
        actions: initialPlan.actions.slice(0, 2),
      });

      const resumedPlan = buildPhase6c3RecoveryPlan(
        await inspectPhase6c3RecoveryState(connection!)
      );
      expect(resumedPlan).toEqual({
        status: "recoverable",
        actions: [
          {
            kind: "drop-index",
            name: "premium_listings_stripe_customer_unique",
          },
          { kind: "drop-index", name: "premium_listings_service_key_unique" },
          { kind: "drop-table", name: "business_memberships" },
        ],
        reasons: [],
      });
      await executePhase6c3RecoveryPlan(connection!, resumedPlan);

      for (const statement of statements) {
        await connection!.query(statement);
      }
      expect(await inspectPhase6c3RecoveryState(connection!)).toMatchObject({
        businessMemberships: {
          exists: true,
          rowCount: 1,
          unexpectedRowCount: 0,
        },
        stripeReconciliations: { exists: true, rowCount: 0 },
        premiumIndexes: expect.arrayContaining([
          "premium_listings_service_key_unique",
          "premium_listings_stripe_customer_unique",
          "premium_listings_stripe_subscription_unique",
        ]),
      });
    }
  );

  it("blocks recovery rather than deleting a membership created after partial migration", async () => {
    await seedApprovedClaim(connection!);
    const statements = migrationStatements("0018_fearless_bedlam.sql");
    for (const statement of statements.slice(0, 11)) {
      await connection!.query(statement);
    }
    await connection!.query(
      "INSERT INTO business_memberships(serviceKey, userId, ownerClaimId, activeOwnerKey, role, status, createdBy) VALUES ('delegated-business', 99, NULL, NULL, 'manager', 'active', 1)"
    );

    const plan = buildPhase6c3RecoveryPlan(
      await inspectPhase6c3RecoveryState(connection!)
    );
    expect(plan).toEqual({
      status: "blocked",
      actions: [],
      reasons: ["business_memberships contains 1 non-backfill row"],
    });
    await expect(
      executePhase6c3RecoveryPlan(connection!, plan)
    ).rejects.toThrow("business_memberships contains 1 non-backfill row");
    expect(await inspectPhase6c3RecoveryState(connection!)).toMatchObject({
      businessMemberships: { exists: true, rowCount: 2, unexpectedRowCount: 1 },
    });
  });

  it("blocks recovery when a backfill-shaped owner has a null active-owner key", async () => {
    await seedApprovedClaim(connection!);
    const statements = migrationStatements("0018_fearless_bedlam.sql");
    for (const statement of statements.slice(0, 11)) {
      await connection!.query(statement);
    }
    await connection!.query(
      "UPDATE business_memberships SET activeOwnerKey = NULL WHERE serviceKey = 'phase6c3-business'"
    );

    const state = await inspectPhase6c3RecoveryState(connection!);
    expect(state.businessMemberships).toEqual({
      exists: true,
      rowCount: 1,
      unexpectedRowCount: 1,
    });
    expect(buildPhase6c3RecoveryPlan(state)).toEqual({
      status: "blocked",
      actions: [],
      reasons: ["business_memberships contains 1 non-backfill row"],
    });
  });

  it("blocks recovery when a backfill-shaped active owner has a revocation timestamp", async () => {
    await seedApprovedClaim(connection!);
    const statements = migrationStatements("0018_fearless_bedlam.sql");
    for (const statement of statements.slice(0, 11)) {
      await connection!.query(statement);
    }
    await connection!.query(
      "UPDATE business_memberships SET revokedAt = CURRENT_TIMESTAMP WHERE serviceKey = 'phase6c3-business'"
    );

    const state = await inspectPhase6c3RecoveryState(connection!);
    expect(state.businessMemberships.unexpectedRowCount).toBe(1);
    expect(buildPhase6c3RecoveryPlan(state)).toMatchObject({
      status: "blocked",
      actions: [],
      reasons: ["business_memberships contains 1 non-backfill row"],
    });
  });

  it("blocks recovery when a migration-owned table has an unexpected structure", async () => {
    const statements = migrationStatements("0018_fearless_bedlam.sql");
    for (const statement of statements.slice(0, 10)) {
      await connection!.query(statement);
    }
    await connection!.query(
      "ALTER TABLE business_memberships ADD COLUMN manualNote text"
    );

    const state = await inspectPhase6c3RecoveryState(connection!);
    expect(state.artifactMismatches).toContain(
      "business_memberships definition does not match migration 0018"
    );
    expect(buildPhase6c3RecoveryPlan(state)).toMatchObject({
      status: "blocked",
      actions: [],
    });
  });

  it("blocks recovery when a migration-owned table has an unexpected trigger", async () => {
    const statements = migrationStatements("0018_fearless_bedlam.sql");
    for (const statement of statements.slice(0, 10)) {
      await connection!.query(statement);
    }
    await connection!.query(
      "CREATE TRIGGER phase6c3_manual_membership_trigger BEFORE INSERT ON business_memberships FOR EACH ROW SET NEW.status = NEW.status"
    );

    const state = await inspectPhase6c3RecoveryState(connection!);
    expect(state.artifactMismatches).toContain(
      "business_memberships definition does not match migration 0018"
    );
    expect(buildPhase6c3RecoveryPlan(state)).toMatchObject({
      status: "blocked",
      actions: [],
    });
  });

  it("blocks recovery when a migration-owned table has a prefix index", async () => {
    const statements = migrationStatements("0018_fearless_bedlam.sql");
    for (const statement of statements.slice(0, 10)) {
      await connection!.query(statement);
    }
    await connection!.query(
      "ALTER TABLE business_memberships DROP INDEX business_memberships_active_owner_unique"
    );
    await connection!.query(
      "CREATE UNIQUE INDEX business_memberships_active_owner_unique ON business_memberships(activeOwnerKey(10))"
    );

    const state = await inspectPhase6c3RecoveryState(connection!);
    expect(state.artifactMismatches).toContain(
      "business_memberships definition does not match migration 0018"
    );
    expect(buildPhase6c3RecoveryPlan(state)).toMatchObject({
      status: "blocked",
      actions: [],
    });
  });

  it("blocks recovery when a named premium index has the wrong definition", async () => {
    await connection!.query(
      "CREATE INDEX premium_listings_service_key_unique ON premium_listings(tier)"
    );

    const state = await inspectPhase6c3RecoveryState(connection!);
    expect(state.artifactMismatches).toContain(
      "premium_listings_service_key_unique definition does not match migration 0018"
    );
    expect(buildPhase6c3RecoveryPlan(state)).toMatchObject({
      status: "blocked",
      actions: [],
    });
  });

  it("blocks recovery when a named premium index is only a column prefix", async () => {
    await connection!.query(
      "CREATE UNIQUE INDEX premium_listings_service_key_unique ON premium_listings(serviceKey(10))"
    );

    const state = await inspectPhase6c3RecoveryState(connection!);
    expect(state.artifactMismatches).toContain(
      "premium_listings_service_key_unique definition does not match migration 0018"
    );
    expect(buildPhase6c3RecoveryPlan(state)).toMatchObject({
      status: "blocked",
      actions: [],
    });
  });

  it("blocks recovery when the reconciliation table has an unexpected structure", async () => {
    for (const statement of migrationStatements("0018_fearless_bedlam.sql")) {
      await connection!.query(statement);
    }
    await connection!.query(
      "ALTER TABLE stripe_checkout_reconciliations ADD COLUMN manualNote text"
    );

    const state = await inspectPhase6c3RecoveryState(connection!);
    expect(state.artifactMismatches).toContain(
      "stripe_checkout_reconciliations definition does not match migration 0018"
    );
    expect(buildPhase6c3RecoveryPlan(state)).toMatchObject({
      status: "blocked",
      actions: [],
    });
  });

  it("blocks recovery rather than deleting a durable reconciliation audit row", async () => {
    await seedApprovedClaim(connection!);
    for (const statement of migrationStatements("0018_fearless_bedlam.sql")) {
      await connection!.query(statement);
    }
    await connection!.query(
      "INSERT INTO stripe_checkout_reconciliations(stripeEventId, checkoutSessionId, stripeSubscriptionId, reason) VALUES ('evt_partial', 'cs_partial', 'sub_partial', 'ownership_changed')"
    );

    const plan = buildPhase6c3RecoveryPlan(
      await inspectPhase6c3RecoveryState(connection!)
    );
    expect(plan).toEqual({
      status: "blocked",
      actions: [],
      reasons: ["stripe_checkout_reconciliations contains 1 row"],
    });
    await expect(
      executePhase6c3RecoveryPlan(connection!, plan)
    ).rejects.toThrow("stripe_checkout_reconciliations contains 1 row");
    expect(await inspectPhase6c3RecoveryState(connection!)).toMatchObject({
      stripeReconciliations: { exists: true, rowCount: 1 },
    });
  });

  it(
    "revalidates immediately before cleanup when state changes after planning",
    { timeout: 60000 },
    async () => {
      for (const statement of migrationStatements("0018_fearless_bedlam.sql")) {
        await connection!.query(statement);
      }
      const stalePlan = buildPhase6c3RecoveryPlan(
        await inspectPhase6c3RecoveryState(connection!)
      );
      expect(stalePlan.status).toBe("recoverable");

      await connection!.query(
        "INSERT INTO stripe_checkout_reconciliations(stripeEventId, checkoutSessionId, stripeSubscriptionId, reason) VALUES ('evt-after-plan', 'cs-after-plan', 'sub-after-plan', 'test')"
      );

      await expect(
        executePhase6c3RecoveryPlan(connection!, stalePlan)
      ).rejects.toThrow("recovery state changed after planning");
      expect(await inspectPhase6c3RecoveryState(connection!)).toMatchObject({
        stripeReconciliations: { exists: true, rowCount: 1 },
      });
    }
  );

  it(
    "applies and journals 0018 through the real Drizzle runner, then reruns as a no-op",
    { timeout: 60000 },
    async () => {
      await seedApprovedClaim(connection!);
      await connection!.query(
        "INSERT INTO business_claims(serviceKey, businessName, claimantName, claimantEmail, claimantRole, verificationMethod, userId, status) VALUES ('pending-business', 'Pending', 'Owner', 'pending@example.test', 'Owner', 'owner', 1, 'pending'), ('unbound-business', 'Unbound', 'Owner', 'unbound@example.test', 'Owner', 'owner', NULL, 'approved')"
      );
      await markMigrationsThrough0017(connection!);

      const db = drizzle(connection!);
      await migrate(db, { migrationsFolder: "drizzle" });
      expect(
        buildPhase6c3RecoveryPlan(
          await inspectPhase6c3RecoveryState(connection!)
        )
      ).toEqual({
        status: "already-applied",
        actions: [],
        reasons: [],
      });
      const [memberships] = await connection!.query(
        "SELECT serviceKey, userId, ownerClaimId, role, status FROM business_memberships"
      );
      expect(memberships).toEqual([
        {
          serviceKey: "phase6c3-business",
          userId: 1,
          ownerClaimId: 1,
          role: "owner",
          status: "active",
        },
      ]);

      await expect(
        migrate(db, { migrationsFolder: "drizzle" })
      ).resolves.toBeUndefined();
      const [journal] = await connection!.query(
        "SELECT COUNT(*) AS count FROM __drizzle_migrations WHERE created_at >= 1785619131415"
      );
      expect(journal).toEqual([{ count: 1 }]);
    }
  );

  it("fails owner-conflict preflight before creating any permanent Phase 6C3 artifact", async () => {
    await connection!.query(
      "INSERT INTO users(id, openId) VALUES (1, 'conflict-user-1'), (2, 'conflict-user-2')"
    );
    await connection!.query(
      "INSERT INTO business_claims(serviceKey, businessName, claimantName, claimantEmail, claimantRole, verificationMethod, userId, status) VALUES ('conflict-business', 'Business', 'One', 'one@example.test', 'Owner', 'owner', 1, 'approved'), ('conflict-business', 'Business', 'Two', 'two@example.test', 'Owner', 'owner', 2, 'approved')"
    );

    const statements = migrationStatements("0018_fearless_bedlam.sql");
    await expect(connection!.query(statements[0])).resolves.toBeDefined();
    await expect(connection!.query(statements[1])).rejects.toMatchObject({
      code: "ER_DUP_ENTRY",
    });

    expect(await inspectPhase6c3RecoveryState(connection!)).toMatchObject({
      migrationRecorded: false,
      businessMemberships: { exists: false },
      stripeReconciliations: { exists: false },
      premiumIndexes: [],
    });
  });

  it.each([
    {
      conflict: "service key",
      rows: "('duplicate-service', 'basic', NULL, NULL), ('duplicate-service', 'premium', NULL, NULL)",
      failedStatementIndex: 5,
    },
    {
      conflict: "Stripe customer",
      rows: "('service-one', 'premium', 'duplicate-customer', NULL), ('service-two', 'premium', 'duplicate-customer', NULL)",
      failedStatementIndex: 6,
    },
    {
      conflict: "Stripe subscription",
      rows: "('service-one', 'premium', NULL, 'duplicate-subscription'), ('service-two', 'premium', NULL, 'duplicate-subscription')",
      failedStatementIndex: 7,
    },
  ])(
    "fails $conflict preflight before creating permanent Phase 6C3 artifacts",
    async ({ rows, failedStatementIndex }) => {
      await connection!.query(
        `INSERT INTO premium_listings(serviceKey, tier, stripeCustomerId, stripeSubscriptionId) VALUES ${rows}`
      );
      const statements = migrationStatements("0018_fearless_bedlam.sql");
      for (const statement of statements.slice(0, failedStatementIndex)) {
        await connection!.query(statement);
      }
      await expect(
        connection!.query(statements[failedStatementIndex])
      ).rejects.toMatchObject({
        code: "ER_DUP_ENTRY",
      });
      expect(await inspectPhase6c3RecoveryState(connection!)).toMatchObject({
        migrationRecorded: false,
        businessMemberships: { exists: false },
        stripeReconciliations: { exists: false },
        premiumIndexes: [],
      });
    }
  );
});
