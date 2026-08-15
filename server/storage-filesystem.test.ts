import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  resolveExistingStorageFile,
  writeStorageFile,
} from "./storage-filesystem";

function temporaryDirectory(): string {
  return mkdtempSync(join(tmpdir(), "settleclt-storage-test-"));
}

describe("persistent storage filesystem boundary", () => {
  it("writes atomically and resolves a regular file inside the root", async () => {
    const root = join(temporaryDirectory(), "storage");
    const key = await writeStorageFile(
      root,
      "business/photo.txt",
      Buffer.from("safe")
    );
    const resolved = await resolveExistingStorageFile(root, key);

    expect(key).toBe("business/photo.txt");
    expect(readFileSync(resolved.path, "utf8")).toBe("safe");
    const replacement = await writeStorageFile(
      root,
      "business/replacement.txt",
      Buffer.from("replacement")
    );
    expect(replacement).toBe("business/replacement.txt");
    expect(readFileSync(join(root, replacement), "utf8")).toBe("replacement");
    await expect(
      writeStorageFile(root, key, Buffer.from("overwrite"))
    ).rejects.toMatchObject({ code: "EEXIST" });
    expect(readFileSync(resolved.path, "utf8")).toBe("safe");
  });

  it("rejects a replacement symlink when opening an existing file", async () => {
    const base = temporaryDirectory();
    const root = join(base, "storage");
    const outside = join(base, "outside.txt");
    mkdirSync(root, { recursive: true });
    writeFileSync(join(root, "photo.txt"), "inside");
    writeFileSync(outside, "outside");
    const opened = await import("./storage-filesystem").then(mod =>
      mod.openExistingStorageFile(root, "photo.txt")
    );
    await opened.handle.close();
    expect(readFileSync(opened.path, "utf8")).toBe("inside");
  });

  it("fails closed when production storage root is missing", async () => {
    const root = join(temporaryDirectory(), "missing");
    await expect(
      writeStorageFile(root, "photo.txt", Buffer.from("blocked"), false)
    ).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("rejects a symlinked production root ancestor", async () => {
    const base = temporaryDirectory();
    const outside = join(base, "outside");
    const parent = join(base, "parent");
    mkdirSync(outside, { recursive: true });
    symlinkSync(outside, parent, "junction");
    await expect(
      writeStorageFile(
        join(parent, "storage"),
        "photo.txt",
        Buffer.from("blocked"),
        false
      )
    ).rejects.toThrow("symbolic link");
  });

  it("rejects traversal and symlinks beneath the storage root", async () => {
    const base = temporaryDirectory();
    const root = join(base, "storage");
    const outside = join(base, "outside");
    mkdirSync(root, { recursive: true });
    mkdirSync(outside, { recursive: true });
    writeFileSync(join(outside, "secret.txt"), "private");
    symlinkSync(outside, join(root, "linked"), "junction");

    await expect(
      resolveExistingStorageFile(root, "../outside/secret.txt")
    ).rejects.toThrow("path traversal");
    await expect(
      resolveExistingStorageFile(root, "linked/secret.txt")
    ).rejects.toThrow("symbolic link");
    await expect(
      writeStorageFile(root, "linked/new.txt", Buffer.from("blocked"))
    ).rejects.toThrow("symbolic link");
  });
});
