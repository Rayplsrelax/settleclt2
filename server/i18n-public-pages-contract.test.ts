import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

function source(path: string) {
  return readFileSync(new URL(path, import.meta.url), "utf8");
}

describe("translated public page contracts", () => {
  it("translates Contact headings, form labels, states, and accessibility copy", () => {
    const contact = source("../client/src/pages/Contact.tsx");
    for (const key of [
      "contact.title",
      "contact.subtitle",
      "contact.commonTopics",
      "contact.sentTitle",
      "contact.sentDescription",
      "contact.sendAnother",
      "contact.formTitle",
      "contact.name",
      "contact.email",
      "contact.subject",
      "contact.message",
      "contact.sending",
      "contact.send",
    ]) {
      expect(contact).toContain(`t("${key}")`);
    }
  });

  it("translates authentication modes, fields, status, and recovery actions", () => {
    const auth = source("../client/src/pages/Auth.tsx");
    for (const key of [
      "auth.welcomeBack",
      "auth.createAccountTitle",
      "auth.resetPasswordTitle",
      "auth.subtitle",
      "auth.continueGoogle",
      "auth.or",
      "auth.name",
      "auth.email",
      "auth.password",
      "auth.signIn",
      "auth.createAccount",
      "auth.sendReset",
      "auth.forgotPassword",
      "auth.backToSignIn",
    ]) {
      expect(auth).toContain(`t("${key}")`);
    }
    expect(auth).toContain('setMessage(t("auth.resetEmailSent"))');
    expect(auth).toContain('setMessage(t("auth.verifyEmail"))');
  });

  it("translates neighborhood discovery filters, cards, and page sections", () => {
    const neighborhoods = source("../client/src/pages/Neighborhoods.tsx");
    for (const key of [
      "neighborhoods.title",
      "neighborhoods.subtitle",
      "neighborhoods.quizCta",
      "neighborhoods.popular",
      "neighborhoods.viewGuide",
      "neighborhoods.compare",
      "neighborhoods.coreTitle",
      "neighborhoods.metroTitle",
    ]) {
      expect(neighborhoods).toContain(`t("${key}"`);
    }
    expect(neighborhoods).toContain('labelKey: "neighborhoods.filterAll"');
    expect(neighborhoods).toContain('labelKey: "neighborhoods.filterBudget"');
    expect(neighborhoods).toContain("t(f.labelKey)");
  });
});
