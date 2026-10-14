import { test, expect } from "@playwright/test";
import axe from "axe-core";
import { open, capture } from "./helpers.mjs";
test("Chef Gugu About story, portrait, navigation and reduced motion", async ({ page }, info) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(() => {
    window.aboutLayoutShift = 0;
    new PerformanceObserver(list => {
      for (const entry of list.getEntries()) if (!entry.hadRecentInput) window.aboutLayoutShift += entry.value;
    }).observe({ type: 'layout-shift', buffered: true });
  });
  await open(page, '/about');
  await expect(page).toHaveTitle('About | Floating Bakery & Caterers');
  await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /founded by Chef Gugu in Thatchfield, Centurion/);
  const portrait = page.locator('.founder-portrait img');
  await portrait.scrollIntoViewIfNeeded();
  await expect.poll(() => portrait.evaluate(img => img.complete && img.naturalWidth > 0)).toBe(true);
  await expect(portrait).toHaveAttribute('src', '/images/profile/gugu.jpeg');
  const photo = await portrait.evaluate(img => ({ width: img.naturalWidth, height: img.naturalHeight, ratio: img.clientWidth / img.clientHeight, animation: getComputedStyle(img.parentElement).animationName }));
  expect(photo.ratio).toBeCloseTo(photo.width / photo.height, 2);
  expect(photo.animation).toBe('none');
  const columns = await page.locator('.about-founder').evaluate(el => getComputedStyle(el).gridTemplateColumns.split(' ').length);
  expect(columns).toBe(info.project.use.viewport.width > 760 ? 2 : 1);
  await expect(page.locator('main h1')).toHaveCount(1);
  await expect(page.locator('.about-page section')).toHaveCount(6);
  await expect(page.getByRole('link', { name: 'Request a Quotation', exact: true })).toHaveAttribute('href', '/quote-request');
  await page.addScriptTag({ content: axe.source });
  expect(await page.evaluate(async () => (await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a','wcag2aa','wcag21a','wcag21aa'] } })).violations.map(v => v.id))).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  await capture(page, `${info.project.name}-phase7-about`);
  expect(await page.evaluate(() => window.aboutLayoutShift)).toBeLessThan(0.1);
  await page.locator('footer').getByRole('link', { name: 'About Us' }).click();
  await page.goto('/');
  await page.getByRole('link', { name: 'Discover Our Story' }).click();
  await expect(page).toHaveURL(/\/about$/);
  if (info.project.use.viewport.width <= 800) await page.getByRole('button', { name: 'Open navigation' }).click();
  await expect(page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'About', exact: true })).toHaveAttribute('aria-current', 'page');
  await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Catalogue', exact: true }).click();
  await expect(page).toHaveURL(/\/cakes$/);
  expect(errors).toEqual([]);
});
test("all public and admin routes fit the viewport and render without exceptions", async ({
  page,
}, info) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  for (const path of [
    "/",
    "/cakes",
    "/cakes/vanilla",
    "/about",
    "/catering",
    "/contact",
    "/cake-designer",
    "/quote-request",
    "/admin",
    "/admin/products",
    "/admin/pricing",
    "/admin/quotations",
    "/admin/calendar",
    "/admin/reports",
    "/admin/settings",
    "/not-found",
  ]) {
    await open(page, path);
    if (await page.locator('.public-site').count()) {
      expect(await page.locator('.public-site').evaluate(el => getComputedStyle(el).backgroundColor), `${path} background`).toBe('rgb(255, 255, 255)');
    }
    await page.waitForTimeout(150);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
      `${path} at ${info.project.name}`,
    ).toBe(true);
    if (["/", "/cakes", "/admin", "/cake-designer"].includes(path))
      await capture(
        page,
        `${info.project.name}-${path.replaceAll("/", "-") || "home"}`,
      );
  }
  expect(errors).toEqual([]);
});
test("representative pages pass automated WCAG checks", async ({ page }) => {
  for (const path of [
    "/",
    "/cakes",
    "/contact",
    "/cake-designer",
    "/admin",
    "/admin/products",
    "/admin/pricing",
    "/admin/calendar",
    "/admin/settings",
  ]) {
    await open(page, path);
    await page.addScriptTag({ content: axe.source });
    const violations = await page.evaluate(async () => {
      const r = await window.axe.run(document, {
        runOnly: {
          type: "tag",
          values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"],
        },
      });
      return r.violations.map((v) => ({
        id: v.id,
        targets: v.nodes.map((n) => n.target),
      }));
    });
    expect(violations, path).toEqual([]);
  }
});
