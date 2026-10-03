import { fileURLToPath } from 'node:url';
import cloudflare from '@astrojs/cloudflare';
import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import { defineConfig } from 'astro/config';

export default defineConfig({
  output: 'static',
  session: false,
  adapter: cloudflare({ imageService: 'passthrough' }),
  integrations: [react(), mdx()],
  server: {
    host: '127.0.0.1',
    port: 7778,
  },
  vite: {
    ssr: {
      target: 'webworker',
      resolve: {
        mainFields: ['browser', 'module', 'jsnext:main', 'jsnext'],
      },
    },
    build: {
      rolldownOptions: {
        checks: {
          moduleLevelDirective: false,
        },
      },
    },
    resolve: {
      alias: {
        '~': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
  },
});
