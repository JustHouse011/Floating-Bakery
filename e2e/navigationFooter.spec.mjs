import { test, expect } from '@playwright/test';
import axe from 'axe-core';
import { open, capture } from './helpers.mjs';

test('centred bakery logo, split navigation, no reviews and premium footer', async ({page}, info) => {
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  page.on('console',message=>{if(message.type()==='error')errors.push(message.text());});
  await open(page,'/');
  await expect(page.getByText(/testimonials/i)).toHaveCount(0);
  const logo=page.locator('header .site-logo');
  await expect(logo).toHaveAttribute('href','/');
  await expect(logo.locator('img')).toHaveAttribute('src','/images/catalogue/official-logo.webp');
  await expect.poll(()=>logo.locator('img').evaluate(img=>img.complete&&img.naturalWidth>0)).toBe(true);
  const box=await logo.boundingBox();
  expect(Math.abs(box.x+box.width/2-info.project.use.viewport.width/2)).toBeLessThanOrEqual(1);
  const nav=page.getByRole('navigation',{name:'Main navigation'});
  const names=['Home','About','Catalogue','Catering','Cake Designer','Contact'];
  if(info.project.use.viewport.width<=950){
    const menu=page.getByRole('button',{name:'Open navigation',exact:true});
    expect((await menu.boundingBox()).x).toBeLessThan(box.x);
    await menu.click();
    await expect(nav.getByRole('link',{name:'Home',exact:true})).toBeFocused();
    await expect(page.locator('body')).toHaveCSS('overflow','hidden');
    await page.keyboard.press('Shift+Tab');
    await expect(nav.getByRole('link',{name:'Contact',exact:true})).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(menu).toBeFocused();
    await expect(page.locator('body')).not.toHaveCSS('overflow','hidden');
    await menu.click();
    await logo.click();
    await expect(page.locator('body')).not.toHaveCSS('overflow','hidden');
    await menu.click();
  }else{
    const left=await page.locator('.site-nav-left').boundingBox();const right=await page.locator('.site-nav-right').boundingBox();
    expect(left.x+left.width).toBeLessThan(box.x);
    expect(right.x).toBeGreaterThan(box.x+box.width);
    expect(box.x-(left.x+left.width)).toBeGreaterThanOrEqual(39);
    expect(box.x-(left.x+left.width)).toBeLessThanOrEqual(66);
    expect(right.x-(box.x+box.width)).toBeGreaterThanOrEqual(39);
    expect(right.x-(box.x+box.width)).toBeLessThanOrEqual(66);
    expect(await page.locator('.site-nav-left a').allTextContents()).toEqual(names.slice(0,3));
    expect((await page.locator('.site-nav-right a').allTextContents()).map(text=>text.trim())).toEqual(names.slice(3));
  }
  for(const name of names) await expect(nav.getByRole('link',{name,exact:true})).toBeVisible();
  await expect(nav.getByRole('link',{name:/Quote/})).toHaveCount(0);
  await nav.getByRole('link',{name:'Contact',exact:true}).click();
  await expect(page).toHaveURL(/\/contact$/);
  await logo.click();await expect(page).toHaveURL(/\/$/);
  const footer=page.locator('.site-footer');
  expect(await footer.evaluate(el=>getComputedStyle(el).backgroundColor)).toBe('rgb(255, 255, 255)');
  await expect(footer.getByText('Thatchfield Crescent Estate',{exact:false})).toBeVisible();
  await expect(footer.locator('a[href^="tel:"]')).toHaveAttribute('href','tel:+27731268382');
  await expect(footer.locator('a[href^="mailto:"]')).toHaveAttribute('href','mailto:guguminnaar@gmail.com');
  const credit=footer.getByRole('link',{name:'Designed and Developed by Bongani Nombamba',exact:true});
  await expect(credit).toHaveAttribute('href','https://www.locate.africa');
  await expect(credit).toHaveAttribute('target','_blank');
  await expect(credit).toHaveAttribute('rel','noopener noreferrer');
  await expect(footer.locator('input')).toHaveCount(0);
  expect(await footer.locator('.footer-links a').evaluateAll(links=>links.map(a=>a.getAttribute('href')))).toEqual(['/','/about','/cakes','/catering','/cake-designer','/contact']);
  for(const [name,path] of [['About Us','/about'],['Catalogue','/cakes'],['Catering','/catering'],['Cake Designer','/cake-designer'],['Contact Us','/contact']]){
    await footer.getByRole('link',{name,exact:true}).click();
    await expect(page).toHaveURL(new RegExp(`${path}$`));
    await expect(page.locator('main h1').first()).toBeVisible();
    await expect(page.getByText(/testimonials/i)).toHaveCount(0);
  }
  await page.addScriptTag({content:axe.source});
  expect(await page.evaluate(async()=>(await window.axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa']}})).violations.map(v=>v.id))).toEqual([]);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  await capture(page,`${info.project.name}-phase8b-contact-footer`);
  await open(page,'/testimonials');
  await expect(page.getByRole('heading',{name:'A little detour.'})).toBeVisible();
  await page.locator('header .site-logo').click();
  await expect(page).toHaveURL(/\/$/);
  expect(errors).toEqual([]);
});
