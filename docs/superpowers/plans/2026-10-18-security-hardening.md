# Portfolio Security Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enforce a secure static-site baseline in the Astro repository and document the provider controls the owner must apply when hosting it.

**Architecture:** Keep the portfolio fully static. Add a tested Cloudflare response policy, an offline scanner for tracked source and generated assets, and fail-closed production-build gates; record database, auth, API, AI, and provider controls as future launch requirements rather than adding unused infrastructure.

**Tech Stack:** Astro 7, Node.js 22 ESM, Vitest, Cloudflare static asset headers, npm lockfile/audit

**Spec:** `docs/superpowers/specs/2026-10-18-security-hardening-design.md`

## Global Constraints

- Do not deploy, connect Cloudflare, edit DNS, rotate credentials, or change live GitHub/Cloudflare settings.
- Preserve the static Astro architecture: no auth, database, API, CSRF, CORS, upload, webhook, AI, or rate-limit placeholder code.
- Production canonical origin is exactly `https://sushanth.tech`.
- Never print matched credential values; diagnostics contain only rule name, path, and line number.
- Keep `.env`, `.env.*`, `.dev.vars`, and `.dev.vars.*` ignored while allowing only `.env.example` and `.dev.vars.example`.
- Do not add runtime dependencies.
- Preserve existing user work in the dirty worktree; stage and commit only files named by each task.

## Review Focus

- A malicious value named `PUBLIC_API_KEY` or `PUBLIC_TOKEN` must fail even when its value does not match a known provider-token format (Task 2).
- Sanitized example placeholders such as `PASTE_YOUR_ACCESS_KEY` must not make normal repository checks unusable (Task 2).
- Binary assets and files larger than the scanner limit must be skipped deterministically without decoding or logging their contents (Task 2).
- A change to the trusted inline theme bootstrap must fail until its CSP hash is updated (Task 1).
- Running production verification against a missing or empty `dist/client` must fail closed with a useful, non-secret diagnostic (Task 3).

---

### Task 1: Tested browser response policy

**Files:**
- Create: `src/lib/security-policy.js`
- Create: `tests/unit/security-policy.test.js`
- Modify: `public/_headers`

**Interfaces:**
- Consumes: `getThemeBootstrapScript(): string` from `src/lib/theme.js`.
- Produces: `sha256CspHash(value: string): string`, `CONTENT_SECURITY_POLICY: string`, and `REQUIRED_SECURITY_HEADERS: Readonly<Record<string, string>>` from `src/lib/security-policy.js`.
- Produces: a `/*` block in `public/_headers` used by Task 3.

- [ ] **Step 1: Write failing policy tests**

Add tests named `hashes the exact trusted theme bootstrap`, `defines a deny-by-default CSP without unsafe inline scripts`, `defines the required browser headers`, and `keeps the deployed headers synchronized with the policy`. Assert:

```js
expect(sha256CspHash(getThemeBootstrapScript())).toMatch(/^'sha256-[A-Za-z0-9+/]+=*'$/);
expect(CONTENT_SECURITY_POLICY).toContain("default-src 'self'");
expect(CONTENT_SECURITY_POLICY).toContain("object-src 'none'");
expect(CONTENT_SECURITY_POLICY).toContain("frame-ancestors 'none'");
expect(CONTENT_SECURITY_POLICY).toContain(sha256CspHash(getThemeBootstrapScript()));
expect(CONTENT_SECURITY_POLICY).not.toContain("script-src 'self' 'unsafe-inline'");
expect(REQUIRED_SECURITY_HEADERS).toMatchObject({
  'Strict-Transport-Security': 'max-age=31536000',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
});
```

Parse the `/*` block in `public/_headers` and assert every `REQUIRED_SECURITY_HEADERS` entry appears exactly once with the same value.

- [ ] **Step 2: Run the policy tests and verify failure**

Run: `npx vitest run tests/unit/security-policy.test.js`

Expected: FAIL because `src/lib/security-policy.js` does not exist.

- [ ] **Step 3: Implement the policy module**

Implement `sha256CspHash(value)` with `node:crypto`. Define a CSP with these directives: `default-src 'self'`, `base-uri 'self'`, `object-src 'none'`, `frame-ancestors 'none'`, `form-action 'self'`, `img-src 'self' data:`, `font-src 'self'`, `style-src 'self'`, `style-src-attr 'unsafe-inline'`, `script-src 'self' <theme hash>`, `connect-src 'self'`, `media-src 'self'`, `manifest-src 'self'`, `worker-src 'self'`, and `upgrade-insecure-requests`.

