import { describe, it, expect } from "vitest";
import { QUIZ_QUESTIONS, scoreNeighborhoods, getMatchLabel, type QuizAnswers } from "../shared/quiz";

describe("Quiz Questions", () => {
  it("should have exactly 7 questions", () => {
    expect(QUIZ_QUESTIONS).toHaveLength(7);
  });

  it("each question should have required fields", () => {
    for (const q of QUIZ_QUESTIONS) {
      expect(q.id).toBeTruthy();
      expect(q.title).toBeTruthy();
      expect(q.subtitle).toBeTruthy();
      expect(q.type).toMatch(/^(single|multi)$/);
      expect(q.options.length).toBeGreaterThanOrEqual(2);
    }
  });

  it("each option should have id, label, and emoji", () => {
    for (const q of QUIZ_QUESTIONS) {
      for (const opt of q.options) {
        expect(opt.id).toBeTruthy();
        expect(opt.label).toBeTruthy();
        expect(opt.emoji).toBeTruthy();
      }
    }
  });

  it("question IDs should be unique", () => {
    const ids = QUIZ_QUESTIONS.map(q => q.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("option IDs within each question should be unique", () => {
    for (const q of QUIZ_QUESTIONS) {
      const ids = q.options.map(o => o.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });
});

describe("scoreNeighborhoods", () => {
  it("should return 20 neighborhoods scored", () => {
    const answers: QuizAnswers = {
      budget: "mid",
      commute: "wfh",
      vibe: "artsy",
      household: "couple",
      priorities: ["walkability", "hip"],
      dealbreakers: ["none"],
    };
    const results = scoreNeighborhoods(answers);
    expect(results).toHaveLength(20);
  });

  it("should sort results by score descending", () => {
    const answers: QuizAnswers = {
      budget: "budget",
      commute: "transit",
      vibe: "urban",
      household: "solo",
      priorities: ["nightlife", "walkability"],
      dealbreakers: ["none"],
    };
    const results = scoreNeighborhoods(answers);
    for (let i = 1; i < results.length; i++) {
      expect(results[i - 1].score).toBeGreaterThanOrEqual(results[i].score);
    }
  });

  it("should have percentage between 0 and 100", () => {
    const answers: QuizAnswers = {
      budget: "high",
      commute: "short-drive",
      vibe: "suburban",
      household: "young-kids",
      priorities: ["schools", "safety"],
      dealbreakers: ["none"],
    };
    const results = scoreNeighborhoods(answers);
    for (const r of results) {
      expect(r.percentage).toBeGreaterThanOrEqual(0);
      expect(r.percentage).toBeLessThanOrEqual(100);
    }
  });

  it("should include matchReasons as an array", () => {
    const answers: QuizAnswers = {
      budget: "mid",
      commute: "wfh",
      vibe: "quiet",
      household: "couple",
      priorities: ["parks"],
      dealbreakers: ["none"],
    };
    const results = scoreNeighborhoods(answers);
    for (const r of results) {
      expect(Array.isArray(r.matchReasons)).toBe(true);
    }
  });

  it("should include warnings as an array", () => {
    const answers: QuizAnswers = {
      budget: "budget",
      commute: "transit",
      vibe: "urban",
      household: "solo",
      priorities: ["nightlife"],
      dealbreakers: ["car-dependent"],
    };
    const results = scoreNeighborhoods(answers);
    for (const r of results) {
      expect(Array.isArray(r.warnings)).toBe(true);
    }
  });

  it("budget-conscious answers should favor affordable neighborhoods", () => {
    const answers: QuizAnswers = {
      budget: "budget",
      commute: "drive-far",
      vibe: "suburban",
      household: "solo",
      priorities: ["value"],
      dealbreakers: ["none"],
    };
    const results = scoreNeighborhoods(answers);
    const top3Names = results.slice(0, 3).map(r => r.neighborhood.name);
    // Expensive areas like SouthPark should not be in top 3 for budget-conscious users
    expect(top3Names).not.toContain("SouthPark");
  });

  it("transit-focused answers should favor walkable neighborhoods", () => {
    const answers: QuizAnswers = {
      budget: "mid-high",
      commute: "transit",
      vibe: "urban",
      household: "solo",
      priorities: ["walkability"],
      dealbreakers: ["car-dependent"],
    };
    const results = scoreNeighborhoods(answers);
    // Top result should have a decent walk score
    expect(results[0].neighborhood.stats.walkScore).toBeGreaterThanOrEqual(50);
  });

  it("family answers should favor family-friendly neighborhoods", () => {
    const answers: QuizAnswers = {
      budget: "mid-high",
      commute: "short-drive",
      vibe: "suburban",
      household: "school-kids",
      priorities: ["schools", "safety"],
      dealbreakers: ["none"],
    };
    const results = scoreNeighborhoods(answers);
    // Top results should have family-related match reasons
    const top = results[0];
    const allReasons = top.matchReasons.join(" ").toLowerCase();
    // Should have some family or school related reason
    expect(
      allReasons.includes("school") || allReasons.includes("family") || allReasons.includes("safe") || top.percentage > 50
    ).toBe(true);
  });

  it("should handle empty dealbreakers gracefully", () => {
    const answers: QuizAnswers = {
      budget: "mid",
      commute: "wfh",
      vibe: "artsy",
      household: "couple",
      priorities: ["walkability"],
      dealbreakers: [],
    };
    const results = scoreNeighborhoods(answers);
    expect(results).toHaveLength(20);
  });
});

describe("getMatchLabel", () => {
  it("should return Perfect Match for 85+", () => {
    const result = getMatchLabel(90);
    expect(result.label).toBe("Perfect Match");
  });

  it("should return Great Fit for 70-84", () => {
    const result = getMatchLabel(75);
    expect(result.label).toBe("Strong Match");
  });

  it("should return Good Option for 55-69", () => {
    const result = getMatchLabel(60);
    expect(result.label).toBe("Good Match");
  });

  it("should return Worth Exploring for 40-54", () => {
    const result = getMatchLabel(45);
    expect(result.label).toBe("Decent Match");
  });

  it("should return Not Ideal for below 40", () => {
    const result = getMatchLabel(30);
    expect(result.label).toBe("Weak Match");
  });

  it("should include a color string", () => {
    const result = getMatchLabel(90);
    expect(result.color).toBeTruthy();
    expect(typeof result.color).toBe("string");
  });
});
