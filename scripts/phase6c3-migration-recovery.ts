import mysql, { type RowDataPacket } from "mysql2/promise";
import {
  buildPhase6c3RecoveryPlan,
  executePhase6c3RecoveryPlan,
  inspectPhase6c3RecoveryState,
  validatePhase6c3ApplyConfirmation,
} from "../server/phase6c3-migration-recovery";

function argumentValue(name: string): string | undefined {
  const prefix = `${name}=`;
  return process.argv
    .find(argument => argument.startsWith(prefix))
    ?.slice(prefix.length);
}

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is required for Phase 6C3 recovery inspection");
}

const apply = process.argv.includes("--apply");
const connection = await mysql.createConnection(databaseUrl);

try {
  const [databaseRows] = await connection.query<
    (RowDataPacket & { databaseName: string | null })[]
  >("SELECT DATABASE() AS databaseName");
  const databaseName = databaseRows[0]?.databaseName;
  if (!databaseName) {
    throw new Error("DATABASE_URL must select a database");
  }

  const state = await inspectPhase6c3RecoveryState(connection);
  const plan = buildPhase6c3RecoveryPlan(state);
  console.log(JSON.stringify({ databaseName, state, plan }, null, 2));

  if (!apply) {
    console.log("mode=plan-only");
  } else {
    validatePhase6c3ApplyConfirmation(databaseName, {
      confirmedDatabase: argumentValue("--confirm-database"),
      confirmedMigration: argumentValue("--confirm-migration"),
      writeQuiescenceConfirmed: process.argv.includes(
        "--confirm-write-quiescence"
      ),
    });
    await executePhase6c3RecoveryPlan(connection, plan);
    const finalState = await inspectPhase6c3RecoveryState(connection);
    const finalPlan = buildPhase6c3RecoveryPlan(finalState);
    if (
      finalPlan.status !== "ready" &&
      finalPlan.status !== "already-applied"
    ) {
      throw new Error(
        `Phase 6C3 cleanup did not converge: ${JSON.stringify(finalPlan)}`
      );
    }
    console.log(`mode=apply`);
    console.log(`result=${finalPlan.status}`);
  }
} finally {
  await connection.end();
}
