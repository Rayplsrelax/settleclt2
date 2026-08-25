import { createHash } from "node:crypto";
import {
  chmodSync,
  lstatSync,
  mkdirSync,
  readdirSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { relative, resolve, sep } from "node:path";
import {
  readStableRegularFile,
  requireRealDirectory,
} from "./migration-artifact-lib.mjs";

export const ARTIFACT_MANIFEST_NAME = "artifact-manifest.json";
const ARTIFACT_ROOTS = ["dist", "ops/release", "migrations"];
const SHA_PATTERN = /^[0-9a-f]{40}$/;
const DIGEST_PATTERN = /^[0-9a-f]{64}$/;

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function portablePath(root, candidate) {
  return relative(root, candidate).split(sep).join("/");
}

function modeString(stat) {
  // Only executable bits are release-significant; prepare-release removes write
  // bits after verification without changing this normalized mode contract.
  return (stat.mode & 0o111).toString(8).padStart(4, "0");
}

function identityMetadata(stat, type) {
  return {
    type,
    device: String(stat.dev),
    inode: String(stat.ino),
    mode: stat.mode,
    size: type === "file" ? stat.size : undefined,
    modifiedMs: stat.mtimeMs,
  };
}

function collectMembers(artifactRoot) {
  const root = requireRealDirectory(artifactRoot, "artifact root");
  const members = [];
  const tree = [{ path: ".", ...identityMetadata(lstatSync(root), "directory") }];
  const allowedTopLevel = new Set(["dist", "ops", "migrations", ARTIFACT_MANIFEST_NAME]);
  for (const entry of readdirSync(root)) {
    if (!allowedTopLevel.has(entry)) {
      throw new Error(`artifact contains an unexpected top-level member: ${entry}`);
    }
  }
  const opsRoot = resolve(root, "ops");
  const opsStat = lstatSync(opsRoot, { throwIfNoEntry: false });
  if (!opsStat || opsStat.isSymbolicLink() || !opsStat.isDirectory()) {
    throw new Error("artifact ops must be a real non-symlink directory");
  }
  const opsEntries = readdirSync(opsRoot);
  if (opsEntries.length !== 1 || opsEntries[0] !== "release") {
    throw new Error("artifact ops contains an extra or missing member");
  }
  const visit = candidate => {
    const stat = lstatSync(candidate, { throwIfNoEntry: false });
    if (!stat) throw new Error(`artifact member disappeared: ${portablePath(root, candidate)}`);
    if (stat.isSymbolicLink()) {
      throw new Error(`artifact contains a symbolic link: ${portablePath(root, candidate)}`);
    }
    const path = portablePath(root, candidate);
    if (stat.isDirectory()) {
      tree.push({ path, ...identityMetadata(stat, "directory") });
      for (const entry of readdirSync(candidate).sort()) {
        visit(resolve(candidate, entry));
      }
      return;
    }
    if (!stat.isFile()) {
      throw new Error(`artifact member is not a regular file: ${path}`);
    }
    tree.push({ path, ...identityMetadata(stat, "file") });
    members.push({ path, stat });
  };

  for (const relativeRoot of ARTIFACT_ROOTS) {
    const candidate = resolve(root, ...relativeRoot.split("/"));
    const stat = lstatSync(candidate, { throwIfNoEntry: false });
    if (!stat || stat.isSymbolicLink() || !stat.isDirectory()) {
      throw new Error(`artifact ${relativeRoot} must be a real non-symlink directory`);
    }
    visit(candidate);
  }
  const manifestPath = resolve(root, ARTIFACT_MANIFEST_NAME);
  const manifestStat = lstatSync(manifestPath, { throwIfNoEntry: false });
  if (manifestStat) {
    if (manifestStat.isSymbolicLink() || !manifestStat.isFile()) {
      throw new Error("artifact manifest must be a regular non-symlink file");
    }
    tree.push({
      path: ARTIFACT_MANIFEST_NAME,
      ...identityMetadata(manifestStat, "file"),
    });
  }
  members.sort((left, right) => left.path < right.path ? -1 : left.path > right.path ? 1 : 0);
  tree.sort((left, right) => left.path < right.path ? -1 : left.path > right.path ? 1 : 0);
  return { root, members, tree };
}

function manifestPayload(releaseGitSha, files) {
  return { schemaVersion: 1, releaseGitSha, files };
}

function digestPayload(payload) {
  return sha256(Buffer.from(JSON.stringify(payload), "utf8"));
}

export function createArtifactManifest(artifactRoot, releaseGitSha) {
  if (!SHA_PATTERN.test(String(releaseGitSha))) {
    throw new Error("release SHA must be a full lowercase SHA");
  }
  const { root, members } = collectMembers(artifactRoot);
  const files = members.map(({ path, stat }) => {
    const bytes = readStableRegularFile(resolve(root, ...path.split("/")), root, `artifact input ${path}`);
    return { path, type: "file", mode: modeString(stat), sha256: sha256(bytes) };
  });
  const payload = manifestPayload(releaseGitSha, files);
  const manifest = { ...payload, artifactManifestDigest: digestPayload(payload) };
  const target = resolve(root, ARTIFACT_MANIFEST_NAME);
  const temporary = `${target}.tmp-${process.pid}`;
  mkdirSync(root, { recursive: true });
  rmSync(temporary, { force: true });
  writeFileSync(temporary, `${JSON.stringify(manifest, null, 2)}\n`, { encoding: "utf8", mode: 0o444 });
  const existing = lstatSync(target, { throwIfNoEntry: false });
  if (existing) {
    if (existing.isSymbolicLink() || !existing.isFile()) {
      rmSync(temporary, { force: true });
      throw new Error("artifact manifest target must be a regular non-symlink file");
    }
    chmodSync(target, 0o644);
    rmSync(target);
  }
  renameSync(temporary, target);
  return manifest;
}

export function verifyArtifactManifest({ artifactRoot, releaseGitSha, beforeRead } = {}) {
  if (!SHA_PATTERN.test(String(releaseGitSha))) {
    throw new Error("release SHA must be a full lowercase SHA");
  }
  const root = requireRealDirectory(artifactRoot, "artifact root");
  const manifestPath = resolve(root, ARTIFACT_MANIFEST_NAME);
  const manifestBytes = readStableRegularFile(
    manifestPath,
    root,
    "top-level artifact manifest",
    beforeRead
  );
  let manifest;
  try {
    manifest = JSON.parse(manifestBytes.toString("utf8"));
  } catch {
    throw new Error("top-level artifact manifest is invalid JSON");
  }
  if (
    manifest.schemaVersion !== 1 ||
    manifest.releaseGitSha !== releaseGitSha ||
    !Array.isArray(manifest.files) ||
    !DIGEST_PATTERN.test(String(manifest.artifactManifestDigest))
  ) {
    throw new Error("top-level artifact manifest is invalid or has the wrong release SHA");
  }
  const payload = manifestPayload(manifest.releaseGitSha, manifest.files);
  if (digestPayload(payload) !== manifest.artifactManifestDigest) {
    throw new Error("artifact manifest digest mismatch");
  }

  const { members, tree: initialTree } = collectMembers(root);
  const actualPaths = members.map(member => member.path);
  const expectedPaths = [];
  const seen = new Set();
  for (const file of manifest.files) {
    if (
      typeof file?.path !== "string" ||
      file.path.includes("\\") ||
      file.path.split("/").some(part => !part || part === "." || part === "..") ||
      file.type !== "file" ||
      !/^[0-7]{4}$/.test(String(file.mode)) ||
      !DIGEST_PATTERN.test(String(file.sha256)) ||
      seen.has(file.path)
    ) {
      throw new Error("artifact manifest contains an invalid or duplicate member");
    }
    seen.add(file.path);
    expectedPaths.push(file.path);
  }
  const sortedExpected = [...expectedPaths].sort();
  if (JSON.stringify(expectedPaths) !== JSON.stringify(sortedExpected)) {
    throw new Error("artifact manifest paths must be sorted");
  }
  if (JSON.stringify(actualPaths) !== JSON.stringify(expectedPaths)) {
    throw new Error("artifact file set has extra or missing members");
  }

  for (let index = 0; index < manifest.files.length; index += 1) {
    const file = manifest.files[index];
    const candidate = resolve(root, ...file.path.split("/"));
    const bytes = readStableRegularFile(candidate, root, `artifact member ${file.path}`, beforeRead);
    const stat = lstatSync(candidate);
    if (modeString(stat) !== file.mode) {
      throw new Error(`artifact member mode mismatch: ${file.path}`);
    }
    if (sha256(bytes) !== file.sha256) {
      throw new Error(`artifact member hash mismatch: ${file.path}`);
    }
  }
  const releaseManifestBytes = readStableRegularFile(
    resolve(root, "dist", "release-manifest.json"),
    root,
    "deployable release manifest",
    beforeRead
  );
  const releaseManifest = JSON.parse(releaseManifestBytes.toString("utf8"));
  if (
    releaseManifest.schemaVersion !== 1 ||
    releaseManifest.gitSha !== releaseGitSha ||
    releaseManifest.deployable !== true ||
    releaseManifest.manifestPurpose !== "clean-release-package"
  ) {
    throw new Error("deployable release manifest does not match the clean release package");
  }
  const { tree: finalTree } = collectMembers(root);
  if (JSON.stringify(finalTree) !== JSON.stringify(initialTree)) {
    throw new Error("artifact tree changed during verification (extra, missing, or retargeted member)");
  }
  return { manifest, root, manifestBytes };
}
