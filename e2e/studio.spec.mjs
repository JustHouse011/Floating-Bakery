import {test,expect} from '@playwright/test';
import axe from 'axe-core';
import {open,gpuState,dbQuotes,capture} from './helpers.mjs';
async function studioState(page,action='read',argument) {
 return page.evaluate(async({action,argument})=>{const url=performance.getEntriesByType('resource').find(r=>new URL(r.name).pathname==='/src/store/cakeDesignerStore.ts')?.name;const {cakeDesignerStore}=await import(url);const s=cakeDesignerStore.getState();if(action==='select')s.selectProduct(argument);if(action==='edit')s.editStudio(argument);return JSON.parse(JSON.stringify(cakeDesignerStore.getState().configuration));},{action,argument});
}
test('structure controls constrain supports and raycast selection opens the placement editor',async({page})=>{
 await open(page,'/cake-designer?product=cake-wa-0008');await page.locator('canvas').waitFor();
 await page.getByText('Advanced tier proportions & board',{exact:true}).click();
 await page.getByLabel('Board finish',{exact:true}).selectOption('Gold');expect((await studioState(page)).studio.board.colour).toBe('#c6a044');
 await expect.poll(async()=>page.evaluate(async()=>{const url=performance.getEntriesByType('resource').find(r=>r.name.includes('/@react-three_fiber.js'))?.name;if(!url)return null;const f=await import(url);const scene=f._roots.get(document.querySelector('canvas'))?.store.getState().scene;const board=scene?.getObjectByName('advanced-studio-cake')?.children.find(m=>m.isMesh&&m.position.y===.785);return board?.material.color.getHexString();})).toBe('c6a044');
 await page.getByLabel('Board finish',{exact:true}).selectOption('Silver');expect((await studioState(page)).studio.board.colour).toBe('#c0c0c0');
 await page.getByLabel('Studio tier count',{exact:true}).selectOption('4');expect((await studioState(page)).studio.tiers).toHaveLength(4);
 await page.getByLabel('Studio shape',{exact:true}).selectOption('Rectangular');
 const before=await studioState(page);await page.getByLabel('Tier 2 width',{exact:true}).fill('3');await expect(page.getByRole('alert').filter({hasText:'Upper tiers must fit'})).toBeVisible();expect((await studioState(page)).studio.tiers[1].width).toBe(before.studio.tiers[1].width);
 await page.getByLabel('Tier 4 height',{exact:true}).fill('1.1');expect((await studioState(page)).studio.tiers[3].height).toBe(1.1);
 const c=await studioState(page);const item={id:'raycast-plaque',kind:'Plaque',tier:0,region:'Front',scale:.8,rotation:0,colour:'#63323d',density:1,text:'Thando'};
 await studioState(page,'edit',{...c.studio,decorations:[item]});await page.getByRole('button',{name:'Front view',exact:true}).click();await page.locator('.canvas-frame canvas').scrollIntoViewIfNeeded();
 const point=await page.evaluate(async()=>{const url=performance.getEntriesByType('resource').find(r=>r.name.includes('/@react-three_fiber.js')).name;const f=await import(url);const {scene,camera,gl}=f._roots.get(document.querySelector('canvas')).store.getState();scene.updateMatrixWorld(true);const group=scene.getObjectByName('decoration-raycast-plaque');let label;group.traverse(mesh=>{if(mesh.isMesh&&mesh.geometry.type==='PlaneGeometry')label=mesh;});const p=label.position.clone();label.getWorldPosition(p);p.project(camera);const rect=gl.domElement.getBoundingClientRect();return {x:rect.x+(p.x+1)*rect.width/2,y:rect.y+(1-p.y)*rect.height/2};});
 await page.mouse.click(point.x,point.y);await expect(page.getByRole('group',{name:'Selected Plaque',exact:true})).toBeVisible();
 await page.getByLabel('Attachment region',{exact:true}).selectOption('Left');await page.getByRole('slider',{name:'Decoration scale',exact:true}).focus();await page.keyboard.press('ArrowRight');expect((await studioState(page)).studio.decorations[0].scale).toBeGreaterThan(.8);
 await page.getByRole('button',{name:'Duplicate selected decoration',exact:true}).click();expect((await studioState(page)).studio.decorations).toHaveLength(2);await page.getByRole('button',{name:'Remove Plaque',exact:true}).last().click();expect((await studioState(page)).studio.decorations).toHaveLength(1);await page.getByRole('button',{name:'Undo',exact:true}).click();expect((await studioState(page)).studio.decorations).toHaveLength(2);
});
test('43 photo-driven templates render; finishes visibly change pixels and attachments stay valid',async({page},info)=>{
 test.setTimeout(240000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await open(page,'/cake-designer?product=cake-wa-0008');await page.locator('canvas').waitFor();await expect.poll(async()=>(await gpuState(page)).calls).toBeGreaterThan(0);
 const {clientCakeProducts}=await import('../.tools/studio/clientCakeCatalogue.cjs');
 for(const product of clientCakeProducts){const c=await studioState(page,'select',product.id);expect(c.studio.templateId).toBe(product.id);await expect(page.locator('.studio-reference img')).toHaveAttribute('alt',product.name);expect((await gpuState(page)).calls).toBeGreaterThan(0);}
 await studioState(page,'select','cake-wa-0008');
 const pixels=[];
 for(const finish of ['Smooth buttercream','Vertical ridges','Quilted fondant','Ombré','Marble','Watercolour','Ruffled']){const c=await studioState(page);await studioState(page,'edit',{...c.studio,finish});await page.waitForTimeout(200);pixels.push((await page.locator('.canvas-frame').screenshot()).toString('base64'));expect((await gpuState(page)).calls).toBeGreaterThan(0);}
 expect(new Set(pixels).size).toBe(pixels.length);
 const c=await studioState(page);const d={...c.studio.decorations[0],region:'Right',scale:.7,rotation:40};await studioState(page,'edit',{...c.studio,decorations:[d]});
 const attachment=await page.evaluate(async(id)=>{const url=performance.getEntriesByType('resource').find(r=>r.name.includes('/@react-three_fiber.js')).name;const f=await import(url);const {scene}=f._roots.get(document.querySelector('canvas')).store.getState();const g=scene.getObjectByName(`decoration-${id}`);return g.position.toArray();},d.id);
 expect(attachment[0]).toBeGreaterThan(c.studio.tiers[0].width/2);expect(attachment[1]).toBeCloseTo(.82+c.studio.tiers[0].height/2);
 await capture(page,`${info.project.name}-advanced-studio`);expect(errors).toEqual([]);
});
test('placement controls, undo/redo, saved designs, comparison and mobile disclosures work',async({page},info)=>{
 await open(page,'/cake-designer?product=cake-wa-0008');await page.locator('canvas').waitFor();
 await page.getByRole('button',{name:'Add Rose cluster',exact:true}).click();
 await page.getByLabel('Attachment region', {exact:true}).selectOption('Left');
 await page.getByLabel('Decoration text',{exact:true}).count();
 const edited=await studioState(page);expect(edited.studio.decorations.at(-1).region).toBe('Left');
 await page.getByRole('button',{name:'Undo',exact:true}).click();expect((await studioState(page)).studio.decorations.at(-1).region).toBe('Top');
 await page.getByRole('button',{name:'Redo',exact:true}).click();expect((await studioState(page)).studio.decorations.at(-1).region).toBe('Left');
 await page.getByLabel('Recipient name',{exact:true}).fill('Thando');await page.getByLabel('Age / anniversary number').fill('30');
 await page.getByRole('button',{name:'Original Design | Your Customisation',exact:true}).click();await expect(page.locator('.studio-original-reference img')).toBeVisible();
 await page.getByRole('button',{name:'Front view',exact:true}).click();await expect.poll(async()=>(await gpuState(page)).camera[0]).toBeCloseTo(0);
 await page.getByRole('button',{name:'Side view',exact:true}).click();expect((await gpuState(page)).camera[0]).toBeGreaterThan(0);
 await page.getByRole('button',{name:'Top view',exact:true}).click();
 await page.locator('.studio-tools > summary').evaluate(e=>e.parentElement.open=true);await page.getByRole('button',{name:'Save design',exact:true}).click();
 const saved=await studioState(page);await page.reload();await expect.poll(async()=>JSON.stringify((await studioState(page)).studio)).toBe(JSON.stringify(saved.studio));
 await page.getByRole('button',{name:'Reset to original template',exact:true}).click();expect((await studioState(page)).studio.personalisation.name).toBe('');
 await page.getByRole('button',{name:'Undo',exact:true}).click();expect((await studioState(page)).studio.personalisation.name).toBe('Thando');
 if(info.project.name.includes('mobile')){await page.locator('.tools-drawer>summary').click();await expect(page.locator('.studio-controls')).not.toBeVisible();await page.locator('.tools-drawer>summary').click();await expect(page.locator('.studio-controls')).toBeVisible();await page.getByRole('button',{name:'Open design tools drawer',exact:true}).click();await expect(page.getByRole('dialog',{name:'Design tools drawer',exact:true})).toBeVisible();await page.keyboard.press('Escape');await expect(page.getByRole('dialog',{name:'Design tools drawer',exact:true})).not.toBeVisible();await expect(page.getByRole('button',{name:'Open design tools drawer',exact:true})).toBeFocused();}
 const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);expect(overflow).toBe(false);
 await page.evaluate(axe.source);const a11y=await page.evaluate(()=>axe.run(document.querySelector('main'),{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}}));expect(a11y.violations).toEqual([]);
});
test('advanced quote snapshots and admin inspection retain the original photograph and fixed flavour range',async({page},info)=>{
 test.setTimeout(180000);await open(page,'/cake-designer?product=cake-wa-0042');
 await page.getByRole('combobox',{name:'Flavour',exact:true}).selectOption('Chocolate Bar One');await page.getByLabel('Recipient name',{exact:true}).fill('Lerato');await page.getByLabel('Special design instructions',{exact:true}).fill('Please confirm four-tier support');
 await page.getByRole('button',{name:'Request This Cake',exact:true}).first().click();await page.getByLabel('Full name',{exact:true}).fill('Studio Customer');await page.getByLabel('Email address',{exact:true}).fill('studio@example.com');await page.getByLabel('South African contact number').fill('0821234567');await page.getByRole('button',{name:'Continue',exact:true}).click();await page.getByLabel('Event date',{exact:true}).fill('2026-12-20');await page.getByLabel(/guests/i).fill('50');await page.getByRole('button',{name:'Continue',exact:true}).click();await page.getByRole('button',{name:'Continue',exact:true}).click();await page.getByRole('checkbox',{name:/understand|saved locally|demonstration/i}).check();await page.getByRole('button',{name:'Save Demo Request',exact:true}).click();await expect(page).toHaveURL(/\/quotations\//);
 const [quote]=await dbQuotes(page);expect(quote.snapshot.configuration.studio.tiers).toHaveLength(4);expect(quote.snapshot.configuration.studio.personalisation.name).toBe('Lerato');expect(quote.snapshot.official.minimumEstimateCents).toBe(170000);expect(quote.snapshot.official.maximumEstimateCents).toBe(217000);expect(quote.snapshot.official.image).toContain('0042');const original=JSON.stringify(quote.snapshot);
 await open(page,`/admin/quotations/${quote.id}`);await expect(page.getByText('Please confirm four-tier support',{exact:true})).toBeVisible();await page.getByRole('button',{name:'Inspect saved 3D design',exact:true}).click();await expect(page.locator('canvas')).toBeVisible();await expect.poll(async()=>(await gpuState(page)).calls).toBeGreaterThan(0);await capture(page,`${info.project.name}-advanced-studio-admin`);expect(JSON.stringify((await dbQuotes(page))[0].snapshot)).toBe(original);
});
