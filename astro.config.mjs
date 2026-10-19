import cloudflare from '@astrojs/cloudflare';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';
import { existsSync, readFileSync } from 'node:fs';
import { validateExperience } from './src/lib/experience.js';
import { validateTechStack } from './src/lib/tech-stack.js';

// Cloudflare prerenders in workerd, whose filesystem is virtual. Validate local
// author assets here, while Astro's configuration still runs in Node.
validateExperience(JSON.parse(readFileSync(new URL('./src/data/experience.json', import.meta.url), 'utf8')));
validateTechStack(JSON.parse(readFileSync(new URL('./src/data/tech-stack.json', import.meta.url), 'utf8')), path => existsSync(new URL(`./public${path}`, import.meta.url)));

const site = process.env.PUBLIC_SITE_URL || 'http://localhost:7778';

export default defineConfig({
  integrations: [react()],
  site,
  output: 'static',
  session: false,
  adapter: cloudflare({ imageService: 'passthrough' }),
  server: {
    host: '127.0.0.1',
    port: 7778,
  },
  vite: {
    plugins: [tailwindcss()],
    // Vite intermittently advertises an optimized Motion entry that its cache
    // does not contain, leaving the Tech Stack Astro island with a 404 import.
    // Serve Motion from its package modules instead of the volatile dep cache.
    optimizeDeps: {
      exclude: [
        'motion/react',
        'gsap',
        'gsap/ScrollTrigger',
        'lenis',
        'lottie-web/build/player/lottie_light',
      ],
    },
    // Cloudflare's prerender optimizer must not replace a running dev server's
    // deps_ssr files when a production build runs in the same worktree.
    cacheDir: process.argv.includes('build')
      ? 'node_modules/.vite-astro-build'
      : 'node_modules/.vite-astro-dev',
    build: {
      rolldownOptions: {
        checks: {
          moduleLevelDirective: false,
        },
      },
    },

  },
});
