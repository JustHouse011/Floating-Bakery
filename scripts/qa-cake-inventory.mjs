import { chromium } from '@playwright/test';
import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const root = 'public/images/catalogue';
const files = (await readdir(root)).filter(n => /^IMG-20261013-WA\d+\.jpg$/i.test(n)).sort();
// Names and categories follow visual inspection, not inferred dimensions or ingredients.
const designs = {
  '0006': ['Red Rose Celebration Cake', 'Floral Cakes', ['Birthday Cakes'], 'A red rose, cream finish and red textured band with a personalised topper.'],
  '0007': ['Blush and Gold Birthday Cake', 'Birthday Cakes', ['Luxury Cakes'], 'A blush-and-white finish with gold accents and a birthday topper.'],
  '0008': ['Emerald Rose Celebration Cake', 'Floral Cakes', ['Luxury Cakes'], 'Green roses, leafy details and a sparkling emerald-toned accent on a white cake.'],
  '0009': ['Pink Makeup Celebration Cake', 'Birthday Cakes', ['Custom Celebration Cakes'], 'A pink quilted-look design with makeup-themed decorations and a bow.'],
  '0010': ['Orange Piped Birthday Cake', 'Birthday Cakes', [], 'Bright orange piping, a white lower band and pearl-like details.'],
  '0012': ['Peppa Pig Storybook Birthday Cake', "Kids' Cakes", ['Birthday Cakes'], 'A colourful storybook-themed panel with gold balloon-like decorations.'],
  '0013': ['Rainbow Peppa Pig Birthday Cake', "Kids' Cakes", ['Birthday Cakes'], 'A rainbow, little house and Peppa Pig characters on a blue-and-green design.'],
  '0014': ['Gold Sculpture Celebration Cake', 'Luxury Cakes', ['Custom Celebration Cakes'], 'A sculptural gold topper, geometric accents and black-and-white detailing.'],
  '0016': ['Graduation Books Celebration Cake', 'Graduation Cakes', ['Custom Celebration Cakes'], 'Book-shaped decorations, a graduation cap and personalised congratulatory details.'],
  '0017': ['Black Drip Eighteenth Birthday Cake', 'Birthday Cakes', ['Luxury Cakes'], 'A black-and-white drip design with gold number toppers and decorative treats.'],
  '0018': ['Berry and Gold Square Celebration Cake', 'Birthday Cakes', ['Custom Celebration Cakes'], 'A square white design with dark berry-like decorations and gold birthday lettering.'],
  '0019': ['Pink Hello Kitty Birthday Cake', "Kids' Cakes", ['Birthday Cakes'], 'Pink character panels, butterflies and a personalised number topper.'],
  '0021': ['Green Bow Celebration Cake', 'Custom Celebration Cakes', ['Luxury Cakes'], 'A white shirt-inspired design with green bow, ribbon details and a white flower.'],
  '0022': ['Marble and Gold Birthday Cake', 'Birthday Cakes', ['Luxury Cakes'], 'Grey marbled detailing, gold accents and personalised message panels.'],
  '0024': ['Ribbon and Pearls Birthday Cake', 'Birthday Cakes', ['Custom Celebration Cakes'], 'Cream piping, gold details and a black ribbon frame a playful birthday message.'],
  '0025': ['Pink Rose Birthday Cake', 'Floral Cakes', ['Birthday Cakes'], 'Pink roses and a gold birthday topper above a blush-and-white textured design.'],
  '0026': ['Jungle Friends Birthday Cake', "Kids' Cakes", ['Birthday Cakes'], 'Giraffe and animal decorations with green foliage and a personalised number.'],
  '0027': ['Teal Floral Congratulations Cake', 'Floral Cakes', ['Custom Celebration Cakes'], 'Pink roses, teal flowers and gold accents with a congratulations topper.'],
  '0028': ['Pastel Garden Celebration Cake', 'Floral Cakes', ['Custom Celebration Cakes'], 'Pastel pink and lilac flowers, leafy accents and a softly coloured finish.'],
  '0029': ['Pink Crown and Teddy Celebration Cake', "Kids' Cakes", ['Custom Celebration Cakes'], 'A pink crown and teddy decoration with bows, hearts and a personalised plaque.'],
  '0030': ['Blue Teddy First Birthday Cake', "Kids' Cakes", ['Birthday Cakes'], 'A pale blue design with teddy decoration, little gifts and first-birthday lettering.'],
  '0031': ['Blush Crown Birthday Cake', 'Birthday Cakes', ['Luxury Cakes'], 'A blush crown, pink bow, floral plaque and gold details.'],
  '0032': ['Bronze Rose Birthday Cake', 'Floral Cakes', ['Birthday Cakes'], 'A bronze-toned upper section, orange roses and a gold number topper.'],
  '0033': ['Mint and Pink Rose Celebration Cake', 'Floral Cakes', ['Custom Celebration Cakes'], 'A pale mint finish with pink roses, bow and personalised floral plaque.'],
  '0034': ['Black and Gold Birthday Cake', 'Luxury Cakes', ['Birthday Cakes'], 'Black-and-gold accents, folded fans and a personalised birthday number.'],
  '0035': ['Ivory Floral Celebration Cake', 'Floral Cakes', ['Luxury Cakes'], 'An ivory design with white flower clusters and green leafy details.'],
  '0036': ['Blue and Gold Birthday Cake', 'Birthday Cakes', ['Luxury Cakes'], 'Blue textured accents, gold detailing and balloon-like decorations.'],
  '0037': ['Pink Castle Celebration Cake', "Kids' Cakes", ['Custom Celebration Cakes'], 'A pink castle design with glittering turrets, crown and floral details.'],
  '0038': ['Pink Butterfly First Birthday Cake', "Kids' Cakes", ['Birthday Cakes'], 'A pink design with butterflies, teddy decoration and first-birthday lettering.'],
  '0039': ['Cupcake Gift First Birthday Cake', "Kids' Cakes", ['Birthday Cakes'], 'A large cupcake-shaped topper above a striped gift-inspired design.'],
  '0040': ['Blue and Purple Birthday Cake', "Kids' Cakes", ['Birthday Cakes'], 'A blue-to-purple finish, shimmering leaf-like toppers and a personalised number.'],
  '0041': ['Cowboy Toy Celebration Cake', "Kids' Cakes", ['Birthday Cakes'], 'Cow-print, stars and cowboy-inspired details on stacked colourful sections.'],
  '0042': ['Cascading Pink Rose Celebration Cake', 'Floral Cakes', ['Luxury Cakes'], 'A cascade of pink rose decorations over a pale pink celebration design.'],
  '0043': ['Black and Gold Gift Celebration Cake', 'Luxury Cakes', ['Birthday Cakes'], 'Black-and-gold gift-inspired decoration, a sculptural bow and birthday details.'],
  '0044': ['Silver Crown Birthday Cake', 'Luxury Cakes', ['Birthday Cakes'], 'A silver crown, pearl-like accents and silver birthday lettering on an ivory finish.'],
  '0045': ['Pastel Bouquet Birthday Cake', 'Floral Cakes', ['Birthday Cakes'], 'A bouquet-inspired design in peach and yellow with a matching bow.'],
  '0046': ['Hello Kitty Rainbow Birthday Cake', "Kids' Cakes", ['Birthday Cakes'], 'A pink Hello Kitty design with rainbow, butterflies and colourful lettering.'],
  '0047': ['Black Bow Celebration Cake', 'Custom Celebration Cakes', ['Luxury Cakes'], 'A black-and-white shirt-inspired design with bow, buttons and striped lower section.'],
  '0048': ['Gold and Pink Butterfly Birthday Cake', 'Birthday Cakes', ['Luxury Cakes'], 'White finish with pink butterflies, gold lettering and balloon-like accents.'],
  '0049': ['Pink Butterfly Celebration Cake', 'Birthday Cakes', ['Custom Celebration Cakes'], 'Pink swirled detailing, delicate butterflies and a gold birthday topper.'],
  '0050': ['Handbag Celebration Cake', 'Luxury Cakes', ['Birthday Cakes'], 'A patterned handbag-inspired topper with fashion-themed decorative details.'],
  '0051': ['Sage Floral Celebration Cake', 'Floral Cakes', ['Luxury Cakes'], 'A pale sage design with white flowers, dried-look foliage and gold accents.'],
  '0052': ['Teal and Gold Number Birthday Cake', 'Birthday Cakes', ['Luxury Cakes'], 'Teal textured accents, gold details and a large personalised number topper.'],
};
const crops = { '0017': { x: 0, y: 339, width: 738, height: 926 }, '0044': { x: 0, y: 144, width: 738, height: 1313 } };
await mkdir('qa/evidence/phase6', { recursive: true });
const browser = await chromium.launch({ channel: 'chrome' });
try {
  const page = await browser.newPage();
  // An image document supplies the same origin without the app's live HMR client.
  await page.goto('http://127.0.0.1:5173/images/catalogue/official-logo.webp');
  const entries = [];
  for (const file of files) {
    const bytes = await readFile(`${root}/${file}`);
    const info = await page.evaluate(async src => {
      const img = new Image(); img.src = src; await img.decode();
      return { width: img.naturalWidth, height: img.naturalHeight };
    }, `/images/catalogue/${file}`);
    entries.push({ file, ...info, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') });
  }
  await writeFile('qa/evidence/phase6/source-inventory.json', JSON.stringify(entries, null, 2));
  await mkdir('public/images/cakes/client', { recursive: true });
  const inventory = [];
  const products = [];
  for (const entry of entries) {
    const number = entry.file.match(/WA(\d+)/)[1];
    const coverNumber = number === '0020' ? '0014' : number;
    const [name, category, secondary, description] = designs[coverNumber];
    const slug = `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-$/, '')}-${coverNumber}`;
    const suffix = number === '0020' ? '-gallery-0020' : '';
    const stem = `/images/cakes/client/${slug}${suffix}`;
    const crop = crops[number] || { x: 0, y: 0, width: entry.width, height: entry.height };
    const derivatives = await page.evaluate(async ({ file, crop }) => {
      const img = new Image(); img.src = `/images/catalogue/${file}`; await img.decode();
      const make = width => {
        const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = Math.round(width * crop.height / crop.width);
        canvas.getContext('2d').drawImage(img, crop.x, crop.y, crop.width, crop.height, 0, 0, canvas.width, canvas.height);
        return { width: canvas.width, height: canvas.height, data: canvas.toDataURL('image/webp', .88).split(',')[1] };
      };
      return { detail: make(crop.width), thumbnail: make(Math.min(400, crop.width)) };
    }, { file: entry.file, crop });
    for (const [variant, value] of Object.entries(derivatives)) {
      const file = `${stem}-${variant === 'thumbnail' ? 'thumb' : 'detail'}.webp`;
      const bytes = Buffer.from(value.data, 'base64');
      await writeFile(`public${file}`, bytes);
      value.path = file; value.bytes = bytes.length; delete value.data;
    }
    inventory.push({ ...entry, originalPath: `/images/catalogue/${entry.file}`, productId: `cake-wa-${coverNumber}`, role: number === '0020' ? 'gallery' : 'cover', duplicateOf: null, visualDuplicateOf: number === '0020' ? 'IMG-20261013-WA0014.jpg' : null, decoded: true, crop, cropReason: number === '0017' ? 'Unambiguous gallery UI removed; complete photograph and bakery branding retained. Lower-right gallery visual-search icon is retained to avoid touching cake/background content.' : number === '0044' ? 'Unambiguous black letterboxing removed; complete cake and bakery branding retained.' : 'No crop; complete supplied photograph retained.', derivatives });
    if (number === '0020') continue;
    const featuredOrder = ['0008','0042','0013','0043','0016','0035'].indexOf(number);
    products.push({ id: `cake-wa-${number}`, name, slug, category, categories: [category, ...secondary], price: 1480, image: derivatives.detail.path, description, flavour: 'Vanilla', demo: false, kind: 'official-cake', availability: 'Enquiry', designerEligible: true, featured: featuredOrder >= 0, featuredOrder: featuredOrder >= 0 ? featuredOrder : 100, visible: true, dateAdded: '2026-10-13', gallery: [], sourceImages: [`/images/catalogue/${entry.file}`], availableFlavours: ['Vanilla','Chocolate','Marble (Chocolate & Vanilla)','Vanilla Caramel','Red Velvet','Vanilla Coconut','Lemon Poppyseed','Doughnut','Orange','Vanilla Cinnamon','Strawberry','Carrot','Lemon Poppyseed Blueberry','Chocolate Caramel','Chocolate Bar One'], pricingMode: 'official-range', reviewNotes: ['Descriptive catalogue name and categories require bakery approval; photograph does not establish dimensions, ingredients or servings.', ...(number === '0017' ? ['Cropped gallery screenshot; small lower-right visual-search overlay retained.'] : []), ...(number === '0014' ? ['WA0014 and WA0020 show the same design and are grouped; both original sources retained.'] : [])], responsiveImages: { thumbnail: derivatives.thumbnail.path, detail: derivatives.detail.path, srcSet: `${derivatives.thumbnail.path} ${derivatives.thumbnail.width}w, ${derivatives.detail.path} ${derivatives.detail.width}w` } });
  }
  const gallery = inventory.find(e=>e.file.endsWith('WA0020.jpg'));
  const grouped = products.find(p=>p.id==='cake-wa-0014');
  grouped.gallery.push(gallery.derivatives.detail.path); grouped.sourceImages.push(gallery.originalPath);
  const summary = { supportedDirectoryFiles: (await readdir(root)).filter(n=>/\.(jpe?g|png|webp|avif|gif)$/i.test(n)).length, cakeSourceCount: entries.length, existingNonCakeAssets: 12, uniqueHashes: new Set(entries.map(e=>e.sha256)).size, exactDuplicateCount: 0, visuallyGroupedSourceCount: 2, productCount: products.length, originalBytes: entries.reduce((n,e)=>n+e.bytes,0), detailBytes: inventory.reduce((n,e)=>n+e.derivatives.detail.bytes,0), thumbnailBytes: inventory.reduce((n,e)=>n+e.derivatives.thumbnail.bytes,0), cropCount: Object.keys(crops).length, corruptCount: 0, items: inventory };
  await writeFile(`${root}/CAKE_IMAGE_INVENTORY.json`, JSON.stringify(summary, null, 2)+'\n');
  await writeFile('src/data/clientCakeCatalogue.ts', `import type { Product } from '../types';\n\n// Client-supplied photographs; reproducible inventory: scripts/qa-cake-inventory.mjs.\nexport const clientCakeProducts: Product[] = ${JSON.stringify(products, null, 2)};\n\nexport const cakeImageInventory = ${JSON.stringify(summary, null, 2)} as const;\n`);
  for (const item of inventory) {
    const original = await readFile(`${root}/${item.file}`);
    if (createHash('sha256').update(original).digest('hex') !== item.sha256) throw new Error(`Original changed: ${item.file}`);
    for (const derivative of Object.values(item.derivatives)) {
      const dimensions = await page.evaluate(async src => {
        const img = new Image(); img.src = src; await img.decode();
        return [img.naturalWidth, img.naturalHeight];
      }, derivative.path);
      if (dimensions[0] !== derivative.width || dimensions[1] !== derivative.height) throw new Error(`Invalid derivative: ${derivative.path}`);
    }
    const product = products.find(p=>p.id===item.productId);
    if (!product?.sourceImages.includes(item.originalPath)) throw new Error(`Unrepresented source: ${item.file}`);
    if (item.role === 'gallery' && !product.gallery.includes(item.derivatives.detail.path)) throw new Error(`Missing gallery: ${item.file}`);
  }
  if (new Set(products.map(p=>p.id)).size !== products.length) throw new Error('Duplicate product IDs');
  if (inventory.length !== 44 || products.length !== 43) throw new Error('Unexpected catalogue totals');
  console.log('Verified 44 original hashes, 88 decoded WebP derivatives, 43 unique product IDs and complete source/gallery coverage.');
  console.log(JSON.stringify({ products: products.length, originalBytes: summary.originalBytes, detailBytes: summary.detailBytes, thumbnailBytes: summary.thumbnailBytes, crops: summary.cropCount }));
  for (let start = 0; start < entries.length; start += 12) {
    const data = await page.evaluate(async rows => {
      const canvas = document.createElement('canvas'); canvas.width = 1440; canvas.height = 1560;
      const ctx = canvas.getContext('2d'); ctx.fillStyle = '#ddd'; ctx.fillRect(0, 0, 1440, 1560);
      for (let i = 0; i < rows.length; i++) {
        const img = new Image(); img.src = `/images/catalogue/${rows[i].file}`; await img.decode();
        const x = (i % 4) * 360, y = Math.floor(i / 4) * 520;
        const scale = Math.min(350 / img.naturalWidth, 480 / img.naturalHeight);
        const w = img.naturalWidth * scale, h = img.naturalHeight * scale;
        ctx.drawImage(img, x + (360-w)/2, y + 24, w, h);
        ctx.fillStyle = '#111'; ctx.font = '18px Arial'; ctx.fillText(rows[i].file, x + 8, y + 20);
      }
      return canvas.toDataURL('image/jpeg', .9).split(',')[1];
    }, entries.slice(start, start + 12));
    await writeFile(`qa/evidence/phase6/contact-${start}.jpg`, Buffer.from(data, 'base64'));
  }
  console.log(JSON.stringify({ sources: entries.length, bytes: entries.reduce((n,e)=>n+e.bytes,0), uniqueHashes: new Set(entries.map(e=>e.sha256)).size }));
} finally { await browser.close(); }
