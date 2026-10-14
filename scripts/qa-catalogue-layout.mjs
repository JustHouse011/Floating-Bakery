import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
const browser = await chromium.launch({ channel: 'chrome' });
const results = [];
try {
  for (const [width, height] of [[1920,1080],[1440,900],[1024,768],[768,1024],[390,844],[360,800]]) {
    const context = await browser.newContext({ viewport: { width, height }, reducedMotion: 'reduce' });
    const page = await context.newPage(); const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto('http://127.0.0.1:5173/cakes/plain-scones', { waitUntil: 'domcontentloaded' });
    await page.getByRole('heading', { name: 'Plain Scones', exact: true }).waitFor();
    const state = await page.locator('.site-footer-grid').evaluate(el => ({ display: getComputedStyle(el).display, width: el.getBoundingClientRect().width, paragraphWidths: [...el.querySelectorAll('p')].map(p => p.getBoundingClientRect().width), text: el.innerText, overflow: document.documentElement.scrollWidth > innerWidth + 1 }));
    if (state.display !== 'grid' || state.paragraphWidths.some(w => w < 160) || state.overflow || errors.length) throw new Error(JSON.stringify({ width, state, errors }));
    await mkdir('qa/evidence/phase8b', { recursive: true });
    await page.locator('.site-footer-grid').screenshot({ path: `qa/evidence/phase8b/footer-${width}.png` });
    results.push({ viewport: `${width}x${height}`, ...state, errors }); await context.close();
  }
  await writeFile('qa/evidence/phase8b/footer-layout.json', JSON.stringify(results, null, 2));
  console.log('Footer contacts readable at all six viewports.');
} finally { await browser.close(); }
