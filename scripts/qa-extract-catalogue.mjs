import { chromium } from '@playwright/test';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const sourceRoot = 'public/catalogue-source/';
const sweet = 'image(20261013-125810).png';
const scones = 'image(20261013-125821).png';
const jobs = [
  ['fudge-brownies', sweet, 42, 346, 311, 225],
  ['chocolate-chip-cookies', sweet, 386, 346, 311, 225],
  ['chocolate-cheesecake-brownies', sweet, 729, 346, 311, 220],
  ['chocolate-eclairs', sweet, 42, 710, 311, 209],
  ['cream-puffs', sweet, 386, 710, 311, 209],
  ['profiteroles', sweet, 729, 710, 311, 209],
  ['chouquettes', sweet, 42, 1051, 311, 183],
  ['palmiers', sweet, 386, 1051, 311, 183],
  ['madeleines', sweet, 729, 1051, 311, 183],
  ['plain-scones', scones, 8, 462, 412, 483],
  ['chocolate-chip-scones', scones, 8, 991, 412, 391],
  ['official-logo', sweet, 38, 0, 287, 266],
];
const hashes = {};
for (const file of [sweet, scones]) hashes[file] = createHash('sha256').update(await readFile(sourceRoot + file)).digest('hex');
const browser = await chromium.launch({ channel: 'chrome' });
try {
  const page = await browser.newPage();
  await page.goto('about:blank');
  await mkdir('public/images/catalogue', { recursive: true });
  const result = [];
  for (const [name, source, x, y, width, height] of jobs) {
    const sourceData = `data:image/png;base64,${(await readFile(sourceRoot + source)).toString('base64')}`;
    const data = await page.evaluate(async ({ sourceData, x, y, width, height }) => {
      const img = new Image(); img.src = sourceData; await img.decode();
      const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
      canvas.getContext('2d').drawImage(img, x, y, width, height, 0, 0, width, height);
      return { data: canvas.toDataURL('image/webp', 0.88).split(',')[1], sourceWidth: img.naturalWidth, sourceHeight: img.naturalHeight };
    }, { sourceData, x, y, width, height });
    const bytes = Buffer.from(data.data, 'base64');
    await writeFile(`public/images/catalogue/${name}.webp`, bytes);
    result.push({ name, source, x, y, width, height, bytes: bytes.length, sourceWidth: data.sourceWidth, sourceHeight: data.sourceHeight });
  }
  for (const file of [sweet, scones]) if (createHash('sha256').update(await readFile(sourceRoot + file)).digest('hex') !== hashes[file]) throw new Error('Source changed');
  await writeFile('public/images/catalogue/EXTRACTION.json', JSON.stringify({ originalSHA256: hashes, crops: result }, null, 2));
  console.log(`Extracted ${result.length} native-resolution WebP crops; original hashes preserved.`);
} finally { await browser.close(); }
