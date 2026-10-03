import { SITEMAP_ROUTES } from '../data/public-routes.js';

export const prerender = true;

export function GET({ site }) {
  if (!site) throw new Error('Astro site configuration is required to generate sitemap.xml.');
  const urls = SITEMAP_ROUTES
    .map(route => `  <url><loc>${new URL(route, site).href}</loc></url>`)
    .join('\n');
  return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`, {
    headers: { 'content-type': 'application/xml; charset=utf-8' },
  });
}
