import { describe, expect, it } from 'vitest';
import { requireProductionSiteUrl } from '../../scripts/require-site-url.mjs';

describe('production site URL gate', () => {
  it('accepts only a bare HTTPS production origin', () => {
    expect(requireProductionSiteUrl('https://portfolio.example/')).toBe('https://portfolio.example');
    for (const value of [undefined, '', 'http://portfolio.example', 'https://portfolio.example/path', 'not-a-url']) {
      expect(() => requireProductionSiteUrl(value)).toThrow(/PUBLIC_SITE_URL/);
    }
  });
});
