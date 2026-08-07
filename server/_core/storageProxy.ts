import type { Express } from "express";
import path from "path";
import fs from "fs";

/**
 * Storage proxy — serves files from the local filesystem.
 *
 * Originally proxied to Manus Forge API for presigned URLs. After migration
 * to self-hosted infrastructure, blog cover images and other stored assets
 * are served directly from `public/manus-storage/` on disk.
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

    // Normalize the key while preserving valid path segments
    const normalizedKey = path.normalize(key).replace(/^[/\\]+/, "");
    const storageDir = path.resolve(
      process.cwd(),
      "public",
      "manus-storage",
    );
    const filePath = path.resolve(storageDir, normalizedKey);

    // Ensure the resolved path is still inside the storage directory
    if (!filePath.startsWith(storageDir + path.sep)) {
      res.status(403).send("Forbidden");
      return;
    }

    try {
      await fs.promises.access(filePath, fs.constants.F_OK);
    } catch {
      res.status(404).send("File not found");
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

    const stream = fs.createReadStream(filePath);
    stream.on("error", (err) => {
      console.error("[StorageProxy] stream error:", err);
      if (!res.headersSent) {
        res.status(500).send("Error reading file");
      }
    });
    stream.pipe(res);
  });
}
