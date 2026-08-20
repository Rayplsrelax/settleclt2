import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const pageNames = [
  "BusinessDetail.tsx",
  "DirectoryCategory.tsx",
  "FindRealtor.tsx",
  "ListYourBusiness.tsx",
  "SubmitEvent.tsx",
  "Quiz.tsx",
  "Profile.tsx",
  "MyBusiness.tsx",
];

function page(name: string) {
  return readFileSync(new URL(`../client/src/pages/${name}`, import.meta.url), "utf8");
}

describe("public/account translation audit guard", () => {
  it("keeps the completed Quiz and Submit Event shells connected to i18n", () => {
    const quiz = page("Quiz.tsx");
    const submitEvent = page("SubmitEvent.tsx");
    for (const [source, keys] of [
      [quiz, ["quiz.title", "quiz.subtitle", "quiz.back", "quiz.next", "quiz.seeMatches"]],
      [submitEvent, ["submitEvent.title", "submitEvent.submitted", "submitEvent.submit", "submitEvent.submitting"]],
    ] as const) {
      expect(source).toContain("useI18n");
      for (const key of keys) expect(source).toContain(`t("${key}")`);
    }
  });

  it("prevents requested public/account pages from reintroducing fixed en-US formatting", () => {
    for (const name of pageNames) {
      const source = page(name);
      expect(source, name).not.toMatch(/toLocale(?:Date|Time)String\(\s*["']en-US["']/);
    }
  });
});
