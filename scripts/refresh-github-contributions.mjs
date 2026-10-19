import { writeFile } from 'node:fs/promises';
import { loadGitHubContributions } from '../src/lib/github-contributions.js';

const username = 'SushanthOO7';
const token = process.env.GITHUB_TOKEN;

if (!token) {
  console.error('GITHUB_TOKEN is required to refresh GitHub contributions.');
  process.exitCode = 1;
} else {
  const result = await loadGitHubContributions({ username, token, snapshot: null });
  const { source: _source, ...snapshot } = result;
  const url = new URL('../src/data/github-contributions.json', import.meta.url);
  await writeFile(url, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8');
  console.log(`Saved ${snapshot.days.length} contribution days for ${username} through ${snapshot.range.to}.`);
}
