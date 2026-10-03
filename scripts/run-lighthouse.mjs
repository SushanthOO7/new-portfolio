import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { launch } from 'chrome-launcher';
import lighthouse from 'lighthouse';

const root = resolve(import.meta.dirname, '..');
const config = JSON.parse(await readFile(resolve(root, 'lighthouserc.json'), 'utf8'));
const outputDirectory = resolve(root, '.artifacts/lighthouse');
const baseUrl = process.env.LIGHTHOUSE_BASE_URL ?? config.baseUrl;
const chrome = await launch({
  chromePath: process.env.CHROME_PATH,
  chromeFlags: ['--headless', '--no-sandbox', '--disable-dev-shm-usage'],
});

let failed = false;
await mkdir(outputDirectory, { recursive: true });

try {
  for (const route of config.routes) {
    const url = new URL(route.path, baseUrl).href;
    const result = await lighthouse(url, {
      port: chrome.port,
      logLevel: 'error',
      output: 'json',
      onlyCategories: config.categories,
      formFactor: 'mobile',
      screenEmulation: { mobile: true, width: 412, height: 823, deviceScaleFactor: 2.625, disabled: false },
    });
    if (!result?.lhr) throw new Error(`Lighthouse returned no result for ${url}`);
    const slug = route.path === '/' ? 'home' : route.path.slice(1).replaceAll('/', '--');
    await writeFile(resolve(outputDirectory, `${slug}.json`), JSON.stringify(result.lhr, null, 2));
    const scores = Object.fromEntries(config.categories.map(category => [category, result.lhr.categories[category].score]));
    process.stdout.write(`${route.path} ${Object.entries(scores).map(([name, score]) => `${name}=${Math.round(score * 100)}`).join(' ')}\n`);
    for (const [category, minimum] of Object.entries(route.minimumScores)) {
      if (scores[category] < minimum) {
        process.stderr.write(`${route.path} ${category} score ${scores[category]} is below ${minimum}\n`);
        failed = true;
      }
    }
  }
} finally {
  await chrome.kill();
}

if (failed) process.exitCode = 1;
