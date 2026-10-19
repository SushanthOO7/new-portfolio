import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const projects = readFileSync(new URL('../../src/components/astro/home/Projects.astro', import.meta.url), 'utf8');
const globalCss = readFileSync(new URL('../../src/styles/global.css', import.meta.url), 'utf8');
const packageJson = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8'));

describe('Projects contribution skyline integration', () => {
  it('renders the GitHub activity island after the existing folder', () => {
    expect(projects).toContain("import GitHubActivity from '../../react/GitHubActivity.tsx'");
    expect(projects.indexOf('<ProjectsFolder')).toBeLessThan(projects.indexOf('<GitHubActivity'));
    expect(projects).toContain('client:visible');
    expect(projects).toContain('<style is:global>');
  });

  it('loads Tailwind utilities without enabling Tailwind preflight', () => {
    expect(globalCss).toContain('@import "tailwindcss/theme.css" layer(theme);');
    expect(globalCss).toContain('@import "tailwindcss/utilities.css" layer(utilities);');
    expect(globalCss).not.toContain('@import "tailwindcss";');
  });

  it('loads local environment variables for the snapshot refresh command', () => {
    expect(packageJson.scripts['github:refresh']).toContain('--env-file-if-exists=.env');
  });
});
