# Cloudflare deployment security checklist

These dashboard actions must be completed by the account owner. Repository code cannot enable or prove provider-level controls.

1. **Inspect history and rotate credentials.** Search the current tree and Git history for credential names and provider key prefixes. Revoke and replace every credential that was ever committed—even if later deleted. Review provider activity, give replacements read-only/minimum scopes, and never rewrite history as a substitute for revocation.
2. **Harden GitHub.** In `SushanthOO7/new-portfolio`, enable secret scanning and push protection where available, Dependabot alerts/security updates, and a ruleset or branch protection for `main` that blocks force pushes/deletion and requires reviewed pull requests and passing checks.
3. **Restrict the Cloudflare connection.** Connect only `SushanthOO7/new-portfolio`. Remove unused repository access from the Cloudflare GitHub app and confirm `main` is the production branch.
4. **Use deterministic build settings.** Set the install command to `npm ci` and the build command to `npm run build:production`. Do not use a fallback command that bypasses the production gate.
5. **Set the public origin.** Add `PUBLIC_SITE_URL` as a non-secret build variable with the exact value `https://sushanth.tech`. It is intentionally public metadata, not a credential.
6. **Protect the optional GitHub credential.** If live contribution refresh is enabled, store `GITHUB_TOKEN` as an encrypted build secret—not a runtime variable and never a `PUBLIC_` variable. Use a fine-grained, read-only token with the shortest practical lifetime. The committed fallback data means this secret is optional.
7. **Deploy only generated output.** Keep Wrangler's assets directory set to `./dist/client` as declared in `wrangler.jsonc`. Do not serve the repository, `.env` files, source maps containing secrets, or arbitrary workspace paths.
8. **Confirm DNS and TLS before relying on HSTS.** Keep `sushanth.tech` attached to the `portfolio` Worker, proxy the record through Cloudflare, confirm Universal SSL is active, use Full (strict) where an origin TLS mode applies, and verify both the apex and `www` redirect work over HTTPS before retaining HSTS.
9. **Verify the live deployment.** After each security-policy change, run `curl -I https://sushanth.tech` and confirm CSP, HSTS, `X-Content-Type-Options`, `X-Frame-Options`, referrer, permissions, and cross-origin headers. Open the site in a clean browser profile; test navigation, theme, animations, external links, mobile layout, and the `www` redirect. Check the browser console for CSP violations.
10. **Configure operational limits.** Enable available Cloudflare usage/billing alerts and review build/runtime usage. Before adding OpenAI, Anthropic, storage, a database, or another paid service, configure provider budgets or hard caps. Before storing persistent data, document backup ownership, retention, encryption, recovery objectives, and a tested restore procedure.

For each release, run locally or in CI:

```bash
npm ci
npm run security:check
npm run security:audit
PUBLIC_SITE_URL=https://sushanth.tech npm run build:production
```

Do not deploy if any command fails. A live header check is required because repository tests cannot prove Cloudflare is serving the newest deployment or that dashboard settings are correct.
