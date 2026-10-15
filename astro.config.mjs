import cloudflare from '@astrojs/cloudflare';
import { defineConfig } from 'astro/config';

const site = process.env.PUBLIC_SITE_URL || 'http://localhost:7778';

export default defineConfig({
  site,
  output: 'static',
  session: false,
  adapter: cloudflare({ imageService: 'passthrough' }),
  server: {
    host: '127.0.0.1',
    port: 7778,
  },
  vite: {
    build: {
      rolldownOptions: {
        checks: {
          moduleLevelDirective: false,
        },
      },
    },

  },
});
