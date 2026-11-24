import { defineConfig, envField } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://konzeptholz.ch',
  output: 'static',
  trailingSlash: 'always',
  env: {
    // Encrypted at build time. The build fails if they are missing, rather than publishing unreachable contact details.
    validateSecrets: true,
    schema: {
      CONTACT_EMAIL: envField.string({ context: 'server', access: 'secret', includes: '@' }),
      CONTACT_PHONE: envField.string({ context: 'server', access: 'secret', startsWith: '+' }),
    },
  },
  integrations: [sitemap({ filter: (page) => !new URL(page).pathname.startsWith('/404') })],
  redirects: { '/startseite/': '/' },
});
