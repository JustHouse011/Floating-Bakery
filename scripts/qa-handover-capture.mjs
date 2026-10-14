import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';

const browser = await chromium.launch({ channel: 'chrome' });
try {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  const page = await context.newPage();
  const errors = [];
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  await page.goto('http://127.0.0.1:5173/');
  await page.waitForTimeout(1200);
  await page.goto('http://127.0.0.1:5173/cake-designer');
  await page.locator('canvas').waitFor();
  await page.waitForTimeout(1500);
  await mkdir('qa/evidence/final', { recursive: true });
  await page.screenshot({ path: 'qa/evidence/final/designer-mobile-viewport.png' });
  await writeFile('qa/evidence/final/handover-console.json', JSON.stringify(errors, null, 2));
  if (errors.length) throw new Error(JSON.stringify(errors));
  console.log('Final homepage/designer console clean; mobile viewport captured.');
} finally {
  await browser.close();
}
