import { execFileSync, spawnSync } from "node:child_process";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

const prepareScript = resolve("ops/release/prepare-release.sh");
const activateScript = resolve("ops/release/activate-release.sh");
const rollbackScript = resolve("ops/release/rollback-release.sh");
const ledgerVerifier = resolve("scripts/verify-migration-ledger.mjs");
const temporaryDirectories: string[] = [];

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
    })
  );
  return artifact;
}

function run(script: string, ...args: string[]): string {
  return execFileSync("bash", [script, ...args], {
    encoding: "utf8",
    env: { ...process.env, MSYS: "winsymlinks:nativestrict" },
  });
}

function runResult(script: string, ...args: string[]) {
  return spawnSync("bash", [script, ...args], {
    encoding: "utf8",
    env: { ...process.env, MSYS: "winsymlinks:nativestrict" },
  });
}

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
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
});

describe("immutable release scripts", () => {
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

  it("packages release operations alongside dist", () => {
    const packageScript = resolve("scripts/package-release-artifact.mjs");
    const artifact = resolve("release-artifact");
    expect(readFileSync(packageScript, "utf8")).toContain(
      'cpSync(releaseOps, resolve(artifact, "ops", "release")'
    );
    expect(
      readFileSync(resolve("ops/release/systemd/settleclt@.service"), "utf8")
    ).toContain("ExecStart=/usr/bin/node dist/index.js");
    expect(
      readFileSync(resolve("ops/release/monitor-release.sh"), "utf8")
    ).toContain("monitoring hold");
  });

  it("rejects ambiguous migration ledger tips", () => {
    const source = readFileSync(ledgerVerifier, "utf8").replace(/\s+/g, " ");
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
      "artifact release manifest does not match the requested release"
    );
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
    run(activateScript, releaseRoot, firstSha);
    run(
      prepareScript,
      releaseRoot,
      createArtifact(root, secondSha, "second"),
      secondSha
    );
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
});
