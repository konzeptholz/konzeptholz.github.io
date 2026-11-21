async (page) => {
  const assert = (value, message) => { if (!value) throw new Error(message); };
  const results = [];
  for (const width of [390, 540, 767, 768, 1024, 1280]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto('http://127.0.0.1:4321/');
    await page.getByRole('button', { name: 'Hauptnavigation' }).click();
    const animation = await page.locator('#navigation').evaluate(async element => {
      const animation = element.getAnimations().find(item => item.animationName === 'menu-enter');
      if (!animation) throw new Error('Missing slide/fade animation');
      const timing = animation.effect.getTiming();
      const frames = animation.effect.getKeyframes();
      await animation.finished;
      return { duration: timing.duration, frames };
    });
    assert(animation.duration === 700, 'Opening duration must match original');
    assert(animation.frames[0].opacity === '0' && animation.frames[0].transform.includes('100%'), 'Menu must fade and slide in from right');
    const box = await page.locator('#navigation').boundingBox();
    assert(Math.abs(box.width - width * (width < 768 ? .8 : .5)) < 1, 'Incorrect responsive panel width');
    const nav = await page.locator('#navigation nav').boundingBox();
    assert(Math.abs(nav.y + nav.height / 2 - 422) < 1, 'Links must be vertically centered');
    const close = await page.locator('.menu-close').boundingBox();
    assert(close.y === 50 && Math.abs(close.x + close.width - (width - 50)) < 1, 'Incorrect close button position');
    await page.screenshot({ path: `/tmp/konzeptholz-menu-${width}.png` });
    await page.getByRole('button', { name: 'Menü schliessen' }).click();
    assert(!await page.locator('#navigation').isVisible(), 'Close button failed');
    await page.getByRole('button', { name: 'Hauptnavigation' }).click();
    await page.keyboard.press('Escape');
    assert(!await page.locator('#navigation').isVisible(), 'Escape failed during animation');
    assert(await page.locator('.menu-toggle').evaluate(e => e === document.activeElement), 'Focus must return to toggle');
    results.push(`${width}px: animation, layout, close and Escape passed`);
  }
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.getByRole('button', { name: 'Hauptnavigation' }).click();
  assert(await page.locator('#navigation').evaluate(e => e.getAnimations().length === 0), 'Reduced motion must suppress animation');
  await page.mouse.click(10, 300);
  assert(!await page.locator('#navigation').isVisible(), 'Backdrop dismissal failed');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  return { results, reducedMotion: 'passed', backdropDismissal: 'passed' };
}
