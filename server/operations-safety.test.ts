import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  chmodSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { gzipSync } from "node:zlib";
import { afterEach, describe, expect, it } from "vitest";

const backupScript = resolve("ops/release/create-backup.sh");
const releaseLibrary = resolve("ops/release/lib.sh");
const monitorScript = resolve("ops/release/monitor-release.sh");
const restoreDrillScript = resolve("ops/release/dr-restore-drill.sh");
const temporaryDirectories: string[] = [];

function temporaryDirectory(): string {
  const directory = mkdtempSync(join(tmpdir(), "settleclt-ops-safety-test-"));
  temporaryDirectories.push(directory);
  return directory;
}

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

describe("pre-deployment backup controls", () => {
  it("publishes checksummed database, release, and shared-data archives", () => {
    const root = temporaryDirectory();
    const backupRoot = join(root, "backups");
    const sha = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
    const release = join(root, "releases", sha);
    mkdirSync(join(release, "dist"), { recursive: true });
    mkdirSync(join(root, "shared", "public", "manus-storage", "uploads"), {
      recursive: true,
    });
    writeFileSync(join(release, "dist", "index.js"), "release artifact");
    writeFileSync(
      join(release, "dist", "release-manifest.json"),
      JSON.stringify({
        schemaVersion: 1,
        app: "settle-clt",
        version: "1.0.0",
        gitSha: sha,
        builtAt: "2026-08-15T00:00:00.000Z",
      })
    );
    writeFileSync(
      join(root, "shared", "public", "manus-storage", "uploads", "sample.txt"),
      "shared data"
    );
    symlinkSync(`releases/${sha}`, join(root, "current"), "junction");

    const defaultsFile = join(root, "mysql.cnf");
    writeFileSync(
      defaultsFile,
      "[client]\nuser=backup\npassword=not-a-real-secret\n"
    );
    chmodSync(defaultsFile, 0o600);

    const fakeDump = join(root, "mysqldump");
    writeFileSync(
      fakeDump,
      '#!/usr/bin/env bash\nprintf "%s\\n" "-- fake dump" "CREATE TABLE evidence (id int);" "INSERT INTO evidence VALUES (1);" "-- Dump completed on 2026-08-15"\n'
    );
    chmodSync(fakeDump, 0o755);

    execFileSync(
      "bash",
      [backupScript, root, backupRoot, defaultsFile, "settleclt", "14"],
      {
        env: {
          ...process.env,
          MYSQLDUMP_BIN: fakeDump,
          BACKUP_TIMESTAMP: "20260815T120000Z",
          BACKUP_TEST_ALLOW_INSECURE_DEFAULTS: "1",
          NODE_ENV: "test",
          MSYS: "winsymlinks:nativestrict",
        },
      }
    );

    const backup = join(backupRoot, "20260815T120000Z-aaaaaaaaaaaa");
    expect(readdirSync(backup).sort()).toEqual([
      "SHA256SUMS",
      "backup-evidence.json",
      "database.sql.gz",
      "release.tar.gz",
      "shared.tar.gz",
    ]);
    const evidence = JSON.parse(
      readFileSync(join(backup, "backup-evidence.json"), "utf8")
    );
    expect(evidence).toMatchObject({
      schemaVersion: 1,
      app: "settle-clt",
      gitSha: sha,
      database: "settleclt",
      status: "verified",
    });
    expect(readFileSync(join(backup, "SHA256SUMS"), "utf8")).toContain(
      "database.sql.gz"
    );
  });

  it("rejects an unsafe database name before invoking mysqldump", () => {
    const root = temporaryDirectory();
    const defaultsFile = join(root, "mysql.cnf");
    writeFileSync(defaultsFile, "[client]\n");
    chmodSync(defaultsFile, 0o600);

    const result = spawnSync(
      "bash",
      [
        backupScript,
        root,
        join(root, "backups"),
        defaultsFile,
        "settleclt;drop",
        "14",
      ],
      { encoding: "utf8" }
    );

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("invalid database name");
  });

  it("rejects privileged SQL hidden in executable comments", () => {
    const root = temporaryDirectory();
    const dump = join(root, "database.sql.gz");
    writeFileSync(
      dump,
      gzipSync(
        "/*!50000 CREATE DATABASE `outside`; */\nCREATE TABLE evidence (id int);\n-- Dump completed on 2026-08-15\n"
      )
    );

    const result = spawnSync(
      "bash",
      [
        "-c",
        'source "$1"; validate_database_dump "$2"',
        "backup-test",
        releaseLibrary,
        dump,
      ],
      { encoding: "utf8" }
    );
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("non-allowlisted executable SQL comment");
  });

  it("rejects comment-obfuscated privileged SQL", () => {
    const root = temporaryDirectory();
    const dump = join(root, "database.sql.gz");
    writeFileSync(
      dump,
      gzipSync(
        "CREATE/**/DATABASE `outside`;\n-- Dump completed on 2026-08-15\n"
      )
    );
    const result = spawnSync(
      "bash",
      [
        "-c",
        'source "$1"; validate_database_dump "$2"',
        "backup-test",
        releaseLibrary,
        dump,
      ],
      { encoding: "utf8" }
    );
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("unsupported ordinary SQL block comment");
  });

  it("rejects executable-comment separators and unquoted cross-schema joins", () => {
    for (const sql of [
      "CREATE /*!50000 */ DATABASE outside;",
      "USE /*!50000 */ outside;",
      "SET /*!50000 */ GLOBAL max_connections=1;",
      "SELECT * FROM local_t JOIN settleclt_dr_19990101.secret ON 1=1;",
    ]) {
      const root = temporaryDirectory();
      const dump = join(root, "database.sql.gz");
      writeFileSync(
        dump,
        gzipSync(`${sql}\n-- Dump completed on 2026-08-15\n`)
      );
      const result = spawnSync(
        "bash",
        [
          "-c",
          'source "$1"; validate_database_dump "$2"',
          "backup-test",
          releaseLibrary,
          dump,
        ],
        { encoding: "utf8" }
      );
      expect(result.status, sql).not.toBe(0);
    }
  });

  it("rejects mixed-quoted qualification but accepts dotted string data", () => {
    for (const sql of [
      "SELECT * FROM local_t JOIN settleclt_dr_19990101.`secret` ON 1=1;",
      "SELECT * FROM local_t JOIN `settleclt_dr_19990101`.secret ON 1=1;",
      "DROP TABLE `settleclt_dr_19990101`.secret;",
      'SET SESSION sql_mode=\'ANSI_QUOTES\'; DROP TABLE "settleclt_dr_19990101"."secret";',
      'SELECT 1; SET SESSION SQL_MODE=\'ANSI_QUOTES\'; DROP TABLE "settleclt_dr_19990101"."secret";',
      'SET\nSESSION SQL_MODE=\'ANSI_QUOTES\'; DROP TABLE "settleclt_dr_19990101"."secret";',
      "/*!50000 SET SESSION SQL_MODE=CONCAT('ANSI','_QUOTES') */;\nDROP TABLE \"settleclt_dr_19990101\".\"secret\";",
      "SELECT * FROM 123outside.secret;",
    ]) {
      const root = temporaryDirectory();
      const dump = join(root, "database.sql.gz");
      writeFileSync(
        dump,
        gzipSync(`${sql}\n-- Dump completed on 2026-08-15\n`)
      );
      const result = spawnSync("bash", [
        "-c",
        'source "$1"; validate_database_dump "$2"',
        "test",
        releaseLibrary,
        dump,
      ]);
      expect(result.status, sql).not.toBe(0);
    }

    const root = temporaryDirectory();
    const dump = join(root, "database.sql.gz");
    writeFileSync(
      dump,
      gzipSync(
        "INSERT INTO evidence VALUES ('user@example.com', 'photo.jpg', 'https://settleclt.com/path');\n-- Dump completed on 2026-08-15\n"
      )
    );
    const accepted = spawnSync("bash", [
      "-c",
      'source "$1"; validate_database_dump "$2"',
      "test",
      releaseLibrary,
      dump,
    ]);
    expect(accepted.status).toBe(0);
  });
});

