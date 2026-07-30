import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

function readRepositoryFile(relativePath: string): string {
  return readFileSync(
    fileURLToPath(new URL(`../${relativePath}`, import.meta.url)),
    "utf8"
  );
}

describe("repository security configuration", () => {
  it("runs a least-privilege CI quality gate on pushes and pull requests", () => {
    const workflow = readRepositoryFile(".github/workflows/ci.yml");

    expect(workflow).toContain("name: CI");
    expect(workflow).toMatch(/pull_request:\s*\n\s+branches:\s*\[main\]/);
    expect(workflow).toMatch(/push:\s*\n\s+branches:\s*\[main\]/);
    expect(workflow).not.toContain("pull_request_target");
    expect(workflow).toMatch(/permissions:\s*\n\s+contents: read/);
    expect(workflow).toContain("persist-credentials: false");
    expect(workflow).not.toMatch(
      /pnpm\/action-setup@[^\n]+\n\s+with:\n\s+version:/
    );
    expect(workflow).toContain("pnpm install --frozen-lockfile");
    expect(workflow).toContain("pnpm audit --prod --audit-level high");
    expect(workflow).toContain("pnpm run test");
    expect(workflow).toContain("pnpm run check");
    expect(workflow).toContain("pnpm run build");
    expect(workflow).toContain(
      "VITE_MIXPANEL_TOKEN: 00000000000000000000000000000000"
    );
    expect(workflow).not.toContain("${{ secrets.");

    const actionReferences = [
      ...workflow.matchAll(/uses:\s+[^@\s]+@([^\s]+)/g),
    ];
    expect(actionReferences.length).toBeGreaterThan(0);
    for (const [, reference] of actionReferences) {
      expect(reference).toMatch(/^[0-9a-f]{40}$/);
    }
  });

  it("schedules grouped npm and GitHub Actions dependency updates", () => {
    const dependabot = readRepositoryFile(".github/dependabot.yml");

    expect(dependabot).toMatch(/^version: 2/m);
    expect(dependabot.match(/package-ecosystem:/g)).toHaveLength(2);
    expect(dependabot).toContain('package-ecosystem: "npm"');
    expect(dependabot).toContain('package-ecosystem: "github-actions"');
    expect(dependabot).toMatch(/interval: "weekly"/);
    expect(dependabot).toContain('timezone: "America/New_York"');
    expect(dependabot).not.toContain("target-branch:");
    expect(dependabot).toContain("production-dependencies:");
    expect(dependabot).toContain("development-dependencies:");
    expect(dependabot).toContain("security-updates:");
    expect(dependabot.match(/applies-to: "version-updates"/g)).toHaveLength(3);
    expect(dependabot.match(/applies-to: "security-updates"/g)).toHaveLength(1);
  });

  it("defines a post-CI main-branch ruleset without an impossible self-review requirement", () => {
    const ruleset = JSON.parse(
      readRepositoryFile(".github/rulesets/main.json")
    );

    expect(ruleset.enforcement).toBe("active");
    expect(ruleset.conditions.ref_name.include).toContain("~DEFAULT_BRANCH");

    const rules = new Map(
      ruleset.rules.map((rule: { type: string }) => [rule.type, rule])
    );
    expect(rules.has("deletion")).toBe(true);
    expect(rules.has("non_fast_forward")).toBe(true);
    expect(rules.has("required_linear_history")).toBe(true);
    expect(
      rules.get("pull_request").parameters.required_approving_review_count
    ).toBe(0);
    expect(
      rules.get("required_status_checks").parameters.required_status_checks
    ).toContainEqual({ context: "CI / quality" });
    expect(
      rules.get("required_status_checks").parameters
        .strict_required_status_checks_policy
    ).toBe(true);
  });

  it("defines the GitHub security features to enable after approval", () => {
    const settings = JSON.parse(
      readRepositoryFile(".github/security-and-analysis.json")
    );

    expect(settings.security_and_analysis).toEqual({
      secret_scanning: { status: "enabled" },
      secret_scanning_push_protection: { status: "enabled" },
    });

    const rollout = readRepositoryFile(".github/SECURITY_ROLLOUT.md");
    expect(rollout).toContain("PUT /repos/{owner}/{repo}/vulnerability-alerts");
    expect(rollout).toContain(
      "PUT /repos/{owner}/{repo}/automated-security-fixes"
    );
    expect(rollout).toContain("PATCH /repos/{owner}/{repo}");
    expect(rollout).not.toContain("validity checks");
  });
});
