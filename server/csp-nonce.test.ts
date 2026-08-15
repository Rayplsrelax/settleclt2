import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createCspNonce, injectCspNonce } from "./_core/csp-nonce";

describe("CSP nonces", () => {
  it("creates a unique browser-safe nonce for each response", () => {
    const first = createCspNonce();
    const second = createCspNonce();

    expect(first).toMatch(/^[A-Za-z0-9_-]{32,}$/);
    expect(second).not.toBe(first);
  });

  it("adds the response nonce to every inline and module script", () => {
    const html =
      '<script type="application/ld+json">{"@type":"WebSite"}</script><div id="root"></div><script type="module" src="/assets/index.js"></script>';

    const result = injectCspNonce(html, "response_nonce");

    expect(result).toContain(
      '<script nonce="response_nonce" type="application/ld+json">'
    );
    expect(result).toContain(
      '<script nonce="response_nonce" type="module" src="/assets/index.js"></script>'
    );
  });

  it("does not replace an existing script nonce", () => {
    const html = '<script nonce="existing">window.example = true;</script>';

    expect(injectCspNonce(html, "response_nonce")).toBe(html);
  });

  it("fails closed when production HTML has no response nonce", () => {
    expect(() => injectCspNonce('<script type="module"></script>', "")).toThrow(
      "Missing CSP nonce"
    );
  });

  it("injects the response nonce when production serves the SPA shell", () => {
    const source = readFileSync(
      resolve(__dirname, "./_core/vite.ts"),
      "utf-8"
    ).replace(/\s+/g, " ");

    expect(source).toContain(
      "injectCspNonce(routeTemplate, res.locals.cspNonce)"
    );
    expect(source).toContain("express.static(distPath, { index: false })");
  });
});