describe("release monitoring decision controls", () => {
  it("records a pass decision when every release sample is healthy", () => {
    const root = temporaryDirectory();
    const evidence = join(root, "monitor.json");
    const sha = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";
    const fakeCurl = join(root, "curl");
    const metricsCounter = join(root, "metrics-count").split("\\").join("/");
    writeFileSync(
      fakeCurl,
      `#!/usr/bin/env bash\nurl="\${!#}"\ncase "$url" in\n  */api/version) printf '%s' '{"app":"settle-clt","gitSha":"${sha}"}' ;;\n  */health/live) printf '%s' '{"status":"ok"}' ;;\n  */health/ready) printf '%s' '{"status":"ready"}' ;;\n  */health/summary) count=0; [[ ! -f '${metricsCounter}' ]] || count=$(<'${metricsCounter}'); printf '{"requestCount":%s,"status5xx":0}' "$count"; printf '%s' "$((count + 100))" > '${metricsCounter}' ;;\n  *) printf '%s' '<!doctype html><title>Settle CLT</title>' ;;\nesac\n`
    );
    chmodSync(fakeCurl, 0o755);

    execFileSync(
      "bash",
      [monitorScript, "https://settleclt.test", sha, evidence, "3", "0", "1"],
      { env: { ...process.env, CURL_BIN: fakeCurl } }
    );

    expect(JSON.parse(readFileSync(evidence, "utf8"))).toMatchObject({
      decision: "PASS",
      expectedGitSha: sha,
      samples: 3,
      failedSamples: 0,
      automaticRollbackExecuted: false,
      traffic: { observedRequests: 300, observed5xxRate: 0 },
    });
  }, 15_000);

  it("recommends but never executes rollback after the failure threshold", () => {
    const root = temporaryDirectory();
    const evidence = join(root, "monitor.json");
    const sha = "cccccccccccccccccccccccccccccccccccccccc";
    const fakeCurl = join(root, "curl");
    writeFileSync(
      fakeCurl,
      `#!/usr/bin/env bash
url="\${!#}"
state="${join(root, "monitor-state").split("\\").join("/")}"
case "$url" in
  */health/summary)
    if [[ ! -f "$state" ]]; then printf '%s' '{"requestCount":0,"status5xx":0}' > "$state"; printf '%s' '{"requestCount":0,"status5xx":0}'; else exit 22; fi ;;
  */api/version|*/health/live|*/health/ready|/)
    exit 22 ;;
  *) exit 22 ;;
esac
`
    );
    chmodSync(fakeCurl, 0o755);

    const result = spawnSync(
      "bash",
      [monitorScript, "https://settleclt.test", sha, evidence, "3", "0", "2"],
      { encoding: "utf8", env: { ...process.env, CURL_BIN: fakeCurl } }
    );

    expect(result.status).toBe(2);
    expect(JSON.parse(readFileSync(evidence, "utf8"))).toMatchObject({
      decision: "ROLLBACK_RECOMMENDED",
      failedSamples: 2,
      automaticRollbackExecuted: false,
    });
  });
});

