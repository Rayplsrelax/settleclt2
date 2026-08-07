// Local filesystem storage helpers.
//
// Originally used Manus Forge API for cloud storage. After migration to
// self-hosted infrastructure, files are stored on local disk under
// `public/manus-storage/` and served via the `/manus-storage/*` route
// registered in `_core/storageProxy.ts`.
//
// The return shape ({ key, url }) is kept the same so callers in routers.ts,
// imageGeneration.ts, etc. don't need changes.

import path from "path";
import fs from "fs";

const STORAGE_DIR = path.resolve(process.cwd(), "public", "manus-storage");

function normalizeKey(relKey: string): string {
  return path.normalize(relKey).replace(/^[/\\]+/, "");
}

export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream"
): Promise<{ key: string; url: string }> {
  const key = normalizeKey(relKey);
  const filePath = path.resolve(STORAGE_DIR, key);

  // Validate path traversal BEFORE any filesystem operations
  if (!filePath.startsWith(STORAGE_DIR + path.sep)) {
    throw new Error("Invalid storage key: path traversal detected");
  }

  // Ensure the storage directory exists
  const dir = path.dirname(filePath);
  await fs.promises.mkdir(dir, { recursive: true });

  const buffer = Buffer.isBuffer(data)
    ? data
    : typeof data === "string"
      ? Buffer.from(data, "utf-8")
      : Buffer.from(data);

  await fs.promises.writeFile(filePath, buffer);

  // Return a URL that the browser can fetch — served by the storage proxy route
  const url = `/manus-storage/${key}`;
  return { key, url };
}

export async function storageGet(relKey: string): Promise<{ key: string; url: string }> {
  const key = normalizeKey(relKey);
  const filePath = path.resolve(STORAGE_DIR, key);

  if (!filePath.startsWith(STORAGE_DIR + path.sep)) {
    throw new Error("Invalid storage key: path traversal detected");
  }

  try {
    await fs.promises.access(filePath, fs.constants.F_OK);
  } catch {
    throw new Error(`File not found: ${key}`);
  }

  return { key, url: `/manus-storage/${key}` };
}
