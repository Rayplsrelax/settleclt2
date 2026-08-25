import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  chmodSync,
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  statSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative, resolve, sep } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
// @ts-ignore JavaScript release utility intentionally has no TypeScript surface.
import {
  applyReleaseMigrations,
  connectReleaseDatabase,
  verifyPackagedMigrationInputs,
} from "../scripts/apply-release-migrations.mjs";
// @ts-ignore JavaScript release utility intentionally has no TypeScript surface.
import { REQUIRED_SCHEMA_FINGERPRINT } from "../scripts/migration-schema-lib.mjs";
// @ts-ignore JavaScript release utility intentionally has no TypeScript surface.
import { verifyPackagedMigrationInputs as verifyImmutableInputs } from "../scripts/migration-artifact-lib.mjs";
// @ts-ignore JavaScript release utility intentionally has no TypeScript surface.
import { preflightMigrationState } from "../scripts/preflight-migration-state.mjs";
// @ts-ignore JavaScript release utility intentionally has no TypeScript surface.
import {
  createArtifactManifest,
  verifyArtifactManifest,
} from "../scripts/artifact-manifest-lib.mjs";
// @ts-ignore JavaScript release utility intentionally has no TypeScript surface.
import { publishStagedArtifact } from "../scripts/artifact-publication-lib.mjs";

const prepareScript = resolve("ops/release/prepare-release.sh");
const preflightScript = resolve("ops/release/preflight-release.sh");
const activateScript = resolve("ops/release/activate-release.sh");
const rollbackScript = resolve("ops/release/rollback-release.sh");
const ledgerVerifier = resolve("scripts/verify-migration-ledger.mjs");
const packageScript = resolve("scripts/package-release-artifact.mjs");
const expectedDatabaseTargetSha256 = "b".repeat(64);
const temporaryDirectories: string[] = [];

function runGit(cwd: string, ...args: string[]): string {
  return execFileSync("git", args, { cwd, encoding: "utf8" }).trim();
}

function pnpmInvocation(args: string[]): { executable: string; args: string[] } {
  if (process.platform !== "win32") return { executable: "pnpm", args };
  const cli = join(String(process.env.APPDATA), "npm", "node_modules", "pnpm", "bin", "pnpm.cjs");
  return { executable: process.execPath, args: [cli, ...args] };
}

function runPnpm(cwd: string, args: string[], env: NodeJS.ProcessEnv = process.env): string {
  const invocation = pnpmInvocation(args);
  return execFileSync(invocation.executable, invocation.args, {
    cwd, env, encoding: "utf8", timeout: 180_000,
  });
}

function createCleanPackageRepository(): string {
  const sourceRoot = resolve(".");
  const repository = join(temporaryDirectory(), "repository");
  mkdirSync(repository, { recursive: true });
  const listed = execFileSync(
    "git",
    ["ls-files", "-z", "--cached", "--others", "--exclude-standard"],
    { cwd: sourceRoot, encoding: "buffer", maxBuffer: 32 * 1024 * 1024 }
  ).toString("utf8").split("\0").filter(Boolean);
  for (const path of listed) {
    const portable = path.split("\\").join("/");
    if (portable === "portfolio" || portable.startsWith("portfolio/")) continue;
    const destination = join(repository, ...portable.split("/"));
    mkdirSync(dirname(destination), { recursive: true });
    cpSync(join(sourceRoot, ...portable.split("/")), destination, { preserveTimestamps: false });
  }
  runGit(repository, "init", "--initial-branch=main");
  runGit(repository, "config", "user.email", "release-test@example.invalid");
  runGit(repository, "config", "user.name", "Release Test");
  runGit(repository, "add", "--all");
  runGit(repository, "commit", "-m", "fixture source");
  return repository;
}

function linkFixtureDependencies(repository: string): void {
  const source = resolve("node_modules");
  if (!statSync(source, { throwIfNoEntry: false })?.isDirectory()) {
    throw new Error("release integration test requires the repository dependencies to be installed");
  }
  symlinkSync(source, join(repository, "node_modules"), process.platform === "win32" ? "junction" : "dir");
}

function packageFixture(repository: string, extraEnv: NodeJS.ProcessEnv = {}) {
  const sha = runGit(repository, "rev-parse", "HEAD");
  const invocation = pnpmInvocation(["run", "release:package"]);
  const result = spawnSync(invocation.executable, invocation.args, {
    cwd: repository,
    encoding: "utf8",
    timeout: 240_000,
    env: {
      ...process.env,
      RELEASE_GIT_SHA: sha,
      RELEASE_BUILT_AT: "2026-08-24T00:00:00.000Z",
      ...extraEnv,
    },
  });
  return { result, sha, artifact: join(repository, "release-artifact") };
}

function executableMode(path: string): string {
  return (statSync(path).mode & 0o111).toString(8).padStart(4, "0");
}

function treeSnapshot(root: string): string {
  const entries: Array<{ path: string; bytes: string }> = [];
  const visit = (directory: string) => {
    for (const name of readdirSync(directory).sort()) {
      const candidate = join(directory, name);
      const stat = statSync(candidate);
      if (stat.isDirectory()) visit(candidate);
      else entries.push({
        path: relative(root, candidate).split(sep).join("/"),
        bytes: createHash("sha256").update(readFileSync(candidate)).digest("hex"),
      });
    }
  };
  visit(root);
  return JSON.stringify(entries);
}

function treeContainsText(root: string, needle: string): boolean {
  for (const name of readdirSync(root)) {
    const candidate = join(root, name);
    const stat = statSync(candidate);
    if (stat.isDirectory() && treeContainsText(candidate, needle)) return true;
    if (stat.isFile() && readFileSync(candidate).includes(Buffer.from(needle))) return true;
  }
  return false;
}

function temporaryDirectory(): string {
  const directory = mkdtempSync(join(tmpdir(), "settleclt-release-test-"));
  temporaryDirectories.push(directory);
  return directory;
}

