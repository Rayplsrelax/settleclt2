import type { Express } from "express";
import path from "path";
import { resolveStorageDirectory } from "../storage-path";
import { openExistingStorageFile } from "../storage-filesystem";

/**
 * Storage proxy — serves files from the local filesystem.
 *
 * Originally proxied to Manus Forge API for presigned URLs. After migration
 * to self-hosted infrastructure, blog cover images and other stored assets
 * are served from the configured persistent storage directory. Production
 * requires SETTLECLT_STORAGE_DIR; development defaults to
 * `public/manus-storage/` on disk.
 *
 * New uploads via `storagePut()` also write to this directory, so the
 * `/manus-storage/*` route handles both legacy blog covers and new
 * business photos.
 */
export function registerStorageProxy(app: Express) {
  app.get("/manus-storage/*", async (req, res) => {
    const key = (req.params as any)[0] as string;
    if (!key) {
      res.status(400).send("Missing storage key");
      return;
    }

    const storageDir = resolveStorageDirectory(
      process.env,
      process.cwd(),
      process.env.NODE_ENV === "production"
    );
    let filePath: string;
    let fileHandle: import("node:fs").promises.FileHandle;
    try {
      const opened = await openExistingStorageFile(storageDir, key);
      filePath = opened.path;
      fileHandle = opened.handle;
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      res
        .status(code === "ENOENT" ? 404 : 403)
        .send(code === "ENOENT" ? "File not found" : "Forbidden");
      return;
    }

    // Set appropriate content type based on extension
    const ext = path.extname(filePath).toLowerCase();
    const contentTypes: Record<string, string> = {
      ".png": "image/png",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".gif": "image/gif",
      ".webp": "image/webp",
      ".svg": "image/svg+xml",
    };
    res.set("Content-Type", contentTypes[ext] || "application/octet-stream");
    res.set("Cache-Control", "public, max-age=31536000, immutable");

    const stream = fileHandle.createReadStream();
    stream.on("error", async err => {
      console.error("[StorageProxy] stream error:", err);
      await fileHandle.close().catch(() => undefined);
      if (!res.headersSent) {
        res.status(500).send("Error reading file");
      }
    });
    stream.on("close", () => {
      void fileHandle.close().catch(() => undefined);
    });
    stream.pipe(res);
  });
}
