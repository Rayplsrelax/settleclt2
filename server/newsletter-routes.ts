import type { Express, Request, Response } from "express";
import {
  confirmNewsletterSubscription,
  unsubscribeNewsletterSubscription,
} from "./newsletter-service";

function tokenFromRequest(req: Request): string {
  return typeof req.query.token === "string" ? req.query.token : "";
}

function page(
  title: string,
  message: string,
  action?: { label: string; path: string; token: string }
): string {
  const form = action
    ? `<form method="post" action="${action.path}"><input type="hidden" name="token" value="${action.token.replace(/[&<>"']/g, "")}"><button type="submit">${action.label}</button></form>`
    : "";
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title} | Settle CLT</title></head><body><main><h1>${title}</h1><p>${message}</p>${form}<p><a href="/">Return to Settle CLT</a></p></main></body></html>`;
}

function sendPage(res: Response, status: number, html: string) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.status(status).type("html").send(html);
}

export function registerNewsletterRoutes(app: Express) {
  app.get("/api/newsletter/confirm", async (req, res) => {
    const token = tokenFromRequest(req);
    sendPage(
      res,
      token ? 200 : 400,
      token
        ? page(
            "Confirm subscription",
            "Confirm that you want to receive Settle CLT newsletter emails.",
            {
              label: "Confirm subscription",
              path: "/api/newsletter/confirm",
              token,
            }
          )
        : page("Link unavailable", "This confirmation link is invalid.")
    );
  });

  app.post("/api/newsletter/confirm", async (req, res) => {
    const rawToken = typeof req.body?.token === "string" ? req.body.token : "";
    const confirmed = await confirmNewsletterSubscription(rawToken).catch(
      () => false
    );
    sendPage(
      res,
      confirmed ? 200 : 400,
      confirmed
        ? page(
            "Subscription confirmed",
            "You're subscribed to Settle CLT updates."
          )
        : page(
            "Link unavailable",
            "This confirmation link is invalid, expired, or already used."
          )
    );
  });

  app.get("/api/newsletter/unsubscribe", (req, res) => {
    const token = tokenFromRequest(req);
    sendPage(
      res,
      token ? 200 : 400,
      token
        ? page(
            "Unsubscribe",
            "Confirm that you no longer want Settle CLT newsletter emails.",
            {
              label: "Unsubscribe",
              path: "/api/newsletter/unsubscribe",
              token,
            }
          )
        : page("Link unavailable", "This unsubscribe link is invalid.")
    );
  });

  app.post("/api/newsletter/unsubscribe", async (req, res) => {
    const rawToken = typeof req.body?.token === "string" ? req.body.token : "";
    const unsubscribed = await unsubscribeNewsletterSubscription(
      rawToken
    ).catch(() => false);
    sendPage(
      res,
      200,
      page(
        "Unsubscribed",
        unsubscribed
          ? "You will no longer receive the Settle CLT newsletter."
          : "This address is already unsubscribed or the link is no longer valid."
      )
    );
  });
}
