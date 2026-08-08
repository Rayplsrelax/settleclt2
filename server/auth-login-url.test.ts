import { describe, expect, it } from "vitest";
import { getLoginUrl } from "../client/src/const";

describe("getLoginUrl", () => {
  it("starts the same-origin signed OAuth flow with a local return path", () => {
    expect(getLoginUrl("/my-business?claim=owner-business")).toBe(
      "/auth?returnTo=%2Fmy-business%3Fclaim%3Downer-business"
    );
  });
});
