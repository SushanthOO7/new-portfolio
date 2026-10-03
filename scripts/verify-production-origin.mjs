import { readdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { requireProductionSiteUrl } from './require-site-url.mjs';

async function filesBelow(directory) {
  const entries=await readdir(directory,{withFileTypes:true});
  const nested=await Promise.all(entries.map(entry=>{
    const path=resolve(directory,entry.name);
    return entry.isDirectory() ? filesBelow(path) : [path];
  }));
  return nested.flat();
}

function assertOrigin(value, origin, source) {
  if (!value) throw new Error(`${source} is missing a production URL.`);
  if (new URL(value).origin !== origin) {
    throw new Error(`${source} uses ${new URL(value).origin} instead of ${origin}.`);
  }
}

export async function verifyProductionOrigin({ origin, clientDirectory }) {
  const files=await filesBelow(clientDirectory);
  const htmlFiles=files.filter(file=>file.endsWith('.html'));
  if (!htmlFiles.length) throw new Error('Production build emitted no HTML files.');
  for (const file of htmlFiles) {
    const html=await readFile(file,'utf8');
    assertOrigin(html.match(/<link rel="canonical" href="([^"]+)"/)?.[1],origin,`${file} canonical`);
    assertOrigin(html.match(/<meta property="og:url" content="([^"]+)"/)?.[1],origin,`${file} og:url`);
    assertOrigin(html.match(/<meta property="og:image" content="([^"]+)"/)?.[1],origin,`${file} og:image`);
  }
  const sitemap=await readFile(resolve(clientDirectory,'sitemap.xml'),'utf8');
  const locations=[...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match=>match[1]);
  if (!locations.length) throw new Error('Production sitemap contains no locations.');
  for (const location of locations) assertOrigin(location,origin,'sitemap location');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const origin=requireProductionSiteUrl();
  await verifyProductionOrigin({origin,clientDirectory:resolve('dist/client')});
  console.log(`Verified production URLs use ${origin}.`);
}
