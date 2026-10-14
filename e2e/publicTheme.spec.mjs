import { test, expect } from '@playwright/test';
import { open, capture } from './helpers.mjs';

test('white theme, minimal controls, equal photography, map and adaptive interactions', async ({ page }, info) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await open(page, '/');
  await expect(page.locator('canvas')).toHaveCount(0);
  expect(await page.evaluate(() => performance.getEntriesByType('resource').some(r => r.name.includes('/three/CakeScene/')))).toBe(false);
  expect(await page.locator('html').evaluate(el => getComputedStyle(el).backgroundColor)).toBe('rgb(255, 255, 255)');
  for (const selector of ['.public-site', 'header', 'footer', '.hero', '.how', '.catering-feature', '.final-cta']) {
    expect(await page.locator(selector).first().evaluate(el => getComputedStyle(el).backgroundColor), selector).toBe('rgb(255, 255, 255)');
  }
  const buttonStyle = await page.locator('.hero .button').evaluate(el => {
    const s = getComputedStyle(el); return { background: s.backgroundColor, top: s.borderTopWidth, bottom: s.borderBottomWidth, height: el.getBoundingClientRect().height };
  });
  expect(buttonStyle.background).toBe('rgba(0, 0, 0, 0)');
  expect(buttonStyle.top).toBe('0px'); expect(buttonStyle.bottom).toBe('2px'); expect(buttonStyle.height).toBeGreaterThanOrEqual(44);
  await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
  await expect(page.getByRole('button', { name: 'Back to top' })).toBeVisible();
  await page.getByRole('button', { name: 'Back to top' }).click();
  await expect.poll(() => page.evaluate(() => scrollY)).toBeLessThan(3);
  await expect(page.locator('main')).toBeFocused();
  await open(page, '/cakes');
  const frames = await page.locator('.product-image').evaluateAll(elements => elements.map(el => ({ width: el.getBoundingClientRect().width, height: el.getBoundingClientRect().height })));
  expect(frames.length).toBe(61);
  for (const frame of frames) { expect(frame.width / frame.height).toBeCloseTo(.8, 2); expect(frame.height).toBeCloseTo(frames[0].height, 0); }
  await page.locator('.product-image').first().hover();
  expect(await page.locator('.product-photo').first().evaluate(el => getComputedStyle(el).transform)).toBe('none');
  await capture(page, `${info.project.name}-phase8-catalogue`);
  await open(page, '/about');
  for (const selector of ['.about-hero','.about-founder','.about-location']) expect(await page.locator(selector).evaluate(el => getComputedStyle(el).backgroundColor)).toBe('rgb(255, 255, 255)');
  await open(page, '/contact');
  const field = await page.getByLabel('Your name', { exact: true }).evaluate(el => {
    const s = getComputedStyle(el); return { bg: s.backgroundColor, top: s.borderTopWidth, right: s.borderRightWidth, left: s.borderLeftWidth, bottom: s.borderBottomWidth };
  });
  expect(field).toEqual({ bg:'rgb(255, 255, 255)', top:'0px',right:'0px',left:'0px',bottom:'1px' });
  await expect(page.getByRole('heading', { name: "We'd Love to Hear From You" })).toBeVisible();
  await expect(page.locator('iframe')).toHaveAttribute('title', /Thatchfield Crescent Estate/);
  await expect(page.locator('iframe')).toHaveAttribute('src', /q=Thatchfield.*output=embed/);
  await expect(page.getByRole('link', { name: 'Get Directions', exact: true }).first()).toHaveAttribute('href', /api=1&destination=Thatchfield%20Crescent%20Estate/);
  await page.getByLabel('Your name', { exact: true }).fill('Phase Eight Test');
  await page.getByLabel('Email address', { exact: true }).fill('phase8@example.com');
  await page.getByLabel('Telephone', { exact: true }).fill('0731268382');
  await page.getByLabel('Your message', { exact: true }).fill('A local test enquiry.');
  await page.getByRole('checkbox').check();
  await page.locator('.contact form').evaluate(form => { form.requestSubmit(); form.requestSubmit(); });
  await expect(page.getByRole('heading', { name: 'Your idea is saved.' })).toBeVisible();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('floating:enquiries') || '[]').length)).toBe(1);
  await capture(page, `${info.project.name}-phase8-contact`);
  await page.mouse.move(100, 120);
  await expect(page.locator('.cursor-accent')).toBeHidden();
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await open(page, '/');
  await page.mouse.move(100, 120);
  const pointer = await page.evaluate(() => matchMedia('(hover:hover) and (pointer:fine)').matches);
  if (pointer) {
    await expect(page.locator('.cursor-accent')).toBeVisible();
    await page.locator('.hero .button').hover();
    await expect(page.locator('.cursor-accent')).toHaveAttribute('data-active', 'true');
  } else await expect(page.locator('.cursor-accent')).toBeHidden();
  expect(await page.locator('.route-content').evaluate(el => getComputedStyle(el).animationName)).toBe('public-route-enter');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(page.locator('.cursor-accent')).toBeHidden();
  expect(await page.locator('.route-content').evaluate(el => getComputedStyle(el).animationName)).toBe('none');
  expect(errors).toEqual([]);
});
