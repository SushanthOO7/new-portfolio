import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it } from 'vitest';

describe('Astro application shell', () => {
  it('keeps the client animation stack out of Vite dependency optimization', async () => {
    const configUrl = `${pathToFileURL(resolve('astro.config.mjs')).href}?optimizer-test=${Date.now()}`;
    const { default: config } = await import(configUrl);

    expect(config.vite.optimizeDeps.exclude).toEqual(expect.arrayContaining([
      'motion/react',
      'gsap',
      'gsap/ScrollTrigger',
      'lenis',
      'lottie-web/build/player/lottie_light',
    ]));
  });

  it('builds static HTML with the landing-page document landmarks', async () => {
    const configUrl = pathToFileURL(resolve('astro.config.mjs')).href;
    const { default: config } = await import(configUrl);
    expect(config.output).toBe('static');
    expect(config.adapter.name).toContain('cloudflare');

    const document = await readFile('dist/client/index.html', 'utf8');

    expect(document).toMatch(/<html[^>]+lang="en"/);
    expect(document).toContain('<meta name="viewport"');
    expect(document).toMatch(/<main[^>]+id="main-content"/);
    expect(document).not.toContain('My Stack');
    expect(document).not.toContain('Check out all projects');
  }, 120_000);

  it('renders the compact rotating role transition in the hero', async () => {
    const document = await readFile('dist/client/index.html', 'utf8');

    expect(document).toContain('data-role-transition');
    expect(document).toContain(
      'aria-label="Software Engineer plus Web Development, AI &amp; ML, Test Automation, and DevOps"'
    );
    expect(document).toMatch(/data-role="Web Development"[^>]*class="[^"]*is-active/);
  });

  it('renders navigation targets and a blank contact anchor', async () => {
    const document = await readFile('dist/client/index.html', 'utf8');

    expect(document).toContain('href="#experience"');
    expect(document).toContain('href="#projects"');
    expect(document).toContain('href="#contact"');
    expect(document).toMatch(/<section[^>]+id="contact"[^>]+aria-labelledby="contact-title"/);
    expect(document).toContain('id="contact-title"');
  });

  it('renders the legacy social rail with accessible contact links', async () => {
    const document = await readFile('dist/client/index.html', 'utf8');

    expect(document).toContain('data-social-rail');
    expect(document).toContain('aria-label="Social links"');
    expect(document).toContain('href="https://github.com/SushanthOO7"');
    expect(document).toContain('href="https://www.linkedin.com/in/sushanth-u-v-7899911a7"');
    expect(document).toContain('href="mailto:sushanth.2942000@gmail.com"');
    expect(document).toContain('href="tel:+917022883568"');
  });

  it('keeps the scroll-to-explore copy with the legacy mouse indicator', async () => {
    const document = await readFile('dist/client/index.html', 'utf8');

    expect(document).toMatch(/class="explore"[^>]+aria-label="Scroll to explore"/);
    expect(document).toContain('class="explore__indicator"');
    expect(document).toMatch(/Scroll<br[^>]*>to explore/);
    expect(document).not.toContain('class="explore__circle"');
  });

  it('positions the desktop hero details beneath the W and clear of the social rail', async () => {
    const source = await readFile('src/components/astro/home/Intro.astro', 'utf8');

    expect(source).toMatch(/\.bottom \{[\s\S]*?inset: auto 8\.4% 20\.2% 10%;/);
  });

  it('continues the paired hero guide lines through the main portfolio sections', async () => {
    const document = await readFile('dist/client/index.html', 'utf8');
    const globalStyles = await readFile('src/styles/global.css', 'utf8');

    expect(document.match(/data-section-guides/g)).toHaveLength(3);
    expect(globalStyles).toMatch(/\[data-section-guides\]::before,[\s\S]*?\[data-section-guides\]::after/);
    expect(globalStyles).toContain('inset-inline-start: 2.8%');
    expect(globalStyles).toContain('inset-inline-end: 2.8%');
    expect(globalStyles).toMatch(
      /\[data-section-guides\]::after \{[\s\S]*?linear-gradient\([\s\S]*?transparent,[\s\S]*?6%,[\s\S]*?88%,[\s\S]*?transparent[\s\S]*?\)/
    );
  });

  it('uses one shared content width for Projects and Tech Stack', async () => {
    const projects = await readFile('src/components/astro/home/Projects.astro', 'utf8');
    const techStack = await readFile('src/styles/tech-stack.css', 'utf8');

    expect(projects).toContain('max-width: var(--max-width)');
    expect(projects).not.toContain('.projects__inner::before');
    expect(techStack).toContain('max-width: var(--max-width)');
    expect(techStack).not.toContain('.tech-stack__inner::before');
  });

  it('renders the signature wordmark with a themeable hover layer', async () => {
    const document = await readFile('dist/client/index.html', 'utf8');
    const wordmarkVector = await readFile('src/assets/brand/sushanth-wordmark.svg', 'utf8');

    expect(document).toContain('<clipPath id="brand-wordmark-clip"');
    expect(document).toContain('class="brand__wordmark-fill"');
    expect(document).toContain('clip-path="url(#brand-wordmark-clip)"');
    expect(wordmarkVector).toContain('viewBox="0 0 2172 724"');
    expect(wordmarkVector).toContain('fill-rule="evenodd"');
    expect(Buffer.byteLength(wordmarkVector)).toBeLessThan(25_000);
  });
});
