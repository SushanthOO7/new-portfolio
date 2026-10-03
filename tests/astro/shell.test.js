import { execFile } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { promisify } from 'node:util';
import { describe, expect, it } from 'vitest';

const execFileAsync = promisify(execFile);

describe('Astro application shell', () => {
  it('builds static HTML with the required integrations and document landmarks', async () => {
    const configUrl = pathToFileURL(resolve('astro.config.mjs')).href;
    const { default: config } = await import(configUrl);
    const integrationNames = config.integrations.map(integration => integration.name);

    expect(config.output).toBe('static');
    expect(config.adapter.name).toContain('cloudflare');
    expect(integrationNames).toEqual(
      expect.arrayContaining(['@astrojs/react', '@astrojs/mdx'])
    );

    await execFileAsync('npm', ['run', 'build'], {
      cwd: process.cwd(),
      timeout: 120_000,
    });
    const document = await readFile('dist/client/index.html', 'utf8');

    expect(document).toMatch(/<html[^>]+lang="en"/);
    expect(document).toContain('<meta name="viewport"');
    expect(document).toMatch(/<main[^>]+id="main-content"/);
  }, 120_000);
});
