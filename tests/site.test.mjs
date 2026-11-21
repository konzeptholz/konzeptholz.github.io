import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import path from 'node:path';

const routes = ['', 'beratung', 'statik', 'planung', 'brandschutz', 'impressum-datenschutz'];
for (const route of routes) {
  test(`${route || '/'} preserves a complete, independently hosted page`, async () => {
    const html = await readFile(`dist/${route ? route + '/' : ''}index.html`, 'utf8');
    assert.match(html, /lang="de-CH"/);
    assert.equal((html.match(/<h1[\s>]/g) || []).length, 1);
    assert.match(html, /href="#email"/);
    assert.match(html, /href="#telefon"/);
    assert.doesNotMatch(html, /wp-content|DeCryptX|http:\/\/tel:|blablabla|fonts.googleapis/);
    assert.match(html, new RegExp(`rel="canonical" href="https://konzeptholz.ch/${route ? route + '/' : ''}"`));
    for (const [, url] of html.matchAll(/(?:href|src)="(\/[^"#?]*)"/g)) {
      const target = url.endsWith('/') ? `${url}index.html` : url;
      await access(path.join('dist', target));
    }
  });
}
test('legal content, portraits, legacy URL, and sitemap survive migration', async () => {
  const legal = await readFile('dist/impressum-datenschutz/index.html', 'utf8');
  for (const text of ['CHE-269.115.772', 'CH-020.4.080.983-3', 'Datenschutzerklärung', 'Cookie-Richtlinie', 'Urheberrechte']) assert.ok(legal.includes(text), text);
  const team = await readFile('dist/beratung/index.html', 'utf8');
  for (const image of ['Silvan_Capol.jpg', 'Vera_Capol.jpg', 'Turi.webp']) assert.ok(team.includes(image));
  const redirect = await readFile('dist/startseite/index.html', 'utf8');
  assert.match(redirect, /http-equiv="refresh"/i);
  await access('dist/sitemap-index.xml');
  assert.equal((await readFile('dist/CNAME', 'utf8')).trim(), 'konzeptholz.ch');
});

test('custom 404 and original favicon are packaged for GitHub Pages', async () => {
  const html = await readFile('dist/404.html', 'utf8');
  assert.match(html, /Seite nicht gefunden/);
  assert.match(html, /name="robots" content="noindex, follow"/);
  assert.match(html, /href="\/">Zur Startseite/);
  assert.match(html, /href="\/favicon.ico"/);
  const icon = await readFile('dist/favicon.ico');
  assert.deepEqual([...icon.subarray(0, 4)], [0, 0, 1, 0]);
  const sitemap = await readFile('dist/sitemap-0.xml', 'utf8');
  assert.doesNotMatch(sitemap, /\/404/);
});
