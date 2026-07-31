import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(import.meta.dirname, "..");
const exceptionsPath = path.join(root, ".github", "DEPENDENCY_SECURITY_EXCEPTIONS.md");

describe("dependency security exceptions", () => {
  it("documents the exact residual development-only esbuild advisory without hiding it", () => {
    const document = fs.readFileSync(exceptionsPath, "utf8");

    expect(document).toContain("GHSA-67mh-4wv8-2f99");
    expect(document).toContain("drizzle-kit@0.31.10");
    expect(document).toContain("esbuild@0.18.20");
    expect(document).toContain("pnpm audit --prod --audit-level=low");
    expect(document).toContain("Keep the alert open");
    expect(document).toContain("disposable database");
  });
});
