import { describe, expect, it } from 'vitest';
import { requireProductionSiteUrl } from '../../scripts/require-site-url.mjs';

describe('production site URL gate', () => {
  it('accepts only the canonical bare HTTPS production origin', () => {
    expect(requireProductionSiteUrl('https://sushanth.tech')).toBe('https://sushanth.tech');
    expect(requireProductionSiteUrl('https://sushanth.tech/')).toBe('https://sushanth.tech');
    for (const value of [
      undefined,
      '',
      'http://sushanth.tech',
      'https://localhost',
      'https://www.sushanth.tech',
      'https://portfolio.example',
      'https://user:password@sushanth.tech',
      'https://sushanth.tech:8443',
      'https://sushanth.tech/path',
      'https://sushanth.tech?preview=true',
      'https://sushanth.tech#work',
      'not-a-url',
    ]) {
      expect(() => requireProductionSiteUrl(value)).toThrow(/PUBLIC_SITE_URL/);
    }
  });
});
