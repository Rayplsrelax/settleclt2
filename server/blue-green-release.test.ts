import { execFileSync, spawnSync } from "node:child_process";
import {
  chmodSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  readlinkSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

const switchScript = resolve("ops/release/switch-traffic.sh");
const rollbackScript = resolve("ops/release/rollback-traffic.sh");
const assignScript = resolve("ops/release/assign-slot.sh");
const systemdTemplate = resolve("ops/release/systemd/settleclt@.service");
const blueEnvironment = resolve("ops/release/systemd/slot-blue.env");
const greenEnvironment = resolve("ops/release/systemd/slot-green.env");
const serverEntry = resolve("server/_core/index.ts");
const temporaryDirectories: string[] = [];

function temporaryDirectory(): string {
  const directory = mkdtempSync(join(tmpdir(), "settleclt-blue-green-test-"));
  temporaryDirectories.push(directory);
  return directory;
}

function executable(path: string, content: string): void {
  writeFileSync(path, content);
  chmodSync(path, 0o755);
}

function createRelease(
  root: string,
  slot: "blue" | "green",
  sha: string
): void {
  const release = join(root, "releases", sha, "dist");
  mkdirSync(release, { recursive: true });
  writeFileSync(
    join(release, "release-manifest.json"),
    JSON.stringify({
      schemaVersion: 1,
      app: "settle-clt",
      version: "1.0.0",
      gitSha: sha,
    })
  );
  mkdirSync(join(root, "slots"), { recursive: true });
  symlinkSync(join("..", "releases", sha), join(root, "slots", slot), "dir");
}

function createHarness(root: string) {
  const bin = join(root, "bin");
  mkdirSync(bin, { recursive: true });
  const nginxLog = join(root, "nginx.log");
  const fakeNginx = join(bin, "nginx");
  const fakeCurl = join(bin, "curl");
  executable(
    fakeNginx,
    `#!/usr/bin/env bash\nprintf '%s\\n' "$*" >> "${nginxLog.split("\\").join("/")}"\nexit 0\n`
  );
  executable(
    fakeCurl,
    `#!/usr/bin/env bash\nurl="\${!#}"\nif [[ "$url" == */api/version ]]; then\n  if [[ "$url" == *:3003/* ]]; then sha=bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb; else sha=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa; fi\n  printf '{"schemaVersion":1,"app":"settle-clt","version":"1.0.0","gitSha":"%s","builtAt":"2026-08-15T00:00:00.000Z"}' "$sha"\nelse\n  printf '<!doctype html><title>Settle CLT</title>'\nfi\n`
  );
  return { fakeCurl, fakeNginx, nginxLog };
}

function commandEnvironment(fakeCurl: string, fakeNginx: string) {
  return {
    ...process.env,
    CURL_BIN: fakeCurl,
    NGINX_BIN: fakeNginx,
    MSYS: "winsymlinks:nativestrict",
  };
}

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    spawnSync(
      "bash",
      [
        "-c",
        'chmod -R u+w -- "$1" 2>/dev/null || true',
        "blue-green-cleanup",
        directory,
      ],
      { env: { ...process.env, MSYS: "winsymlinks:nativestrict" } }
    );
    rmSync(directory, { recursive: true, force: true });
  }
});

