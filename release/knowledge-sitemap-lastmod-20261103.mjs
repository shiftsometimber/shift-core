import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {approvedTickerModule,APPROVED_TICKER_PATHS} from './approved-shared-ticker-wording-20261031.mjs';
export const EXTRA_TICKER_PATHS=Object.freeze(['/medicine-news/scotland-glp1-prescribing-variation-october-2026','/medicine-news/offshore-travel-weight-limit-november-2026']);
export const digest=s=>createHash('sha256').update(s).digest('hex');
export function soleServingVersion(deployment){
 const rows=deployment.versions;assert(Array.isArray(rows)&&rows.length>0);for(const row of rows)assert(Number.isFinite(row.percentage)&&row.percentage>=0);
 assert.equal(rows.reduce((n,r)=>n+r.percentage,0),100,'Deployment traffic does not account for 100%');
 const live=rows.filter(r=>r.percentage>0);assert.equal(live.length,1,'Split live traffic requires separate reconciliation');assert.equal(live[0].percentage,100);return live[0].version_id;
}
export function patchKnowledgeSitemapBundle(source){
 const start=source.indexOf('async function withDynamicBabyLoveDiscovery(');
 assert(start>=0,'Serving Knowledge discovery function not identified');
 const pattern=/if\s*\(\s*row\.editorial\s*&&\s*text\.includes\(/g;
 const matches=[...source.matchAll(pattern)];
 assert.equal(matches.length,1,'Require one exact existing sitemap predicate');
 const match=matches[0];assert(match.index>start&&match.index-start<7000,'Predicate outside reviewed discovery function');
 assert(source.slice(start,match.index).includes('knowledge_articles'),'Published Knowledge query missing');
 assert(source.slice(match.index,match.index+1000).includes('articleModifiedDate(row)'),'Existing honest modification calculation missing');
 const replacement='if (text.includes(';
 const after=source.slice(0,match.index)+replacement+source.slice(match.index+match[0].length);
 assert.equal(after.slice(0,match.index)+match[0]+after.slice(match.index+replacement.length),source,'Complete runtime inverse failed');
 return {module:after,proof:{beforeSHA256:digest(source),afterSHA256:digest(after),offset:match.index,old:match[0],replacement,fullInverseVerified:true}};
}
export function patchTwoApprovedTickerLines(source,fixture){
 const baseline=approvedTickerModule(fixture);assert.equal(source,baseline.module,'Current shared ticker differs from retained approved v3 source');
 const match=source.match(/^const body=("(?:\\.|[^"])*");\n/);assert(match);
 const body=JSON.parse(match[1]),old=JSON.stringify(APPROVED_TICKER_PATHS)+'.includes(url.pathname)',replacement=JSON.stringify([...APPROVED_TICKER_PATHS,...EXTRA_TICKER_PATHS])+'.includes(url.pathname)';
 assert.equal(body.split(old).length,2,'Approved shared selector must be unique');
 const afterBody=body.replace(old,replacement);assert.equal(afterBody.replace(replacement,old),body);
 const after='const body='+JSON.stringify(afterBody)+';\n'+source.slice(match[0].length);
 assert.equal(after.replace(JSON.stringify(afterBody),match[1]),source,'Complete shared Worker inverse failed');
 return {module:after,body:afterBody,beforeBody:body,proof:{beforeSHA256:digest(source),afterSHA256:digest(after),fullInverseVerified:true,additionalPaths:EXTRA_TICKER_PATHS}};
}
const origin='https://shiftsometimber.co.uk',proofDir='knowledge-sitemap-proof';
async function run(){
 mkdirSync(proofDir,{recursive:true});
 const account=process.env.CLOUDFLARE_ACCOUNT_ID,token=process.env.CLOUDFLARE_API_TOKEN;
 assert(account&&token);assert.equal(process.env.GITHUB_REPOSITORY,'shiftsometimber/shift-core');assert.equal(process.env.GITHUB_ACTOR_ID,'315011648');
 async function api(path,options={}){const r=await fetch('https://api.cloudflare.com/client/v4'+path,{...options,headers:{Authorization:'Bearer '+token,...options.headers},signal:AbortSignal.timeout(45000)});const d=await r.json();assert(r.ok&&d.success,'Provider request failed '+r.status+' '+JSON.stringify(d.errors));return d.result;}
 const active=async name=>{const d=await api('/accounts/'+account+'/workers/scripts/'+name+'/deployments');return [...d.deployments].sort((a,b)=>Date.parse(b.created_on)-Date.parse(a.created_on))[0]};
 const version=(name,id)=>api('/accounts/'+account+'/workers/workers/'+name+'/versions/'+id+'?include=modules');
 const promote=(name,id,message)=>api('/accounts/'+account+'/workers/scripts/'+name+'/deployments',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({strategy:'percentage',versions:[{version_id:id,percentage:100}],annotations:{'workers/message':message}})});
 const clean=s=>s.replace(/<script\b[^>]*\bsrc=["']https:\/\/static.cloudflareinsights.com[^"']*["'][\s\S]*?<\/script>/gi,'').replace(/<script\b[^>]*>[\s\S]*?window\.__CF\$cv\$params[\s\S]*?<\/script>/gi,'');
 async function get(path){const r=await fetch(origin+path,{headers:{'Cache-Control':'no-cache'},signal:AbortSignal.timeout(25000)});assert.equal(r.status,200,path);return clean(await r.text());}
 const pages=['/','/about','/member-login','/articles/mounjaro-injection-sites',...EXTRA_TICKER_PATHS];
 async function capturePages(){const out={};for(const p of pages)out[p]=digest(await get(p));return out;}
 const beforePages=await capturePages();writeFileSync(proofDir+'/pages-before.json',JSON.stringify(beforePages));
 const beforeSitemap=await get('/sitemap.xml');writeFileSync(proofDir+'/sitemap-before.xml',beforeSitemap);
 const loc=origin+'/articles/mounjaro-injection-sites';
 function entries(xml){return [...xml.matchAll(/<url\b[^>]*>[\s\S]*?<\/url\s*>/gi)].map(x=>x[0])}
 function item(xml,url){return entries(xml).filter(x=>x.includes('<loc>'+url+'</loc>'))}
 assert.equal(item(beforeSitemap,loc).length,1);assert.match(item(beforeSitemap,loc)[0],/<lastmod>2026-10-29T05:00:37.839Z<\/lastmod>/,'Live evidence no longer matches; reconcile before repair');
 async function release(name,patcher,{expectedVersion,verify}){
  const dir=proofDir+'/'+name;mkdirSync(dir,{recursive:true});
  const before=await active(name),selectedVersion=soleServingVersion(before);if(expectedVersion)assert.equal(selectedVersion,expectedVersion,'Serving component moved; reconcile before staging');
  const previous=selectedVersion,original=await version(name,previous),settings=await api('/accounts/'+account+'/workers/scripts/'+name+'/settings');
  writeFileSync(dir+'/deployment-before.json',JSON.stringify(before));writeFileSync(dir+'/provider-before.json',JSON.stringify(original));writeFileSync(dir+'/settings-before.json',JSON.stringify(settings));
  const module=original.modules.find(m=>m.name===original.main_module);assert(module,'Native main module missing');
  const bytes=Buffer.from(module.content_base64,'base64'),source=bytes.toString();assert.equal(Buffer.from(source).length,bytes.length,'Native main module is not UTF-8');
  let patch;try{patch=patcher(source)}catch(error){console.error('PATCH_CONTEXT '+JSON.stringify({name,functionOffset:source.indexOf('withDynamicBabyLoveDiscovery'),snippet:source.slice(Math.max(0,source.indexOf('async function withDynamicBabyLoveDiscovery(')),Math.max(0,source.indexOf('async function withDynamicBabyLoveDiscovery('))+3800)}));throw error;}
  writeFileSync(dir+'/before.mjs',source);writeFileSync(dir+'/after.mjs',patch.module);writeFileSync(dir+'/inverse-proof.json',JSON.stringify(patch.proof));
  const metadata={main_module:original.main_module,compatibility_date:original.compatibility_date||settings.compatibility_date,compatibility_flags:original.compatibility_flags||settings.compatibility_flags||[],bindings:original.bindings.map(b=>({type:'inherit',name:b.name})),annotations:{'workers/message':'Approved publication delivery repair; exact retained content and source/notification guards preserved'}};
  for(const key of ['placement','limits','observability','logpush','tail_consumers','tags'])if(settings[key]!==undefined)metadata[key]=settings[key];
  const form=new FormData();form.set('metadata',new Blob([JSON.stringify(metadata)],{type:'application/json'}),'metadata.json');
  for(const m of original.modules){const content=m.name===module.name?Buffer.from(patch.module):Buffer.from(m.content_base64,'base64');form.set(m.name,new Blob([content],{type:m.content_type||'application/javascript+module'}),m.name);}
  assert.equal((await active(name)).id,before.id,'Component moved before staging');
  const uploaded=await api('/accounts/'+account+'/workers/scripts/'+name+'/versions?bindings_inheritance=strict',{method:'POST',body:form}),owned=uploaded.id;assert.match(owned,/^[a-f0-9-]{36}$/);
  writeFileSync(dir+'/staged-version.json',JSON.stringify({owned,previous,source:process.env.GITHUB_SHA}));
  const staged=await version(name,owned);assert.equal(staged.main_module,original.main_module);assert.deepEqual(staged.bindings,original.bindings);assert.equal(staged.compatibility_date,original.compatibility_date);assert.deepEqual(staged.compatibility_flags||[],original.compatibility_flags||[]);
  assert.deepEqual(staged.modules.map(m=>m.name).sort(),original.modules.map(m=>m.name).sort());
  for(const m of original.modules){const actual=staged.modules.find(x=>x.name===m.name),expected=m.name===module.name?Buffer.from(patch.module):Buffer.from(m.content_base64,'base64');assert.equal(digest(Buffer.from(actual.content_base64,'base64')),digest(expected),'Unintended module delta: '+m.name);}
  assert.equal((await active(name)).id,before.id,'Component moved during staging');
  writeFileSync(dir+'/promotion-intent.json',JSON.stringify({owned,previous,before:before.id}));
  try{
   await promote(name,owned,'Publish approved current content: sitemap dates and exact scoped ticker lines');
   const live=await active(name);assert.equal(soleServingVersion(live),owned);
   await verify(patch);
   assert.equal((await active(name)).id,live.id,'Another writer moved the component during verification');
   const receipt={verified:true,at:new Date().toISOString(),component:name,version:owned,deployment:live.id,previous,source:process.env.GITHUB_SHA,modules:original.modules.length,changedModules:[module.name],inverse:patch.proof,noCmsMutation:true,noEmail:true,noRoutesChanged:true};
   writeFileSync(dir+'/verification.json',JSON.stringify(receipt,null,2));console.log('COMPONENT_VERIFIED '+JSON.stringify(receipt));return receipt;
  }catch(error){
   const now=await active(name);
   if(now.versions.filter(v=>v.percentage>0).length===1&&soleServingVersion(now)===owned){await promote(name,previous,'Restore owned previous version after failed publication-delivery verification');assert.equal(soleServingVersion(await active(name)),previous);writeFileSync(dir+'/rollback.json',JSON.stringify({restored:previous,failed:owned,reason:String(error)}));}
   throw error;
  }
 }
 const core=await release('shift-core',patchKnowledgeSitemapBundle,{expectedVersion:'632ae7ba-ac02-4a9c-8db3-3a818cb9c80c',verify:async()=>{
  const after=await get('/sitemap.xml');writeFileSync(proofDir+'/sitemap-after.xml',after);
  assert.equal(item(after,loc).length,1);assert.match(item(after,loc)[0],/<lastmod>2026-11-03<\/lastmod>/);
  const urls=x=>entries(x).map(n=>n.match(/<loc>([^<]+)<\/loc>/)?.[1]).sort();assert.deepEqual(urls(after),urls(beforeSitemap),'Sitemap URL membership changed');
  for(const p of EXTRA_TICKER_PATHS)assert.equal(item(after,origin+p).length,1);
  assert.deepEqual(await capturePages(),beforePages,'An unrelated public response changed');
 }});
 const fixture=readFileSync('tests/fixtures/approved-shared-ticker-before-20261031.mjs','utf8');
 const ticker=await release('shift-latest-news-ticker-20261024',s=>patchTwoApprovedTickerLines(s,fixture),{verify:async patch=>{
  const r=await fetch(origin+'/assets/public-news-ticker-v1.js?v=public-news-20260917-r4',{headers:{'Cache-Control':'no-cache'},signal:AbortSignal.timeout(25000)});
  assert.equal(r.status,200);assert.equal(await r.text(),patch.body);assert.equal(r.headers.get('X-Shift-Ticker-Release'),'shift-news-shared-v3');
  const h=await fetch(origin+'/assets/public-news-ticker-v1.js',{method:'HEAD',signal:AbortSignal.timeout(25000)});assert.equal(h.status,200);assert.equal(await h.text(),'');
 }});
 const ledger=await api('/accounts/'+account+'/d1/database/88f40aed-cb23-4372-8c94-8a73f48bc847/query',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({batch:[{sql:"SELECT event_id,recipient,status,attempts,sent_at,provider_message_id,last_error FROM radar_live_email WHERE event_id IN (1700,1701) ORDER BY event_id",params:[]},{sql:"SELECT event_id,COUNT(*) publications,MIN(created_at) first_published_at FROM radar_audit WHERE event_id IN (1700,1701) AND action='published' GROUP BY event_id ORDER BY event_id",params:[]}]})});
 writeFileSync(proofDir+'/durable-notification-ledger.json',JSON.stringify(ledger));
 const rows=ledger[0].results;assert.deepEqual(rows.map(x=>x.event_id),[1700,1701]);for(const row of rows){assert.equal(row.status,'sent');assert.equal(row.recipient,'matt@shiftsometimber.co.uk');assert.equal(row.attempts,1);assert(!row.last_error);}
 for(const row of ledger[1].results)assert.equal(row.publications,1,'Unexpected publication replay');
 console.log('NOTIFICATION_LEDGER '+JSON.stringify(ledger));
 console.log('DELIVERY_REPAIR_COMPLETE '+JSON.stringify({core,ticker,mailboxReceiptVerifiedSeparately:true}));
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)await run();
