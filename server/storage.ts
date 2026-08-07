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
  return relKey.replace(/^\/+/, "").replace(/\.\.\//g, "");
}

export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream"
): Promise<{ key: string; url: string }> {
  const key = normalizeKey(relKey);

  // Ensure the storage directory exists
  const dir = path.dirname(path.resolve(STORAGE_DIR, key));
  fs.mkdirSync(dir, { recursive: true });

  const filePath = path.resolve(STORAGE_DIR, key);

  // Ensure resolved path stays within storage dir
  if (!filePath.startsWith(STORAGE_DIR + path.sep)) {
    throw new Error("Invalid storage key: path traversal detected");
  }

  const buffer = Buffer.isBuffer(data)
    ? data
    : typeof data === "string"
      ? Buffer.from(data, "utf-8")
      : Buffer.from(data);

  fs.writeFileSync(filePath, buffer);

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

  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${key}`);
  }

  return { key, url: `/manus-storage/${key}` };
}