describe("restore SQL client safety", () => {
  it("rejects mysql client shell directives and disables client commands", () => {
    const library = readFileSync(releaseLibrary, "utf8");
    const drill = readFileSync(restoreDrillScript, "utf8");
    expect(library).toContain("mysql client directive");
    expect(library).toContain("system");
    expect(library).toContain("source");
    expect(drill).toContain("--binary-mode=1");
  });
});

describe("archive listing validation", () => {
  it("consumes complete tar listings and propagates tar failures", () => {
    for (const script of [backupScript, restoreDrillScript]) {
      const source = readFileSync(script, "utf8");
      expect(source).toContain(
        'verbose_listing=$(tar --force-local -tvzf "$archive") || fail'
      );
      expect(source).toContain("grep -Eq '^[^d-]' <<< \"$verbose_listing\"");
      expect(source).not.toContain('tar --force-local -tvzf "$archive" | grep');
      expect(source).not.toContain("done < <(tar --force-local -tzf");
    }
  });
});

describe("disaster-recovery restore drill", () => {
  it("rejects a checksum manifest that does not name exactly the restore artifacts", () => {
    const root = temporaryDirectory();
    const backup = join(root, "backup");
    mkdirSync(backup, { recursive: true });
    for (const name of ["database.sql.gz", "release.tar.gz", "shared.tar.gz"]) {
      writeFileSync(join(backup, name), "untrusted");
    }
    writeFileSync(
      join(backup, "SHA256SUMS"),
      `${"0".repeat(64)}  unrelated.txt\n`
    );
    writeFileSync(join(backup, "backup-evidence.json"), "{}\n");
    const defaultsFile = join(root, "mysql.cnf");
    writeFileSync(defaultsFile, "[client]\n");
    chmodSync(defaultsFile, 0o600);

    const result = spawnSync(
      "bash",
      [
        restoreDrillScript,
        backup,
        join(root, "work"),
        defaultsFile,
        "settleclt_dr_20260815_checksum",
        join(root, "evidence"),
      ],
      {
        encoding: "utf8",
        env: {
          ...process.env,
          BACKUP_TEST_ALLOW_INSECURE_DEFAULTS: "1",
          DRILL_EXPECTED_SERVER_UUID: "11111111-1111-1111-1111-111111111111",
          DRILL_PRODUCTION_SERVER_UUID: "22222222-2222-2222-2222-222222222222",
        },
      }
    );
    expect(result.status).not.toBe(0);
  });

  it("restores a verified backup into an isolated database and records evidence", () => {
    const root = temporaryDirectory();
    const backup = join(root, "backup");
    const source = join(root, "source");
    const sha = "dddddddddddddddddddddddddddddddddddddddd";
    mkdirSync(backup, { recursive: true });
    mkdirSync(join(source, sha, "dist"), { recursive: true });
    mkdirSync(join(source, "shared", "uploads"), { recursive: true });
    writeFileSync(
      join(source, sha, "dist", "release-manifest.json"),
      JSON.stringify({ schemaVersion: 1, app: "settle-clt", gitSha: sha })
    );
    writeFileSync(join(source, "shared", "uploads", "proof.txt"), "restored");
    writeFileSync(
      join(backup, "database.sql.gz"),
      gzipSync(
        "CREATE TABLE evidence (id int); INSERT INTO evidence VALUES (1);\n-- Dump completed on 2026-08-15\n"
      )
    );
    execFileSync("tar", [
      "--force-local",
      "-C",
      source,
      "-czf",
      join(backup, "release.tar.gz"),
      sha,
    ]);
    execFileSync("tar", [
      "--force-local",
      "-C",
      source,
      "-czf",
      join(backup, "shared.tar.gz"),
      "shared",
    ]);
    const artifactNames = [
      "database.sql.gz",
      "release.tar.gz",
      "shared.tar.gz",
    ];
    writeFileSync(
      join(backup, "SHA256SUMS"),
      artifactNames
        .map(name => {
          const hash = createHash("sha256")
            .update(readFileSync(join(backup, name)))
            .digest("hex");
          return `${hash}  ${name}`;
        })
        .join("\n") + "\n"
    );
    writeFileSync(
      join(backup, "backup-evidence.json"),
      JSON.stringify({
        schemaVersion: 1,
        app: "settle-clt",
        gitSha: sha,
        database: "settleclt",
        status: "verified",
        consistency: "transactional-database-before-append-only-shared-archive",
        sharedDataContract: "atomic-immutable-write-before-database-reference",
        artifacts: ["database.sql.gz", "release.tar.gz", "shared.tar.gz"],
        checksums: "SHA256SUMS",
      })
    );

    const defaultsFile = join(root, "mysql.cnf");
    writeFileSync(defaultsFile, "[client]\n");
    const mysqlLog = join(root, "mysql.log");
    const fakeMysql = join(root, "mysql");
    writeFileSync(
      fakeMysql,
      `#!/usr/bin/env bash\nprintf '%s\\n' "$*" >> "${mysqlLog.split("\\").join("/")}"\nargs="$*"\nif [[ "$args" == *'SHOW GRANTS'* ]]; then printf '%s\\n' 'GRANT USAGE ON *.* TO drill' 'GRANT ALL PRIVILEGES ON settleclt\\_dr\\_%.* TO drill'; elif [[ "$args" == *'@@server_uuid'* ]]; then printf '11111111-1111-1111-1111-111111111111\\t0\\t0\\tOFF\\n'; elif [[ "$args" == *'SCHEMATA'* ]]; then printf '0\\n'; elif [[ "$args" == *'TABLE_NAME'* ]]; then printf 'evidence\\n'; elif [[ "$args" == *'COUNT(*)'* ]]; then printf '1\\n'; else cat >/dev/null || true; fi\n`
    );
    chmodSync(fakeMysql, 0o755);
    const evidence = join(root, "dr-evidence.json");

    execFileSync(
      "bash",
      [
        restoreDrillScript,
        backup,
        join(root, "drill-work"),
        defaultsFile,
        "settleclt_dr_20260815",
        evidence,
      ],
      {
        env: {
          ...process.env,
          MYSQL_BIN: fakeMysql,
          PROVISION_MYSQL_BIN: fakeMysql,
          DRILL_PROVISION_DEFAULTS_FILE: defaultsFile,
          NODE_ENV: "test",
          BACKUP_TEST_ALLOW_INSECURE_DEFAULTS: "1",
          DRILL_EXPECTED_SERVER_UUID: "11111111-1111-1111-1111-111111111111",
          DRILL_PRODUCTION_SERVER_UUID: "22222222-2222-2222-2222-222222222222",
        },
      }
    );

    expect(JSON.parse(readFileSync(evidence, "utf8"))).toMatchObject({
      status: "verified",
      sourceGitSha: sha,
      drillDatabase: "settleclt_dr_20260815",
      tableCount: 1,
      totalRows: 1,
      drillDatabaseDropped: true,
    });
    expect(readFileSync(mysqlLog, "utf8")).toContain(
      "DROP DATABASE IF EXISTS `settleclt_dr_20260815`"
    );
  });
});

