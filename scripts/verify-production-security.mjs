#!/usr/bin/env node

import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

import { scanFiles, formatFinding } from "./security/secret-scanner.mjs";
import { requireProductionSiteUrl } from "./require-site-url.mjs";
import { verifyProductionOrigin } from "./verify-production-origin.mjs";
import { REQUIRED_SECURITY_HEADERS } from "../src/lib/security-policy.js";

const TEXT_ARTIFACT_EXTENSIONS = new Set([
  ".html",
  ".js",
  ".mjs",
  ".json",
  ".xml",
  ".css",
  ".map",
  ".txt",
]);
const LOCALHOST_URL = /http:\/\/(?:localhost|127\.0\.0\.1|\[::1\])(?=[:/\s"'<]|$)/gi;

async function filesBelow(directory) {
  let entries;
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch (error) {
    const wrapped = new Error(`Production client directory is unavailable (${error.code ?? "READ_ERROR"}).`);
    wrapped.cause = error;
    throw wrapped;
  }

  const nested = await Promise.all(entries.map(async (entry) => {
    const filePath = path.resolve(directory, entry.name);
    if (entry.isDirectory()) return filesBelow(filePath);
    return entry.isFile() ? [filePath] : [];
  }));
  return nested.flat();
}

function lineNumber(text, index) {
  return text.slice(0, index).split("\n").length;
}

async function assertNoLocalhostReferences(filePaths) {
  for (const filePath of filePaths) {
    const text = await readFile(filePath, "utf8");
    LOCALHOST_URL.lastIndex = 0;
    const match = LOCALHOST_URL.exec(text);
    if (match) {
      throw new Error(`[localhost-url] ${filePath}:${lineNumber(text, match.index)}`);
    }
  }
}

async function assertHeaders(headersPath) {
  let headersText;
  try {
    headersText = await readFile(headersPath, "utf8");
  } catch (error) {
    throw new Error(`Production _headers file is missing (${error.code ?? "READ_ERROR"}).`);
  }

  for (const [name, value] of Object.entries(REQUIRED_SECURITY_HEADERS)) {
    if (!headersText.includes(`${name}: ${value}`)) {
      throw new Error(`Production _headers is missing required header ${name}.`);
    }
  }
}

export async function verifyProductionSecurity({ origin, clientDirectory, headersPath }) {
  const files = await filesBelow(clientDirectory);
  const htmlFiles = files.filter((filePath) => path.extname(filePath).toLowerCase() === ".html");
  if (htmlFiles.length === 0) throw new Error("Production client directory contains no HTML files.");

  const textFiles = files.filter((filePath) => TEXT_ARTIFACT_EXTENSIONS.has(path.extname(filePath).toLowerCase()));
  const findings = await scanFiles(textFiles);
  if (findings.length > 0) {
    throw new Error(`Production artifact contains a secret: ${formatFinding(findings[0])}`);
  }

  await assertNoLocalhostReferences(textFiles);
  await assertHeaders(headersPath);
  await verifyProductionOrigin({ origin, clientDirectory });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    const origin = requireProductionSiteUrl();
    const clientDirectory = path.resolve("dist/client");
    await verifyProductionSecurity({
      origin,
      clientDirectory,
      headersPath: path.join(clientDirectory, "_headers"),
    });
    console.log("Verified production artifact security controls.");
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
