import { describe, expect, it } from 'vitest';
import { GET } from '../../src/pages/sitemap.xml.js';

describe('generated sitemap', () => {
  it('uses the configured site and contains only the landing page', async () => {
    const response=GET({site:new URL('https://portfolio.example/')});
    const xml=await response.text();
    expect(response.headers.get('content-type')).toContain('application/xml');
    expect(xml).not.toContain('hamishw.com');
    expect(xml.split('<loc>https://portfolio.example/</loc>')).toHaveLength(2);
    expect(xml).not.toContain('/projects');
  });
});
