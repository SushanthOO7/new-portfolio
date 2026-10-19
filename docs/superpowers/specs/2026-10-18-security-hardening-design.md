# Portfolio Security Hardening Design

## Objective

Harden the current Astro portfolio in source control before it is hosted. The owner will perform GitHub and Cloudflare deployment work separately after the code changes are complete.

## Deployment Context

The intended production path is:

1. The owner pushes from a local machine to `SushanthOO7/new-portfolio` on GitHub.
2. Cloudflare Workers Builds detects the change.
3. Cloudflare installs locked dependencies, runs the production build, and deploys `dist`.
4. Cloudflare serves the site globally at `https://sushanth.tech`.

This project currently builds a static Astro site. It has no active API routes, authentication, database, file uploads, webhooks, cookies, AI endpoints, or server-side user data.

## Scope

### Repository changes

- Keep local environment and Cloudflare development-secret files out of Git.
- Detect likely committed secrets and unsafe public environment-variable names.
- Validate that production builds use the canonical HTTPS origin.
- Add Cloudflare-compatible browser security headers, including a content security policy, HSTS, clickjacking protection, MIME-sniffing protection, referrer restrictions, and a minimal permissions policy.
- Test the security configuration and production artifact so regressions fail locally and in automated builds.
- Add repeatable package-audit and security-check commands.
- Update stale repository metadata where it affects supply-chain clarity.
- Document current controls, non-applicable controls, and controls required when new server-side features are introduced.

### Owner-managed steps

The implementation will document but will not perform:

- GitHub secret scanning, push protection, Dependabot, and branch protection.
- Cloudflare repository connection, build settings, encrypted variables, HTTPS settings, HSTS activation, rate limiting, or deployment.
- Domain and DNS configuration for `sushanth.tech`.
- Rotation or revocation of credentials in GitHub, AWS, Cloudflare, or other providers.
- Provider spending limits, database backups, or restore tests.

## Security Model

### Trust boundaries

- The browser and all browser-provided input are untrusted.
- GitHub Actions or Cloudflare build environments may read only explicitly configured build secrets.
- Secrets must never use Astro's `PUBLIC_` prefix or appear in generated browser assets.
- The deployed artifact is static and must not expose source-only configuration.
- External package code is treated as a supply-chain risk and remains pinned by `package-lock.json`.

### Current controls

The repository already ignores `.env`, `.env.*`, `.dev.vars`, and `.dev.vars.*`, while allowing sanitized example files. The production build already requires an HTTPS `PUBLIC_SITE_URL` and verifies generated origins. The GitHub contribution token is used only by an explicit build-time refresh script and has a checked-in fallback data snapshot.

### Controls not currently applicable

Row-level security, authorization, ownership checks, login throttling, password hashing, sessions, CSRF, CORS, upload validation, private storage, webhook verification, parameterized SQL, database backups, AI prompt-injection defenses, and AI tool limits do not protect any current route because the related features do not exist. The security register will mark them as launch gates if those features are added.

## Implementation Design

### Secret and configuration validation

A repository-local security script will inspect tracked source and generated production assets for high-confidence credential patterns and prohibited public secret names. It will avoid printing discovered secret values. Sanitized example placeholders will be explicitly allowed.

The existing production-origin checks will remain the canonical guard for `https://sushanth.tech`. Tests will cover malformed, non-HTTPS, localhost, and mismatched origins.

### Browser security policy

`public/_headers` will define the security policy for production responses. The content security policy will allow only resources the current site needs. It will be validated against a production build so restrictive directives do not silently break Astro scripts, React islands, fonts, images, or animations.

HSTS will be present in the repository policy but the runbook will warn that the owner must confirm the custom domain works over HTTPS before enabling preload or expanding the policy to subdomains.

### Dependency integrity

Cloudflare build instructions will use `npm ci`. Repository scripts will expose a repeatable production dependency audit. Package names will be resolved from the lockfile, ensuring that installed packages correspond to declared dependencies.

### Documentation and future gates

A security register will map every requested checklist item to one of:

- enforced in code;
- owner action required before production;
- not applicable to the current static site;
- required before a named future feature launches.

The hosting runbook will be procedural but will not make provider-side changes.

## Failure Behavior

Security validation must fail closed during the production build: an insecure origin, likely credential, unsafe public variable, or missing required header stops the build with a short message that identifies the file and rule without printing secret contents. Browser-facing production errors must remain generic; build diagnostics may contain paths and rule names but no credentials or personal data.

## Verification

- Unit tests for origin validation, secret-pattern classification, public-variable rules, and required headers.
- A production build followed by artifact scanning for localhost origins and likely credentials.
- `npm audit` against production dependencies.
- Existing unit and end-to-end tests to detect CSP or rendering regressions.
- Manual review of the final security register against the original checklist.

## Completion Criteria

- All repository-enforceable controls in the checklist are implemented or explicitly classified.
- Security checks run through one documented command and as part of the production build.
- The production artifact contains no detected credentials or insecure canonical origin.
- Existing application tests pass.
- No hosting, deployment, DNS, or provider-account setting is changed.
