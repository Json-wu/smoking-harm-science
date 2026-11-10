import { fileURLToPath } from 'node:url';
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';

const site = process.env.SITE_URL ?? 'https://yan.aivelo.net';

export default defineConfig({
  site,
  vite: {
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
  },
  integrations: [
    tailwind({
      applyBaseStyles: false,
    }),
    sitemap(),
  ],
  markdown: {
    shikiConfig: {
      theme: 'github-light',
    },
  },
});
