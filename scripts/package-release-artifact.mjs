import { execFileSync, spawnSync } from "node:child_process";
import { createHash, randomBytes } from "node:crypto";
import {
  chmodSync,
  cpSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, relative, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";
import {
  createArtifactManifest,
  verifyArtifactManifest,
} from "./artifact-manifest-lib.mjs";
import { publishStagedArtifact } from "./artifact-publication-lib.mjs";
import { REQUIRED_SCHEMA_FINGERPRINT } from "./migration-schema-lib.mjs";
import { readMigrationPlan } from "./migration-ledger-lib.mjs";

const root = resolve(import.meta.dirname, "..");
const artifact = resolve(process.env.RELEASE_ARTIFACT_DIR ?? resolve(root, "release-artifact"));
const releaseGitSha = process.env.RELEASE_GIT_SHA;
const exactSourceInputs = [
  "package.json",
  "pnpm-lock.yaml",
  "scripts/package-release-artifact.mjs",
  "scripts/artifact-publication-lib.mjs",
  "scripts/artifact-manifest-lib.mjs",
  "scripts/migration-artifact-lib.mjs",
  "scripts/migration-ledger-lib.mjs",
  "scripts/migration-schema-lib.mjs",
  "scripts/release-database-safety-lib.mjs",
];
let temporaryRoot;
let sourceCheckout;
let stagingArtifact;
let worktreeRegistered = false;

function git(cwd, ...args) {
  return execFileSync("git", args, { cwd, encoding: "utf8" }).trim();
}

function requireLowercaseReleaseSha() {
  if (!/^[0-9a-f]{40}$/.test(String(releaseGitSha))) {
    throw new Error("RELEASE_GIT_SHA must be a full lowercase 40-character SHA");
  }
}

function releaseStatus() {
  return git(
    root,
    "status",
    "--porcelain=v1",
    "--untracked-files=all",
    "--",
    ".",
    ":(exclude)portfolio",
    ":(exclude)portfolio/**"
  );
}

function requireExecutingInputsMatchHead() {
  for (const path of exactSourceInputs) {
    execFileSync("git", ["ls-files", "--error-unmatch", "--", path], {
      cwd: root,
      stdio: "ignore",
    });
  }
  const result = spawnSync("git", ["diff", "--quiet", "HEAD", "--", ...exactSourceInputs], {
    cwd: root,
    stdio: "ignore",
  });
  if (result.status !== 0) {
    throw new Error("release package executable or source inputs do not match HEAD");
  }
}

function requireCleanExactReleaseSource(stage) {
  requireLowercaseReleaseSha();
  const topLevel = resolve(git(root, "rev-parse", "--show-toplevel"));
  if (topLevel !== root) throw new Error("release package script must execute from the repository root");
  const head = git(root, "rev-parse", "HEAD");
  if (releaseGitSha !== head) {
    throw new Error(`RELEASE_GIT_SHA must exactly match HEAD (${stage})`);
  }
  const dirty = releaseStatus();
  if (dirty) {
    throw new Error(
      `release input worktree must be clean (${stage}; portfolio/ is the only documented non-release exclusion):\n${dirty}`
    );
  }
  requireExecutingInputsMatchHead();
}

function pnpmInvocation(args) {
  const execPath = process.env.npm_execpath;
  if (execPath && /pnpm(?:\.c?js)?$/i.test(execPath)) {
    return { executable: process.execPath, args: [execPath, ...args] };
  }
  return { executable: process.platform === "win32" ? "pnpm.cmd" : "pnpm", args };
}

function runPnpm(cwd, args, { allowFailure = false } = {}) {
  const invocation = pnpmInvocation(args);
  const result = spawnSync(invocation.executable, invocation.args, {
    cwd,
    env: process.env,
    encoding: "utf8",
    stdio: "inherit",
  });
  if (result.error && !allowFailure) throw result.error;
  if (result.status !== 0 && !allowFailure) {
    throw new Error(`pnpm ${args.join(" ")} failed with exit code ${String(result.status)}`);
  }
  return result.status === 0;
}

function installExactDependencies() {
  if (!runPnpm(sourceCheckout, ["install", "--frozen-lockfile", "--offline"], { allowFailure: true })) {
    console.warn("Offline pnpm store was incomplete; retrying frozen install with configured network access");
    runPnpm(sourceCheckout, ["install", "--frozen-lockfile"]);
  }
}

function sha256(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function copyMigrationInput(source, destinationRelative, migrationsArtifact, files) {
  const destination = resolve(migrationsArtifact, ...destinationRelative.split("/"));
  mkdirSync(dirname(destination), { recursive: true });
  cpSync(source, destination, { preserveTimestamps: false });
  files.push({ path: destinationRelative, sha256: sha256(destination) });
}

async function buildStagedArtifact() {
  const sourceDist = resolve(sourceCheckout, "dist");
  const localManifestPath = resolve(sourceDist, "release-manifest.json");
  const localManifest = JSON.parse(readFileSync(localManifestPath, "utf8"));
  if (localManifest.deployable !== false || localManifest.manifestPurpose !== "local-build-only") {
    throw new Error("isolated exact-SHA build must produce an explicitly non-deployable local manifest");
  }

  const migrationsArtifact = resolve(stagingArtifact, "migrations");
  mkdirSync(stagingArtifact, { recursive: true });
  cpSync(sourceDist, resolve(stagingArtifact, "dist"), {
    recursive: true,
    preserveTimestamps: false,
  });
  cpSync(resolve(sourceCheckout, "ops", "release"), resolve(stagingArtifact, "ops", "release"), {
    recursive: true,
    preserveTimestamps: false,
  });
  writeFileSync(
    resolve(stagingArtifact, "dist", "release-manifest.json"),
    `${JSON.stringify({
      schemaVersion: 1,
      app: "settle-clt",
      version: "1.0.0",
      gitSha: releaseGitSha,
      builtAt: process.env.RELEASE_BUILT_AT ?? new Date().toISOString(),
      deployable: true,
      manifestPurpose: "clean-release-package",
    }, null, 2)}\n`,
    { encoding: "utf8", mode: 0o444 }
  );

  const files = [];
  const migrationPlan = readMigrationPlan(sourceCheckout);
  for (const migration of migrationPlan) {
    copyMigrationInput(migration.path, `drizzle/${migration.tag}.sql`, migrationsArtifact, files);
  }
  copyMigrationInput(
    resolve(sourceCheckout, "drizzle/meta/_journal.json"),
    "drizzle/meta/_journal.json",
    migrationsArtifact,
    files
  );
  for (const script of [
    "apply-release-migrations.mjs",
    "artifact-manifest-lib.mjs",
    "migration-artifact-lib.mjs",
    "migration-ledger-lib.mjs",
    "migration-schema-lib.mjs",
    "release-database-safety-lib.mjs",
    "preflight-migration-state.mjs",
    "preflight-release.mjs",
    "verify-migration-ledger.mjs",
    "verify-release-artifact.mjs",
  ]) {
    copyMigrationInput(
      resolve(sourceCheckout, "scripts", script),
      `scripts/${script}`,
      migrationsArtifact,
      files
    );
  }

  const esbuildModule = resolve(sourceCheckout, "node_modules", "esbuild", "lib", "main.js");
  const { buildSync } = await import(pathToFileURL(esbuildModule).href);
  const bundledRunner = resolve(migrationsArtifact, "bin/apply-release-migrations.mjs");
  mkdirSync(dirname(bundledRunner), { recursive: true });
  buildSync({
    entryPoints: [resolve(sourceCheckout, "scripts/apply-release-migrations.mjs")],
    outfile: bundledRunner,
    bundle: true,
    platform: "node",
    format: "esm",
    target: "node20",
    packages: "bundle",
    banner: {
      js: 'import { createRequire as __createRequire } from "node:module"; const require = __createRequire(import.meta.url);',
    },
    logLevel: "silent",
  });
  files.push({ path: "bin/apply-release-migrations.mjs", sha256: sha256(bundledRunner) });
  const bundledPreflight = resolve(migrationsArtifact, "bin/preflight-release.mjs");
  buildSync({
    entryPoints: [resolve(sourceCheckout, "scripts/preflight-release.mjs")],
    outfile: bundledPreflight,
    bundle: true,
    platform: "node",
    format: "esm",
    target: "node20",
    packages: "bundle",
    banner: {
      js: 'import { createRequire as __createRequire } from "node:module"; const require = __createRequire(import.meta.url);',
    },
    logLevel: "silent",
  });
  files.push({ path: "bin/preflight-release.mjs", sha256: sha256(bundledPreflight) });
  copyMigrationInput(resolve(sourceCheckout, "package.json"), "package.json", migrationsArtifact, files);
  copyMigrationInput(resolve(sourceCheckout, "pnpm-lock.yaml"), "pnpm-lock.yaml", migrationsArtifact, files);
  files.sort((left, right) => left.path.localeCompare(right.path));

  const journalTip = migrationPlan.at(-1);
  if (!journalTip) throw new Error("migration journal is empty");
  writeFileSync(
    resolve(migrationsArtifact, "manifest.json"),
    `${JSON.stringify({
      schemaVersion: 1,
      releaseGitSha,
      journalTip: { tag: journalTip.tag, when: journalTip.when, hash: journalTip.hash },
      requiredSchemaFingerprint: REQUIRED_SCHEMA_FINGERPRINT,
      files,
    }, null, 2)}\n`,
    { encoding: "utf8", mode: 0o444 }
  );
  return createArtifactManifest(stagingArtifact, releaseGitSha);
}

try {
  requireCleanExactReleaseSource("before isolated build");
  temporaryRoot = mkdtempSync(resolve(tmpdir(), "settleclt-release-package-"));
  sourceCheckout = resolve(temporaryRoot, "source");
  git(root, "worktree", "add", "--detach", sourceCheckout, releaseGitSha);
  worktreeRegistered = true;
  if (git(sourceCheckout, "rev-parse", "HEAD") !== releaseGitSha) {
    throw new Error("temporary release worktree did not resolve to the requested exact SHA");
  }

  installExactDependencies();
  runPnpm(sourceCheckout, ["run", "build"]);
  if (git(sourceCheckout, "rev-parse", "HEAD") !== releaseGitSha || git(sourceCheckout, "status", "--porcelain=v1")) {
    throw new Error("isolated release source changed during dependency installation or build");
  }

  const stagingName = `${basename(artifact)}.staging-${process.pid}-${randomBytes(6).toString("hex")}`;
  stagingArtifact = resolve(dirname(artifact), stagingName);
  rmSync(stagingArtifact, { recursive: true, force: true });
  const artifactManifest = await buildStagedArtifact();
  const verified = verifyArtifactManifest({ artifactRoot: stagingArtifact, releaseGitSha });
  if (verified.manifest.artifactManifestDigest !== artifactManifest.artifactManifestDigest) {
    throw new Error("staged release artifact verification digest changed");
  }

  requireCleanExactReleaseSource("immediately before publication");
  mkdirSync(dirname(artifact), { recursive: true });
  publishStagedArtifact({ artifact, stagingArtifact });
  stagingArtifact = undefined;
  console.log(
    `Packaged ${artifactManifest.files.length} fully hashed deployable files for ${releaseGitSha} into ${relative(root, artifact).split(sep).join("/")}`
  );
} finally {
  if (stagingArtifact) rmSync(stagingArtifact, { recursive: true, force: true });
  if (worktreeRegistered && sourceCheckout) {
    try {
      git(root, "worktree", "remove", "--force", sourceCheckout);
    } catch (error) {
      console.error(`Failed to remove temporary release worktree: ${error instanceof Error ? error.message : String(error)}`);
    }
    try {
      git(root, "worktree", "prune");
    } catch (error) {
      console.error(`Failed to prune temporary release worktree registration: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  if (temporaryRoot) rmSync(temporaryRoot, { recursive: true, force: true });
}
