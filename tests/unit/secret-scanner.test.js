import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";

import {
  formatFinding,
  scanFiles,
  scanText,
} from "../../scripts/security/secret-scanner.mjs";

const join = (...parts) => parts.join("");

describe("secret scanner", () => {
  it.each([
    ["github-token", join("gh", "p_", "A".repeat(36))],
    ["aws-access-key", join("AK", "IA", "A".repeat(16))],
    ["openai-api-key", join("sk", "-proj-", "A".repeat(32))],
    ["anthropic-api-key", join("sk", "-ant-api03-", "A".repeat(32))],
    ["private-key", join("-----BEGIN ", "PRIVATE KEY-----")],
  ])("detects %s provider-shaped credentials", (rule, value) => {
    expect(scanText({ text: `prefix ${value}`, filePath: "src/value.js" })).toEqual([
      expect.objectContaining({ rule, filePath: "src/value.js", line: 1 }),
    ]);
  });

  it("detects generic sensitive assignments and unsafe public variables", () => {
    const secretName = join("DATABASE_", "SECRET");
    const publicName = join("PUBLIC_", "SERVICE_TOKEN");
    const findings = scanText({
      text: `${secretName}=correct-horse-battery-staple\n${publicName}=visible-credential`,
      filePath: ".env.local",
    });

    expect(findings).toEqual([
      expect.objectContaining({ rule: "sensitive-assignment", line: 1 }),
      expect.objectContaining({ rule: "public-secret", line: 2 }),
    ]);
  });

  it("reports line numbers and formats only redacted metadata", () => {
    const credential = join("gh", "o_", "Z".repeat(36));
    const [finding] = scanText({
      text: `safe\nstill safe\n${credential}`,
      filePath: "config.txt",
    });
    const formatted = formatFinding(finding);

    expect(finding.line).toBe(3);
    expect(formatted).toContain("github-token");
    expect(formatted).toContain("config.txt:3");
    expect(formatted).not.toContain(credential);
  });

  it("allows only explicit placeholder or empty values in example files", () => {
    const safe = scanText({
      text: "API_TOKEN=replace_me\nDB_PASSWORD=\nSERVICE_PRIVATE_KEY=your_private_key_here",
      filePath: ".env.example",
    });
    const unsafe = scanText({
      text: "API_TOKEN=real-looking-value",
      filePath: ".env.example",
    });

    expect(safe).toEqual([]);
    expect(unsafe).toEqual([expect.objectContaining({ rule: "sensitive-assignment" })]);
  });

  it("skips binary files and files larger than 2 MiB", async () => {
    const directory = await mkdtemp(path.join(tmpdir(), "portfolio-secret-scan-"));
    const binaryPath = path.join(directory, "binary.dat");
    const largePath = path.join(directory, "large.txt");
    const credential = join("gh", "u_", "X".repeat(36));
    await writeFile(binaryPath, Buffer.from(`prefix\0${credential}`));
    await writeFile(largePath, `${"x".repeat(2 * 1024 * 1024 + 1)}${credential}`);

    await expect(scanFiles([binaryPath, largePath])).resolves.toEqual([]);
  });

  it("deduplicates findings by rule, path, and line", () => {
    const value = join("github_pat_", "A".repeat(40));
    const findings = scanText({ text: `${value} ${value}`, filePath: "duplicate.txt" });

    expect(findings).toHaveLength(1);
  });
});

describe("secret ignore policy", () => {
  it("ignores secret environments and permits only sanitized templates", async () => {
    const gitignore = await readFile(new URL("../../.gitignore", import.meta.url), "utf8");

    expect(gitignore).toContain(".env\n");
    expect(gitignore).toContain(".env.*\n");
    expect(gitignore).toContain(".dev.vars\n");
    expect(gitignore).toContain(".dev.vars.*\n");
    expect(gitignore.match(/^!.*(?:env|dev\.vars).*example$/gm)).toEqual([
      "!.env.example",
      "!.dev.vars.example",
    ]);
  });
});
