#!/usr/bin/env node

import { execFile } from "node:child_process";
import { promisify } from "node:util";

import { formatFinding, scanFiles } from "./secret-scanner.mjs";

const execFileAsync = promisify(execFile);

async function trackedPaths() {
  const options = { encoding: "buffer", maxBuffer: 16 * 1024 * 1024 };
  const [{ stdout }, { stdout: deletedOutput }] = await Promise.all([
    execFileAsync("git", ["ls-files", "-z"], options),
    execFileAsync("git", ["ls-files", "-z", "--deleted"], options),
  ]);
  const deleted = new Set(deletedOutput.toString("utf8").split("\0").filter(Boolean));
  return stdout
    .toString("utf8")
    .split("\0")
    .filter((filePath) => filePath && !deleted.has(filePath));
}

async function main() {
  try {
    const requestedPaths = process.argv.slice(2);
    const filePaths = requestedPaths.length > 0 ? requestedPaths : await trackedPaths();
    const findings = await scanFiles(filePaths);

    for (const finding of findings) console.error(formatFinding(finding));
    if (findings.length > 0) {
      console.error(`Secret scan failed with ${findings.length} finding(s).`);
      process.exitCode = 1;
      return;
    }

    console.log(`Secret scan passed (${filePaths.length} file(s) checked).`);
  } catch (error) {
    const code = typeof error?.code === "string" ? error.code : "SCAN_ERROR";
    const message = typeof error?.message === "string" ? error.message : "unknown error";
    console.error(`Secret scan could not read a requested path (${code}: ${message}).`);
    process.exitCode = 1;
  }
}

await main();
