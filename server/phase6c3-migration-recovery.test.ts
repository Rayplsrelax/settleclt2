import { describe, expect, it } from "vitest";
import {
  buildPhase6c3RecoveryPlan,
  validatePhase6c3ApplyConfirmation,
} from "./phase6c3-migration-recovery";

const completePartialState = {
  migrationRecorded: false,
  artifactMismatches: [],
  businessMemberships: { exists: true, rowCount: 1, unexpectedRowCount: 0 },
  stripeReconciliations: { exists: true, rowCount: 0 },
  premiumIndexes: [
    "premium_listings_service_key_unique",
    "premium_listings_stripe_customer_unique",
    "premium_listings_stripe_subscription_unique",
  ],
};

describe("Phase 6C3 migration recovery planning", () => {
  it("cleans deterministic partial artifacts in reverse creation order", () => {
    expect(buildPhase6c3RecoveryPlan(completePartialState)).toEqual({
      status: "recoverable",
      actions: [
        { kind: "drop-table", name: "stripe_checkout_reconciliations" },
        {
          kind: "drop-index",
          name: "premium_listings_stripe_subscription_unique",
        },
        { kind: "drop-index", name: "premium_listings_stripe_customer_unique" },
        { kind: "drop-index", name: "premium_listings_service_key_unique" },
        { kind: "drop-table", name: "business_memberships" },
      ],
      reasons: [],
    });
  });

  it("refuses to discard memberships not produced by the approved-claim backfill", () => {
    expect(
      buildPhase6c3RecoveryPlan({
        ...completePartialState,
        businessMemberships: {
          exists: true,
          rowCount: 2,
          unexpectedRowCount: 1,
        },
      })
    ).toEqual({
      status: "blocked",
      actions: [],
      reasons: ["business_memberships contains 1 non-backfill row"],
    });
  });

  it("refuses to discard reconciliation audit rows", () => {
    expect(
      buildPhase6c3RecoveryPlan({
        ...completePartialState,
        stripeReconciliations: { exists: true, rowCount: 1 },
      })
    ).toEqual({
      status: "blocked",
      actions: [],
      reasons: ["stripe_checkout_reconciliations contains 1 row"],
    });
  });

  it("refuses cleanup when a named artifact does not match migration 0018", () => {
    expect(
      buildPhase6c3RecoveryPlan({
        ...completePartialState,
        artifactMismatches: [
          "business_memberships columns do not match migration 0018",
          "premium_listings_service_key_unique definition does not match migration 0018",
        ],
      })
    ).toEqual({
      status: "blocked",
      actions: [],
      reasons: [
        "business_memberships columns do not match migration 0018",
        "premium_listings_service_key_unique definition does not match migration 0018",
      ],
    });
  });

  it("does nothing once migration 0018 is journaled", () => {
    expect(
      buildPhase6c3RecoveryPlan({
        ...completePartialState,
        migrationRecorded: true,
      })
    ).toEqual({ status: "already-applied", actions: [], reasons: [] });
  });

  it("blocks a journaled migration when expected schema is incomplete", () => {
    expect(
      buildPhase6c3RecoveryPlan({
        ...completePartialState,
        migrationRecorded: true,
        businessMemberships: {
          exists: false,
          rowCount: 0,
          unexpectedRowCount: 0,
        },
      })
    ).toEqual({
      status: "blocked",
      actions: [],
      reasons: [
        "migration journal records 0018 but business_memberships is missing",
      ],
    });
  });

  it("reports a clean pre-migration database as ready", () => {
    expect(
      buildPhase6c3RecoveryPlan({
        migrationRecorded: false,
        artifactMismatches: [],
        businessMemberships: {
          exists: false,
          rowCount: 0,
          unexpectedRowCount: 0,
        },
        stripeReconciliations: { exists: false, rowCount: 0 },
        premiumIndexes: [],
      })
    ).toEqual({ status: "ready", actions: [], reasons: [] });
  });

  it("requires exact database, migration, and write-quiescence confirmations before cleanup", () => {
    expect(() =>
      validatePhase6c3ApplyConfirmation("settleclt_prod", {
        confirmedDatabase: "settleclt_other",
        confirmedMigration: "0018_fearless_bedlam",
        writeQuiescenceConfirmed: true,
      })
    ).toThrow("database confirmation does not match");
    expect(() =>
      validatePhase6c3ApplyConfirmation("settleclt_prod", {
        confirmedDatabase: "settleclt_prod",
        confirmedMigration: "wrong_migration",
        writeQuiescenceConfirmed: true,
      })
    ).toThrow("migration confirmation must equal 0018_fearless_bedlam");
    expect(() =>
      validatePhase6c3ApplyConfirmation("settleclt_prod", {
        confirmedDatabase: "settleclt_prod",
        confirmedMigration: "0018_fearless_bedlam",
        writeQuiescenceConfirmed: false,
      })
    ).toThrow("write quiescence must be confirmed");
    expect(() =>
      validatePhase6c3ApplyConfirmation("settleclt_prod", {
        confirmedDatabase: "settleclt_prod",
        confirmedMigration: "0018_fearless_bedlam",
        writeQuiescenceConfirmed: true,
      })
    ).not.toThrow();
  });
});
