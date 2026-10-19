import { readFile, stat } from "node:fs/promises";

const MAX_FILE_SIZE = 2 * 1024 * 1024;
const BINARY_PREFIX_SIZE = 8 * 1024;

const PROVIDER_RULES = Object.freeze([
  ["github-token", /\b(?:gh[pousr]_[A-Za-z0-9]{36,255}|github_pat_[A-Za-z0-9_]{20,255})\b/g],
  ["aws-access-key", /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/g],
  ["openai-api-key", /\bsk-(?!ant-)(?:proj-)?[A-Za-z0-9_-]{20,}\b/g],
  ["anthropic-api-key", /\bsk-ant-[A-Za-z0-9_-]{20,}\b/g],
  ["private-key", /-----BEGIN (?:[A-Z0-9 ]+ )?PRIVATE KEY-----/g],
]);

const SENSITIVE_NAME = /(?:_SECRET|_TOKEN|_PASSWORD|_PRIVATE_KEY)$/;
const PUBLIC_SENSITIVE_NAME = /^PUBLIC_.*(?:KEY|TOKEN|SECRET|PASSWORD)/;
const ASSIGNMENT = /^\s*(?:export\s+)?(?:const\s+|let\s+|var\s+)?([A-Z][A-Z0-9_]*)\s*[:=]\s*(.*?)\s*[,;]?\s*$/;
const EXAMPLE_PLACEHOLDERS = new Set([
  "",
  "changeme",
  "change_me",
  "example",
  "placeholder",
  "replace_me",
  "redacted",
  "xxx",
  "your_key_here",
  "your_token_here",
  "your_secret_here",
  "your_password_here",
  "your_private_key_here",
]);

function lineNumber(text, index) {
  return text.slice(0, index).split("\n").length;
}

function addFinding(findings, seen, finding) {
  const key = `${finding.rule}:${finding.filePath}:${finding.line}`;
  if (!seen.has(key)) {
    seen.add(key);
    findings.push(finding);
  }
}

function normalizedAssignmentValue(rawValue) {
  const withoutComment = rawValue.replace(/\s+#.*$/, "").trim();
  return withoutComment.replace(/^(['"])(.*)\1$/, "$2").trim().toLowerCase();
}

function isAllowedExampleValue(filePath, value) {
  return /(?:^|\.)example$/i.test(filePath) && (
    EXAMPLE_PLACEHOLDERS.has(value) ||
    /^<[^>]+>$/.test(value) ||
    /^your_[a-z0-9_]+$/.test(value)
  );
}

export function scanText({ text, filePath }) {
  const findings = [];
  const seen = new Set();

  for (const [rule, pattern] of PROVIDER_RULES) {
    pattern.lastIndex = 0;
    for (const match of text.matchAll(pattern)) {
      addFinding(findings, seen, {
        rule,
        filePath,
        line: lineNumber(text, match.index),
      });
    }
  }

  for (const [index, line] of text.split("\n").entries()) {
    const match = line.match(ASSIGNMENT);
    if (!match) continue;

    const [, name, rawValue] = match;
    const value = normalizedAssignmentValue(rawValue);
    if (isAllowedExampleValue(filePath, value)) continue;

    const rule = PUBLIC_SENSITIVE_NAME.test(name)
      ? "public-secret"
      : SENSITIVE_NAME.test(name)
        ? "sensitive-assignment"
        : null;
    if (rule) addFinding(findings, seen, { rule, filePath, line: index + 1 });
  }

  return findings;
}

export async function scanFiles(filePaths) {
  const findings = [];

  for (const filePath of filePaths) {
    const fileStat = await stat(filePath);
    if (!fileStat.isFile() || fileStat.size > MAX_FILE_SIZE) continue;

    const buffer = await readFile(filePath);
    if (buffer.subarray(0, BINARY_PREFIX_SIZE).includes(0)) continue;
    findings.push(...scanText({ text: buffer.toString("utf8"), filePath }));
  }

  const unique = new Map(
    findings.map((finding) => [
      `${finding.rule}:${finding.filePath}:${finding.line}`,
      finding,
    ]),
  );
  return [...unique.values()];
}

export function formatFinding({ rule, filePath, line }) {
  return `[${rule}] ${filePath}:${line}`;
}
