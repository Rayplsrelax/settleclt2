import { describe, expect, it } from "vitest";
import {
  formatActivityDescription,
  shouldRenderActivityDetail,
  type ActivityTranslator,
} from "../client/src/i18n/activityLabels";

const t: ActivityTranslator = (key, vars) =>
  `${key}${vars ? `:${JSON.stringify(vars)}` : ""}`;

describe("structured activity localization", () => {
  it("consumes completed for named and entity-less bingo activities", () => {
    expect(
      formatActivityDescription(
        { type: "bingo", description: "Completed!", action: "bingo_progress", entityName: "Queen City", completed: true },
        t
      )
    ).toContain("activity.bingoCompleted");
    expect(
      formatActivityDescription(
        { type: "bingo", description: "made bingo progress", action: "bingo_progress", completed: false },
        t
      )
    ).toBe("activity.bingoProgressGeneric");
  });

  it.each([
    ["neighborhood", "activity.targetType.neighborhood"],
    ["service", "activity.targetType.service"],
  ])("maps canonical targetType %s to a localized label", (targetType, expectedKey) => {
    const rendered = formatActivityDescription(
      {
        type: "comment",
        description: `commented on ${targetType}`,
        action: "commented",
        targetType,
        entityName: "fixture-entity",
      },
      t
    );
    expect(rendered).toContain(expectedKey);
    expect(rendered).not.toContain(`\"targetType\":\"${targetType}\"`);
  });

  it("never falls back to raw application English for a known action", () => {
    const rawEnglish = "made bingo progress";
    expect(
      formatActivityDescription(
        { type: "bingo", description: rawEnglish, action: "bingo_progress" },
        t
      )
    ).not.toBe(rawEnglish);
    expect(
      shouldRenderActivityDetail({ action: "bingo_progress", detail: "Completed!" })
    ).toBe(false);
  });

  it("keeps user-authored comment previews eligible for rendering", () => {
    expect(
      shouldRenderActivityDetail({ action: "commented", detail: "Fixture comment" })
    ).toBe(true);
  });
});
