import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://konzeptholz.ch',
  output: 'static',
  trailingSlash: 'always',
  integrations: [sitemap({ filter: (page) => !new URL(page).pathname.startsWith('/404') })],
  redirects: { '/startseite/': '/' },
});
