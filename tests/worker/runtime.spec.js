import { access, readFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import { describe, expect, it } from 'vitest';

const root=new URL('../../',import.meta.url);
const read=path=>readFile(new URL(path,root),'utf8');
const exists=async path=>access(new URL(path,root),constants.F_OK).then(()=>true,()=>false);

describe('Astro Workers cutover',()=>{
  it('promotes Astro and Workers scripts without legacy commands',async()=>{
    const pkg=JSON.parse(await read('package.json'));const scripts=JSON.stringify(pkg.scripts);
    expect(pkg.sideEffects).toBeUndefined();
    expect(pkg.scripts.dev).toBe('astro dev --host 127.0.0.1 --port 7778');
    expect(pkg.scripts.build).toBe('astro build');
    expect(pkg.scripts.preview).toBe('npm run build && wrangler dev');
    expect(pkg.scripts['build:production']).toContain('require-site-url');
    expect(pkg.scripts['build:production']).toContain('verify-production-origin');
    expect(pkg.scripts.deploy).toBe('npm run build:production && wrangler deploy');
    expect(scripts).not.toMatch(/remix|wrangler pages/i);
  });

  it('contains no legacy Remix or Pages dependency surface',async()=>{
    const pkg=JSON.parse(await read('package.json'));const names=[...Object.keys(pkg.dependencies??{}),...Object.keys(pkg.devDependencies??{})];
    expect(names.filter(name=>name.startsWith('@remix-run/')||name==='miniflare')).toEqual([]);
    expect(names).not.toContain('@astrojs/cloudflare-pages');
    expect(pkg.dependencies.react).toMatch(/^\^19\.3\./);
    expect(pkg.dependencies['react-dom']).toMatch(/^\^19\.3\./);
  });

  it('targets the generated Worker and static assets with current runtime settings',async()=>{
    const config=JSON.parse(await read('wrangler.jsonc'));
    expect(config).toMatchObject({
      name:'portfolio',main:'@astrojs/cloudflare/entrypoints/server',compatibility_date:'2026-10-03',
      compatibility_flags:['nodejs_compat'],preview_urls:true,previews:{},
      assets:{binding:'ASSETS',directory:'./dist/client'},observability:{enabled:true},
    });
  });

  it('removes legacy source and configuration',async()=>{
    for(const path of ['app','functions','vite.config.js','wrangler.toml','tests/legacy','Dockerfile','compose.yaml','README.Docker.md','.dockerignore']) expect(await exists(path)).toBe(false);
    expect(await exists('public/.assetsignore')).toBe(true);
  });

  it('reads contact secrets from the current Workers runtime API',async()=>{
    const endpoint=await read('src/pages/api/contact.js');
    expect(endpoint).toContain("from 'cloudflare:workers'");
    expect(endpoint).not.toContain('locals.runtime');
  });

  it('bundles server dependencies for the Workers browser runtime',async()=>{
    const astroConfig=await read('astro.config.mjs');
    expect(astroConfig).toContain("target: 'webworker'");
    expect(astroConfig).toContain("mainFields: ['browser', 'module', 'jsnext:main', 'jsnext']");
  });

  it('uses a Workers preview hostname rule and never emits the old Pages rule',async()=>{
    const headers=await read('public/_headers');
    expect(headers).toContain('workers.dev');
    expect(headers).not.toContain('pages.dev');
  });

  it('generates the sitemap instead of shipping stale hard-coded URLs',async()=>{
    expect(await exists('public/sitemap.xml')).toBe(false);
    expect(await exists('src/pages/sitemap.xml.js')).toBe(true);
  });
});
