<p align="center">
  <img src="/public/favicon.svg" width="50" alt="Logo" />
</p>
<h1 align="center">Personal portfolio</h1>

[![Site preview](/public/site-preview.png)](/public/site-preview.png)

Sushanth U V's portfolio, built with Astro, focused React islands, Three.js, and native CSS. Static routes ship minimal JavaScript; Cloudflare Workers handles the contact endpoint.

## Install & run

Use Node.js `22.12.0` or newer and npm 11 or newer. Install the locked dependencies with:

```bash
npm ci
```

Once it's done start up a local server with:

```bash
npm run dev
```

### GitHub contribution skyline

The Projects section reads `SushanthOO7` contribution data from GitHub's GraphQL API during the Astro build. Copy `.env.example` to `.env` and set a read-only `GITHUB_TOKEN` to use fresh data locally. The token stays server-side and must not use Astro's `PUBLIC_` prefix.

Refresh the checked-in fallback snapshot explicitly with:

```bash
npm run github:refresh
```

Without a token, builds use `src/data/github-contributions.json`. In Cloudflare, configure `GITHUB_TOKEN` as an encrypted build environment variable (not a browser/runtime variable) so production builds can refresh the chart; keep the snapshot committed so API or rate-limit failures do not block deployment.

To view the components storybook:

```bash
npm run dev:storybook
```

## Deployment

Production runs as a Cloudflare Worker. Set `PUBLIC_SITE_URL` to the final HTTPS origin, configure the Worker secrets described in [the cutover runbook](docs/migration/astro-cutover.md), then deploy with:

```bash
npm run deploy
```

## Permissions

I'm cool with anyone using the code or parts of the code for their own site, it is open source so people can learn from it and adapt it. However, I would encourage you to modify the theme and components it to make it your own. If you are using the site's design largely unmodified, I'd appreciate being credited as the designer of the website.

I do not give permission to present any of my projects as your own (this is being actively used as my portfolio site and these are my real projects I've worked on).

## FAQ

<details>
  <summary>How do I get the contact form to work?</summary>
  
  Create an AWS account and configure SES. Copy `.dev.vars.example` to `.dev.vars` for local development, and add the same encrypted secrets to the deployed Worker. Run `npm run test:worker` to verify the built endpoint against a local SES mock without sending email.
</details>