Add `Content-Security-Policy`, `Strict-Transport-Security`, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, `Cross-Origin-Opener-Policy: same-origin`, `Cross-Origin-Resource-Policy: same-origin`, and `X-Permitted-Cross-Domain-Policies: none` to `REQUIRED_SECURITY_HEADERS`.

- [ ] **Step 4: Add the matching `/*` header block**

Place the general `/*` block before existing asset-specific cache blocks in `public/_headers`. Copy the exact CSP and header values exported by the module. Do not add HSTS `preload` or `includeSubDomains`.

- [ ] **Step 5: Run the policy tests**

Run: `npx vitest run tests/unit/security-policy.test.js`

Expected: PASS.

- [ ] **Step 6: Build and smoke-test CSP compatibility**

Run: `npm run build && npx playwright test tests/e2e/home.spec.js tests/e2e/theme.spec.js tests/e2e/splash.spec.js`

Expected: build succeeds and all selected browser tests pass without CSP console errors.

- [ ] **Step 7: Commit the response policy**

```bash
git add src/lib/security-policy.js tests/unit/security-policy.test.js public/_headers
git commit -m "security: enforce browser response policy"
```

### Task 2: Secret and unsafe-environment scanner

**Files:**
- Create: `scripts/security/secret-scanner.mjs`
- Create: `scripts/security/scan-secrets.mjs`
- Create: `tests/unit/secret-scanner.test.js`
- Modify: `.gitignore`

**Interfaces:**
- Consumes: UTF-8 file paths supplied by the CLI or the NUL-delimited output of `git ls-files`.
- Produces: `scanText({ text, filePath }): Finding[]`, `scanFiles(filePaths): Promise<Finding[]>`, and `formatFinding(finding): string` from `secret-scanner.mjs`.
- `Finding` is `{ rule: string, filePath: string, line: number }`; it never contains the matched value.
- Produces: `scan-secrets.mjs [paths...]`, exiting `0` when clean and `1` when findings exist.

- [ ] **Step 1: Write failing scanner tests**

Cover provider-shaped GitHub, AWS, OpenAI, and Anthropic credentials; PEM private-key headers; generic assignments to names ending in `_SECRET`, `_TOKEN`, `_PASSWORD`, or `_PRIVATE_KEY`; any `PUBLIC_` variable containing `KEY`, `TOKEN`, `SECRET`, or `PASSWORD`; line numbers; redacted formatting; allowlisted example placeholders; binary input; and files over 2 MiB.

Assert that `formatFinding` includes the rule, file, and line but does not include the synthetic secret. Assert `.gitignore` includes the four secret patterns from Global Constraints and only the two example exceptions.

- [ ] **Step 2: Run the scanner tests and verify failure**

Run: `npx vitest run tests/unit/secret-scanner.test.js`

Expected: FAIL because the scanner module does not exist.

- [ ] **Step 3: Implement the pure scanner**

Implement the interfaces above. Treat a NUL byte within the first 8 KiB as binary and skip it. Skip files larger than 2 MiB. Allow only empty values and explicit placeholder values in `*.example`; do not blanket-ignore example files. Deduplicate findings by `rule:filePath:line`.

- [ ] **Step 4: Implement the CLI**

When paths are provided, scan those paths. Otherwise obtain tracked paths with `execFile('git', ['ls-files', '-z'])`; split on NUL without invoking a shell. Print only `formatFinding` output and a count. Catch filesystem/process errors, print a generic path plus error code/message, and exit nonzero.

- [ ] **Step 5: Tighten and document ignore rules**

Keep the existing environment patterns in `.gitignore`; add comments stating that only sanitized templates may be committed. Do not change the effective allow/deny behavior.

- [ ] **Step 6: Run unit and repository scans**

Run: `npx vitest run tests/unit/secret-scanner.test.js && node scripts/security/scan-secrets.mjs`

Expected: tests PASS and the tracked repository scan exits `0` without printing credential values.

- [ ] **Step 7: Commit the scanner**

```bash
git add .gitignore scripts/security/secret-scanner.mjs scripts/security/scan-secrets.mjs tests/unit/secret-scanner.test.js
git commit -m "security: detect committed credentials"
```

