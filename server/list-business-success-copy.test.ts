import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  new URL("../client/src/pages/ListYourBusiness.tsx", import.meta.url),
  "utf8"
);

describe("ListYourBusiness truthful success acknowledgement", () => {
  it("does not promise unsupported confirmation email delivery in either locale", () => {
    const successLines = source
      .split(/\r?\n/)
      .filter(line => line.includes('successDescription: "'));
    expect(successLines).toHaveLength(2);
    for (const line of successLines) {
      expect(line.toLowerCase()).not.toMatch(/confirmation email|correo de confirmación/);
      expect(line.toLowerCase()).toMatch(/received|recibimos/);
    }
  });

  it("does not promise an activation email in either locale FAQ", () => {
    expect(source).not.toMatch(/confirmation email once your listing is live/i);
    expect(source).not.toMatch(/correo cuando el perfil esté activo/i);
    expect(source).toMatch(/review timing varies/i);
    expect(source).toMatch(/el plazo varía/i);
    expect(source).toMatch(/publication is not guaranteed|la publicación no está garantizada/i);
  });
});
