// Expects a build with the dummy values from .env.example.
async (page) => {
  const base = 'http://127.0.0.1:4321';
  const assert = (value, message) => { if (!value) throw new Error(message); };
  const results = [];
  const foreign = [];
  const errors = [];
  let slowest = 0;
  page.on('request', request => { if (!request.url().startsWith(base) && !request.url().startsWith('data:')) foreign.push(request.url()); });
  page.on('pageerror', error => errors.push(error.message));
  const dialog = page.locator('#contact-captcha');
  const confirm = dialog.getByRole('button', { name: 'Ich bin kein Roboter' });
  const footerEmail = page.locator('address a').last();
  const revealed = page.locator('address a[href="mailto:test@example.com"]');

  for (const width of [320, 390, 768, 1440]) {
    for (const route of ['', 'beratung/', 'impressum-datenschutz/', '404.html']) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`${base}/${route}`);
      const height = await page.evaluate(() => document.documentElement.scrollHeight);
      await footerEmail.click();
      assert(await confirm.evaluate(button => button === document.activeElement), 'Dialog must focus the confirmation');
      const box = await dialog.boundingBox();
      assert(box.x >= 0 && box.x + box.width <= width, `Dialog overflows at ${width}`);
      assert(await dialog.evaluate(e => e.scrollWidth <= e.clientWidth), `Dialog content overflows at ${width}`);
      const start = Date.now();
      await confirm.click();
      await dialog.waitFor({ state: 'hidden' });
      slowest = Math.max(slowest, Date.now() - start);
      assert(await page.locator('a[href="#email"], a[href="#telefon"]').count() === 0, `Placeholders left on /${route}`);
      assert(await revealed.count() === 1, 'Email missing');
      assert(await page.locator('address a[href="tel:+00000000000"]').count() === 1, 'Phone missing');
      assert(await footerEmail.evaluate(link => link === document.activeElement), 'Focus must return to the link');
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Horizontal overflow');
      assert(await page.evaluate(() => document.documentElement.scrollHeight) === height, 'Revealing must not move the layout');
      results.push(`${width}px /${route}: passed`);
    }
  }

  for (const close of ['Escape', 'button']) {
    await page.goto(base);
    await footerEmail.click();
    await confirm.click();
    if (close === 'Escape') await page.keyboard.press('Escape');
    else await dialog.getByRole('button', { name: 'Schliessen' }).click();
    await page.waitForTimeout(slowest + 1000);
    assert(await page.locator('a[href^="mailto:"]').count() === 0, `Cancelled captcha must reveal nothing (${close})`);
    await footerEmail.click();
    await confirm.click();
    await dialog.waitFor({ state: 'hidden' });
    assert(await revealed.count() === 1, 'Reopening must work');
  }

  await page.goto(base);
  const sealed = await dialog.getAttribute('data-contact');
  await dialog.evaluate(element => { element.dataset.contact = 'broken'; });
  await footerEmail.click();
  await confirm.click();
  await dialog.getByText('Die Prüfung hat leider nicht funktioniert').waitFor();
  assert(await page.locator('a[href^="mailto:"]').count() === 0, 'Failed captcha must reveal nothing');
  await dialog.evaluate((element, value) => { element.dataset.contact = value; }, sealed);
  await confirm.click();
  await dialog.waitFor({ state: 'hidden' });
  assert(await revealed.count() === 1, 'Retry must work');

  assert(!foreign.length, `Third-party requests: ${foreign.join(', ')}`);
  assert(!errors.length, `Browser errors: ${errors.join(', ')}`);
  return { results, cancelled: 'passed', failed: 'passed', thirdPartyRequests: 0, slowestMs: slowest };
}
