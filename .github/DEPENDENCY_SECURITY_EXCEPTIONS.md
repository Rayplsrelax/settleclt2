# Dependency security exceptions

This document records dependency advisories that cannot currently be remediated without crossing an upstream package's incompatible version range. Exceptions apply only to the exact dependency path and usage described below. Production dependencies must remain free of known vulnerabilities.

## GHSA-67mh-4wv8-2f99 — esbuild development server

- **Status:** Temporarily accepted development-only risk
- **Severity:** Moderate
- **Dependency path:** `drizzle-kit@0.31.10 > @esbuild-kit/esm-loader@2.6.5 > @esbuild-kit/core-utils@3.3.2 > esbuild@0.18.20`
- **Production reachability:** None. `drizzle-kit` is a development dependency used by the `db:push` script and is not installed as a production dependency. `pnpm audit --prod --audit-level=low` reports no known vulnerabilities.
- **Affected behavior:** The advisory concerns esbuild's development server. Settle CLT does not invoke esbuild's `serve` or `servedir` API through this dependency path.
- **Why no override is used:** `@esbuild-kit/core-utils@3.3.2` requires `esbuild ~0.18.20`, while the patched release begins at `0.25.0`. An override would cross incompatible pre-1.0 minor versions and could mismatch the JavaScript wrapper and native binary.
- **Compensating controls:** The production audit is a blocking CI gate. Database migration tooling is not exposed by the production application. Development servers must not be exposed to untrusted networks.
- **Exit condition:** Upgrade to a stable Drizzle Kit release that removes the deprecated `@esbuild-kit` chain, then run migration generation against a disposable database and require the full audit to pass.
- **Review cadence:** Review whenever Drizzle Kit changes and at least monthly while the exception remains open.

This exception does not authorize suppressing or dismissing the GitHub Dependabot alert. Keep the alert open so the upstream fix remains visible.