function createArtifact(root: string, gitSha: string, marker: string): string {
  const artifact = join(root, `artifact-${marker}`);
  mkdirSync(join(artifact, "dist"), { recursive: true });
  writeFileSync(
    join(artifact, "dist", "index.js"),
    `export default ${JSON.stringify(marker)};\n`
  );
  writeFileSync(
    join(artifact, "dist", "release-manifest.json"),
    JSON.stringify({
      schemaVersion: 1,
      app: "settle-clt",
      version: "1.0.0",
      gitSha,
      builtAt: "2026-08-15T00:00:00.000Z",
      deployable: true,
      manifestPurpose: "clean-release-package",
    })
  );
  mkdirSync(join(artifact, "ops", "release"), { recursive: true });
  writeFileSync(
    join(artifact, "ops", "release", "marker.sh"),
    `#!/bin/sh\necho ${marker}\n`
  );
  mkdirSync(join(artifact, "migrations"), { recursive: true });
  const migrationFiles = [
    "drizzle/meta/_journal.json",
    "drizzle/0033_business_claim_identity_unique.sql",
    "scripts/apply-release-migrations.mjs",
    "scripts/migration-artifact-lib.mjs",
    "scripts/migration-ledger-lib.mjs",
    "scripts/migration-schema-lib.mjs",
    "scripts/release-database-safety-lib.mjs",
    "bin/apply-release-migrations.mjs",
    "scripts/preflight-migration-state.mjs",
    "scripts/preflight-release.mjs",
    "scripts/verify-migration-ledger.mjs",
    "bin/preflight-release.mjs",
    "package.json",
    "pnpm-lock.yaml",
  ].map(path => {
    const target = join(artifact, "migrations", path);
    mkdirSync(join(target, ".."), { recursive: true });
    const content = path === "bin/preflight-release.mjs"
      ? `if (!process.env.DATABASE_URL || !process.env.EXPECTED_DATABASE_TARGET_SHA256 || !process.env.MIGRATIONS_ROOT || !process.env.RELEASE_ARTIFACT_ROOT || !process.env.RELEASE_GIT_SHA) process.exit(64); console.log(JSON.stringify({status:"current",pending:[],current:"0033_business_claim_identity_unique"}));\n`
      : `${path}:${marker}\n`;
    writeFileSync(target, content);
    return { path, sha256: createHash("sha256").update(content).digest("hex") };
  });
  const tipHash = migrationFiles.find(file =>
    file.path.endsWith("0033_business_claim_identity_unique.sql")
  )!.sha256;
  writeFileSync(
    join(artifact, "migrations", "manifest.json"),
    JSON.stringify({
      schemaVersion: 1,
      releaseGitSha: gitSha,
      journalTip: {
        tag: "0033_business_claim_identity_unique",
        when: 1786575602000,
        hash: tipHash,
      },
      requiredSchemaFingerprint: REQUIRED_SCHEMA_FINGERPRINT,
      files: migrationFiles,
    })
  );
  createArtifactManifest(artifact, gitSha);
  return artifact;
}

function writeMigrationGate(releaseRoot: string, gitSha: string): void {
  const manifest = JSON.parse(
    readFileSync(
      join(releaseRoot, "releases", gitSha, "migrations", "manifest.json"),
      "utf8"
    )
  );
  const artifactManifest = JSON.parse(
    readFileSync(
      join(releaseRoot, "releases", gitSha, "artifact-manifest.json"),
      "utf8"
    )
  );
  mkdirSync(join(releaseRoot, "migration-gates"), { recursive: true });
  writeFileSync(
    join(releaseRoot, "migration-gates", `${gitSha}.json`),
    JSON.stringify({
      schemaVersion: 1,
      releaseGitSha: gitSha,
      journalTip: manifest.journalTip,
      requiredSchemaFingerprint: manifest.requiredSchemaFingerprint,
      artifactManifestDigest: artifactManifest.artifactManifestDigest,
      databaseTargetSha256: expectedDatabaseTargetSha256,
      verifiedAt: "2026-08-24T00:00:00.000Z",
      engineVersion: "8.4.11",
      sqlMode: "NO_ENGINE_SUBSTITUTION,STRICT_TRANS_TABLES",
    })
  );
}

function run(script: string, ...args: string[]): string {
  return execFileSync("bash", [script, ...args], {
    encoding: "utf8",
    env: { ...process.env, EXPECTED_DATABASE_TARGET_SHA256: expectedDatabaseTargetSha256, MSYS: "winsymlinks:nativestrict" },
  });
}

function runResult(script: string, ...args: string[]) {
  return spawnSync("bash", [script, ...args], {
    encoding: "utf8",
    env: { ...process.env, EXPECTED_DATABASE_TARGET_SHA256: expectedDatabaseTargetSha256, MSYS: "winsymlinks:nativestrict" },
  });
}

function replaceWithSymlink(path: string, target: string, type: "file" | "junction" = "file"): void {
  spawnSync("bash", ["-c", 'chmod u+w -- "$1" "$(dirname -- "$1")" 2>/dev/null || true', "link", path]);
  rmSync(path, { recursive: type === "junction", force: true });
  symlinkSync(target, path, type);
}

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(join(directory, "repository", "node_modules"), { recursive: true, force: true });
    spawnSync(
      "bash",
      [
        "-c",
        'chmod -R u+w -- "$1" 2>/dev/null || true',
        "release-test-cleanup",
        directory,
      ],
      { env: { ...process.env, MSYS: "winsymlinks:nativestrict" } }
    );
    rmSync(directory, { recursive: true, force: true });
  }
}, 120_000);

