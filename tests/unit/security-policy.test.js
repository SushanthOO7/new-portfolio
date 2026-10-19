import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import {
  CONTENT_SECURITY_POLICY,
  REQUIRED_SECURITY_HEADERS,
  sha256CspHash,
  securityHeadersForHtml,
} from '../../src/lib/security-policy.js';
import { getThemeBootstrapScript } from '../../src/lib/theme.js';

function parseRootHeaders(source) {
  const lines = source.split(/\r?\n/);
  const rootIndex = lines.findIndex(line => line.trim() === '/*');
  if (rootIndex === -1) return [];

  const headers = [];
  for (const line of lines.slice(rootIndex + 1)) {
    if (!/^\s+/.test(line)) break;
    const match = line.match(/^\s+([^:]+):\s*(.+)$/);
    if (match) headers.push([match[1], match[2]]);
  }
  return headers;
}

describe('browser security policy', () => {
  it('hashes the exact trusted theme bootstrap', () => {
    expect(sha256CspHash(getThemeBootstrapScript())).toMatch(/^'sha256-[A-Za-z0-9+/]+=*'$/);
  });

  it('defines a deny-by-default CSP without unsafe inline scripts', () => {
    expect(CONTENT_SECURITY_POLICY).toContain("default-src 'self'");
    expect(CONTENT_SECURITY_POLICY).toContain("object-src 'none'");
    expect(CONTENT_SECURITY_POLICY).toContain("frame-ancestors 'none'");
    expect(CONTENT_SECURITY_POLICY).toContain(sha256CspHash(getThemeBootstrapScript()));
    expect(CONTENT_SECURITY_POLICY).not.toContain("script-src 'self' 'unsafe-inline'");
  });

  it('authorizes exact inline style blocks from every generated page', () => {
    const css = '\n.card { color: red; }\n';
    const policy = securityHeadersForHtml([
      `<style>${css}</style>`,
      '<STYLE media="screen">.other { color: blue; }</STYLE>',
    ])['Content-Security-Policy'];
    const styles = policy.split('; ').find(value => value.startsWith('style-src '));
    expect(styles).toContain(sha256CspHash(css));
    expect(styles).toContain(sha256CspHash('.other { color: blue; }'));
    expect(styles).not.toContain("'unsafe-inline'");
    expect(styles).not.toContain(sha256CspHash(css.trim()));
  });

  it('permits Cloudflare analytics script and reporting endpoints', () => {
    const directives = CONTENT_SECURITY_POLICY.split('; ');
    expect(directives.find(value => value.startsWith('script-src ')))
      .toContain('https://static.cloudflareinsights.com');
    expect(directives.find(value => value.startsWith('connect-src ')))
      .toContain('https://cloudflareinsights.com');
  });

  it('defines the required browser headers', () => {
    expect(REQUIRED_SECURITY_HEADERS).toMatchObject({
      'Strict-Transport-Security': 'max-age=31536000',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
    });
  });

  it('keeps the deployed headers synchronized with the policy', async () => {
    const source = await readFile('public/_headers', 'utf8');
    const rootHeaders = parseRootHeaders(source);

    for (const [name, expectedValue] of Object.entries(REQUIRED_SECURITY_HEADERS)) {
      const matches = rootHeaders.filter(([headerName]) => headerName === name);
      expect(matches, `${name} must appear once in the root header block`).toHaveLength(1);
      expect(matches[0][1]).toBe(expectedValue);
    }
  });
});
