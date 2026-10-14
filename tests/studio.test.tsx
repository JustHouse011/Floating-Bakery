import { test } from 'node:test';
import assert from 'node:assert/strict';
import { clientCakeProducts } from '../src/data/clientCakeCatalogue';
import { catalogueTemplate } from '../src/data/cakeTemplates';
import { defaultConfiguration } from '../src/data/designer';
import { defaultWorkspace } from '../src/services/adminRepository';
import { cakePricingStore } from '../src/store/cakePricingStore';
import { validateStudio, decorationAnchor, studioTierPositions, studioFromConfiguration } from '../src/services/studioDesign';
import { validateConfiguration, configurationForProduct } from '../src/services/cakeConfiguration';
import { calculateCakeEstimate } from '../src/services/pricingEngine';
import { cakeDesignerStore } from '../src/store/cakeDesignerStore';
import { saveDesign, restoreDesign, DESIGN_STORAGE_KEY } from '../src/services/designerStorage';
import { captureQuotationSnapshot } from '../src/services/quotationSnapshot';
import { quotationRequestPolicy } from '../src/data/quotation';
const cakePricingRules=defaultWorkspace().rules;
const productConfig=(id:string)=>configurationForProduct(id,cakePricingRules);
test('all 43 templates validate with 44 associated photographs and distinct starting structures',()=>{
 assert.equal(clientCakeProducts.length,43);assert.equal(clientCakeProducts.flatMap(p=>p.sourceImages||[]).length,44);
 for(const product of clientCakeProducts){const template=catalogueTemplate(product.id)!;assert.equal(template.templateId,product.id);assert.deepEqual(validateStudio(template),template);assert.ok(template.referenceOnly.length);}
 assert.equal(catalogueTemplate('cake-wa-0042')!.tiers.length,4);assert.equal(catalogueTemplate('cake-wa-0018')!.shape,'Square');assert.equal(catalogueTemplate('cake-wa-0020'),undefined);
});
test('invalid supports, offsets, colours and dangling decoration tiers are rejected',()=>{
 const s=catalogueTemplate('cake-wa-0035')!;
 assert.throws(()=>validateStudio({...s,tiers:s.tiers.map((t,i)=>i===1?{...t,width:3}:t)}));
 assert.throws(()=>validateStudio({...s,tiers:s.tiers.map((t,i)=>i===1?{...t,offset:.3}:t)}));
 assert.throws(()=>validateStudio({...s,decorations:[{...s.decorations[0],tier:4}]}));
 assert.throws(()=>validateStudio({...s,decorations:[s.decorations[0],s.decorations[0]]}));
 assert.throws(()=>validateStudio({...s,secondaryColour:'url(fake)'}));
 assert.throws(()=>validateStudio({...s,tiers:s.tiers.map((t,i)=>i===0?{...t,depth:1}:t)}));
 assert.throws(()=>validateStudio({...s,decorations:[{...s.decorations[0],region:'Top',tier:0}]}));
 assert.throws(()=>validateStudio({...s,decorations:Array.from({length:5},(_,i)=>({...s.decorations[0],id:`crowded-${i}`,tier:2,region:'Top'}))}));
});
test('attachment anchors track tier height, taper and offset for each supported region',()=>{
 const s=catalogueTemplate('cake-wa-0035')!;s.tiers[1].offset=.1;s.tiers[0].height=1.1;
 const t=studioTierPositions(s)[1];assert.equal(t.x,.1);assert.equal(t.bottom,1.92);
 for(const region of ['Top','Front','Left','Right'] as const){const a=decorationAnchor(s,{...s.decorations[0],tier:1,region});assert.ok(a.every(Number.isFinite));if(region==='Top')assert.ok(a[1]>t.bottom+t.height);else assert.equal(a[1],t.bottom+t.height/2);}
});
test('separated side attachments follow the tapered surface at their actual height',()=>{
 const s=catalogueTemplate('cake-wa-0008')!;s.tiers[0].taper=.1;s.decorations=Array.from({length:3},(_,i)=>({...s.decorations[0],id:`side-${i}`,region:'Front' as const}));validateStudio(s);
 for(const item of s.decorations){const [,y,z]=decorationAnchor(s,item),t=s.tiers[0];const surface=t.depth/2*(1-t.taper*(y-.82)/t.height);assert.ok(Math.abs(z-surface-.025)<1e-8);}
});
test('versions 1 and 2 restore unchanged; version 3 deeply round-trips complete studio data',()=>{
 const records=new Map<string,string>();const storage={getItem:(k:string)=>records.get(k)||null,setItem:(k:string,v:string)=>{records.set(k,v);}};
 for(const version of [1,2]){const c=defaultConfiguration();storage.setItem(DESIGN_STORAGE_KEY,JSON.stringify({version,configuration:c}));assert.deepEqual(restoreDesign(storage),c);}
 const c=productConfig('cake-wa-0042');saveDesign(c,storage);const restored=restoreDesign(storage);assert.deepEqual(restored,c);restored.studio!.tiers[0].colour='#111111';assert.notEqual(restoreDesign(storage).studio!.tiers[0].colour,'#111111');
});
test('undo, redo, template reset and duplicate retain original immutable configurations',()=>{
 cakePricingStore.getState().setRules(cakePricingRules);cakeDesignerStore.setState(cakeDesignerStore.getInitialState(),true);const store=()=>cakeDesignerStore.getState();store().selectProduct('cake-wa-0008');const original=structuredClone(store().configuration);const s=studioFromConfiguration(store().configuration);store().editStudio({...s,finish:'Quilted fondant'});store().undo();assert.deepEqual(store().configuration,original);store().redo();assert.equal(store().configuration.studio!.finish,'Quilted fondant');store().resetTemplate();assert.deepEqual(store().configuration,original);store().duplicateDesign();assert.equal(store().configuration.studio!.templateId,null);assert.equal(store().configuration.selectedProductId,original.selectedProductId);
});
test('advanced decoration changes preserve each official flavour range and single surcharge',()=>{
 const c=productConfig('cake-wa-0042');for(const flavour of ['Vanilla','Chocolate','Chocolate Bar One'] as const){c.officialFlavour=flavour;const before=calculateCakeEstimate(c,cakePricingRules);const after=calculateCakeEstimate({...c,studio:{...c.studio!,finish:'Metallic accents',decorations:[]}},cakePricingRules);assert.deepEqual(after,before);assert.equal(after.tierSurchargesCents,0);assert.equal(after.decorationSurchargesCents,0);assert.equal(after.minimumEstimateCents,148000+(flavour==='Vanilla'?0:flavour==='Chocolate'?18000:22000));}
});
test('quotation captures advanced positions and instructions without shared mutable references',()=>{
 const c=productConfig('cake-wa-0008');c.personalisationInstructions='Keep the emerald roses';const snapshot=captureQuotationSnapshot(c,cakePricingRules,[],quotationRequestPolicy);const original=JSON.stringify(snapshot);c.studio!.decorations[0].colour='#ffffff';assert.equal(JSON.stringify(snapshot),original);assert.ok(Object.isFrozen(snapshot.configuration.studio));assert.ok(snapshot.official!.image.includes('0008'));assert.equal(snapshot.configuration.studio!.decorations[0].region,'Top');assert.equal(snapshot.configuration.personalisationInstructions,'Keep the emerald roses');
 assert.equal(validateConfiguration(defaultConfiguration()).studio,undefined);
});
