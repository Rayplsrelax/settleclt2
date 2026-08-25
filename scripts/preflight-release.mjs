#!/usr/bin/env node
import { preflightMigrationState } from "./preflight-migration-state.mjs";

const migrationsRoot = process.env.MIGRATIONS_ROOT;
const releaseArtifactRoot = process.env.RELEASE_ARTIFACT_ROOT;
const releaseGitSha = process.env.RELEASE_GIT_SHA;
if (!migrationsRoot || !releaseArtifactRoot || !releaseGitSha) {
  throw new Error("MIGRATIONS_ROOT, RELEASE_ARTIFACT_ROOT, and RELEASE_GIT_SHA are required");
}

await preflightMigrationState({ migrationsRoot, releaseGitSha });
