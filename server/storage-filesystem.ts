import { randomUUID } from "node:crypto";
import { constants } from "node:fs";
import { promises as fs } from "node:fs";
import * as path from "node:path";

const productionStorage = process.env.NODE_ENV === "production";

function assertTrustedDirectory(
  stat: import("node:fs").Stats,
  storageDirectory: boolean
): void {
  if (!productionStorage) return;
  if (stat.uid !== 0)
    throw new Error("Production storage directories must be root-owned");
  if (storageDirectory && (stat.mode & 0o1000) === 0) {
    throw new Error("Production storage directories must use the sticky bit");
  }
  if (!storageDirectory && (stat.mode & 0o022) !== 0) {
    throw new Error(
      "Production storage ancestors must not be group/world writable"
    );
  }
}

export function normalizeStorageKey(key: string): string {
  if (!key || key.includes("\0")) throw new Error("Invalid storage key");
  const portable = key.replace(/\\/g, "/");
  if (path.posix.isAbsolute(portable) || path.win32.isAbsolute(key)) {
    throw new Error("Invalid storage key: absolute paths are not allowed");
  }
  const segments = portable.split("/").filter(Boolean);
  if (
    segments.length === 0 ||
    segments.some(segment => segment === "." || segment === "..")
  ) {
    throw new Error("Invalid storage key: path traversal detected");
  }
  return segments.join("/");
}

export async function validateStorageDirectory(
  root: string,
  create = false
): Promise<string> {
  if (create) {
    const absolute = path.resolve(root);
    const filesystemRoot = path.parse(absolute).root;
    const relative = path.relative(filesystemRoot, absolute);
    const segments = relative ? relative.split(path.sep).filter(Boolean) : [];
    let current = filesystemRoot;
    for (const segment of segments) {
      current = path.join(current, segment);
      let stat;
      try {
        stat = await fs.lstat(current);
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
        await fs.mkdir(current, { mode: 0o750 });
        stat = await fs.lstat(current);
      }
      if (stat.isSymbolicLink() || !stat.isDirectory()) {
        throw new Error(
          "Storage root contains a symbolic link or non-directory"
        );
      }
    }
  }
  const absolute = path.resolve(root);
  const filesystemRoot = path.parse(absolute).root;
  const relative = path.relative(filesystemRoot, absolute);
  const segments = relative ? relative.split(path.sep).filter(Boolean) : [];
  let current = filesystemRoot;
  for (const segment of segments) {
    current = path.join(current, segment);
    const stat = await fs.lstat(current);
    if (stat.isSymbolicLink() || !stat.isDirectory()) {
      throw new Error("Storage root contains a symbolic link or non-directory");
    }
    assertTrustedDirectory(stat, current === absolute);
  }
  return fs.realpath(absolute);
}

function assertContained(root: string, candidate: string): void {
  if (candidate !== root && !candidate.startsWith(`${root}${path.sep}`)) {
    throw new Error("Storage path escaped the configured root");
  }
}

async function resolveParent(
  root: string,
  key: string,
  create: boolean
): Promise<{
  canonicalRoot: string;
  normalizedKey: string;
  parent: string;
  target: string;
}> {
  const normalizedKey = normalizeStorageKey(key);
  const segments = normalizedKey.split("/");
  const canonicalRoot = await validateStorageDirectory(root, create);
  let parent = canonicalRoot;

  for (const segment of segments.slice(0, -1)) {
    const next = path.join(parent, segment);
    if (create) {
      try {
        await fs.mkdir(next, { mode: 0o750 });
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
      }
    }
    const segmentStat = await fs.lstat(next);
    if (segmentStat.isSymbolicLink() || !segmentStat.isDirectory()) {
      throw new Error("Storage path contains a symbolic link or non-directory");
    }
    assertTrustedDirectory(segmentStat, true);
    const canonicalSegment = await fs.realpath(next);
    assertContained(canonicalRoot, canonicalSegment);
    parent = canonicalSegment;
  }

  const target = path.join(parent, segments[segments.length - 1]);
  assertContained(canonicalRoot, target);
  return { canonicalRoot, normalizedKey, parent, target };
}

export async function openExistingStorageFile(
  root: string,
  key: string
): Promise<{
  key: string;
  path: string;
  handle: import("node:fs").promises.FileHandle;
}> {
  const resolved = await resolveParent(root, key, false);
  if (productionStorage && constants.O_NOFOLLOW === undefined) {
    throw new Error("Production storage requires O_NOFOLLOW support");
  }
  const noFollow = constants.O_NOFOLLOW ?? 0;
  const handle = await fs.open(resolved.target, constants.O_RDONLY | noFollow);
  try {
    const targetStat = await handle.stat();
    if (!targetStat.isFile())
      throw new Error("Storage target must be a regular non-symlink file");
    const canonicalTarget = await fs.realpath(resolved.target);
    assertContained(resolved.canonicalRoot, canonicalTarget);
    return { key: resolved.normalizedKey, path: canonicalTarget, handle };
  } catch (error) {
    await handle.close();
    throw error;
  }
}

export async function resolveExistingStorageFile(
  root: string,
  key: string
): Promise<{ key: string; path: string }> {
  const opened = await openExistingStorageFile(root, key);
  await opened.handle.close();
  return { key: opened.key, path: opened.path };
}

export async function writeStorageFile(
  root: string,
  key: string,
  data: Buffer,
  allowCreateRoot = true
): Promise<string> {
  const resolved = await resolveParent(root, key, allowCreateRoot);
  const temporary = path.join(resolved.parent, `.upload-${randomUUID()}.tmp`);
  let temporaryHandle: import("node:fs").promises.FileHandle | undefined;
  try {
    temporaryHandle = await fs.open(
      temporary,
      constants.O_CREAT | constants.O_EXCL | constants.O_WRONLY,
      0o640
    );
    await temporaryHandle.writeFile(data);
    await temporaryHandle.sync();
    await temporaryHandle.close();
    temporaryHandle = undefined;

    const parentHandle = await fs.open(resolved.parent, constants.O_RDONLY);
    try {
      const parentStat = await parentHandle.stat();
      if (!parentStat.isDirectory())
        throw new Error("Storage parent is not a directory");
      const canonicalParent = await fs.realpath(resolved.parent);
      assertContained(resolved.canonicalRoot, canonicalParent);
      await fs.link(temporary, resolved.target);
    } finally {
      await parentHandle.close();
    }
  } finally {
    await temporaryHandle?.close().catch(() => undefined);
    await fs.rm(temporary, { force: true });
  }
  return resolved.normalizedKey;
}
