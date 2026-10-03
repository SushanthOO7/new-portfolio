import { describe, expect, it } from 'vitest';
import { GET } from '../../src/pages/sitemap.xml.js';
import { SITEMAP_ROUTES } from '../../src/data/public-routes.js';

describe('generated sitemap', () => {
  it('uses the configured site and contains every real public route exactly once', async () => {
    const response=GET({site:new URL('https://portfolio.example/')});
    const xml=await response.text();
    expect(response.headers.get('content-type')).toContain('application/xml');
    expect(xml).not.toContain('hamishw.com');
    for (const route of SITEMAP_ROUTES) {
      const location=new URL(route,'https://portfolio.example/').href;
      expect(xml.split(`<loc>${location}</loc>`)).toHaveLength(2);
    }
  });
});
