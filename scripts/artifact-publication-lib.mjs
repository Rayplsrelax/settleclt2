import { lstatSync, renameSync, rmSync } from "node:fs";
import { randomBytes } from "node:crypto";

/**
 * Atomically publishes a staged release artifact.
 *
 * The staging-to-canonical rename is the commit point. Once it succeeds, backup
 * cleanup is best-effort: a cleanup failure emits a warning and retains the
 * previous artifact at `retainedBackup` for operator recovery.
 */
export function publishStagedArtifact({
  artifact,
  stagingArtifact,
  backupSuffix = `${process.pid}-${randomBytes(6).toString("hex")}`,
  rename = renameSync,
  removeBackup = path => rmSync(path, { recursive: true, force: true }),
  stat = path => lstatSync(path, { throwIfNoEntry: false }),
  warn = message => console.warn(message),
}) {
  const existing = stat(artifact);
  if (existing && (existing.isSymbolicLink() || !existing.isDirectory())) {
    throw new Error("release artifact target must be a real non-symlink directory when it exists");
  }

  const backup = `${artifact}.previous-${backupSuffix}`;
  let movedExisting = false;
  try {
    if (existing) {
      rename(artifact, backup);
      movedExisting = true;
    }
    rename(stagingArtifact, artifact);
  } catch (error) {
    if (movedExisting && !stat(artifact)) {
      try {
        rename(backup, artifact);
      } catch (restoreError) {
        throw new AggregateError(
          [error, restoreError],
          "release artifact publication failed and the prior artifact could not be restored"
        );
      }
    }
    throw error;
  }

  if (!movedExisting) return { committed: true, retainedBackup: undefined };
  try {
    removeBackup(backup);
    return { committed: true, retainedBackup: undefined };
  } catch (error) {
    warn(
      `Release artifact was published successfully, but backup cleanup failed; retained backup for recovery at ${backup}: ${error instanceof Error ? error.message : String(error)}`
    );
    return { committed: true, retainedBackup: backup };
  }
}
