#!/usr/bin/env node
import { resolve } from "node:path";
import { verifyArtifactManifest } from "./artifact-manifest-lib.mjs";

const [artifactRoot, releaseGitSha] = process.argv.slice(2);
if (!artifactRoot || !releaseGitSha) {
  throw new Error("usage: verify-release-artifact.mjs ARTIFACT_ROOT RELEASE_GIT_SHA");
}
const { manifest } = verifyArtifactManifest({
  artifactRoot: resolve(artifactRoot),
  releaseGitSha,
});
process.stdout.write(`${manifest.artifactManifestDigest}\n`);
