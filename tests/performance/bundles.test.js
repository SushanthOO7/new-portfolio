import { gzipSync } from 'node:zlib';
import { readFile, readdir } from 'node:fs/promises';
import { basename, dirname, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { analyzeAudit, formatAudit } from '../../scripts/check-audit.mjs';

const root = resolve(import.meta.dirname, '../..');
const assets = resolve(root, 'dist/client/_astro');
const ordinaryRoutes = ['projects', 'career', 'uses', 'articles', 'articles/hello-world', 'articles/modern-styling-in-react'];
const graphicsRoutes = ['', 'projects/smart-sparrow', 'projects/volkihar-knight'];
const staticImportPattern = /(?:from\s*|import\s*)["'](\.\.?\/[^"']+\.js)["']/g;

function htmlPath(route) {
  return resolve(root, 'dist/client', route, 'index.html');
}

async function entryGraph(route) {
  const html = await readFile(htmlPath(route), 'utf8');
  const entries = [...html.matchAll(/(?:component-url|renderer-url)="\/_astro\/([^"?]+\.js)/g)].map(match => match[1]);
  const visited = new Set();
  async function visit(file) {
    if (visited.has(file)) return;
    visited.add(file);
    const source = await readFile(resolve(assets, file), 'utf8');
    for (const match of source.matchAll(staticImportPattern)) await visit(basename(resolve(assets, dirname(file), match[1])));
  }
  await Promise.all(entries.map(visit));
  const files = await Promise.all([...visited].map(async file => {
    const source = await readFile(resolve(assets, file));
    return { file, source: source.toString(), gzipBytes: gzipSync(source).byteLength };
  }));
  return { files, gzipBytes: files.reduce((sum, file) => sum + file.gzipBytes, 0) };
}

describe('production client bundle budgets', () => {
  it('keeps every emitted client chunk below Vite\'s 500 kB warning threshold', async () => {
    const chunks = (await readdir(assets)).filter(file => file.endsWith('.js'));
    const sizes = await Promise.all(chunks.map(async file => ({ file, bytes: (await readFile(resolve(assets, file))).byteLength })));
    expect(sizes.filter(chunk => chunk.bytes > 500 * 1024)).toEqual([]);
  });

  it.each(ordinaryRoutes)('%s stays below 150 kB gzip and excludes server/graphics tooling', async route => {
    const graph = await entryGraph(route);
    expect(graph.gzipBytes).toBeLessThanOrEqual(150 * 1024);
    const code = graph.files.map(file => `${file.file}\n${file.source}`).join('\n').toLowerCase();
    expect(code).not.toMatch(/three\.module|gsap|@aws-sdk|storybook/);
  });

  it.each(graphicsRoutes)('%s initial island graph stays below 250 kB before deferred scenes', async route => {
    const graph = await entryGraph(route);
    expect(graph.gzipBytes).toBeLessThanOrEqual(250 * 1024);
    expect(graph.files.map(file => file.file)).not.toContain(expect.stringMatching(/^three\.module/));
  });
});

describe('audit report enforcement', () => {
  it('names every affected path and preserves severity ordering', () => {
    const vulnerabilities = analyzeAudit({ vulnerabilities: {
      transitive: { severity: 'critical', isDirect: false, nodes: ['node_modules/root/node_modules/transitive'], via: [{ title: 'unsafe parser' }] },
      root: { severity: 'moderate', isDirect: true, nodes: ['node_modules/root'], via: ['transitive'] },
    } });
    expect(vulnerabilities.map(item => item.name)).toEqual(['transitive', 'root']);
    expect(formatAudit(vulnerabilities)).toContain('node_modules/root/node_modules/transitive');
  });
});
