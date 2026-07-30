# Repository security rollout

These files define the intended GitHub security posture. Committing them does not change repository settings by itself.

## Safe activation order

1. Merge the CI workflow and confirm `CI / quality` succeeds on `main`.
2. Enable the dependency graph and Dependabot alerts with `PUT /repos/{owner}/{repo}/vulnerability-alerts`.
3. Enable Dependabot security updates with the dedicated `PUT /repos/{owner}/{repo}/automated-security-fixes` endpoint.
4. Apply `security-and-analysis.json` with `PATCH /repos/{owner}/{repo}` to enable secret scanning and push protection. The file intentionally contains only fields supported by the repository update endpoint.
5. Replace the disabled `ray` ruleset with `rulesets/main.json`, or create the new ruleset and remove the disabled one after verification.
6. Verify that direct pushes, force pushes, and branch deletion are blocked and that PRs require the strict `CI / quality` check.

Do not activate the ruleset before the CI check has successfully run on `main`; requiring a status check that has never reported can block updates.

## Ruleset rationale

- Pull requests are mandatory, but required approvals are zero because this is currently a single-maintainer repository and GitHub does not allow authors to approve their own pull requests.
- Review conversations must be resolved.
- Only squash and rebase merges are allowed so history stays linear.
- Force pushes and deletion of the default branch are blocked.
- The required check is strict, so PRs must be tested against current `main`.
- There are no bypass actors.

## Rollback

If the required check is unavailable, disable only the `required_status_checks` rule while diagnosing CI. Keep deletion and non-fast-forward protections active. Do not disable secret scanning merely to unblock a push; remove or rotate the detected credential instead.
