import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";
import { HOUSING_COPY } from "../shared/housing-copy";

const { insertBusinessSubmission, submitReferral, notifyOwner } = vi.hoisted(() => ({
  insertBusinessSubmission: vi.fn(),
  submitReferral: vi.fn(),
  notifyOwner: vi.fn(),
}));

vi.mock("./db", async importOriginal => ({
  ...(await importOriginal<typeof import("./db")>()),
  insertBusinessSubmission,
  submitReferral,
}));
vi.mock("./_core/notification", () => ({ notifyOwner }));

import {
  appRouter,
  businessSubmissionInputSchema,
  businessReferralInputSchema,
  newsletterSubscriptionInputSchema,
  premiumLeadInputSchema,
  referralInputSchema,
} from "./routers";

const publicContext = (): TrpcContext => ({
  user: null,
  req: { protocol: "https", headers: {} } as TrpcContext["req"],
  res: {} as TrpcContext["res"],
});

const businessFixture = {
  name: "Fixture Person",
  email: "business-lead@example.test",
  businessName: "Fixture Business",
  category: "moving-companies",
  phone: "704-555-0100",
  website: "https://example.test",
  area: "Fixture Area",
  description: "PII-safe fixture description",
};
const referralFixture = {
  name: "Fixture Person",
  email: "referral-lead@example.test",
  phone: "704-555-0101",
  referralType: "buying" as const,
  budget: "fixture budget",
  neighborhoods: "Fixture Neighborhood",
  timeline: "fixture timeline",
  notes: "PII-safe fixture notes",
  currentCity: "Fixture City",
  referralSource: "fixture source",
};

const fieldsAtLimits = {
  business: {
    name: 120,
    email: 254,
    businessName: 200,
    category: 128,
    phone: 32,
    website: 2048,
    area: 160,
    description: 4000,
  },
  premiumLead: {
    serviceKey: 255,
    name: 255,
    email: 254,
    phone: 32,
    message: 2000,
    source: 128,
  },
  referral: {
    name: 120,
    email: 254,
    phone: 32,
    budget: 100,
    neighborhoods: 500,
    timeline: 100,
    notes: 4000,
    currentCity: 160,
    referralSource: 160,
  },
  newsletter: { email: 254 },
  businessReferral: {
    serviceKey: 255,
    category: 128,
    name: 255,
    email: 254,
    phone: 32,
    need: 500,
    source: 128,
  },
} as const;

function valueOfLength(length: number) {
  return "x".repeat(length);
}

function emailOfLength(length: number) {
  return `${"x".repeat(length - "@example.test".length)}@example.test`;
}

