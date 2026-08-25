import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const getEnrichedService = vi.hoisted(() => vi.fn());

vi.mock("./db", async importOriginal => ({
  ...(await importOriginal<typeof import("./db")>()),
  getEnrichedService,
}));

import { appRouter } from "./routers";

const publicContext = {
  user: null,
  req: {} as TrpcContext["req"],
  res: {} as TrpcContext["res"],
} satisfies TrpcContext;

const adminContext = {
  user: {
    id: 1,
    openId: "admin-user",
    name: "Admin",
    email: "admin@example.com",
    role: "admin",
  },
  req: {} as TrpcContext["req"],
  res: {} as TrpcContext["res"],
} satisfies TrpcContext;

describe("enrichment null behavior", () => {
  beforeEach(() => {
    getEnrichedService.mockReset();
  });

  it("normalizes an awaited missing enrichment row to null", async () => {
    getEnrichedService.mockResolvedValue(undefined);

    const result = await appRouter
      .createCaller(publicContext)
      .enrichment.getByKey({ serviceKey: "missing-business" });

    expect(getEnrichedService).toHaveBeenCalledWith("missing-business");
    expect(result).toBeNull();
  });

  it("normalizes an awaited missing admin enrichment row to null", async () => {
    getEnrichedService.mockResolvedValue(undefined);

    const result = await appRouter
      .createCaller(adminContext)
      .admin.getEnrichment({ serviceKey: "missing-business" });

    expect(getEnrichedService).toHaveBeenCalledWith("missing-business");
    expect(result).toBeNull();
  });

  it.each([
    ["public", () => appRouter.createCaller(publicContext).enrichment.getByKey({ serviceKey: "broken-business" })],
    ["admin", () => appRouter.createCaller(adminContext).admin.getEnrichment({ serviceKey: "broken-business" })],
  ] as const)("propagates rejected DB promises from the %s endpoint", async (_endpoint, invoke) => {
    const failure = new Error("database unavailable");
    getEnrichedService.mockRejectedValue(failure);

    await expect(invoke()).rejects.toThrow("database unavailable");
  });
});
