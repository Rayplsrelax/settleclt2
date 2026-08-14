import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const confirmNewsletterSubscription = vi.fn();
const unsubscribeNewsletterSubscription = vi.fn();

vi.mock("./newsletter-service", () => ({
  confirmNewsletterSubscription: (...args: unknown[]) =>
    confirmNewsletterSubscription(...args),
  unsubscribeNewsletterSubscription: (...args: unknown[]) =>
    unsubscribeNewsletterSubscription(...args),
}));

import { registerNewsletterRoutes } from "./newsletter-routes";

function makeApp() {
  const app = express();
  app.use(express.urlencoded({ extended: false }));
  registerNewsletterRoutes(app);
  return app;
}

describe("newsletter public routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    confirmNewsletterSubscription.mockResolvedValue(true);
    unsubscribeNewsletterSubscription.mockResolvedValue(true);
  });

  it("keeps confirmation GET read-only for email link scanners", async () => {
    const response = await request(makeApp()).get(
      "/api/newsletter/confirm?token=confirm-token"
    );

    expect(response.status).toBe(200);
    expect(response.text).toContain('method="post"');
    expect(response.text).toContain("confirm-token");
    expect(confirmNewsletterSubscription).not.toHaveBeenCalled();
  });

  it("confirms only after a POST confirmation", async () => {
    const response = await request(makeApp())
      .post("/api/newsletter/confirm")
      .type("form")
      .send({ token: "confirm-token" });

    expect(response.status).toBe(200);
    expect(response.text).toContain("Subscription confirmed");
    expect(confirmNewsletterSubscription).toHaveBeenCalledWith("confirm-token");
  });

  it("keeps unsubscribe GET read-only for email link scanners", async () => {
    const response = await request(makeApp()).get(
      "/api/newsletter/unsubscribe?token=unsubscribe-token"
    );

    expect(response.status).toBe(200);
    expect(response.text).toContain('method="post"');
    expect(response.text).toContain("unsubscribe-token");
    expect(unsubscribeNewsletterSubscription).not.toHaveBeenCalled();
  });

  it("unsubscribes only after a POST confirmation", async () => {
    const response = await request(makeApp())
      .post("/api/newsletter/unsubscribe")
      .type("form")
      .send({ token: "unsubscribe-token" });

    expect(response.status).toBe(200);
    expect(response.text).toContain("You will no longer receive");
    expect(unsubscribeNewsletterSubscription).toHaveBeenCalledWith(
      "unsubscribe-token"
    );
  });

  it("returns generic invalid-link pages without subscriber data", async () => {
    confirmNewsletterSubscription.mockResolvedValue(false);
    unsubscribeNewsletterSubscription.mockResolvedValue(false);

    const confirmation = await request(makeApp())
      .post("/api/newsletter/confirm")
      .type("form")
      .send({ token: "replayed-token" });
    const unsubscribe = await request(makeApp())
      .post("/api/newsletter/unsubscribe")
      .type("form")
      .send({ token: "replayed-token" });

    expect(confirmation.status).toBe(400);
    expect(confirmation.text).toContain("invalid, expired, or already used");
    expect(confirmation.text).not.toContain("replayed-token");
    expect(unsubscribe.status).toBe(200);
    expect(unsubscribe.text).toContain("already unsubscribed");
    expect(unsubscribe.text).not.toContain("replayed-token");
  });
});
