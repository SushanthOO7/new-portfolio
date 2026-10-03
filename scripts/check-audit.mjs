import { readFile } from 'node:fs/promises';

const SEVERITIES = ['info', 'low', 'moderate', 'high', 'critical'];

function severityRank(value) {
  const rank = SEVERITIES.indexOf(value);
  return rank === -1 ? 0 : rank;
}

export function analyzeAudit(report) {
  const vulnerabilities = Object.entries(report.vulnerabilities ?? {}).map(([name, value]) => ({
    name,
    severity: value.severity ?? 'unknown',
    direct: Boolean(value.isDirect),
    paths: [...new Set(value.nodes ?? [])].sort(),
    via: (value.via ?? []).map(item => typeof item === 'string' ? item : item.title ?? item.name).filter(Boolean),
  }));
  vulnerabilities.sort((left, right) => severityRank(right.severity) - severityRank(left.severity) || left.name.localeCompare(right.name));
  return vulnerabilities;
}

export function formatAudit(vulnerabilities) {
  if (!vulnerabilities.length) return 'No vulnerabilities found.';
  return vulnerabilities.map(item => {
    const paths = item.paths.length ? item.paths.join(', ') : '(path unavailable)';
    const via = item.via.length ? ` via ${item.via.join('; ')}` : '';
    return `${item.severity.toUpperCase()} ${item.name}${item.direct ? ' [direct]' : ''}: ${paths}${via}`;
  }).join('\n');
}

async function main() {
  const [path, mode, threshold = 'critical'] = process.argv.slice(2);
  if (!path || !['--fail-on', '--report-all'].includes(mode)) {
    throw new Error('Usage: node scripts/check-audit.mjs <audit.json> (--fail-on <severity>|--report-all)');
  }
  const report = JSON.parse(await readFile(path, 'utf8'));
  const vulnerabilities = analyzeAudit(report);
  process.stdout.write(`${formatAudit(vulnerabilities)}\n`);
  if (mode === '--fail-on' && vulnerabilities.some(item => severityRank(item.severity) >= severityRank(threshold))) {
    process.exitCode = 1;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) await main();