describe("immutable release scripts", () => {
  it("commits publication even when backup cleanup fails and retains a recoverable backup", () => {
    const root = temporaryDirectory();
    const artifact = join(root, "release-artifact");
    const staging = join(root, "release-artifact.staging");
    mkdirSync(artifact);
    mkdirSync(staging);
    writeFileSync(join(artifact, "marker.txt"), "previous canonical bytes\n");
    writeFileSync(join(staging, "marker.txt"), "new canonical bytes\n");
    const warnings: string[] = [];

    const published = publishStagedArtifact({
      artifact,
      stagingArtifact: staging,
      backupSuffix: "injected-cleanup-failure",
      removeBackup() {
        throw new Error("injected backup removal failure");
      },
      warn(message: string) {
        warnings.push(message);
      },
    });

    expect(published.committed).toBe(true);
    expect(readFileSync(join(artifact, "marker.txt"), "utf8")).toBe("new canonical bytes\n");
    expect(readFileSync(join(published.retainedBackup!, "marker.txt"), "utf8"))
      .toBe("previous canonical bytes\n");
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toMatch(/published|retained backup|cleanup/i);
  });

  it("restores the prior canonical bytes when publication fails before the staging rename commits", () => {
    const root = temporaryDirectory();
    const artifact = join(root, "release-artifact");
    const staging = join(root, "release-artifact.staging");
    mkdirSync(artifact);
    mkdirSync(staging);
    writeFileSync(join(artifact, "marker.txt"), "previous canonical bytes\n");
    writeFileSync(join(staging, "marker.txt"), "unpublished bytes\n");
    let renameCount = 0;

    expect(() => publishStagedArtifact({
      artifact,
      stagingArtifact: staging,
      backupSuffix: "injected-prepublication-failure",
      rename(source: string, destination: string) {
        renameCount += 1;
        if (renameCount === 2) throw new Error("injected staging publication failure");
        renameSync(source, destination);
      },
    })).toThrow(/injected staging publication failure/);

    expect(readFileSync(join(artifact, "marker.txt"), "utf8")).toBe("previous canonical bytes\n");
    expect(readFileSync(join(staging, "marker.txt"), "utf8")).toBe("unpublished bytes\n");
  });

  it("keeps ordinary build non-deployable and reserves packaging for an explicit clean release command", () => {
    const packageJson = JSON.parse(readFileSync(resolve("package.json"), "utf8"));
    expect(packageJson.scripts.build).not.toMatch(/package-release-artifact/);
    expect(packageJson.scripts["release:package"]).toMatch(/package-release-artifact/);
    expect(readFileSync(resolve("scripts/generate-release-manifest.mjs"), "utf8"))
      .toMatch(/deployable:\s*false/);
  });

  it("rejects mismatched and dirty deployable release packaging before writing an artifact", () => {
    const root = temporaryDirectory();
    const repository = join(root, "repository");
    mkdirSync(repository, { recursive: true });
    for (const path of [
      "package.json",
      "pnpm-lock.yaml",
      "scripts/package-release-artifact.mjs",
      "scripts/artifact-publication-lib.mjs",
      "scripts/artifact-manifest-lib.mjs",
      "scripts/migration-artifact-lib.mjs",
      "scripts/migration-ledger-lib.mjs",
      "scripts/migration-schema-lib.mjs",
      "scripts/release-database-safety-lib.mjs",
    ]) {
      const destination = join(repository, ...path.split("/"));
      mkdirSync(dirname(destination), { recursive: true });
      cpSync(resolve(path), destination, { preserveTimestamps: false });
    }
    runGit(repository, "init", "--initial-branch=main");
    runGit(repository, "config", "user.email", "release-test@example.invalid");
    runGit(repository, "config", "user.name", "Release Test");
    runGit(repository, "add", "--all");
    runGit(repository, "commit", "-m", "minimal package validation fixture");
    const fixturePackageScript = join(repository, "scripts", "package-release-artifact.mjs");
    const dist = join(root, "dist");
    const artifact = join(root, "artifact");
    mkdirSync(dist, { recursive: true });
    writeFileSync(join(dist, "index.js"), "local build\n");
    const head = runGit(repository, "rev-parse", "HEAD");
    for (const [sha, reason, makeDirty] of [
      ["A".repeat(40), /lowercase|full/i, false],
      ["0".repeat(40), /HEAD|match/i, false],
      [head, /clean|worktree|release input/i, true],
    ] as const) {
      if (makeDirty) {
        const packageJson = join(repository, "package.json");
        writeFileSync(packageJson, `${readFileSync(packageJson, "utf8")}\n`);
      }
      const result = spawnSync("node", [fixturePackageScript], {
        cwd: repository,
        encoding: "utf8",
        env: { ...process.env, RELEASE_GIT_SHA: sha, RELEASE_DIST_DIR: dist, RELEASE_ARTIFACT_DIR: artifact },
      });
      expect(result.status).not.toBe(0);
      expect(`${result.stdout}${result.stderr}`).toMatch(reason);
      expect(() => statSync(artifact)).toThrow();
    }
  });

  it("hashes every deployable byte in one deterministic sorted artifact manifest", () => {
    const root = temporaryDirectory();
    const sha = "8".repeat(40);
    const artifact = createArtifact(root, sha, "complete-manifest");
    const first = readFileSync(join(artifact, "artifact-manifest.json"), "utf8");
    const verified = verifyArtifactManifest({ artifactRoot: artifact, releaseGitSha: sha });
    const paths = verified.manifest.files.map((file: { path: string }) => file.path);
    expect(paths).toEqual([...paths].sort());
    expect(verified.manifest.files.every((file: { sha256: string; type: string; mode: string }) =>
      /^[0-9a-f]{64}$/.test(file.sha256) && file.type === "file" && /^[0-7]{4}$/.test(file.mode)
    )).toBe(true);
    createArtifactManifest(artifact, sha);
    expect(readFileSync(join(artifact, "artifact-manifest.json"), "utf8")).toBe(first);
  });

  it.each([
    ["dist app bundle", "dist/index.js"],
    ["release operation", "ops/release/marker.sh"],
    ["migration", "migrations/drizzle/0033_business_claim_identity_unique.sql"],
  ])("rejects a mutated %s against the full artifact manifest", (_label, relativePath) => {
    const root = temporaryDirectory();
    const sha = "9".repeat(40);
    const artifact = createArtifact(root, sha, `mutated-${_label}`);
    writeFileSync(join(artifact, ...relativePath.split("/")), "tampered\n");
    expect(() => verifyArtifactManifest({ artifactRoot: artifact, releaseGitSha: sha }))
      .toThrow(/hash|manifest|artifact/i);
  });

  it("rejects extra, missing, symlinked, and digest-mismatched artifact members", () => {
    const root = temporaryDirectory();
    const sha = "a".repeat(40);
    const extra = createArtifact(root, sha, "extra");
    writeFileSync(join(extra, "dist", "extra.js"), "extra\n");
    expect(() => verifyArtifactManifest({ artifactRoot: extra, releaseGitSha: sha })).toThrow(/extra|set|manifest/i);

    const missing = createArtifact(root, sha, "missing");
    rmSync(join(missing, "dist", "index.js"));
    expect(() => verifyArtifactManifest({ artifactRoot: missing, releaseGitSha: sha })).toThrow(/missing|set|manifest/i);

    const linked = createArtifact(root, sha, "linked");
    const external = join(root, "external.js");
    writeFileSync(external, "external\n");
    replaceWithSymlink(join(linked, "dist", "index.js"), external);
    expect(() => verifyArtifactManifest({ artifactRoot: linked, releaseGitSha: sha })).toThrow(/symbolic link|symlink|regular/i);

    const badDigest = createArtifact(root, sha, "digest");
    const manifestPath = join(badDigest, "artifact-manifest.json");
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
    manifest.artifactManifestDigest = "0".repeat(64);
    chmodSync(manifestPath, 0o644);
    writeFileSync(manifestPath, JSON.stringify(manifest));
    expect(() => verifyArtifactManifest({ artifactRoot: badDigest, releaseGitSha: sha })).toThrow(/digest/i);
  });

  it("rejects artifact-member retargeting at descriptor open", () => {
    const root = temporaryDirectory();
    const sha = "b".repeat(40);
    const artifact = createArtifact(root, sha, "artifact-retarget");
    const member = join(artifact, "dist", "index.js");
    const external = join(root, "retarget.js");
    writeFileSync(external, readFileSync(member));
    let retargeted = false;
    expect(() => verifyArtifactManifest({
      artifactRoot: artifact,
      releaseGitSha: sha,
      beforeRead(candidate: string) {
        if (!retargeted && candidate === resolve(member)) {
          retargeted = true;
          replaceWithSymlink(member, external);
        }
      },
    })).toThrow(/retarget|symlink|changed/i);
    expect(retargeted).toBe(true);
  });

  it.each([
    ["injected member", (artifact: string) => {
      writeFileSync(join(artifact, "dist", "unhashed-injected.js"), "unhashed injection\n");
    }],
    ["deleted already-read member", (artifact: string) => {
      rmSync(join(artifact, "dist", "index.js"));
    }],
    ["retargeted already-read directory", (artifact: string) => {
      const original = join(artifact, "ops", "release");
      const replacement = join(artifact, "ops", "release-replacement");
      mkdirSync(replacement);
      cpSync(original, replacement, { recursive: true, preserveTimestamps: true });
      rmSync(original, { recursive: true });
      renameSync(replacement, original);
    }],
  ])("rejects a %s injected after initial enumeration and member reads", (_label, mutate) => {
    const root = temporaryDirectory();
    const sha = "c".repeat(40);
    const artifact = createArtifact(root, sha, `final-tree-${_label}`);
    const releaseManifest = resolve(artifact, "dist", "release-manifest.json");
    let reads = 0;
    let injected = false;

    expect(() => verifyArtifactManifest({
      artifactRoot: artifact,
      releaseGitSha: sha,
      beforeRead(candidate: string) {
        if (candidate === releaseManifest) {
          reads += 1;
          if (reads === 2) {
            mutate(artifact);
            injected = true;
          }
        }
      },
    })).toThrow(/artifact (?:file set|tree|member).*changed|extra|missing|retarget/i);
    expect(injected).toBe(true);
  });

  it("migration-only apply rejects a mutated non-migration artifact before connecting", async () => {
    const root = temporaryDirectory();
    const sha = "d".repeat(40);
    const artifact = createArtifact(root, sha, "migration-full-artifact");
    writeFileSync(join(artifact, "dist", "index.js"), "tampered before migration\n");
    await expect(applyReleaseMigrations({
      connectionString: "mysql://unused.invalid/test",
      artifactRoot: artifact,
      migrationsRoot: join(artifact, "migrations"),
      releaseGitSha: sha,
      gatePath: join(root, "gate.json"),
    })).rejects.toThrow(/artifact member hash mismatch/i);
  });

  it("redacts migration-runner connection failures and never attaches provider causes", async () => {
    const sentinel = "mysql://user:sentinel-password@secret-host.invalid/sentinel_schema aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee ALTER TABLE secrets";
    const provider = Object.assign(new Error(sentinel), {
      code: "ER_ACCESS_DENIED_ERROR",
      sql: "ALTER TABLE secrets",
      host: "secret-host.invalid",
    });
    let exposed = "";
    try {
      await connectReleaseDatabase(
        "mysql://user:sentinel-password@secret-host.invalid/sentinel_schema",
        async () => { throw provider; }
      );
    } catch (error) {
      exposed = String(error);
      expect((error as Error & { cause?: unknown }).cause).toBeUndefined();
    }
    expect(exposed).toBe("Error: database connection failed: access-denied");
    for (const secret of [sentinel, "sentinel-password", "secret-host.invalid", "sentinel_schema", "ALTER TABLE", "ER_ACCESS_DENIED_ERROR"]) {
      expect(exposed).not.toContain(secret);
    }
    const source = readFileSync(resolve("scripts/apply-release-migrations.mjs"), "utf8");
    expect(source).not.toMatch(/error\.message|\{\s*cause\s*:/);
    expect(source.match(/await\s+connection\.query\(/g)).toHaveLength(1);
  });

  it("prepares a SHA-addressed read-only release from a matching artifact", () => {
    const root = temporaryDirectory();
    const releaseRoot = join(root, "releases-root");
    const sha = "1111111111111111111111111111111111111111";
    const artifact = createArtifact(root, sha, "one");

    run(prepareScript, releaseRoot, artifact, sha);

    const release = join(releaseRoot, "releases", sha);
    expect(readFileSync(join(release, "dist", "index.js"), "utf8")).toContain(
      "one"
    );
    expect(statSync(join(release, "dist", "index.js")).mode & 0o222).toBe(0);
  });

  it("runs the exact prepared-release preflight as a SELECT-only, non-writing command", () => {
    const root = temporaryDirectory();
    const releaseRoot = join(root, "release-root");
    const sha = "f".repeat(40);
    run(prepareScript, releaseRoot, createArtifact(root, sha, "standalone-preflight"), sha);

    const result = spawnSync("bash", [preflightScript, releaseRoot, sha], {
      encoding: "utf8",
      env: {
        ...process.env,
        DATABASE_URL: "mysql://protected.invalid/fixture",
        EXPECTED_DATABASE_TARGET_SHA256: expectedDatabaseTargetSha256,
        MSYS: "winsymlinks:nativestrict",
      },
    });
    expect(result.status, `${result.stdout}${result.stderr}`).toBe(0);
    expect(JSON.parse(result.stdout.trim())).toEqual({
      status: "current",
      pending: [],
      current: "0033_business_claim_identity_unique",
    });
    expect(existsSync(join(releaseRoot, "migration-gates"))).toBe(false);

    const source = readFileSync(preflightScript, "utf8");
    expect(source).toContain("bin/preflight-release.mjs");
    expect(source).toContain("verify-release-artifact.mjs");
    expect(source).not.toMatch(/GET_LOCK|apply-release-migrations|MIGRATION_GATE_PATH|mkdir|INSERT|UPDATE|DELETE|ALTER|CREATE|DROP/i);
  });

  it("packages a self-contained read-only preflight entry", () => {
    const source = readFileSync(resolve("scripts/package-release-artifact.mjs"), "utf8");
    expect(source).toContain('entryPoints: [resolve(sourceCheckout, "scripts/preflight-release.mjs")]');
    expect(source).toContain('"bin/preflight-release.mjs"');
    expect(source).toContain('"scripts/preflight-release.mjs"');
  });

  it("packages and independently verifies an exact clean committed source", () => {
    const repository = createCleanPackageRepository();
    linkFixtureDependencies(repository);
    runPnpm(repository, ["run", "build"]);

    const { result, sha, artifact } = packageFixture(repository);
    expect(`${result.stdout}${result.stderr}`).toContain("Packaged");
    expect(result.status).toBe(0);

    const releaseManifest = JSON.parse(
      readFileSync(join(artifact, "dist", "release-manifest.json"), "utf8")
    );
    expect(releaseManifest).toMatchObject({
      gitSha: sha,
      deployable: true,
      manifestPurpose: "clean-release-package",
    });

    const migrationManifest = JSON.parse(
      readFileSync(join(artifact, "migrations", "manifest.json"), "utf8")
    );
    expect(migrationManifest.releaseGitSha).toBe(sha);
    expect(migrationManifest.journalTip.tag).toBe("0033_business_claim_identity_unique");
    expect(migrationManifest.requiredSchemaFingerprint).toBe(REQUIRED_SCHEMA_FINGERPRINT);
    expect(migrationManifest.files.map((file: { path: string }) => file.path))
      .toEqual([...migrationManifest.files.map((file: { path: string }) => file.path)].sort());
    for (const file of migrationManifest.files) {
      const bytes = readFileSync(join(artifact, "migrations", ...file.path.split("/")));
      expect(createHash("sha256").update(bytes).digest("hex")).toBe(file.sha256);
    }

    const topManifest = JSON.parse(
      readFileSync(join(artifact, "artifact-manifest.json"), "utf8")
    );
    const paths = topManifest.files.map((file: { path: string }) => file.path);
    expect(paths).toEqual([...paths].sort());
    for (const file of topManifest.files) {
      const member = join(artifact, ...file.path.split("/"));
      expect(createHash("sha256").update(readFileSync(member)).digest("hex")).toBe(file.sha256);
      expect(executableMode(member)).toBe(file.mode);
      expect(file.type).toBe("file");
    }
    const payload = {
      schemaVersion: topManifest.schemaVersion,
      releaseGitSha: topManifest.releaseGitSha,
      files: topManifest.files,
    };
    expect(createHash("sha256").update(JSON.stringify(payload)).digest("hex"))
      .toBe(topManifest.artifactManifestDigest);
    const verifier = execFileSync(
      "node",
      [join(repository, "scripts", "verify-release-artifact.mjs"), artifact, sha],
      { cwd: repository, encoding: "utf8" }
    ).trim();
    expect(verifier).toBe(topManifest.artifactManifestDigest);
  }, 300_000);

  it("rebuilds revision B in isolation and never consumes stale revision A dist bytes", () => {
    const repository = createCleanPackageRepository();
    linkFixtureDependencies(repository);
    runPnpm(repository, ["run", "build"]);
    writeFileSync(join(repository, "dist", "stale-revision-a.txt"), "must not ship\n");
    const main = join(repository, "client", "src", "main.tsx");
    writeFileSync(main, `${readFileSync(main, "utf8")}\nconsole.log("release-revision-b-marker");\n`);
    runGit(repository, "add", "client/src/main.tsx");
    runGit(repository, "commit", "-m", "revision B");

    const { result, artifact } = packageFixture(repository);
    expect(result.status, `${result.stdout}${result.stderr}`).toBe(0);
    expect(existsSync(join(artifact, "dist", "stale-revision-a.txt"))).toBe(false);
    expect(treeContainsText(join(artifact, "dist"), "release-revision-b-marker")).toBe(true);
  }, 300_000);

  it("fails closed when the original source changes during the isolated build", () => {
    const repository = createCleanPackageRepository();
    linkFixtureDependencies(repository);
    const packageJsonPath = join(repository, "package.json");
    const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));
    packageJson.scripts.build += " && node scripts/test-mutate-original-source.mjs";
    writeFileSync(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`);
    writeFileSync(
      join(repository, "scripts", "test-mutate-original-source.mjs"),
      'import { appendFileSync } from "node:fs"; appendFileSync(process.env.MUTATE_SOURCE_PATH, "\\n// mutated during package\\n");\n'
    );
    runGit(repository, "add", "package.json", "scripts/test-mutate-original-source.mjs");
    runGit(repository, "commit", "-m", "add mutation build fixture");
    const artifact = join(repository, "release-artifact");
    renameSync(createArtifact(repository, runGit(repository, "rev-parse", "HEAD"), "mutation-preserved"), artifact);
    verifyArtifactManifest({ artifactRoot: artifact, releaseGitSha: runGit(repository, "rev-parse", "HEAD") });
    const before = treeSnapshot(artifact);

    const packaged = packageFixture(repository, {
      MUTATE_SOURCE_PATH: join(repository, "client", "src", "main.tsx"),
    });
    expect(packaged.result.status).not.toBe(0);
    expect(`${packaged.result.stdout}${packaged.result.stderr}`).toMatch(/clean|changed|worktree|publication/i);
    expect(treeSnapshot(artifact)).toBe(before);
  }, 300_000);

  it("preserves an existing artifact byte-for-byte when the isolated build fails", () => {
    const repository = createCleanPackageRepository();
    linkFixtureDependencies(repository);
    const packageJsonPath = join(repository, "package.json");
    const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));
    packageJson.scripts.build = 'node -e "process.exit(23)"';
    writeFileSync(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`);
    runGit(repository, "add", "package.json");
    runGit(repository, "commit", "-m", "failing build fixture");
    const artifact = join(repository, "release-artifact");
    renameSync(createArtifact(repository, runGit(repository, "rev-parse", "HEAD"), "failure-preserved"), artifact);
    verifyArtifactManifest({ artifactRoot: artifact, releaseGitSha: runGit(repository, "rev-parse", "HEAD") });
    const before = treeSnapshot(artifact);

    const packaged = packageFixture(repository);
    expect(packaged.result.status).not.toBe(0);
    expect(`${packaged.result.stdout}${packaged.result.stderr}`).toMatch(/build|failed|exit code/i);
    expect(treeSnapshot(artifact)).toBe(before);
  }, 300_000);

  it("rejects ambiguous migration ledger tips", () => {
    const source = readFileSync(ledgerVerifier, "utf8").replace(/\s+/g, " ");
    const journal = JSON.parse(
      readFileSync(resolve("drizzle/meta/_journal.json"), "utf8")
    );
    const expected = journal.entries.at(-1);
    const migration = readFileSync(
      resolve(`drizzle/${expected.tag}.sql`),
      "utf8"
    );

    expect(expected.tag).toBe("0033_business_claim_identity_unique");
    expect(createHash("sha256").update(migration).digest("hex")).toMatch(
      /^[a-f0-9]{64}$/
    );
    expect(source).toContain("resolveExpectedMigration(migrationsRoot)");
    expect(source).toContain("String(actual.hash) !== expected.hash");
    expect(source).toContain(
      "WHERE created_at = (SELECT MAX(created_at) FROM __drizzle_migrations)"
    );
    expect(source).toContain("if (rows.length !== 1)");
    expect(source).toContain(
      "migration ledger has multiple rows at the latest timestamp"
    );
  });

  it("rejects an artifact whose manifest does not match the requested SHA", () => {
    const root = temporaryDirectory();
    const releaseRoot = join(root, "releases-root");
    const artifact = createArtifact(
      root,
      "2222222222222222222222222222222222222222",
      "bad"
    );

    const result = runResult(
      prepareScript,
      releaseRoot,
      artifact,
      "3333333333333333333333333333333333333333"
    );

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain(
      "wrong release SHA"
    );
  });

  it("rejects a symlinked artifact root and external symlinked artifact member", () => {
    const root = temporaryDirectory();
    const sha = "a".repeat(40);
    const artifact = createArtifact(root, sha, "links");
    const artifactLink = join(root, "artifact-link");
    symlinkSync(artifact, artifactLink, "junction");
    expect(runResult(prepareScript, join(root, "root-a"), artifactLink, sha).status).not.toBe(0);

    const external = join(root, "external.js");
    writeFileSync(external, "external\n");
    replaceWithSymlink(join(artifact, "dist", "index.js"), external);
    expect(runResult(prepareScript, join(root, "root-b"), artifact, sha).status).not.toBe(0);
  });

  it("rejects an existing release SHA path that is a symlink", () => {
    const root = temporaryDirectory();
    const releaseRoot = join(root, "release-root");
    const sha = "b".repeat(40);
    const external = join(root, "external-release");
    mkdirSync(join(releaseRoot, "releases"), { recursive: true });
    mkdirSync(external);
    symlinkSync(external, join(releaseRoot, "releases", sha), "junction");
    expect(runResult(prepareScript, releaseRoot, createArtifact(root, sha, "release-link"), sha).status).not.toBe(0);
  });

  it.each([
    ["manifest", "migrations/manifest.json"],
    ["migration SQL", "migrations/drizzle/0033_business_claim_identity_unique.sql"],
    ["runner", "migrations/bin/apply-release-migrations.mjs"],
  ])("rejects activation with an external symlinked %s", (_label, relativePath) => {
    const root = temporaryDirectory();
    const releaseRoot = join(root, "release-root");
    const sha = "c".repeat(40);
    run(prepareScript, releaseRoot, createArtifact(root, sha, `activation-${_label}`), sha);
    writeMigrationGate(releaseRoot, sha);
    const member = join(releaseRoot, "releases", sha, ...relativePath.split("/"));
    const external = join(root, `external-${String(_label).replaceAll(" ", "-")}`);
    writeFileSync(external, readFileSync(member));
    replaceWithSymlink(member, external);
    expect(runResult(activateScript, releaseRoot, sha).status).not.toBe(0);
  });

  it("rejects external symlinked gate evidence", () => {
    const root = temporaryDirectory();
    const releaseRoot = join(root, "release-root");
    const sha = "d".repeat(40);
    run(prepareScript, releaseRoot, createArtifact(root, sha, "gate-link"), sha);
    writeMigrationGate(releaseRoot, sha);
    const gate = join(releaseRoot, "migration-gates", `${sha}.json`);
    const external = join(root, "external-gate.json");
    writeFileSync(external, readFileSync(gate));
    replaceWithSymlink(gate, external);
    expect(runResult(activateScript, releaseRoot, sha).status).not.toBe(0);
  });

  it("never follows a symlinked migration root or manifest member even when external bytes match", () => {
    const root = temporaryDirectory();
    const sha = "e".repeat(40);
    const artifact = createArtifact(root, sha, "verifier-links");
    const migrations = join(artifact, "migrations");
    const rootLink = join(root, "migrations-link");
    symlinkSync(migrations, rootLink, "junction");
    expect(() => verifyPackagedMigrationInputs(rootLink, sha)).toThrow(/symlink|regular|real directory/i);

    const runner = join(migrations, "bin", "apply-release-migrations.mjs");
    const external = join(root, "external-runner.mjs");
    writeFileSync(external, readFileSync(runner));
    replaceWithSymlink(runner, external);
    expect(() => verifyPackagedMigrationInputs(migrations, sha)).toThrow(/symlink|regular|containment/i);
  });

  it("rejects link retargeting between lstat and descriptor open", () => {
    const root = temporaryDirectory();
    const sha = "1".repeat(40);
    const migrations = join(createArtifact(root, sha, "retarget"), "migrations");
    const manifest = join(migrations, "manifest.json");
    const external = join(root, "external-manifest.json");
    writeFileSync(external, readFileSync(manifest));
    let retargeted = false;
    expect(() => verifyImmutableInputs({
      migrationsRoot: migrations,
      releaseGitSha: sha,
      requiredSchemaFingerprint: REQUIRED_SCHEMA_FINGERPRINT,
      beforeRead(candidate: string) {
        if (!retargeted && candidate === resolve(manifest)) {
          retargeted = true;
          replaceWithSymlink(manifest, external);
        }
      },
    })).toThrow(/retarget|symlink|changed/i);
    expect(retargeted).toBe(true);
  });

  it("packaged preflight rejects a symlinked migration root before connecting", async () => {
    const root = temporaryDirectory();
    const sha = "2".repeat(40);
    const migrations = join(createArtifact(root, sha, "preflight-link"), "migrations");
    const linked = join(root, "linked-migrations");
    symlinkSync(migrations, linked, "junction");
    await expect(preflightMigrationState({
      connectionString: "mysql://unused.invalid/test",
      migrationsRoot: linked,
      releaseGitSha: sha,
    })).rejects.toThrow(/symlink|real non-symlink directory/i);
  });

  it("activates releases and swaps current with previous on rollback", () => {
    const root = temporaryDirectory();
    const releaseRoot = join(root, "releases-root");
    const firstSha = "4444444444444444444444444444444444444444";
    const secondSha = "5555555555555555555555555555555555555555";

    run(
      prepareScript,
      releaseRoot,
      createArtifact(root, firstSha, "first"),
      firstSha
    );
    writeMigrationGate(releaseRoot, firstSha);
    run(activateScript, releaseRoot, firstSha);
    run(
      prepareScript,
      releaseRoot,
      createArtifact(root, secondSha, "second"),
      secondSha
    );
    writeMigrationGate(releaseRoot, secondSha);
    run(activateScript, releaseRoot, secondSha);

    expect(
      readFileSync(join(releaseRoot, "current", "dist", "index.js"), "utf8")
    ).toContain("second");
    expect(
      readFileSync(join(releaseRoot, "previous", "dist", "index.js"), "utf8")
    ).toContain("first");

    run(rollbackScript, releaseRoot);

    expect(
      readFileSync(join(releaseRoot, "current", "dist", "index.js"), "utf8")
    ).toContain("first");
    expect(
      readFileSync(join(releaseRoot, "previous", "dist", "index.js"), "utf8")
    ).toContain("second");
  });

  it("refuses activation without exact SHA-bound migration gate evidence", () => {
    const root = temporaryDirectory();
    const releaseRoot = join(root, "releases-root");
    const sha = "6".repeat(40);
    run(prepareScript, releaseRoot, createArtifact(root, sha, "gate"), sha);

    const missing = runResult(activateScript, releaseRoot, sha);
    expect(missing.status).not.toBe(0);
    expect(missing.stderr).toMatch(/migration gate evidence/i);

    writeMigrationGate(releaseRoot, sha);
    const gatePath = join(releaseRoot, "migration-gates", `${sha}.json`);
    const mismatched = JSON.parse(readFileSync(gatePath, "utf8"));
    mismatched.journalTip.hash = "c".repeat(64);
    writeFileSync(gatePath, JSON.stringify(mismatched));
    const wrong = runResult(activateScript, releaseRoot, sha);
    expect(wrong.status).not.toBe(0);
    expect(wrong.stderr).toMatch(/does not match|migration gate/i);

    writeMigrationGate(releaseRoot, sha);
    const digestMismatched = JSON.parse(readFileSync(gatePath, "utf8"));
    digestMismatched.artifactManifestDigest = "0".repeat(64);
    writeFileSync(gatePath, JSON.stringify(digestMismatched));
    expect(runResult(activateScript, releaseRoot, sha).status).not.toBe(0);

    writeMigrationGate(releaseRoot, sha);
    expect(run(activateScript, releaseRoot, sha)).toContain("release activated");
  });

  it.each([
    ["missing engineVersion", (gate: Record<string, unknown>) => { delete gate.engineVersion; }],
    ["invalid engineVersion", (gate: Record<string, unknown>) => { gate.engineVersion = "8.4.11\nsecret"; }],
    ["missing sqlMode", (gate: Record<string, unknown>) => { delete gate.sqlMode; }],
    ["noncanonical sqlMode", (gate: Record<string, unknown>) => { gate.sqlMode = "STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION"; }],
    ["missing database target", (gate: Record<string, unknown>) => { delete gate.databaseTargetSha256; }],
    ["wrong database target", (gate: Record<string, unknown>) => { gate.databaseTargetSha256 = "c".repeat(64); }],
  ])("refuses activation for %s gate metadata", (_label, mutate) => {
    const root = temporaryDirectory();
    const releaseRoot = join(root, "activation-contract-root");
    const sha = "3".repeat(40);
    run(prepareScript, releaseRoot, createArtifact(root, sha, `gate-${_label}`), sha);
    writeMigrationGate(releaseRoot, sha);
    const gatePath = join(releaseRoot, "migration-gates", `${sha}.json`);
    const gate = JSON.parse(readFileSync(gatePath, "utf8"));
    mutate(gate);
    writeFileSync(gatePath, JSON.stringify(gate));
    expect(runResult(activateScript, releaseRoot, sha).status).not.toBe(0);
  });

  it("requires the protected database-target digest at activation", () => {
    const root = temporaryDirectory();
    const releaseRoot = join(root, "activation-target-env-root");
    const sha = "4".repeat(40);
    run(prepareScript, releaseRoot, createArtifact(root, sha, "gate-target-env"), sha);
    writeMigrationGate(releaseRoot, sha);
    const result = spawnSync("bash", [activateScript, releaseRoot, sha], {
      encoding: "utf8",
      env: { ...process.env, EXPECTED_DATABASE_TARGET_SHA256: "", MSYS: "winsymlinks:nativestrict" },
    });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toMatch(/EXPECTED_DATABASE_TARGET_SHA256/);
  });

  it("refuses activation when a hashed immutable migration input is altered", () => {
    const root = temporaryDirectory();
    const releaseRoot = join(root, "releases-root");
    const sha = "7".repeat(40);
    run(prepareScript, releaseRoot, createArtifact(root, sha, "hash"), sha);
    writeMigrationGate(releaseRoot, sha);
    const migration = join(
      releaseRoot,
      "releases",
      sha,
      "migrations",
      "drizzle",
      "0033_business_claim_identity_unique.sql"
    );
    spawnSync("bash", ["-c", 'chmod u+w -- "$1"', "chmod", migration]);
    writeFileSync(migration, "tampered\n");

    const result = runResult(activateScript, releaseRoot, sha);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toMatch(/hash|artifact|immutable migration input/i);
  });

  it.each([
    ["dist app bundle", "dist/index.js"],
    ["release operation", "ops/release/marker.sh"],
    ["migration member", "migrations/drizzle/0033_business_claim_identity_unique.sql"],
    ["top manifest", "artifact-manifest.json"],
  ])("refuses activation after mutation of %s", (_label, relativePath) => {
    const root = temporaryDirectory();
    const releaseRoot = join(root, "activation-mutation-root");
    const sha = "f".repeat(40);
    run(prepareScript, releaseRoot, createArtifact(root, sha, `activation-${_label}`), sha);
    writeMigrationGate(releaseRoot, sha);
    const member = join(releaseRoot, "releases", sha, ...relativePath.split("/"));
    chmodSync(member, 0o644);
    writeFileSync(member, "tampered\n");
    expect(runResult(activateScript, releaseRoot, sha).status).not.toBe(0);
  });

  it("separates generation from reviewed migration application", () => {
    const packageJson = JSON.parse(readFileSync(resolve("package.json"), "utf8"));
    expect(packageJson.scripts["db:generate"]).toBe("drizzle-kit generate");
    expect(packageJson.scripts["db:migrate"]).toBe("drizzle-kit migrate");
    expect(packageJson.scripts["db:push"]).toBe("pnpm run db:migrate");
    expect(packageJson.scripts["release:migrate"]).toBe(
      "bash ops/release/migrate-release.sh"
    );
    for (const name of ["db:migrate", "db:push", "release:migrate"]) {
      expect(packageJson.scripts[name]).not.toMatch(/generate/i);
    }
  });

  it("keeps preflight scripts mutation-free and release migration traffic-free", () => {
    const preflight = readFileSync(
      resolve("scripts/preflight-migration-state.mjs"),
      "utf8"
    );
    expect(preflight).not.toMatch(
      /\b(?:INSERT|UPDATE|DELETE|ALTER|CREATE|DROP|REPLACE|TRUNCATE)\b/i
    );
    const migrationCommand = readFileSync(
      resolve("ops/release/migrate-release.sh"),
      "utf8"
    );
    expect(migrationCommand).not.toMatch(
      /(?:activate-release|assign-slot|switch-traffic|nginx|systemctl)/i
    );
    expect(migrationCommand).not.toMatch(/\$DATABASE_URL|DATABASE_URL=.*\$[0-9]/);
  });
});
