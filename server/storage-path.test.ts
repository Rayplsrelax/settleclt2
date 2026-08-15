import { describe, expect, it } from "vitest";
import { resolveStorageDirectory } from "./storage-path";

describe("persistent runtime storage path", () => {
  it("requires an explicit absolute storage directory in production", () => {
    expect(() =>
      resolveStorageDirectory({}, "/opt/settleclt2/slots/blue", true)
    ).toThrow("SETTLECLT_STORAGE_DIR is required in production");
    expect(() =>
      resolveStorageDirectory(
        { SETTLECLT_STORAGE_DIR: "public/manus-storage" },
        "/opt/settleclt2/slots/blue",
        true
      )
    ).toThrow("SETTLECLT_STORAGE_DIR must be absolute");
  });

  it("uses the explicit shared path in production", () => {
    expect(
      resolveStorageDirectory(
        {
          SETTLECLT_STORAGE_DIR: "/opt/settleclt2/shared/public/manus-storage",
        },
        "/opt/settleclt2/slots/green",
        true
      )
    ).toBe("/opt/settleclt2/shared/public/manus-storage");
    expect(() =>
      resolveStorageDirectory(
        {
          SETTLECLT_STORAGE_DIR:
            "/opt/settleclt2/slots/green/public/manus-storage",
        },
        "/opt/settleclt2/slots/green",
        true
      )
    ).toThrow("must be outside the production working directory");
  });

  it("preserves the local development storage location", () => {
    expect(resolveStorageDirectory({}, "/workspace/settleclt", false)).toBe(
      "/workspace/settleclt/public/manus-storage"
    );
  });
});
