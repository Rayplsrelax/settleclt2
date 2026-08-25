import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const { notifyOwner } = vi.hoisted(() => ({ notifyOwner: vi.fn() }));
vi.mock("./_core/notification", () => ({ notifyOwner }));

import { appRouter, contactInputSchema } from "./routers";

const ordinaryUserContext = (): TrpcContext => ({
  user: {
    id: 42,
    openId: "fixture-user",
    name: "Ordinary User",
    email: "ordinary@example.test",
    loginMethod: "local",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  },
  req: { protocol: "https", headers: {} } as TrpcContext["req"],
  res: {} as TrpcContext["res"],
});

const fixture = {
  name: "Fixture Contact",
  email: "contact@example.test",
  subject: "Fixture subject",
  message: "Fixture message",
};

const value = (length: number) => "x".repeat(length);
const email = (length: number) => `${"x".repeat(length - "@example.test".length)}@example.test`;

describe("dedicated public contact route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    notifyOwner.mockResolvedValue(true);
  });

  it.each([
    ["name", 120],
    ["email", 254],
    ["subject", 200],
    ["message", 4000],
  ] as const)("accepts %s at its maximum and rejects overlimit input", (field, maximum) => {
    const atLimit = field === "email" ? email(maximum) : value(maximum);
    const overLimit = field === "email" ? email(maximum + 1) : value(maximum + 1);
    expect(contactInputSchema.safeParse({ ...fixture, [field]: atLimit }).success).toBe(true);
    expect(contactInputSchema.safeParse({ ...fixture, [field]: overLimit }).success).toBe(false);
  });

  it("allows an ordinary user and returns a generic acknowledgement", async () => {
    const result = await appRouter.createCaller(ordinaryUserContext()).contact.submit(fixture);
    expect(result).toEqual({ success: true, message: "Your message was received." });
    expect(notifyOwner).toHaveBeenCalledWith({
      title: "New contact form message",
      content: expect.stringContaining("Fixture subject"),
    });
  });

  it("returns a controlled generic failure when notification declines delivery", async () => {
    notifyOwner.mockResolvedValue(false);
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    await expect(
      appRouter.createCaller(ordinaryUserContext()).contact.submit(fixture)
    ).rejects.toMatchObject({
      code: "INTERNAL_SERVER_ERROR",
      message: "We couldn't send your message. Please try again.",
    });

    const logged = warn.mock.calls.flat().join(" ");
    for (const pii of Object.values(fixture)) expect(logged).not.toContain(pii);
    warn.mockRestore();
  });

  it("returns the same controlled failure when notification throws without leaking raw PII", async () => {
    notifyOwner.mockRejectedValue(new Error(`provider rejected ${fixture.email} ${fixture.message}`));
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const error = vi.spyOn(console, "error").mockImplementation(() => {});

    let rejection: unknown;
    try {
      await appRouter.createCaller(ordinaryUserContext()).contact.submit(fixture);
    } catch (caught) {
      rejection = caught;
    }
    expect(rejection).toMatchObject({
      code: "INTERNAL_SERVER_ERROR",
      message: "We couldn't send your message. Please try again.",
    });
    const exposed = JSON.stringify(rejection);
    const logged = [...warn.mock.calls, ...error.mock.calls].flat().join(" ");
    for (const pii of Object.values(fixture)) {
      expect(exposed).not.toContain(pii);
      expect(logged).not.toContain(pii);
    }
    warn.mockRestore();
    error.mockRestore();
  });
});