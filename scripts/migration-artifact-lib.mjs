import { createHash } from "node:crypto";
import {
  closeSync,
  constants,
  fstatSync,
  lstatSync,
  openSync,
  readFileSync,
  realpathSync,
} from "node:fs";
import { isAbsolute, relative, resolve, sep } from "node:path";

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function isContained(root, candidate) {
  const rel = relative(root, candidate);
  return rel === "" || (!rel.startsWith(`..${sep}`) && rel !== ".." && !isAbsolute(rel));
}

function sameIdentity(left, right) {
  return (
    left.dev === right.dev &&
    left.ino === right.ino &&
    left.size === right.size &&
    left.mtimeMs === right.mtimeMs
  );
}

export function requireRealDirectory(directory, label = "migration root") {
  const absolute = resolve(directory);
  const stat = lstatSync(absolute, { throwIfNoEntry: false });
  if (!stat || stat.isSymbolicLink() || !stat.isDirectory()) {
    throw new Error(`${label} must be a real non-symlink directory`);
  }
  const real = realpathSync.native(absolute);
  if (resolve(real) !== absolute) {
    throw new Error(`${label} must not resolve through a symlink`);
  }
  return real;
}

function safeMemberPath(root, relativePath) {
  if (
    typeof relativePath !== "string" ||
    relativePath.length === 0 ||
    relativePath.includes("\\") ||
    relativePath.split("/").some(part => !part || part === "." || part === "..")
  ) {
    throw new Error("migration manifest contains an unsafe path");
  }
  const candidate = resolve(root, ...relativePath.split("/"));
  if (!isContained(root, candidate) || candidate === root) {
    throw new Error("migration manifest path escapes the immutable artifact");
  }
  return candidate;
}

export function readStableRegularFile(path, containmentRoot, label, beforeRead) {
  const absolute = resolve(path);
  const root = resolve(containmentRoot);
  if (!isContained(root, absolute)) throw new Error(`${label} escapes its containment root`);

  const relativeParts = relative(root, absolute).split(sep);
  let cursor = root;
  for (let index = 0; index < relativeParts.length - 1; index += 1) {
    cursor = resolve(cursor, relativeParts[index]);
    const component = lstatSync(cursor, { throwIfNoEntry: false });
    if (!component || component.isSymbolicLink() || !component.isDirectory()) {
      throw new Error(`${label} has a symlinked or non-directory parent`);
    }
  }

  const before = lstatSync(absolute, { throwIfNoEntry: false });
  if (!before || before.isSymbolicLink() || !before.isFile()) {
    throw new Error(`${label} must be a regular non-symlink file`);
  }
  const beforeReal = realpathSync.native(absolute);
  if (!isContained(root, beforeReal) || resolve(beforeReal) !== absolute) {
    throw new Error(`${label} fails realpath containment`);
  }
  if (beforeRead) beforeRead(absolute);

  const noFollow = constants.O_NOFOLLOW ?? 0;
  const descriptor = openSync(absolute, constants.O_RDONLY | noFollow);
  try {
    const opened = fstatSync(descriptor);
    if (!opened.isFile() || !sameIdentity(before, opened)) {
      throw new Error(`${label} changed or was retargeted before opening`);
    }
    if (process.platform === "linux") {
      const descriptorReal = realpathSync.native(`/proc/self/fd/${descriptor}`);
      if (!isContained(root, descriptorReal) || resolve(descriptorReal) !== absolute) {
        throw new Error(`${label} descriptor escapes containment`);
      }
    }
    const bytes = readFileSync(descriptor);
    const openedAfter = fstatSync(descriptor);
    const after = lstatSync(absolute, { throwIfNoEntry: false });
    const afterReal = after && !after.isSymbolicLink() ? realpathSync.native(absolute) : null;
    if (
      !after ||
      after.isSymbolicLink() ||
      !after.isFile() ||
      afterReal === null ||
      resolve(afterReal) !== absolute ||
      !isContained(root, afterReal) ||
      !sameIdentity(before, openedAfter) ||
      !sameIdentity(before, after)
    ) {
      throw new Error(`${label} changed or was retargeted while reading`);
    }
    return bytes;
  } finally {
    closeSync(descriptor);
  }
}

export function verifyPackagedMigrationInputs({
  migrationsRoot,
  releaseGitSha,
  requiredSchemaFingerprint,
  beforeRead,
}) {
  const root = requireRealDirectory(migrationsRoot, "packaged migration root");
  const manifestPath = resolve(root, "manifest.json");
  const manifestBytes = readStableRegularFile(
    manifestPath,
    root,
    "packaged migration manifest",
    beforeRead
  );
  const manifest = JSON.parse(manifestBytes.toString("utf8"));
  if (
    manifest.schemaVersion !== 1 ||
    manifest.releaseGitSha !== releaseGitSha ||
    !Array.isArray(manifest.files) ||
    !/^[0-9a-f]{64}$/.test(String(manifest.requiredSchemaFingerprint)) ||
    manifest.requiredSchemaFingerprint !== requiredSchemaFingerprint
  ) {
    throw new Error("invalid or unknown packaged migration manifest");
  }

  const seen = new Set();
  const verifiedBytes = new Map();
  for (const file of manifest.files) {
    if (
      typeof file?.path !== "string" ||
      !/^[0-9a-f]{64}$/.test(String(file.sha256)) ||
      seen.has(file.path)
    ) {
      throw new Error("migration manifest contains a duplicate or invalid input");
    }
    seen.add(file.path);
    const input = safeMemberPath(root, file.path);
    const bytes = readStableRegularFile(input, root, `packaged migration input ${file.path}`, beforeRead);
    if (sha256(bytes) !== file.sha256) {
      throw new Error(`packaged migration input hash mismatch: ${file.path}`);
    }
    verifiedBytes.set(file.path, bytes);
  }

  const journalPath = "drizzle/meta/_journal.json";
  const journalBytes = verifiedBytes.get(journalPath);
  if (!journalBytes) throw new Error("migration journal is not covered by the immutable manifest");
  const journal = JSON.parse(journalBytes.toString("utf8"));
  if (!Array.isArray(journal.entries) || journal.entries.length === 0) {
    throw new Error("migration journal is empty");
  }
  const plan = journal.entries.map(entry => {
    if (!/^[0-9]{4}_[A-Za-z0-9_]+$/.test(String(entry.tag))) {
      throw new Error("migration journal contains an unsafe tag");
    }
    const memberPath = `drizzle/${entry.tag}.sql`;
    const sqlBytes = verifiedBytes.get(memberPath);
    if (!sqlBytes) throw new Error(`migration is not covered by the immutable manifest: ${entry.tag}`);
    return {
      ...entry,
      path: safeMemberPath(root, memberPath),
      sql: sqlBytes.toString("utf8"),
      hash: sha256(sqlBytes),
    };
  });
  const tip = plan.at(-1);
  if (
    manifest.journalTip?.tag !== tip.tag ||
    Number(manifest.journalTip?.when) !== Number(tip.when) ||
    manifest.journalTip?.hash !== tip.hash
  ) {
    throw new Error("packaged migration journal tip does not match its manifest");
  }
  return { manifest, plan, root };
}
