import * as path from "node:path";

type StorageEnvironment = Record<string, string | undefined>;

function resolveFromWorkingDirectory(workingDirectory: string): string {
  if (workingDirectory.startsWith("/")) {
    return path.posix.resolve(workingDirectory, "public", "manus-storage");
  }
  return path.resolve(workingDirectory, "public", "manus-storage");
}

export function resolveStorageDirectory(
  environment: StorageEnvironment,
  workingDirectory: string,
  isProduction: boolean
): string {
  const configured = environment.SETTLECLT_STORAGE_DIR;
  if (!configured) {
    if (isProduction) {
      throw new Error("SETTLECLT_STORAGE_DIR is required in production");
    }
    return resolveFromWorkingDirectory(workingDirectory);
  }

  if (!configured.startsWith("/") && !path.isAbsolute(configured)) {
    throw new Error("SETTLECLT_STORAGE_DIR must be absolute");
  }
  const configuredPath = configured.startsWith("/")
    ? path.posix.resolve(configured)
    : path.resolve(configured);
  const workingPath = workingDirectory.startsWith("/")
    ? path.posix.resolve(workingDirectory)
    : path.resolve(workingDirectory);
  const separator = configured.startsWith("/") ? path.posix.sep : path.sep;
  if (
    isProduction &&
    (configuredPath === workingPath ||
      configuredPath.startsWith(`${workingPath}${separator}`))
  ) {
    throw new Error(
      "SETTLECLT_STORAGE_DIR must be outside the production working directory"
    );
  }
  return configuredPath;
}