### Task 3: Fail-closed production security gate

**Files:**
- Create: `scripts/verify-production-security.mjs`
- Create: `tests/unit/production-security.test.js`
- Modify: `scripts/require-site-url.mjs`
- Modify: `scripts/verify-production-origin.mjs`
- Modify: `tests/unit/site-url.test.js`
- Modify: `package.json`
- Modify: `package-lock.json`

**Interfaces:**
- Consumes: `scanFiles(filePaths)` and `REQUIRED_SECURITY_HEADERS` from Tasks 1 and 2.
- Produces: `verifyProductionSecurity({ origin, clientDirectory, headersPath }): Promise<void>`.
- Keeps `requireProductionSiteUrl(value): string`, now accepting only `https://sushanth.tech`.
- Adds npm scripts `security:scan`, `security:audit`, `security:check`, and extends `build:production`.

- [ ] **Step 1: Write failing canonical-origin tests**

Update `tests/unit/site-url.test.js` so only `https://sushanth.tech` and `https://sushanth.tech/` return `https://sushanth.tech`. Assert rejection of HTTP, localhost, subdomains, alternate HTTPS domains, credentials, ports, paths, query strings, and fragments.

- [ ] **Step 2: Write failing production-security tests**

Use temporary directories to test: missing client directory, no HTML, a clean artifact, a synthetic secret in JavaScript, a localhost URL in HTML/JS/manifest files, a missing `_headers`, and a missing required header. Assert failures name the rule/path but never echo the synthetic secret.

- [ ] **Step 3: Run both test files and verify failure**

Run: `npx vitest run tests/unit/site-url.test.js tests/unit/production-security.test.js`

Expected: FAIL on alternate origins and the missing production-security module.

- [ ] **Step 4: Pin the canonical origin**

Change `requireProductionSiteUrl` to require hostname `sushanth.tech`, no port, username, or password, in addition to the existing HTTPS bare-origin rules. Keep the returned string `https://sushanth.tech`.

- [ ] **Step 5: Implement production verification**

Recursively collect regular files from `clientDirectory`. Require at least one HTML file. Scan text artifacts with extensions `.html`, `.js`, `.mjs`, `.json`, `.xml`, `.css`, `.map`, and `.txt`; reject `http://localhost`, `http://127.0.0.1`, `http://[::1]`, and secret findings. Require the built `_headers` file and validate every Task 1 header against it. Reuse `verifyProductionOrigin` for canonical and sitemap checks.

- [ ] **Step 6: Add package scripts and build ordering**

Set these exact responsibilities:

```json
{
  "security:scan": "node scripts/security/scan-secrets.mjs",
  "security:audit": "npm audit --omit=dev --audit-level=high",
  "security:check": "npm run security:scan && vitest run tests/unit/security-policy.test.js tests/unit/secret-scanner.test.js tests/unit/production-security.test.js tests/unit/site-url.test.js",
  "build:production": "node scripts/require-site-url.mjs && npm run security:scan && astro build && node scripts/verify-production-origin.mjs && node scripts/verify-production-security.mjs"
}
```

Update the lockfile only through `npm install --package-lock-only --ignore-scripts` if npm changes package metadata; do not upgrade dependencies in this task.

- [ ] **Step 7: Run targeted verification**

Run: `npx vitest run tests/unit/site-url.test.js tests/unit/production-security.test.js && npm run security:check`

Expected: PASS.

- [ ] **Step 8: Run the production gate**

Run: `PUBLIC_SITE_URL=https://sushanth.tech npm run build:production`

Expected: build succeeds, origin verification reports `https://sushanth.tech`, and security verification reports a clean artifact without exposing file contents.

- [ ] **Step 9: Commit the production gate**

```bash
git add scripts/require-site-url.mjs scripts/verify-production-origin.mjs scripts/verify-production-security.mjs tests/unit/site-url.test.js tests/unit/production-security.test.js package.json package-lock.json
git commit -m "security: gate production artifacts"
```

### Task 4: Supply-chain metadata and future hosting register

**Files:**
- Create: `docs/security.md`
- Create: `docs/deployment-security-checklist.md`
- Modify: `README.md`
- Modify: `package.json`
- Modify: `package-lock.json`

