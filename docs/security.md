# Security model and control register

## Current scope

This repository builds a public, static Astro portfolio for `https://sushanth.tech`. It has no database, login, account system, server API routes, form submission endpoint, file uploads, payment flow, webhook receiver, AI feature, or model/tool execution. Contact links open the visitor's email or phone application; they do not submit data to this deployment.

The current attack surface is the checked-in source and dependency graph, the Cloudflare build pipeline, generated HTML/CSS/JavaScript and static assets, DNS/TLS configuration, and the browser runtime. A future feature that introduces persistent data, authentication, server-side input, uploads, webhooks, or AI changes this threat model and must satisfy the corresponding launch gates below before deployment.

## Automated controls

- `npm run security:scan` scans present Git-tracked files for provider-shaped credentials, private keys, sensitive assignments, and unsafe secret-like `PUBLIC_` variables. Findings contain only a rule, path, and line number—never the matched value.
- `npm run security:check` runs the repository scan plus focused tests for CSP/header synchronization, the secret scanner, canonical origin validation, and production artifact validation.
- `npm run security:audit` checks production dependencies for high or critical npm advisories.
- `PUBLIC_SITE_URL=https://sushanth.tech npm run build:production` fails closed on the canonical HTTPS origin, scans source, builds, verifies canonical/OG/sitemap origins, rejects secrets and localhost URLs in text artifacts, and verifies the built `_headers` policy.
- `npm test` builds and runs the complete unit/integration suite.

Do not paste a suspected credential into an issue, log, test snapshot, or chat. Revoke it at the provider, remove it from the working tree, inspect Git history, and report only the credential type and affected path. Repository checks reduce risk but do not prove that a key was never previously committed or copied elsewhere.

## Checklist register

| # | Requirement | Status | Enforcement or launch condition |
|---:|---|---|---|
| 1 | Move every API key out of the frontend | Enforced | The GitHub token is build-only and has no `PUBLIC_` prefix; source and built artifacts are scanned for credentials. Any future provider key must remain server-side. |
| 2 | Add `.env` to `.gitignore` before committing | Enforced | `.env`, `.env.*`, `.dev.vars`, and `.dev.vars.*` are ignored; only sanitized example templates are allowed. |
| 3 | Rotate any key that ever touched GitHub | Owner action before launch | Only the credential owner can inspect provider activity and revoke keys. Follow the history and rotation procedure in the deployment checklist. |
| 4 | Enable Row Level Security for every table | Required before feature launch | No database exists. Any database-backed feature must enable and test deny-by-default RLS on every exposed table before launch. |
| 5 | Validate client input on the server | Required before feature launch | There is no input endpoint. Any server endpoint must validate type, length, format, and allowed values independently of the UI. |
| 6 | Check authentication on every API route | Required before feature launch | There are no API routes. Protected routes must enforce authentication server-side before launch. |
| 7 | Check ownership between users | Required before feature launch | There are no users or private records. Multi-user features require negative authorization tests proving user A cannot access user B's data. |
| 8 | Rate-limit login, signup, and password reset | Required before feature launch | No authentication flow exists. Add per-IP and per-account throttles before any auth flow launches. |
| 9 | Rate-limit AI endpoints | Required before feature launch | No AI endpoint exists. Add authenticated quotas and provider-side limits before exposing one. |
| 10 | Set hard OpenAI, Anthropic, and cloud spending caps | Required before feature launch | No model provider is used. Configure hard caps/alerts before adding paid APIs; the owner must also enable available Cloudflare usage alerts. |
| 11 | Use parameterized queries | Required before feature launch | No database or SQL exists. All future queries must use bound parameters or a safe query builder—never string-built SQL. |
| 12 | Prevent XSS when rendering user input | Enforced | The current site has no user-generated content, uses framework escaping, and deploys a hash-based CSP without `unsafe-inline` scripts. Reassess before rendering external/user HTML. |
| 13 | Restrict CORS to owned domains | Not currently applicable | There is no cross-origin API and no wildcard CORS response. Any future API must allow only explicit owned origins. |
| 14 | Use HTTPS everywhere with HSTS | Enforced | The canonical build origin is HTTPS-only and `_headers` emits one-year HSTS. DNS/TLS must remain active in Cloudflare. |
| 15 | Use secure, HttpOnly, SameSite cookies | Required before feature launch | The site sets no authentication cookies. Any session cookie must set `Secure`, `HttpOnly`, and an appropriate `SameSite` value. |
| 16 | Hash passwords or use a real auth provider | Required before feature launch | No passwords are accepted. Prefer a maintained provider; otherwise use Argon2id or bcrypt with reviewed parameters. |
| 17 | Expire sessions and tokens | Required before feature launch | No sessions exist. Future sessions and reset/verification tokens require short, explicit expirations and revocation. |
| 18 | Protect state-changing requests from CSRF | Required before feature launch | No state-changing endpoint exists. Cookie-authenticated mutations require CSRF tokens and origin checks. |
| 19 | Validate file uploads and store them outside the app server | Required before feature launch | Uploads do not exist. Future uploads need allowlisted type/signature, size limits, randomized names, malware handling, and external object storage. |
| 20 | Keep storage buckets private by default | Required before feature launch | No bucket is used. Future buckets must start private and expose only narrowly scoped signed access. |
| 21 | Verify webhook signatures | Required before feature launch | No webhook endpoint exists. Verify against the unmodified request body, enforce timestamp tolerance, and prevent replay before processing. |
| 22 | Do not return stack traces or raw errors | Required before feature launch | The static site has no server error responses. Future endpoints must map internal errors to generic public responses. Build tools print messages only to trusted build logs. |
| 23 | Strip secrets and PII from logs | Enforced | The scanner redacts matched values and current build logs contain no request/user data. New server logging must use an allowlist and redaction. |
| 24 | Run npm audit and update vulnerable packages | Enforced | `npm run security:audit` gates high/critical production advisories. Development-tool advisories remain tracked separately and should be updated when compatible fixes exist. |
| 25 | Verify AI-suggested packages exist | Enforced | Dependencies are locked by `package-lock.json`; CI/build installation uses `npm ci`, which fails on nonexistent or mismatched packages. Review provenance before adding dependencies. |
| 26 | Guard LLM features against prompt injection | Required before feature launch | No LLM feature exists. Treat model input/output as untrusted and add isolation, allowlists, and adversarial tests before launch. |
| 27 | Limit model tool and SQL execution | Required before feature launch | No model tools or SQL exist. Future tools require least privilege, strict schemas, time/budget/result limits, authorization, and human confirmation for consequential actions. |
| 28 | Add CSP and anti-framing/security headers | Enforced | `_headers` is synchronized with tested policy code and includes CSP, `X-Frame-Options`, MIME-sniffing protection, referrer/permissions policy, HSTS, and cross-origin policies. |
| 29 | Back up the database and test restoration | Required before feature launch | No database exists. Persistent data requires scheduled backups, retention, access controls, and a documented, periodically tested restore. |

“Enforced” describes controls present in this repository and build output. Provider/dashboard controls still require owner verification after deployment.
