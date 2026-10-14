import { test, expect } from '@playwright/test';
import { open } from './helpers.mjs';

test('page CTAs use existing workflows and general requests resume customer context', async({page})=>{
  await open(page,'/');
  await expect(page.locator('header').getByRole('link',{name:/Quote/})).toHaveCount(0);
  await expect(page.locator('.hero').getByRole('link',{name:'Explore Our Cakes',exact:true})).toHaveAttribute('href','/cakes');
  await expect(page.locator('.featured').getByRole('link',{name:'Enquire About This Cake',exact:true})).toHaveCount(6);
  await page.locator('.hero').getByRole('link',{name:'Request a Custom Quote',exact:true}).click();
  await expect(page).toHaveURL(/\/quote-request$/);
  await page.getByLabel('Full name',{exact:true}).fill('Returning Customer');
  await page.locator('header .site-logo').click();
  await page.locator('.final-cta').getByRole('link',{name:'Request a Quote',exact:true}).click();
  await expect(page.getByLabel('Full name',{exact:true})).toHaveValue('Returning Customer');
  await page.locator('header .site-logo').click();
  await page.getByRole('link',{name:'Plan Your Event',exact:true}).click();
  await expect(page.getByRole('combobox',{name:'Enquiry type',exact:true})).toHaveValue('Catering');
  await open(page,'/catering');
  for(const name of ['Discuss Your Event','Request a Catering Quote',"Let's Plan Your Celebration"]){
    await expect(page.getByRole('link',{name,exact:true})).toHaveAttribute('href','/contact?type=Catering');
  }
  await open(page,'/about');
  await expect(page.getByRole('heading',{name:'Inspired by Passion. Crafted for Your Celebration.'})).toBeVisible();
  await page.getByRole('link',{name:"Let's Create Something Special",exact:true}).click();
  await expect(page).toHaveURL(/\/quote-request$/);
  await open(page,'/cakes');
  await page.getByRole('link',{name:'Request a Custom Quote',exact:true}).click();
  await expect(page).toHaveURL(/\/quote-request$/);
  await open(page,'/contact');
  await expect(page.locator('.contact-estate-map iframe')).toHaveAttribute('src',/Thatchfield%20Crescent%20Estate/);
  await page.getByRole('link',{name:'Request a Cake Quote',exact:true}).click();
  await expect(page).toHaveURL(/\/quote-request$/);
});

test('cake detail and designer quotations retain photo, flavour, geometry and customer selections', async({page})=>{
  await open(page,'/cakes/cake-wa-0008');
  await page.getByRole('combobox',{name:'Flavour',exact:true}).selectOption('Chocolate Bar One');
  await page.getByLabel('Personalisation instructions',{exact:true}).fill('Keep this wording');
  await page.getByRole('button',{name:'Customise This Cake',exact:true}).click();
  await page.getByRole('button',{name:'Square',exact:true}).click();
  await page.getByRole('button',{name:'3 tiers',exact:true}).click();
  await page.getByRole('button',{name:'Request This Cake',exact:true}).first().click();
  await page.getByLabel('Full name',{exact:true}).fill('Design Customer');
  await page.evaluate(async()=>{ const url=performance.getEntriesByType('resource').find(r=>new URL(r.name).pathname==='/src/store/quotationDraftStore.ts').name;const {useQuotationDraftStore}=await import(url);useQuotationDraftStore.getState().setEvent({guests:'35'}); });
  await page.locator('header .site-logo').click();
  await page.locator('.featured .product-card').first().getByRole('link',{name:'Enquire About This Cake',exact:true}).click();
  await expect(page.getByLabel('Full name',{exact:true})).toHaveValue('Design Customer');
  const draft=await page.evaluate(async()=>{const url=performance.getEntriesByType('resource').find(r=>new URL(r.name).pathname==='/src/store/quotationDraftStore.ts').name;const {useQuotationDraftStore}=await import(url);return useQuotationDraftStore.getState().draft;});
  expect(draft.configuration.selectedProductId).toBe('cake-wa-0008');expect(draft.configuration.shape).toBe('Square');expect(draft.configuration.tiers).toBe(3);expect(draft.configuration.officialFlavour).toBe('Chocolate Bar One');expect(draft.configuration.personalisationInstructions).toBe('Keep this wording');expect(draft.event.guests).toBe('35');
  await expect(page.locator('.quote-design-card img')).toHaveAttribute('src',/0008/);
  await page.locator('header .site-logo').click();
  await page.locator('.featured .product-card').first().getByRole('heading').getByRole('link',{name:'Emerald Rose Celebration Cake',exact:true}).click();
  await expect(page.getByRole('combobox',{name:'Flavour',exact:true})).toHaveValue('Chocolate Bar One');
  await page.getByRole('button',{name:/Request a Quote for This Cake/}).click();
  await expect(page.getByLabel('Full name',{exact:true})).toHaveValue('Design Customer');
  await page.locator('header .site-logo').click();
  await page.reload();
  await page.locator('.hero').getByRole('link',{name:'Request a Custom Quote',exact:true}).click();
  const restored=await page.evaluate(async()=>{const url=performance.getEntriesByType('resource').find(r=>new URL(r.name).pathname==='/src/store/quotationDraftStore.ts').name;const {useQuotationDraftStore}=await import(url);return useQuotationDraftStore.getState().draft.configuration;});
  expect(restored.selectedProductId).toBe('cake-wa-0008');expect(restored.shape).toBe('Square');expect(restored.tiers).toBe(3);expect(restored.officialFlavour).toBe('Chocolate Bar One');
  await page.goto('/cake-designer?product=cake-wa-0008');
  await page.getByRole('button',{name:'Round',exact:true}).click();
  await page.getByRole('button',{name:'Request This Cake',exact:true}).first().click();
  const updated=await page.evaluate(async()=>{const url=performance.getEntriesByType('resource').find(r=>new URL(r.name).pathname==='/src/store/quotationDraftStore.ts').name;const {useQuotationDraftStore}=await import(url);return useQuotationDraftStore.getState().draft.configuration;});
  expect(updated.shape).toBe('Round');expect(updated.tiers).toBe(3);expect(updated.officialFlavour).toBe('Chocolate Bar One');
});
