import { describe, expect, it } from "vitest";
import { parseBingoSquares } from "../client/src/lib/bingo";

describe("bingo square parsing", () => {
  it("accepts a non-empty valid square array", () => {
    expect(parseBingoSquares('[{"id":1,"label":"Visit a park"}]')).toEqual([
      { id: 1, label: "Visit a park" },
    ]);
  });

  it("accepts null optional fields used by seeded cards", () => {
    expect(parseBingoSquares('[{"id":1,"label":"Try a date night","serviceKey":null,"category":null}]')).toEqual([
      { id: 1, label: "Try a date night", serviceKey: null, category: null },
    ]);
  });

  it.each(["[]", "{}", "null", "not-json", '[{"id":"1","label":"Bad"}]', '[{"id":1,"label":"A"},{"id":1,"label":"B"}]']) (
    "rejects malformed or empty square data: %s",
    value => expect(parseBingoSquares(value)).toBeNull()
  );
});
