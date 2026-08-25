import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { testEnv } = vi.hoisted(() => ({
  testEnv: {
    forgeApiUrl: "https://notifications.example.test",
    forgeApiKey: "provider-secret-token",
  },
}));

vi.mock("./env", () => ({ ENV: testEnv }));

import { notifyOwner } from "./notification";

const sentinel = {
  name: "SENTINEL_NAME_Ada_Lovelace",
  email: "sentinel-email@example.test",
  message: "SENTINEL_MESSAGE_private_request_content",
};

function recordedWarnings(warn: ReturnType<typeof vi.spyOn>): string {
  return warn.mock.calls
    .flat()
    .map(value => String(value))
    .join("\n");
}

function expectNoSensitiveValues(value: string): void {
  expect(value).not.toContain(sentinel.name);
  expect(value).not.toContain(sentinel.email);
  expect(value).not.toContain(sentinel.message);
  expect(value).not.toContain(testEnv.forgeApiKey);
}

describe("notifyOwner provider boundary", () => {
  let warn: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("returns false without logging an upstream non-OK response body or submitted values", async () => {
    const upstreamBody = JSON.stringify(sentinel);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(upstreamBody, {
          status: 503,
          statusText: `${sentinel.name} ${sentinel.email} ${sentinel.message}`,
        })
      )
    );

    const result = await notifyOwner({
      title: `${sentinel.name} ${sentinel.email}`,
      content: sentinel.message,
    });

    expect(result).toBe(false);
    expect(warn).toHaveBeenCalledTimes(1);
    const logged = recordedWarnings(warn);
    expectNoSensitiveValues(logged);
    expect(logged).toContain("operation=notifyOwner");
    expect(logged).toContain("status=503");
    expect(logged.length).toBeLessThan(240);
  });

  it("returns false without logging or throwing a caught error that echoes submitted values", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockRejectedValue(
          new Error(
            `${sentinel.name} ${sentinel.email} ${sentinel.message} ${testEnv.forgeApiKey}`
          )
        )
    );

    let thrown: unknown;
    let result: boolean | undefined;
    try {
      result = await notifyOwner({
        title: `${sentinel.name} ${sentinel.email}`,
        content: sentinel.message,
      });
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeUndefined();
    expect(result).toBe(false);
    expect(warn).toHaveBeenCalledTimes(1);
    const logged = recordedWarnings(warn);
    expectNoSensitiveValues(logged);
    expect(logged).toContain("operation=notifyOwner");
    expect(logged).toContain("classification=transport_error");
    expect(logged.length).toBeLessThan(240);
  });

  it("returns true and does not warn when the provider accepts the request", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(null, { status: 204 }))
    );

    await expect(
      notifyOwner({ title: "Accepted", content: "Safe content" })
    ).resolves.toBe(true);
    expect(warn).not.toHaveBeenCalled();
  });
});