describe("scheduled operations and rollback documentation", () => {
  it("defines persistent backup and monthly restore-drill timers", () => {
    const backupTimer = readFileSync(
      resolve("ops/release/systemd/settleclt-backup.timer"),
      "utf8"
    );
    const backupService = readFileSync(
      resolve("ops/release/systemd/settleclt-backup.service"),
      "utf8"
    );
    const drillTimer = readFileSync(
      resolve("ops/release/systemd/settleclt-dr-drill.timer"),
      "utf8"
    );
    const drillService = readFileSync(
      resolve("ops/release/systemd/settleclt-dr-drill.service"),
      "utf8"
    );

    expect(backupTimer).toContain("OnCalendar=*-*-* 02:00:00");
    expect(backupTimer).toContain("Persistent=true");
    expect(backupService).toContain("create-backup.sh");
    expect(backupService).toContain("mysql-backup.cnf");
    expect(backupService).toContain("User=settleclt-backup");
    expect(drillTimer).toContain("OnCalendar=monthly");
    expect(drillTimer).toContain("Persistent=true");
    expect(drillService).toContain("run-latest-dr-drill.sh");
    expect(drillService).toContain("User=settleclt-drill");
  });

  it("documents the approval-gated application rollback boundary", () => {
    const checklist = readFileSync(
      resolve("docs/operations/RELEASE_ROLLBACK_CHECKLIST.md"),
      "utf8"
    );
    expect(checklist).toContain("Explicit rollback approval");
    expect(checklist).toContain("rollback-traffic.sh");
    expect(checklist).toContain("/api/version");
    expect(checklist).toContain("Do not restore the database");
    expect(checklist).toContain("schema-compatible");
  });
});
