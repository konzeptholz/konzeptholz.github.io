# KONZEPTHOLZ website

Static Astro migration of https://konzeptholz.ch/. The original German content,
logo, photographs, dark background, copper palette, and typefaces are retained.
No CMS, external font service, or styling framework is required.

## Development

Use Node.js 24 LTS and npm.

```sh
npm ci
npm run dev
```

```sh
npm run check
npm run build
npm test
npm run preview
```

The production output is `dist/`. Tests check the built pages, local links and
assets, contact links, legal content, and the legacy homepage redirect.

## Editing content

All website content is Markdown, including metadata in YAML frontmatter:

- `src/content/pages/startseite.md`: homepage image and service links.
- `src/content/pages/404.md`: custom not-found page text.
- `src/content/pages/{beratung,statik,planung,brandschutz}.md`: services and team.
- `src/content/pages/impressum-datenschutz.md`: legal page metadata.
- `src/content/legal/{impressum,datenschutz}.md`: complete imprint and privacy text.
- `src/content/shared/site.md`: contact details, branding assets, and interface labels.
- `src/content/drafts/referenzen.md`: original reference placeholder, hidden on all
  screen sizes on the source website; retained here but intentionally not published.

Page filenames determine URLs. Add a page with `kind: page`, `title`, and
`description`. Optional `order` includes it in the service navigation; optional
`image` and `imageAlt` add a hero image. Images live in `public/images/` and can
also be embedded with ordinary Markdown image syntax. The Beratung page stores
portrait names, images, and roles in its `team` frontmatter array. The typed collection
schemas are in `src/content.config.ts`.

Layouts live in `src/layouts/`, page templates in `src/pages/`, and responsive
styles in `src/styles/global.css`. Fonts are bundled locally from Fontsource.

## Deployment

The GitHub Actions workflow checks and builds pull requests, then deploys pushes
to `main` to GitHub Pages. In repository Settings → Pages, select **GitHub
Actions** as the build source. Configure the custom domain `konzeptholz.ch` and
its DNS when ready to replace the existing site. No DNS or live hosting changes
are made by this migration. `public/CNAME` preserves the intended domain.

All six original page URLs are retained. The custom `404.html` is served by
GitHub Pages for unknown URLs and is excluded from search indexing and the sitemap.
The original white-background favicon is preserved in `public/favicon.ico`. `/startseite/` redirects to `/` using a
static HTML redirect compatible with GitHub Pages. Canonical URLs, robots.txt,
and the generated sitemap use `https://konzeptholz.ch`.

## Migration notes

Content and assets were recovered from the public WordPress pages and their
stylesheets. WordPress/Elementor scripts and generated markup were replaced with
static Astro templates. Broken telephone links and JavaScript-obfuscated email
links became standard `tel:` and `mailto:` links. Both legal sections use native expandable sections that work without JavaScript. The original legal wording is preserved, including
its cookie statement; this implementation itself adds no analytics or cookies.

## Visual verification

The layout was compared against the live site using `playwright-cli` at desktop
and mobile widths. The browser check covers all pages at 390, 768, and 1440 pixels,
image loading, horizontal overflow, the mobile menu, keyboard dismissal/focus,
legal sections, navigation, and homepage geometry from the original site.

With the production build served on port 4321 and playwright-cli installed:

```sh
playwright-cli -s=konzeptholz open http://127.0.0.1:4321/
playwright-cli -s=konzeptholz run-code "$(cat tests/browser-check.js)"
playwright-cli -s=konzeptholz run-code "$(cat tests/menu-check.js)"
playwright-cli -s=konzeptholz close
```

Pass `--config=/path/to/config.json` to `open` if your environment requires a
custom Chromium executable. Full-page QA screenshots are written to `/tmp/`.