describe("public lead/referral schema boundaries", () => {
  it("accepts every business field at its documented maximum", () => {
    const input = Object.fromEntries(
      Object.entries(fieldsAtLimits.business).map(([field, length]) => [
        field,
        field === "email" ? emailOfLength(length) : valueOfLength(length),
      ])
    );
    expect(businessSubmissionInputSchema.safeParse(input).success).toBe(true);
  });

  it.each(Object.entries(fieldsAtLimits.business))(
    "rejects business %s above its maximum",
    (field, length) => {
      const value = field === "email" ? emailOfLength(length + 1) : valueOfLength(length + 1);
      expect(
        businessSubmissionInputSchema.safeParse({ ...businessFixture, [field]: value }).success
      ).toBe(false);
    }
  );

  it.each(Object.entries(fieldsAtLimits.premiumLead))(
    "enforces the premium lead %s maximum boundary",
    (field, length) => {
      const base = {
        serviceKey: "fixture-business",
        name: "Fixture Person",
        email: "premium-lead@example.test",
        phone: "704-555-0102",
        message: "Fixture inquiry",
        source: "fixture-source",
      };
      const atLimit = field === "email" ? emailOfLength(length) : valueOfLength(length);
      const overLimit = field === "email" ? emailOfLength(length + 1) : valueOfLength(length + 1);
      expect(premiumLeadInputSchema.safeParse({ ...base, [field]: atLimit }).success).toBe(true);
      expect(premiumLeadInputSchema.safeParse({ ...base, [field]: overLimit }).success).toBe(false);
    }
  );

  it("accepts every referral field at its documented maximum without changing referralType", () => {
    const bounded = Object.fromEntries(
      Object.entries(fieldsAtLimits.referral).map(([field, length]) => [
        field,
        field === "email" ? emailOfLength(length) : valueOfLength(length),
      ])
    );
    expect(referralInputSchema.safeParse({ ...bounded, referralType: "buying" }).success).toBe(true);
    expect(referralInputSchema.safeParse({ ...referralFixture, referralType: "not-canonical" }).success).toBe(false);
  });

  it.each(Object.entries(fieldsAtLimits.referral))(
    "rejects referral %s above its maximum",
    (field, length) => {
      const value = field === "email" ? emailOfLength(length + 1) : valueOfLength(length + 1);
      expect(referralInputSchema.safeParse({ ...referralFixture, [field]: value }).success).toBe(false);
    }
  );

  it("accepts newsletter email exactly at 254 characters and rejects 255", () => {
    expect(
      newsletterSubscriptionInputSchema.safeParse({ email: emailOfLength(254) }).success
    ).toBe(true);
    expect(
      newsletterSubscriptionInputSchema.safeParse({ email: emailOfLength(255) }).success
    ).toBe(false);
  });

  it.each(Object.entries(fieldsAtLimits.businessReferral))(
    "enforces the public business referral %s maximum boundary",
    (field, length) => {
      const base = {
        serviceKey: "fixture-business",
        category: "moving-companies",
        locale: "en" as const,
        name: "Fixture Person",
        email: "business-referral@example.test",
        phone: "704-555-0103",
        need: "Fixture need",
        source: "fixture-source",
      };
      const atLimit = field === "email" ? emailOfLength(length) : valueOfLength(length);
      const overLimit = field === "email" ? emailOfLength(length + 1) : valueOfLength(length + 1);
      expect(businessReferralInputSchema.safeParse({ ...base, [field]: atLimit }).success).toBe(true);
      expect(businessReferralInputSchema.safeParse({ ...base, [field]: overLimit }).success).toBe(false);
    }
  );
});

describe("durable referral submission boundary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    submitReferral.mockResolvedValue({ id: 731, status: "new" });
    notifyOwner.mockResolvedValue(true);
  });

  it("uses the shared neutral housing contract in the owner notification", async () => {
    await appRouter.createCaller(publicContext()).referrals.submit(referralFixture);

    expect(notifyOwner).toHaveBeenCalledWith({
      title: expect.stringContaining("New Referral Lead"),
      content: expect.stringContaining(HOUSING_COPY.en.ownerNotice),
    });
    const notification = JSON.stringify(notifyOwner.mock.calls[0]);
    expect(notification).not.toMatch(/trusted|vetted|free connection|guaranteed referral|guaranteed response|48\s*(?:business\s*)?hours?/i);
  });

  it("returns the single durable insert when owner notification throws", async () => {
    notifyOwner.mockRejectedValue(new Error("fixture notifier unavailable"));
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    const result = await appRouter.createCaller(publicContext()).referrals.submit(referralFixture);

    expect(result).toEqual({ id: 731, status: "new" });
    expect(submitReferral).toHaveBeenCalledTimes(1);
    expect(notifyOwner).toHaveBeenCalledTimes(1);
    const logged = warn.mock.calls.flat().join(" ");
    expect(logged).toContain("referralId=731");
    for (const pii of [referralFixture.name, referralFixture.email, referralFixture.phone, referralFixture.notes]) {
      expect(logged).not.toContain(pii);
    }
    warn.mockRestore();
  });

  it("does not retry or report failure when notification declines delivery", async () => {
    notifyOwner.mockResolvedValue(false);
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    await expect(
      appRouter.createCaller(publicContext()).referrals.submit(referralFixture)
    ).resolves.toEqual({ id: 731, status: "new" });
    expect(submitReferral).toHaveBeenCalledTimes(1);
    expect(notifyOwner).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledTimes(1);
    warn.mockRestore();
  });
});
