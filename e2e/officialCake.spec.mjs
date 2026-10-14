import { test, expect } from '@playwright/test';
import axe from 'axe-core';
import { open, capture, gpuState, dbQuotes } from './helpers.mjs';
import { designAction } from './designAction.mjs';

test('all 44 client photographs are represented and official catalogue/detail ranges work', async ({ page }, info) => {
  await open(page, '/cakes'); await expect(page.locator('.official-cake-product')).toHaveCount(43);
  await capture(page, `${info.project.name}-phase6-catalogue`);
  const pictures = await page.locator('.official-cake-product img').evaluateAll(images => images.map(i => ({ width: i.naturalWidth, src: i.currentSrc, loaded: i.complete })));
  expect(pictures.every(p => p.loaded && p.width > 0 && p.src.includes('/images/cakes/client/') && !p.src.includes('illustration'))).toBeTruthy();
  await page.getByRole('button', { name: 'Featured cakes', exact: true }).click(); await expect(page.locator('.official-cake-product')).toHaveCount(6);
  await page.getByRole('button', { name: 'All cake designs', exact: true }).click(); await expect(page.locator('.product-card')).toHaveCount(49);
  const inventory = await (await page.request.get('/images/catalogue/CAKE_IMAGE_INVENTORY.json')).json(); expect(inventory.cakeSourceCount).toBe(44); expect(inventory.items).toHaveLength(44);
  for (const item of inventory.items) { const response = await page.request.get(item.originalPath); expect(response.ok()).toBeTruthy(); }
  await open(page, '/cakes/cake-wa-0014'); await page.getByRole('button', { name: /photograph 2$/ }).click();
  await expect(page.locator('.official-cake-detail > div > img')).toHaveAttribute('src', /0020/);
  await open(page, '/cakes/cake-wa-0008'); await page.getByRole('combobox', { name: 'Flavour', exact: true }).selectOption('Chocolate');
  await expect(page.locator('.detail-price')).toContainText(/1\s660/); await expect(page.locator('.detail-price')).toContainText(/2\s130/);
  await page.getByRole('combobox', { name: 'Flavour', exact: true }).selectOption('Carrot'); await expect(page.locator('.detail-price')).toContainText(/1\s700/);
  await page.addScriptTag({ content: axe.source }); const violations = await page.evaluate(async () => (await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a','wcag2aa','wcag21a','wcag21aa'] } })).violations); expect(violations).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy(); await capture(page, `${info.project.name}-phase6-detail`);
});

test('official photo/flavour travel through real 3D, quotation, pricing versions and controlled confirmations', async ({ page }, info) => {
  await open(page, '/cakes/cake-wa-0008');
  await page.getByRole('combobox', { name: 'Flavour', exact: true }).selectOption('Chocolate Bar One');
  await page.getByRole('textbox', { name: 'Personalisation instructions', exact: true }).fill('Please personalise the name.');
  await page.getByRole('button', { name: 'Customise This Cake', exact: true }).click();
  await expect(page).toHaveURL(/cake-designer\?product=cake-wa-0008/); await page.locator('canvas').waitFor();
  await expect(page.locator('.studio-reference img')).toHaveAttribute('src', /0008/);
  await expect(page.getByRole('combobox', { name: 'Flavour', exact: true })).toHaveValue('Chocolate Bar One');
  await expect(page.locator('.estimate-total strong')).toContainText(/1\s700/);
  await page.getByRole('button', { name: 'Square', exact: true }).click();
  await page.getByRole('button', { name: '3 tiers', exact: true }).click();
  await page.getByRole('checkbox', { name: 'Decorative pearls', exact: true }).check();
  await expect(page.locator('.estimate-total strong')).toContainText(/1\s700/);
  const gpu = await gpuState(page); expect(gpu.calls).toBeGreaterThan(0);
  await page.context().grantPermissions(['clipboard-read','clipboard-write']);
  await designAction(page, 'Copy Estimate');
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toContain('Flavour: Chocolate Bar One');
  await capture(page, `${info.project.name}-phase6-designer`);
  await page.getByRole('button', { name: 'Request This Cake', exact: true }).first().click();
  await page.getByLabel('Full name', { exact: true }).fill('Official Test Customer'); await page.getByLabel('Email address', { exact: true }).fill('official@example.com'); await page.getByLabel('South African contact number').fill('0821234567');
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByLabel('Event date', { exact: true }).fill('2026-12-20'); await page.getByLabel(/guests/i).fill('20');
  await page.getByRole('button', { name: 'Continue', exact: true }).click(); await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByRole('checkbox', { name: /understand|saved locally|demonstration/i }).check(); await page.getByRole('button', { name: 'Save Demo Request', exact: true }).click();
  await expect(page).toHaveURL(/\/quotations\//); const quoteURL = page.url(); const id = quoteURL.split('/').pop();
  const quotes = await dbQuotes(page); expect(quotes).toHaveLength(1); expect(quotes[0].snapshot.official.flavourSurchargeCents).toBe(22000); expect(quotes[0].snapshot.official.minimumEstimateCents).toBe(170000); expect(quotes[0].snapshot.official.image).toContain('0008');
  const originalSnapshot = JSON.stringify(quotes[0].snapshot);
  await open(page, '/admin/pricing'); await page.getByRole('spinbutton', { name: 'Chocolate Bar One surcharge (ZAR)', exact: true }).fill('230'); await page.getByRole('button', { name: 'Preview official pricing', exact: true }).click(); await expect(page.getByRole('region', { name: 'Official price preview' })).toContainText(/1\s710/); await page.getByRole('button', { name: 'Publish official pricing locally', exact: true }).click(); await expect(page.getByRole('status').filter({ hasText: 'Official pricing published' })).toBeVisible();
  await open(page, `/admin/quotations/${id}`); await page.getByRole('spinbutton', { name: 'Confirmed base price (ZAR)', exact: true }).fill('1400'); await page.getByRole('textbox', { name: 'Confirmation or adjustment reason', exact: true }).fill('Reviewed requirements'); await page.getByRole('button', { name: 'Confirm price locally', exact: true }).click(); await expect(page.getByRole('alert')).toContainText('approved range');
  await page.getByRole('spinbutton', { name: 'Confirmed base price (ZAR)', exact: true }).fill('1600'); await page.getByRole('spinbutton', { name: 'Explicitly approved additional charges (ZAR)', exact: true }).fill('50'); await page.getByRole('checkbox', { name: 'I explicitly approve the listed additional charges', exact: true }).check(); await page.getByRole('button', { name: 'Confirm price locally', exact: true }).click(); await expect(page.getByText(/Manually quoted fixed amount:/)).toContainText(/1\s870/);
  await page.getByRole('spinbutton', { name: 'Confirmed base price (ZAR)', exact: true }).fill('1700'); await page.getByRole('spinbutton', { name: 'Explicitly approved additional charges (ZAR)', exact: true }).fill('0'); await page.getByRole('textbox', { name: 'Confirmation or adjustment reason', exact: true }).fill('Updated requirements reviewed'); await page.getByRole('button', { name: 'Confirm price locally', exact: true }).click(); await expect(page.getByText(/Manually quoted fixed amount:/)).toHaveCount(2);
  const stored = await dbQuotes(page); expect(JSON.stringify(stored[0].snapshot)).toBe(originalSnapshot); expect(stored[0].status).toBe('Quoted');
  await page.goto(quoteURL, { waitUntil: 'domcontentloaded' }); await expect(page.getByText(/Manually quoted fixed amount:/)).toHaveCount(2); await capture(page, `${info.project.name}-phase6-confirmation`);
});
