import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("../client/src/pages/Contact.tsx", import.meta.url), "utf8");
const systemRouterSource = readFileSync(new URL("./_core/systemRouter.ts", import.meta.url), "utf8");

describe("Contact client route contract", () => {
  it("uses only the dedicated bounded contact mutation", () => {
    expect(source).toContain("trpc.contact.submit.useMutation");
    expect(source).not.toContain("system.notifyOwner");
    expect(source).toContain("name,");
    expect(source).toContain("email,");
    expect(source).toContain("subject,");
    expect(source).toContain("message,");
  });

  it("keeps failed submissions retryable and uses localized generic errors", () => {
    expect(source).toContain('onError: () =>');
    expect(source).toContain('toast.error(t("contact.toastError"))');
    expect(source).not.toMatch(/onError:[\s\S]{0,200}setSubmitted\(true\)/);

    const en = readFileSync(new URL("../client/src/i18n/locales/en.ts", import.meta.url), "utf8");
    const es = readFileSync(new URL("../client/src/i18n/locales/es.ts", import.meta.url), "utf8");
    expect(en).toContain("We couldn't send your message. Please try again.");
    expect(es).toContain("No pudimos enviar tu mensaje. Inténtalo de nuevo.");
  });

  it("does not expose owner notification as a tRPC system procedure", () => {
    expect(systemRouterSource).not.toContain("notifyOwner:");
    expect(systemRouterSource).not.toContain('from "./notification"');
  });
});