describe("blue-green release contracts", () => {
  it("assigns a prepared immutable release to a named slot", () => {
    const root = temporaryDirectory();
    const sha = "cccccccccccccccccccccccccccccccccccccccc";
    const release = join(root, "releases", sha, "dist");
    mkdirSync(release, { recursive: true });
    writeFileSync(
      join(release, "release-manifest.json"),
      JSON.stringify({
        schemaVersion: 1,
        app: "settle-clt",
        version: "1.0.0",
        gitSha: sha,
      })
    );

    execFileSync(
      "bash",
      [assignScript, root, join(root, "active-upstream.conf"), "green", sha],
      {
        env: { ...process.env, MSYS: "winsymlinks:nativestrict" },
      }
    );

    expect(
      readlinkSync(join(root, "slots", "green"))
        .split("\\")
        .join("/")
    ).toContain(sha);
  });

  it("defines isolated blue and green systemd slots on private ports", () => {
    const unit = readFileSync(systemdTemplate, "utf8");
    expect(unit).toContain("WorkingDirectory=/opt/settleclt2/slots/%i");
    expect(unit).toContain("User=settleclt-web");
    expect(unit).toContain("ProtectSystem=strict");
    expect(unit).toContain(
      "ReadWritePaths=/opt/settleclt2/shared/public/manus-storage"
    );
    expect(unit).toContain("EnvironmentFile=/etc/settleclt-app/web.env");
    expect(unit).toContain("EnvironmentFile=/etc/settleclt-app/slot-%i.env");
    expect(unit).toContain("ExecStart=/usr/bin/node dist/index.js");

    expect(readFileSync(blueEnvironment, "utf8")).toContain(
      "HOST=127.0.0.1\nPORT=3002"
    );
    expect(readFileSync(greenEnvironment, "utf8")).toContain(
      "HOST=127.0.0.1\nPORT=3003"
    );
    expect(readFileSync(serverEntry, "utf8")).toMatch(
      /const port = releaseSlot\s*\? preferredPort\s*: await findAvailablePort\(preferredPort\)/
    );
  });

  it("smoke-tests and switches the edge proxy while preserving a backup", () => {
    const root = temporaryDirectory();
    const greenSha = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";
    const nginxDirectory = join(root, "sites-enabled");
    const backupDirectory = join(root, "nginx-backups");
    mkdirSync(nginxDirectory, { recursive: true });
    const site = join(nginxDirectory, "settleclt-com");
    writeFileSync(
      site,
      "server { location / { proxy_pass http://10.10.10.101:3002; } }\n"
    );
    const harness = createHarness(root);

    execFileSync(
      "bash",
      [switchScript, site, backupDirectory, "10.10.10.101", "green", greenSha],
      { env: commandEnvironment(harness.fakeCurl, harness.fakeNginx) }
    );
    execFileSync(
      "bash",
      [switchScript, site, backupDirectory, "10.10.10.101", "green", greenSha],
      { env: commandEnvironment(harness.fakeCurl, harness.fakeNginx) }
    );

    expect(readFileSync(site, "utf8")).toContain("10.10.10.101:3003");
    expect(readFileSync(harness.nginxLog, "utf8")).toContain("-t");
    expect(readFileSync(harness.nginxLog, "utf8")).toContain("-s reload");
    expect(
      readFileSync(
        join(backupDirectory, readdirSync(backupDirectory)[0]),
        "utf8"
      )
    ).toContain("10.10.10.101:3002");
  });

  it("rolls traffic back through the same verified edge switch", () => {
    const root = temporaryDirectory();
    const blueSha = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
    const nginxDirectory = join(root, "sites-enabled");
    const backupDirectory = join(root, "nginx-backups");
    mkdirSync(nginxDirectory, { recursive: true });
    const site = join(nginxDirectory, "settleclt-com");
    writeFileSync(
      site,
      "server { location / { proxy_pass http://10.10.10.101:3003; } }\n"
    );
    const harness = createHarness(root);

    execFileSync(
      "bash",
      [rollbackScript, site, backupDirectory, "10.10.10.101", "blue", blueSha],
      { env: commandEnvironment(harness.fakeCurl, harness.fakeNginx) }
    );

    expect(readFileSync(site, "utf8")).toContain("10.10.10.101:3002");
  });

  it("rejects ambiguous edge proxy configurations without mutation", () => {
    const root = temporaryDirectory();
    const greenSha = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";
    const nginxDirectory = join(root, "sites-enabled");
    const backupDirectory = join(root, "nginx-backups");
    mkdirSync(nginxDirectory, { recursive: true });
    const site = join(nginxDirectory, "settleclt-com");
    const original = [
      "proxy_pass http://10.10.10.101:3002;",
      "proxy_pass   http://10.10.10.101:3002;",
      "",
    ].join("\n");
    writeFileSync(site, original);
    const harness = createHarness(root);

    const result = spawnSync(
      "bash",
      [switchScript, site, backupDirectory, "10.10.10.101", "green", greenSha],
      {
        encoding: "utf8",
        env: commandEnvironment(harness.fakeCurl, harness.fakeNginx),
      }
    );

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("exactly one Settle CLT slot proxy_pass");
    expect(readFileSync(site, "utf8")).toBe(original);
  });

  it("restores the edge site when nginx rejects a candidate", () => {
    const root = temporaryDirectory();
    const greenSha = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";
    const nginxDirectory = join(root, "sites-enabled");
    const backupDirectory = join(root, "nginx-backups");
    mkdirSync(nginxDirectory, { recursive: true });
    const site = join(nginxDirectory, "settleclt-com");
    writeFileSync(
      site,
      "server { location / { proxy_pass http://10.10.10.101:3002; } }\n"
    );
    const harness = createHarness(root);
    executable(harness.fakeNginx, "#!/usr/bin/env bash\nexit 1\n");

    const result = spawnSync(
      "bash",
      [switchScript, site, backupDirectory, "10.10.10.101", "green", greenSha],
      {
        encoding: "utf8",
        env: commandEnvironment(harness.fakeCurl, harness.fakeNginx),
      }
    );

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("nginx rejected the candidate");
    expect(readFileSync(site, "utf8")).toContain("10.10.10.101:3002");
  });
});
