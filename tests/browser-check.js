async (page) => {
  const base = 'http://127.0.0.1:4321';
  const routes = ['', 'beratung', 'statik', 'planung', 'brandschutz', 'impressum-datenschutz'];
  const errors = [];
  const results = [];
  page.on('pageerror', error => errors.push(error.message));
  const assert = (condition, message) => { if (!condition) throw new Error(message); };
  for (const width of [390, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const route of routes) {
      const response = await page.goto(`${base}/${route ? route + '/' : ''}`);
      assert(response.status() === 200, `${width}/${route}: HTTP failure`);
      await page.evaluate(() => document.fonts.ready);
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${width}/${route}: horizontal overflow`);
      assert(await page.locator('img').evaluateAll(images => images.every(image => image.complete && image.naturalWidth > 0)), `${width}/${route}: broken image`);
      assert(await page.locator('h1').count() === 1, `${width}/${route}: missing page heading`);
      if (width < 1310) {
        const toggle = page.getByRole('button', { name: 'Hauptnavigation' });
        await toggle.click();
        assert(await page.locator('#navigation').isVisible(), 'Menu did not open');
        assert(await toggle.getAttribute('aria-expanded') === 'true', 'Incorrect expanded state');
        assert(await page.locator('#navigation nav a').count() === 4, 'Missing service links');
        await page.keyboard.press('Escape');
        assert(!await page.locator('#navigation').isVisible(), 'Escape did not close menu');
        assert(await toggle.evaluate(element => element === document.activeElement), 'Menu focus was not restored');
      }
      if (route === 'impressum-datenschutz') {
        if (width >= 768) {
          const heading = await page.locator('summary').first().boundingBox();
          const panel = await page.locator('details[open] .legal-panel').boundingBox();
          assert(panel.y >= heading.y + heading.height - 1, 'Legal panel must appear below its tabs');
          assert(panel.width >= Math.min(width, 1285) - 1, 'Legal panel must span the content width');
        }
        await page.locator('summary').filter({ hasText: 'Datenschutz' }).click();
        assert(await page.getByText('1. Datenschutzerklärung', { exact: true }).isVisible(), 'Privacy section inaccessible');
        assert(!await page.getByText('Kontakt-Adresse', { exact: true }).isVisible(), 'Legal sections should be exclusive');
        await page.locator('summary').filter({ hasText: 'Impressum' }).click();
      }
      await page.screenshot({ path: `/tmp/konzeptholz-${width}-${route || 'home'}.png`, fullPage: true });
      results.push(`${width}px /${route}: passed`);
    }
  }
  await page.setViewportSize({ width: 390, height: 1000 });
  await page.goto(base);
  const image = await page.locator('.home-image').boundingBox();
  assert(Math.abs(image.y - 237.34) < 1 && image.height === 250 && image.width === 390, 'Mobile homepage geometry differs from original');
  await page.getByRole('button', { name: 'Hauptnavigation' }).click();
  await page.locator('#navigation').getByRole('link', { name: 'Statik', exact: true }).click();
  await page.waitForURL('**/statik/');
  await page.getByRole('link', { name: 'Zur Startseite' }).click();
  await page.waitForURL(base + '/');
  await page.setViewportSize({ width: 1440, height: 1000 });
  const desktopImage = await page.locator('.home-image').boundingBox();
  assert(Math.abs(desktopImage.x - 77.5) < 1 && Math.abs(desktopImage.y - 562.69) < 1, 'Desktop homepage image differs from original');
  assert(!errors.length, `Browser errors: ${errors.join(', ')}`);
  return { pages: results, menuNavigation: 'passed', referenceGeometry: 'passed', browserErrors: errors };
}
