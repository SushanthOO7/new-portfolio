#!/usr/bin/env node

import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { securityHeadersForHtml } from "../src/lib/security-policy.js";

async function htmlFilesBelow(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const filePath = path.resolve(directory, entry.name);
    if (entry.isDirectory()) return htmlFilesBelow(filePath);
    return entry.isFile() && filePath.endsWith(".html") ? [filePath] : [];
  }));
  return nested.flat();
}

export async function finalizeProductionHeaders({ clientDirectory, headersPath }) {
  const htmlPaths = await htmlFilesBelow(clientDirectory);
  if (htmlPaths.length === 0) throw new Error("Production client directory contains no HTML files.");
  const htmlDocuments = await Promise.all(htmlPaths.map((filePath) => readFile(filePath, "utf8")));
  const expectedHeaders = securityHeadersForHtml(htmlDocuments);
  let headersText = await readFile(headersPath, "utf8");

  for (const [name, value] of Object.entries(expectedHeaders)) {
    const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const headerLine = new RegExp(`^(\\s*)${escapedName}:.*$`, "mi");
    if (!headerLine.test(headersText)) throw new Error(`Production _headers is missing ${name}.`);
    headersText = headersText.replace(headerLine, `$1${name}: ${value}`);
  }

  await writeFile(headersPath, headersText);
  return expectedHeaders;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    const clientDirectory = path.resolve("dist/client");
    const headersPath = path.join(clientDirectory, "_headers");
    const headers = await finalizeProductionHeaders({ clientDirectory, headersPath });
    const hashCount = headers["Content-Security-Policy"].match(/'sha256-[^']+'/g)?.length ?? 0;
    console.log(`Finalized production CSP with ${hashCount} inline script/style hash(es).`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
