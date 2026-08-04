import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import { isValidOperationsAuthorization } from "./_core/trpc";

describe("restricted operations API authentication", () => {
  it("accepts the exact configured Bearer key", () => {
    expect(isValidOperationsAuthorization("Bearer test-operations-key-123", "test-operations-key-123")).toBe(true);
  });

  it("rejects missing, malformed, empty, and mismatched authorization", () => {
    expect(isValidOperationsAuthorization(undefined, "test-operations-key-123")).toBe(false);
    expect(isValidOperationsAuthorization("Basic test-operations-key-123", "test-operations-key-123")).toBe(false);
    expect(isValidOperationsAuthorization("Bearer", "test-operations-key-123")).toBe(false);
    expect(isValidOperationsAuthorization("Bearer wrong-key", "test-operations-key-123")).toBe(false);
    expect(isValidOperationsAuthorization("Bearer test-operations-key-123", "")).toBe(false);
  });

  it("allows the Bearer key on restricted operations procedures", async () => {
    const original = process.env.OPERATIONS_API_KEY;
    process.env.OPERATIONS_API_KEY = "test-operations-key-123";
    const caller = appRouter.createCaller({
      req: { headers: { authorization: "Bearer test-operations-key-123" } },
      res: {},
      user: null,
    } as any);
    await expect(caller.operations.summary()).resolves.toMatchObject({ totalTasks: 0 });
    process.env.OPERATIONS_API_KEY = original;
  });

  it("does not allow the service key to execute destructive admin procedures", async () => {
    const original = process.env.OPERATIONS_API_KEY;
    process.env.OPERATIONS_API_KEY = "test-operations-key-123";
    const caller = appRouter.createCaller({
      req: { headers: { authorization: "Bearer test-operations-key-123" } },
      res: {},
      user: null,
    } as any);
    await expect(caller.directoryOps.archiveListing({ serviceKey: "business-a", reason: "test" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    process.env.OPERATIONS_API_KEY = original;
  });
});
