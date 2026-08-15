// Local filesystem storage helpers.
//
// Originally used Manus Forge API for cloud storage. After migration to
// self-hosted infrastructure, files are stored on local disk. Production
// requires SETTLECLT_STORAGE_DIR to point outside immutable releases; local
// development defaults to `public/manus-storage/`. Files are served by the
// `/manus-storage/*` route
// registered in `_core/storageProxy.ts`.
//
// The return shape ({ key, url }) is kept the same so callers in routers.ts,
// imageGeneration.ts, etc. don't need changes.

import { resolveStorageDirectory } from "./storage-path";
import {
  resolveExistingStorageFile,
  writeStorageFile,
} from "./storage-filesystem";

const STORAGE_DIR = resolveStorageDirectory(
  process.env,
  process.cwd(),
  process.env.NODE_ENV === "production"
);

export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream"
): Promise<{ key: string; url: string }> {
  const buffer = Buffer.isBuffer(data)
    ? data
    : typeof data === "string"
      ? Buffer.from(data, "utf-8")
      : Buffer.from(data);

  const key = await writeStorageFile(
    STORAGE_DIR,
    relKey,
    buffer,
    process.env.NODE_ENV !== "production"
  );

  // Return a URL that the browser can fetch — served by the storage proxy route
  const url = `/manus-storage/${key}`;
  return { key, url };
}

export async function storageGet(
  relKey: string
): Promise<{ key: string; url: string }> {
  const { key } = await resolveExistingStorageFile(STORAGE_DIR, relKey);
  return { key, url: `/manus-storage/${key}` };
}
