import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import { generateBusinessContentPrompts } from "./business-content-prompts";
import { generateBusinessReviewResponse } from "./business-review-drafts";

describe("Business Pro automation contracts", () => {
  it("exposes the Pro-only automation procedures", () => {
    const procedures = appRouter._def.procedures as Record<string, unknown>;
    expect(procedures["premium.generateContentPrompts"]).toBeDefined();
    expect(procedures["premium.generateReviewResponse"]).toBeDefined();
    expect(procedures["businessFaqs.list"]).toBeDefined();
    expect(procedures["businessFaqs.create"]).toBeDefined();
    expect(procedures["businessFaqs.delete"]).toBeDefined();
  });

  it("returns safe content prompts without an LLM configuration", async () => {
    const previousBase = process.env.OPENAI_API_BASE_URL;
    const previousKey = process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_API_BASE_URL;
    delete process.env.OPENAI_API_KEY;
    const prompts = await generateBusinessContentPrompts({
      serviceKey: "test-business",
      displayName: "Test Business",
      description: "A local service business",
      phone: null,
      website: null,
      hours: null,
      tagline: null,
      category: "moving",
      googleRating: null,
      reviewCount: null,
      verifiedAddress: null,
    });
    if (previousBase === undefined) delete process.env.OPENAI_API_BASE_URL;
    else process.env.OPENAI_API_BASE_URL = previousBase;
    if (previousKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = previousKey;
    expect(prompts).toHaveLength(4);
    expect(prompts.every(prompt => prompt.prompt.includes("Test Business"))).toBe(true);
  });

  it("returns a non-autonomous review draft without an LLM configuration", async () => {
    const previousBase = process.env.OPENAI_API_BASE_URL;
    const previousKey = process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_API_BASE_URL;
    delete process.env.OPENAI_API_KEY;
    const draft = await generateBusinessReviewResponse({
      serviceKey: "test-business",
      displayName: "Test Business",
      description: null,
      phone: null,
      website: null,
      hours: null,
      tagline: null,
      category: "moving",
      googleRating: null,
      reviewCount: null,
      verifiedAddress: null,
    }, { rating: 5, tip: "Great service", aspect: null });
    if (previousBase === undefined) delete process.env.OPENAI_API_BASE_URL;
    else process.env.OPENAI_API_BASE_URL = previousBase;
    if (previousKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = previousKey;
    expect(draft).toContain("Test Business");
    expect(draft).not.toContain("publish");
  });

  it("falls back when the configured LLM provider rejects", async () => {
    const previousFetch = globalThis.fetch;
    const previousBase = process.env.OPENAI_API_BASE_URL;
    const previousKey = process.env.OPENAI_API_KEY;
    process.env.OPENAI_API_BASE_URL = "https://provider.invalid";
    process.env.OPENAI_API_KEY = "test-only-key";
    globalThis.fetch = async () => { throw new Error("provider unavailable"); };
    const prompts = await generateBusinessContentPrompts({
      serviceKey: "test-business",
      displayName: "Test Business",
      description: null,
      phone: null,
      website: null,
      hours: null,
      tagline: null,
      category: "moving",
      googleRating: null,
      reviewCount: null,
      verifiedAddress: null,
    });
    const draft = await generateBusinessReviewResponse({
      serviceKey: "test-business",
      displayName: "Test Business",
      description: null,
      phone: null,
      website: null,
      hours: null,
      tagline: null,
      category: "moving",
      googleRating: null,
      reviewCount: null,
      verifiedAddress: null,
    }, { rating: 5, tip: null, aspect: null });
    globalThis.fetch = previousFetch;
    if (previousBase === undefined) delete process.env.OPENAI_API_BASE_URL;
    else process.env.OPENAI_API_BASE_URL = previousBase;
    if (previousKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = previousKey;
    expect(prompts).toHaveLength(4);
    expect(draft).toContain("Test Business");
  });
});