**Interfaces:**
- Consumes: npm commands and control names created in Tasks 1–3.
- Produces: a checklist mapping all 29 original security concerns to `Enforced`, `Owner action before launch`, `Not currently applicable`, or `Required before feature launch`.

- [ ] **Step 1: Write the security register**

In `docs/security.md`, document the threat model, current static attack surface, exact automated commands, reporting behavior, and a table covering every original checklist item. Mark RLS, API auth/ownership, auth throttling, SQL, cookies, sessions, CSRF, uploads, buckets, webhooks, database backups, AI injection/tool limits, and AI spending caps as future launch gates tied to those features—not as completed controls.

- [ ] **Step 2: Write owner-only hosting instructions**

In `docs/deployment-security-checklist.md`, give ordered manual steps for:

1. rotating any credential that was ever committed and checking Git history;
2. enabling GitHub secret scanning/push protection, Dependabot alerts, and branch protection;
3. connecting only `SushanthOO7/new-portfolio` to Cloudflare;
4. setting Cloudflare install command `npm ci` and build command `npm run build:production`;
5. setting `PUBLIC_SITE_URL=https://sushanth.tech` as a non-secret variable;
6. storing any future `GITHUB_TOKEN` as an encrypted, read-only build secret;
7. deploying only the Astro output expected by the adapter/configuration;
8. configuring DNS and confirming HTTPS before relying on HSTS;
9. verifying live headers with `curl -I https://sushanth.tech` and testing the site;
10. enabling Cloudflare spend/usage alerts and documenting restore procedures if persistent data is later introduced.

Do not claim that the repository can enable provider controls.

- [ ] **Step 3: Correct repository metadata and README commands**

Change `package.json.repository` to `https://github.com/SushanthOO7/new-portfolio.git`. In `README.md`, link both security documents, replace any stale contact-endpoint/SES instructions with the current static contact behavior, and document `npm ci`, `npm run security:check`, `npm run security:audit`, and `PUBLIC_SITE_URL=https://sushanth.tech npm run build:production`.

- [ ] **Step 4: Synchronize lockfile metadata**

Run: `npm install --package-lock-only --ignore-scripts`

Expected: the root package metadata in `package-lock.json` matches `package.json`; no dependency versions change unless npm normalizes existing lock metadata.

- [ ] **Step 5: Run the production dependency audit**

Run: `npm run security:audit`

Expected: exit `0` with no high or critical production vulnerabilities. If the registry is unavailable, record the network failure and rerun when connected; do not report the audit as passed.

- [ ] **Step 6: Run full verification**

Run: `npm run typecheck && npm test && PUBLIC_SITE_URL=https://sushanth.tech npm run build:production && npm run test:e2e`

Expected: all commands exit `0`.

- [ ] **Step 7: Review the checklist mapping**

Compare `docs/security.md` line by line with the 29-item source checklist. Expected: every item appears once, has an accurate status, and links to its enforcement or future launch condition.

- [ ] **Step 8: Commit documentation and metadata**

```bash
git add docs/security.md docs/deployment-security-checklist.md README.md package.json package-lock.json
git commit -m "docs: add secure hosting checklist"
```

### Task 5: Final evidence and handoff

**Files:**
- Modify only files required to fix failures discovered below.

**Interfaces:**
- Consumes: all previous task outputs.
- Produces: a verified repository state and a manual hosting handoff; no deployment.

- [ ] **Step 1: Inspect the final diff for secret disclosure**

Run: `git diff --check HEAD~4..HEAD && node scripts/security/scan-secrets.mjs`

Expected: no whitespace errors and no secret findings.

- [ ] **Step 2: Verify declared packages resolve to the lockfile**

Run a Node one-liner that reads `package.json` and `package-lock.json` and asserts every dependency and devDependency has a corresponding `node_modules/<name>` lockfile entry.

Expected: exit `0`; no package suggested by the implementation is missing.

- [ ] **Step 3: Re-run the complete release gate**

Run: `npm run typecheck && npm test && npm run security:audit && PUBLIC_SITE_URL=https://sushanth.tech npm run build:production && npm run test:e2e`

Expected: every command exits `0`.

- [ ] **Step 4: Report without deploying**

Summarize changed controls, exact verification results, remaining owner actions, and checklist items that remain future gates. Link `docs/deployment-security-checklist.md` as the next action. Explicitly state that no GitHub, Cloudflare, DNS, or production environment was changed.
