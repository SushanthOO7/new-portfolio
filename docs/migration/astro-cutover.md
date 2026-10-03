# Astro Workers cutover runbook

The `astro` branch replaces Remix on Cloudflare Pages with Astro 7, React 19 islands, and a Cloudflare Worker. This runbook is operational guidance only; merging, deploying, domain transfer, and DNS changes remain manual decisions.

## Runtime and secrets

The contact endpoint requires four encrypted Worker secrets:

- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `EMAIL` — verified destination address
- `FROM_EMAIL` — SES-verified sender address

For local preview, copy `.dev.vars.example` to `.dev.vars` and insert development credentials. Never commit `.dev.vars`. Astro sessions and Cloudflare Images are disabled because the site does not use them; the deployed Worker should expose only the `ASSETS` binding plus the four secrets.

## Build and local verification

Use Node 22.12 or newer and npm 11 or newer:

```bash
npm ci
npm test
npm run build
npm run build:storybook
npm run preview
```

Astro writes static assets to `dist/client`, the Worker to `dist/server/entry.mjs`, and Wrangler's redirected deployment manifest to `.wrangler/deploy/config.json`. Wrangler should report that it is using `dist/server/wrangler.json` and serving `ASSETS` locally.

Before release, run the browser suite against `http://127.0.0.1:8787`, generate both audit reports, and run the checker separately so npm's advisory exit code cannot hide its report:

```bash
PLAYWRIGHT_BASE_URL=http://127.0.0.1:8787 npm run test:e2e
npm audit --omit=dev --json > .artifacts/audit-production.json || true
node scripts/check-audit.mjs .artifacts/audit-production.json --fail-on critical
npm audit --json > .artifacts/audit-all.json || true
node scripts/check-audit.mjs .artifacts/audit-all.json --report-all
npm run lighthouse
```

The Lighthouse command expects a local Chromium executable through `CHROME_PATH`. On this repository's Playwright container it can run from `/work` with `/ms-playwright/chromium-1243/chrome-linux64/chrome`.

## Cloudflare dashboard cutover

Do not perform these steps until the branch, preview, and SES behavior have been approved:

1. Create or select a Workers application named `portfolio`; do not reuse a Pages build command.
2. Configure `npm run build` as the build command and `npm run deploy` as the deploy command if Workers Builds is used.
3. Add the four encrypted secrets in Workers & Pages → the Worker → Settings → Variables and Secrets.
4. Deploy to a temporary `workers.dev` preview URL and repeat route, contact, accessibility, visual, and Lighthouse checks there.
5. Confirm the existing custom domain is known, the account owns its DNS zone, certificates are active, and no Pages-only redirects or environment variables remain required.
6. Detach the custom domain from the Pages project only during an agreed maintenance window, then attach it to the verified Worker. Do not change nameservers.
7. Verify HTTPS, canonical URLs, `/robots.txt`, `/sitemap.xml`, all public routes, the branded 404, and one real contact submission.

## Rollback

Keep the last successful Pages deployment available until the Worker has been observed in production. If route, asset, email, or domain verification fails:

1. Remove the custom-domain association from the Worker.
2. Reattach the domain to the last known-good Pages deployment.
3. Confirm the prior Pages URL and custom domain serve the expected build and certificate.
4. Leave the Worker deployment intact for diagnosis; do not overwrite the known-good Pages artifact.
5. Record the failing Worker version, Wrangler logs, route, response status, and timestamp before retrying the cutover.

## Audit status

At the time of migration, npm reports the high-severity `http-cache-semantics` advisory `GHSA-ch52-4w7c-c8xp` through Astro 7.3.5. No patched `http-cache-semantics` release or compatible Astro upgrade is available, and npm's suggested “fix” is a destructive downgrade to Astro 2.10.9. The affected cache package is build tooling and is absent from `dist/server/entry.mjs`; the Worker does not expose a shared HTTP cache using it. The audit checker still reports the complete path, and this exception must be removed as soon as Astro publishes a compatible fix. Critical production advisories remain a hard failure.
