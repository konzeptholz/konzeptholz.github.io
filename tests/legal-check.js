async (page) => {
  const assert = (value, message) => { if (!value) throw new Error(message); };
  const openCount = () => page.locator('.legal-sections details[open]').count();
  const results = [];
  for (const width of [390, 767, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('http://127.0.0.1:4322/impressum-datenschutz/');
    const imprint = page.locator('summary').filter({ hasText: 'Impressum' });
    const privacy = page.locator('summary').filter({ hasText: 'Datenschutz' });
    assert(await openCount() === 1, 'Impressum should be open initially');
    await imprint.click();
    assert(await openCount() === (width < 768 ? 0 : 1), `Active section click at ${width}`);
    await privacy.click();
    assert(await openCount() === 1, 'Switch must open exactly one section');
    assert(await page.getByText('1. Datenschutzerklärung', { exact: true }).isVisible(), 'Privacy content missing');
    await privacy.focus();
    await page.keyboard.press('Enter');
    assert(await openCount() === (width < 768 ? 0 : 1), `Active section Enter at ${width}`);
    if (width >= 768) {
      await page.keyboard.press('Space');
      assert(await openCount() === 1, 'Space must not collapse the desktop tab');
    }
    results.push(`${width}px: passed`);
  }
  await page.setViewportSize({ width: 767, height: 900 });
  await page.locator('summary').filter({ hasText: 'Datenschutz' }).click();
  assert(await openCount() === 0, 'Mobile must allow both collapsed');
  await page.setViewportSize({ width: 768, height: 900 });
  await page.waitForFunction(() => document.querySelectorAll('.legal-sections details[open]').length === 1);
  assert(await page.getByText('1. Datenschutzerklärung', { exact: true }).isVisible(), 'Widening should restore the last section');
  await page.locator('summary').filter({ hasText: 'Impressum' }).click();
  assert(await page.getByText('Kontakt-Adresse', { exact: true }).isVisible(), 'Switching back must work');
  return { results, resizeRestoration: 'passed', keyboard: 'passed' };
}
