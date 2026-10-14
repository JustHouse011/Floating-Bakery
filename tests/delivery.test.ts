import {test,beforeEach} from 'node:test';
import assert from 'node:assert/strict';
import type {ServerResponse} from 'node:http';
import {createHandler,challenge,validChallenge,prepareEmail,references,type ApiRequest} from '../server/delivery';
import {defaultConfiguration} from '../src/data/designer';
import {publicProducts} from '../src/data/publicCatalogue';
import {pageMetadata} from '../src/services/pageMetadata';
let serial=0;
beforeEach(()=>{Object.assign(process.env,{ENQUIRY_ENABLED:'true',NODE_ENV:'production',APP_ORIGIN:'https://bakery.test',RESEND_API_KEY:`test-${++serial}`,RESEND_FROM:'enquiries@bakery.test',RESEND_DOMAIN_ID:'verified-domain',ENQUIRY_SECURITY_SECRET:'test-secret-at-least-thirty-two-characters',UPSTASH_REDIS_REST_URL:'https://redis.test',UPSTASH_REDIS_REST_TOKEN:'test-only'});});
const contact={name:'QA Customer',email:'customer@example.test',telephone:'073 126 8382',type:'General enquiry',message:'A celebration enquiry',consent:true};
const customer={fullName:'QA Customer',email:'customer@example.test',contactNumber:'0731268382',preferredContactMethod:'Email'};
const event={eventType:'Birthday',eventDate:'2099-12-12',fulfilment:'Collection',deliveryArea:'',guests:'20',specialInstructions:'Please review the flowers.'};
function fakeService(options:{verified?:boolean;emailFailure?:boolean;count?:number;lockBusy?:boolean;redisFailure?:boolean}={}){
 const entries=new Map<string,string>(),sent:Record<string,unknown>[]=[];let count=options.count||0;
 const fetcher=(async(input:unknown,init?:RequestInit)=>{
  const url=String(input);if(url.includes('/domains/'))return Response.json({name:'bakery.test',status:options.verified===false?'pending':'verified'});
  if(url.endsWith('/emails')){sent.push(JSON.parse(String(init?.body)));return Response.json(options.emailFailure?{error:'rejected'}:{id:'accepted-provider-id'},{status:options.emailFailure?422:200});}
  if(options.redisFailure)throw Error('Redis unavailable');
  const [command,key,value,...args]=JSON.parse(String(init?.body));let result:unknown=null;
  if(command==='PING')result='PONG';if(command==='GET')result=entries.get(key)||null;
  if(command==='EVAL')result=++count;
  if(command==='SET'){if(args.includes('NX')&&(entries.has(key)||options.lockBusy))result=null;else{entries.set(key,value);result='OK';}}
  if(command==='DEL'){result=entries.delete(key)?1:0;}
  return Response.json({result});
 }) as typeof fetch;return {fetcher,sent,entries};
}
async function invoke(kind:Parameters<typeof createHandler>[0],fetcher:typeof fetch,body?:unknown,headers:Record<string,string>={}){
 let result={status:0,body:{} as Record<string,unknown>};
 const req={method:kind==='status'?'GET':'POST',headers:{origin:'https://bakery.test','content-type':'application/json',...headers},socket:{remoteAddress:'127.0.0.1'},body} as unknown as ApiRequest;
 const res={statusCode:0,setHeader(){},end(text:string){result={status:res.statusCode,body:JSON.parse(text)};}} as unknown as ServerResponse;
 await createHandler(kind,fetcher)(req,res);return result;
}
function envelope(data:unknown=contact,id='aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa'){return {data,submissionId:id,website:'',challenge:challenge(Date.now()-3000)};}
test('missing credentials and unverified sender keep status disabled and reject submissions',async()=>{const service=fakeService();delete process.env.RESEND_API_KEY;assert.equal((await invoke('status',service.fetcher)).body.enabled,false);assert.equal((await invoke('contact',service.fetcher,envelope())).status,503);assert.equal(service.sent.length,0);process.env.RESEND_API_KEY='test';const pending=fakeService({verified:false});assert.equal((await invoke('status',pending.fetcher)).body.enabled,false);});
test('rate service outage makes submission status unavailable',async()=>{assert.equal((await invoke('status',fakeService({redisFailure:true}).fetcher)).body.enabled,false);});
test('verified configured service returns a signed challenge',async()=>{const r=await invoke('status',fakeService().fetcher);assert.equal(r.body.enabled,true);assert.equal(typeof r.body.challenge,'string');assert.equal(validChallenge(challenge(Date.now()-3000)),true);assert.equal(validChallenge(challenge()),false);assert.equal(validChallenge(challenge(Date.now()-3*60*60*1000)),false);assert.equal(validChallenge('forged'),false);});
test('acceptance uses fixed recipient and duplicate requests send once',async()=>{const s=fakeService(),body=envelope({...contact,to:'attacker@example.test'});const first=await invoke('contact',s.fetcher,body);assert.equal(first.body.accepted,true);assert.equal(first.status,200);assert.deepEqual(s.sent[0].to,['guguminnaar@gmail.com']);assert.equal(s.sent[0].from,'enquiries@bakery.test');assert.equal(s.sent[0].reply_to,contact.email);assert.equal((await invoke('contact',s.fetcher,body)).body.reference,first.body.reference);assert.equal(s.sent.length,1);assert.equal((await invoke('contact',s.fetcher,{...body,data:{...contact,message:'Changed'}})).status,409);});
test('provider rejection has no receipt and leaves idempotency lock clear',async()=>{const s=fakeService({emailFailure:true}),r=await invoke('contact',s.fetcher,envelope());assert.equal(r.status,502);assert.equal(r.body.accepted,undefined);assert.equal(s.entries.size,0);});
test('rate limit and busy lock never send email',async()=>{for(const options of [{count:5},{lockBusy:true}]){const s=fakeService(options),r=await invoke('contact',s.fetcher,envelope());assert.equal(r.status,options.count?429:409);assert.equal(s.sent.length,0);}});
test('foreign origins, honeypot, malformed challenge and oversized body are rejected',async()=>{const s=fakeService();assert.equal((await invoke('contact',s.fetcher,envelope(),{origin:'https://attacker.test'})).status,403);for(const body of [{...envelope(),website:'spam'},{...envelope(),challenge:'forged'},{...envelope(),data:{...contact,message:'x'.repeat(4*1024*1024)}}]){assert.notEqual((await invoke('contact',s.fetcher,body)).status,200);}assert.equal(s.sent.length,0);});
test('server validation rejects absent consent and invalid emails',async()=>{await assert.rejects(prepareEmail('contact',{...contact,consent:false}));await assert.rejects(prepareEmail('contact',{...contact,email:'a@example.test\r\nBcc:other@test'}));await assert.rejects(prepareEmail('quotation',{customer,event,configuration:defaultConfiguration(),consent:false}));});
test('official cake quote recomputes approved range and attaches trusted design photograph',async()=>{const config={...defaultConfiguration(),selectedProductId:'cake-wa-0008',officialFlavour:'Chocolate' as const};const prepared=await prepareEmail('quotation',{customer,event,configuration:config,consent:true,estimate:1,references:[]});assert.match(prepared.text,/Estimated range:/);assert.match(prepared.text,/selected flavour surcharge applied once/);assert.ok(prepared.attachments.find(a=>a.filename==='original-cake-reference.webp'));const design=JSON.parse(Buffer.from(prepared.attachments.find(a=>a.filename==='cake-design.json')!.content,'base64').toString());assert.notEqual(design.estimate.minimumCents,1);assert.equal(design.configuration.selectedProductId,config.selectedProductId);});
test('bespoke quote includes advanced configuration and no invented price',async()=>{const p=await prepareEmail('quotation',{customer,event,configuration:defaultConfiguration(),consent:true});assert.match(p.text,/no approved amount/);assert.equal(p.attachments.length,1);});
test('product quantities use official menu prices and unsupported quantities fail',async()=>{const p=await prepareEmail('product',{customer,event,consent:true,productId:'plain-scones',pieces:5,price:1});assert.match(p.text,/300/);await assert.rejects(prepareEmail('product',{customer,event,consent:true,productId:'plain-scones',pieces:6}));});
test('reference attachments reject SVG, unsupported magic and oversized photographs',()=>{for(const content of [Buffer.from('<svg/>').toString('base64'),Buffer.from('GIF89a').toString('base64'),Buffer.alloc(513*1024).toString('base64')])assert.throws(()=>references([{content}]));assert.throws(()=>references(Array(4).fill({content:''})));});
test('all official products survive and preview metadata has no canonical',()=>{assert.equal(publicProducts.filter(p=>p.kind==='official-cake').length,43);const preview=pageMetadata('/cakes/cake-wa-0008');assert.equal(preview.canonical,'');assert.match(preview.robots,/noindex/);const live=pageMetadata('/cakes/cake-wa-0008','https://confirmed.test');assert.equal(live.canonical,'https://confirmed.test/cakes/cake-wa-0008');assert.notEqual(live.title,pageMetadata('/about').title);assert.equal(pageMetadata('/admin','https://confirmed.test').canonical,'');});
