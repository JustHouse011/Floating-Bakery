import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { beginQuotation } from '../src/services/quotationNavigation';
import { useQuotationDraftStore } from '../src/store/quotationDraftStore';
import { useCakeDesignerStore } from '../src/store/cakeDesignerStore';
import { defaultConfiguration } from '../src/data/designer';

beforeEach(()=>{useQuotationDraftStore.getState().clear();useCakeDesignerStore.getState().restoreConfiguration(defaultConfiguration());});
test('general quote starts the current design and resumes an existing draft without loss',()=>{
  useCakeDesignerStore.getState().setMessage('Our celebration');beginQuotation();
  const draft=useQuotationDraftStore.getState();
  assert.equal(draft.draft?.configuration.message,'Our celebration');
  draft.setCustomer({fullName:'Existing Customer'});draft.setStep(2);
  const id=draft.draft?.id;beginQuotation();
  assert.equal(useQuotationDraftStore.getState().draft?.id,id);
  assert.equal(useQuotationDraftStore.getState().draft?.customer.fullName,'Existing Customer');
  assert.equal(useQuotationDraftStore.getState().step,2);
});
test('same design resumes; an explicit same-cake update keeps customer, occasion and references but renews consent',()=>{
  beginQuotation(defaultConfiguration());
  const store=useQuotationDraftStore.getState();store.setCustomer({fullName:'Retained'});store.setEvent({guests:'25'});store.setConsent(true);store.setStep(3);
  const reference={id:'reference',name:'image.png',type:'image/png' as const,size:3,blob:new Blob(['abc'])};store.setReferences([reference]);
  const before=useQuotationDraftStore.getState().draft!;
  beginQuotation(defaultConfiguration());assert.equal(useQuotationDraftStore.getState().draft?.id,before.id);
  beginQuotation({...defaultConfiguration(),message:'Updated wording'});
  const after=useQuotationDraftStore.getState().draft!;
  assert.notEqual(after.id,before.id);assert.equal(after.configuration.message,'Updated wording');
  assert.equal(after.customer.fullName,'Retained');assert.equal(after.event.guests,'25');assert.equal(after.references[0],reference);
  assert.equal(after.demoConsent,false);assert.equal(before.configuration.message,defaultConfiguration().message);
});
test('changing cake preserves customer and occasion without attaching another cake’s inspiration',()=>{
  beginQuotation(defaultConfiguration());const store=useQuotationDraftStore.getState();
  store.setCustomer({fullName:'Same Customer'});store.setEvent({guests:'40'});
  store.setReferences([{id:'old',name:'old.png',type:'image/png',size:3,blob:new Blob(['abc'])}]);
  beginQuotation({...defaultConfiguration(),selectedProductId:'cake-wa-0008'});
  const draft=useQuotationDraftStore.getState().draft!;
  assert.equal(draft.customer.fullName,'Same Customer');assert.equal(draft.event.guests,'40');
  assert.equal(draft.configuration.selectedProductId,'cake-wa-0008');assert.deepEqual(draft.references,[]);
});
