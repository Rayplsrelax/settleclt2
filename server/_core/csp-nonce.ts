import { randomBytes } from "node:crypto";

export function createCspNonce(): string {
  return randomBytes(32).toString("base64url");
}

export function injectCspNonce(html: string, nonce: string): string {
  if (!nonce) {
    throw new Error("Missing CSP nonce");
  }

  return html.replace(
    /<script(\s+type=["']module["'])/i,
    `<script nonce="${nonce}"$1`
  );
}
