import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { REQUIRED_SECURITY_HEADERS } from "../../src/lib/security-policy.js";
import { verifyProductionSecurity } from "../../scripts/verify-production-security.mjs";

const ORIGIN = "https://sushanth.tech";

function cleanHtml(extra = "") {
  return `<!doctype html><html><head>
    <link rel="canonical" href="${ORIGIN}/">
    <meta property="og:url" content="${ORIGIN}/">
    <meta property="og:image" content="${ORIGIN}/icon-512.png">
  </head><body>${extra}</body></html>`;
}

function headersText(headers = REQUIRED_SECURITY_HEADERS) {
  return `/*\n${Object.entries(headers)
    .map(([name, value]) => `  ${name}: ${value}`)
    .join("\n")}\n`;
}

async function fixture({ html = cleanHtml(), headers = headersText(), files = {} } = {}) {
  const root = await mkdtemp(path.join(tmpdir(), "portfolio-production-security-"));
  const clientDirectory = path.join(root, "client");
  await mkdir(clientDirectory);
  if (html !== null) await writeFile(path.join(clientDirectory, "index.html"), html);
  if (headers !== null) await writeFile(path.join(clientDirectory, "_headers"), headers);
  await writeFile(
    path.join(clientDirectory, "sitemap.xml"),
    `<?xml version="1.0"?><urlset><url><loc>${ORIGIN}/</loc></url></urlset>`,
  );
  for (const [name, value] of Object.entries(files)) {
    await writeFile(path.join(clientDirectory, name), value);
  }
  return { clientDirectory, headersPath: path.join(clientDirectory, "_headers") };
}

describe("production security gate", () => {
  it("accepts a clean production artifact", async () => {
    await expect(verifyProductionSecurity({ origin: ORIGIN, ...(await fixture()) })).resolves.toBeUndefined();
  });

  it("rejects a missing client directory", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "portfolio-production-security-"));
    await expect(verifyProductionSecurity({
      origin: ORIGIN,
      clientDirectory: path.join(root, "missing"),
      headersPath: path.join(root, "missing", "_headers"),
    })).rejects.toThrow(/client directory/i);
  });

  it("rejects artifacts with no HTML", async () => {
    await expect(verifyProductionSecurity({ origin: ORIGIN, ...(await fixture({ html: null })) }))
      .rejects.toThrow(/no HTML/i);
  });

  it("rejects and redacts secrets in generated JavaScript", async () => {
    const credential = ["sk", "-proj-", "A".repeat(32)].join("");
    const output = fixture({ files: { "app.js": `const value = "${credential}";` } });

    await expect(verifyProductionSecurity({ origin: ORIGIN, ...(await output) }))
      .rejects.toThrow(/openai-api-key.*app\.js/i);
    try {
      await verifyProductionSecurity({ origin: ORIGIN, ...(await output) });
    } catch (error) {
      expect(error.message).not.toContain(credential);
    }
  });

  it.each(["index.html", "app.js", "manifest.json"])("rejects localhost in %s", async (name) => {
    const localReference = "http://127.0.0.1:7778/private";
    const options = name === "index.html"
      ? { html: cleanHtml(localReference) }
      : { files: { [name]: localReference } };
    await expect(verifyProductionSecurity({ origin: ORIGIN, ...(await fixture(options)) }))
      .rejects.toThrow(new RegExp(`localhost-url.*${name.replace(".", "\\.")}`, "i"));
  });

  it("rejects a missing headers file", async () => {
    await expect(verifyProductionSecurity({ origin: ORIGIN, ...(await fixture({ headers: null })) }))
      .rejects.toThrow(/_headers/i);
  });

  it("rejects a missing required header", async () => {
    const headers = { ...REQUIRED_SECURITY_HEADERS };
    delete headers["Strict-Transport-Security"];
    await expect(verifyProductionSecurity({ origin: ORIGIN, ...(await fixture({ headers: headersText(headers) })) }))
      .rejects.toThrow(/Strict-Transport-Security/);
  });
});
