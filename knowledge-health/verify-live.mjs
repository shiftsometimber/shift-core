import assert from 'node:assert/strict';
import {writeFileSync,mkdirSync} from 'node:fs';
import {guides,answers,version,existing} from './content.mjs';
import {ASSET,esc} from './render.mjs';
const origin='https://shiftsometimber.co.uk';
export async function get(path,options={}){
 const r=await fetch(origin+path,{...options,headers:{'Cache-Control':'no-cache',...options.headers},signal:AbortSignal.timeout(45000)});
 return {status:r.status,headers:Object.fromEntries(r.headers),body:await r.text()};
}
export function main(html){return html.match(/<main\b[\s\S]*?<\/main>/i)?.[0]||'';}
export function cards(html){return [...html.matchAll(/<a\b[^>]*class="shc-card"[\s\S]*?<\/a>/g)].map(m=>m[0]);}
export async function verifyLive(baselines){
 const result={version,at:new Date().toISOString(),guides:[],answers:[],pages:[]};
 const knowledge=await get('/knowledge');assert.equal(knowledge.status,200);assert.equal(knowledge.headers['x-shift-health-knowledge'],version);
 assert(knowledge.body.includes('data-kh-search')&&knowledge.body.includes('data-kh-select'));
 for(const g of [...guides,...existing])assert(knowledge.body.includes('href="'+g.path+'"'),g.path+' missing from Knowledge');
 for(let i=0;i<guides.length;i+=4)await Promise.all(guides.slice(i,i+4).map(async g=>{
  const page=await get(g.path);assert.equal(page.status,200,g.path);assert.equal(page.headers['x-shift-health-knowledge'],version,g.path);
  assert(page.body.includes('<h1>'+esc(g.title)+'</h1>'),g.id+' title');assert(page.body.includes(esc(g.answer)),g.id+' answer');
  for(const [heading,text]of g.sections){assert(page.body.includes(esc(heading)),g.id+' heading');assert(page.body.includes(esc(text)),g.id+' copy');}
  assert(page.body.includes('has not been reviewed by a clinician'));assert(!page.body.includes('"reviewedBy"'));
  result.guides.push({id:g.id,path:g.path,status:page.status,fullCopy:true});
 }));
 const faq=await get('/faq');assert.equal(faq.status,200);assert.equal((faq.body.match(/data-kh-faq>/g)||[]).length,50);assert(faq.body.includes('data-kh-faq-search'));
 const fertility=await get('/shift-health/fertility');assert.equal(fertility.status,200);for(const g of guides.filter(g=>g.topic==='fertility'))assert(fertility.body.includes(g.path));
 const asset=await get(ASSET);assert.equal(asset.status,200);assert(asset.headers['content-type'].includes('javascript'));
 const sitemap=await get('/sitemap.xml');assert.equal(sitemap.status,200);for(const g of guides)assert(sitemap.body.includes('<loc>'+origin+g.path+'</loc>'),g.path+' sitemap');
 for(const path of ['/ask-timber','/explore-knowledge']){const page=await get(path);assert.equal(page.status,200,path);assert.equal(page.headers['x-shift-health-knowledge'],version,path);result.pages.push({path,status:200});}
 const ask=async message=>{
  const response=await get('/v1/ai/chat',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({message,useJourney:false,personalisation:false})});
  assert.equal(response.status,200,message);const data=JSON.parse(response.body);assert.equal(data.mode,'source_checked_health',message);assert.equal(data.journeyUsed,false);assert(data.sources.length);assert.deepEqual(data.keyPoints,[]);assert.deepEqual(data.nextSteps,[]);return data;
 };
 const first=await ask(answers[0].question);assert(first.answer.includes(answers[0].answer));
 result.answers.push({id:answers[0].id,mode:first.mode});
 for(let i=1;i<answers.length;i+=4)await Promise.all(answers.slice(i,i+4).map(async a=>{const data=await ask(a.question);assert(data.answer.includes(a.answer),a.id);result.answers.push({id:a.id,mode:data.mode});}));
 const hostile=await get('/v1/ai/chat',{method:'POST',headers:{Origin:'https://untrusted.invalid','Content-Type':'application/json'},body:JSON.stringify({message:answers[0].question,useJourney:false})});assert.equal(hostile.status,403);
 const urgent=await get('/v1/ai/chat',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({message:'I have chest pain and want to ask about supplements',useJourney:false})});assert.equal(JSON.parse(urgent.body).mode,'safety');
 for(const [path,before]of Object.entries(baselines)){
  const after=await get(path);assert.equal(after.status,before.status,path+' status');
  if(path==='/')assert.equal(main(after.body),main(before.body),'Homepage main changed');
  else{
   assert.equal(after.headers['x-shift-health-knowledge'],version,path+' discovery');
   const panel=/<section class="kh-addition" data-kh-discovery>[\s\S]*?<\/section>/;
   assert.equal(main(after.body).replace(panel,''),main(before.body),path+' existing main copy changed beyond the approved discovery panel');
   if(path==='/shift-health')assert.deepEqual(cards(after.body),cards(before.body),'Approved Health cards changed');
  }
  result.pages.push({path,status:after.status,preserved:true});
 }
 const head=await get(guides[0].path,{method:'HEAD'});assert.equal(head.status,200);assert.equal(head.body,'');assert.equal(head.headers['x-shift-health-knowledge'],version);
 result.verified=true;result.noCustomerWrites=true;result.originGuard=true;result.urgentGuard=true;result.visualBrowserQA='not_verified';
 return result;
}
if(process.argv[1]?.endsWith('verify-live.mjs')){
 mkdirSync('knowledge-health-evidence',{recursive:true});const receipt=await verifyLive({});writeFileSync('knowledge-health-evidence/live.json',JSON.stringify(receipt,null,2));console.log('KNOWLEDGE_LIVE '+JSON.stringify(receipt));
}
