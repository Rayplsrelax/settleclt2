#!/usr/bin/env bash
set -euo pipefail

fail() {
  printf 'release error: %s\n' "$*" >&2
  exit 1
}

require_release_sha() {
  [[ "$1" =~ ^[0-9a-f]{40}$ ]] || fail "release SHA must be 40 lowercase hexadecimal characters"
}

atomic_symlink() {
  local target=$1
  local link=$2
  local temporary="${link}.tmp.$$"
  rm -f -- "$temporary"
  ln -s -- "$target" "$temporary"
  mv -Tf -- "$temporary" "$link"
}

release_target() {
  printf 'releases/%s' "$1"
}

require_slot() {
  [[ "$1" == "blue" || "$1" == "green" ]] || fail "slot must be blue or green"
}

slot_port() {
  case "$1" in
    blue) printf '%s' "${SLOT_PORT_BLUE:-3002}" ;;
    green) printf '%s' "${SLOT_PORT_GREEN:-3003}" ;;
    *) fail "slot must be blue or green" ;;
  esac
}

validate_database_dump() {
  local dump_path=$1
  [[ -f "$dump_path" && ! -L "$dump_path" ]] || fail "database dump must be a regular non-symlink file"
  gzip -t -- "$dump_path"
  if ! gzip -dc -- "$dump_path" | node -e '
const readline = require("node:readline");
const forbidden = [
  /\b(?:CREATE|DROP)\s+DATABASE\b/i,
  /\bUSE\s+(?:`[^`]+`|[A-Za-z_$][\w$]*)/i,

  /\b(?:GRANT|REVOKE)\b/i,
  /\b(?:CREATE|ALTER|DROP)\s+USER\b/i,
  /\bSET\s+(?:@@)?GLOBAL\b/i,
  /\b(?:INTO\s+(?:OUTFILE|DUMPFILE)|LOAD\s+DATA(?:\s+LOCAL)?\s+INFILE)\b/i,
  /\bINSTALL\s+(?:PLUGIN|COMPONENT)\b/i,
  /\bDEFINER\s*=/i,
  /\bSQL\s+SECURITY\s+DEFINER\b/i,
  /\b(?:SET\s+(?:(?:@@)?GLOBAL|PERSIST|@@PERSIST)|RESET\s+PERSIST)\b/i,
  /\b(?:FROM|INTO|UPDATE|TABLE|REFERENCES|TRIGGER|VIEW|PROCEDURE|FUNCTION)\s+(?:IF\s+(?:NOT\s+)?EXISTS\s+)?[A-Za-z_$][\w$]*\s*\./i,
];
let footer = false;
let scanWindow = "";
let qualificationState = "sql";
let qualificationWindow = "";
let lexicalState = "sql";
let sqlModeRestored = false;
function sanitizeForQualification(line) {
  let sanitized = "";
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    const next = line[index + 1];
    if (qualificationState === "single" || qualificationState === "double") {
      const closing = qualificationState === "single" ? String.fromCharCode(39) : "\"";
      sanitized += " ";
      if (character === "\\") {
        if (next !== undefined) {
          sanitized += " ";
          index += 1;
        }
      } else if (character === closing) {
        if (next === closing) {
          sanitized += " ";
          index += 1;
        } else qualificationState = "sql";
      }
      continue;
    }
    if (qualificationState === "backtick") {
      sanitized += character;
      if (character === "`") {
        if (next === "`") {
          sanitized += next;
          index += 1;
        } else qualificationState = "sql";
      }
      continue;
    }
    if (character === "#" || (character === "-" && next === "-" && /\s/.test(line[index + 2] ?? " "))) break;
    if (character.charCodeAt(0) === 39) {
      qualificationState = "single";
      sanitized += " ";
    } else if (character === "\"") {
      qualificationState = "double";
      sanitized += " ";
    } else {
      if (character === "`") qualificationState = "backtick";
      sanitized += character;
    }
  }
  return sanitized;
}
function hasUnsafeOrdinaryComment(line) {
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    const next = line[index + 1];
    if (lexicalState === "single" || lexicalState === "double" || lexicalState === "backtick") {
      const closing = lexicalState === "single" ? String.fromCharCode(39) : lexicalState === "double" ? "\"" : "`";
      if (character === "\\") {
        index += 1;
      } else if (character === closing) {
        if (next === closing) index += 1;
        else lexicalState = "sql";
      }
      continue;
    }
    if (character === "#" || (character === "-" && next === "-" && /\s/.test(line[index + 2] ?? " "))) break;
    if (character.charCodeAt(0) === 39) lexicalState = "single";
    else if (character === "\"") lexicalState = "double";
    else if (character === "`") lexicalState = "backtick";
    else if (character === "/" && next === "*") {
      const marker = line[index + 2];
      if (marker !== "!" && !(marker === "M" && line[index + 3] === "!")) return true;
      index += marker === "M" ? 3 : 2;
    }
  }
  return false;
}
const lines = readline.createInterface({ input: process.stdin, crlfDelay: Infinity });
lines.on("line", line => {
  if (/^-- Dump completed/.test(line)) footer = true;
  if (/\bSQL_MODE\b/i.test(line)) {
    const safeInitialMode = /^\s*\/\*![0-9]{5,6}\s+SET\s+@OLD_SQL_MODE=@@SQL_MODE,\s*SQL_MODE=(["\x27])NO_AUTO_VALUE_ON_ZERO\1\s*\*\/\s*;?\s*$/i.test(line);
    const safeModeRestore = /^\s*\/\*![0-9]{5,6}\s+SET\s+SQL_MODE=@OLD_SQL_MODE\s*\*\/\s*;?\s*$/i.test(line);
    if (!safeInitialMode && !safeModeRestore) {
      console.error("database dump may not change SQL mode semantics");
      process.exitCode = 1;
      lines.close();
      return;
    }
    if (safeModeRestore) sqlModeRestored = true;
  } else if (sqlModeRestored && !/^\s*(?:$|--|#|\/\*(?:!|M!)[0-9]{5,6}\s+SET\b[^\r\n]*\*\/\s*;?\s*$)/i.test(line)) {
    console.error("database dump contains SQL after restoring the original SQL mode");
    process.exitCode = 1;
    lines.close();
    return;
  }
  if (/\/\*(?:!|M!)/i.test(line) && !/^\s*\/\*(?:!|M!)\d{5,6}\s+(?:SET\s+(?!(?:(?:@@)?GLOBAL|PERSIST|@@PERSIST)\b)|ALTER\s+TABLE\s+(?:`[^`]+`|[A-Za-z_$][\w$]*)\s+(?:DISABLE|ENABLE)\s+KEYS\s*)[^\r\n]*\*\/\s*;?\s*$/i.test(line)) {
    console.error("database dump contains a non-allowlisted executable SQL comment");
    process.exitCode = 1;
    lines.close();
    return;
  }
  if (hasUnsafeOrdinaryComment(line)) {
    console.error("database dump contains an unsupported ordinary SQL block comment");
    process.exitCode = 1;
    lines.close();
    return;
  }
  if (/^\s*(?:\\|system(?:\s|$)|source(?:\s|$)|delimiter(?:\s|$))/i.test(line)) {
    console.error("database dump contains a forbidden mysql client directive");
    process.exitCode = 1;
    lines.close();
    return;
  }
  scanWindow = `${scanWindow} ${line}`.replace(/\s+/g, " ").slice(-65536);
  qualificationWindow = `${qualificationWindow} ${sanitizeForQualification(line)}`.replace(/\s+/g, " ").slice(-65536);
  if (/(?:`[^`\r\n]+`|[\p{L}\p{N}_$]*[\p{L}_$][\p{L}\p{N}_$]*)\s*\.\s*(?:`[^`\r\n]+`|[\p{L}\p{N}_$]*[\p{L}_$][\p{L}\p{N}_$]*)/u.test(qualificationWindow)) {
    console.error("database dump contains a forbidden qualified identifier");
    process.exitCode = 1;
    lines.close();
    return;
  }
  if (forbidden.some(pattern => pattern.test(scanWindow))) {
    console.error("database dump contains a forbidden cross-schema or privileged statement");
    process.exitCode = 1;
    lines.close();
  }
});
lines.on("close", () => {
  if (!footer && !process.exitCode) {
    console.error("database dump completion footer is missing");
    process.exitCode = 1;
  }
});
'; then
    fail "database dump validation failed"
  fi
}
