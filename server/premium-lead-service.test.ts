import { describe, expect, it, vi } from "vitest";
import { createPremiumLeadWithNotification } from "./premium-lead-service";

describe("premium lead persistence and notification", () => {
  it("returns the persisted lead when owner notification fails", async () => {
    const createLead = vi.fn().mockResolvedValue(42);
    const getOwner = vi.fn().mockResolvedValue({ userId: 7 });
    const notify = vi.fn().mockRejectedValue(new Error("notification unavailable"));

    await expect(createPremiumLeadWithNotification(
      { serviceKey: "business-a", name: "Visitor", email: "v@example.com", phone: null, message: "Hello", userId: null },
      { createLead, getOwner, notify },
    )).resolves.toBe(42);

    expect(createLead).toHaveBeenCalledTimes(1);
    expect(notify).toHaveBeenCalledTimes(1);
  });

  it("returns the persisted lead when owner lookup fails", async () => {
    const createLead = vi.fn().mockResolvedValue(43);
    const getOwner = vi.fn().mockRejectedValue(new Error("owner lookup unavailable"));
    const notify = vi.fn();

    await expect(createPremiumLeadWithNotification(
      { serviceKey: "business-a", name: "Visitor", email: "v@example.com", phone: null, message: "Hello", userId: null },
      { createLead, getOwner, notify },
    )).resolves.toBe(43);

    expect(notify).not.toHaveBeenCalled();
  });

  it("fails before owner lookup when lead persistence returns no id", async () => {
    const createLead = vi.fn().mockResolvedValue(undefined);
    const getOwner = vi.fn();
    const notify = vi.fn();

    await expect(createPremiumLeadWithNotification(
      { serviceKey: "business-a", name: "Visitor", email: "v@example.com", phone: null, message: "Hello", userId: null },
      { createLead, getOwner, notify },
    )).rejects.toThrow("Failed to persist Premium lead");

    expect(getOwner).not.toHaveBeenCalled();
    expect(notify).not.toHaveBeenCalled();
  });
});
