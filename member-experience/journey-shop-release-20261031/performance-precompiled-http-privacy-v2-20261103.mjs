// Actual HTTP candidate privacy and current public-code preservation. No real sessions or writes.
import assert from 'node:assert/strict';import {readFileSync,writeFileSync} from 'node:fs';import {createHash} from 'node:crypto';
const state=JSON.parse(readFileSync('performance-precompiled-browser-state-20261103.json')),manifest=JSON.parse(readFileSync('performance-precompiled-documents.json')),rows=[],resources=new Set(),hash=b=>createHash('sha256').update(b).digest('hex'),origin='https://shiftsometimber.co.uk';
const overrides={'Cloudflare-Workers-Version-Overrides':state.owners.map(o=>o.name+'="'+o.versionId+'"').join(', ')};
const report={source:state.source,at:new Date().toISOString(),verified:false,productionWrites:0,realMemberRecordsRead:0,revision:2,rows,publicResources:[]};
const save=()=>writeFileSync('performance-precompiled-http-privacy-20261103.json',JSON.stringify(report,null,2)+'\n');
async function get(path,candidate=true,cookie=''){const r=await fetch(origin+path,{headers:{...(candidate?overrides:{}),...(cookie?{Cookie:cookie}:{}),'Accept-Encoding':'gzip'},signal:AbortSignal.timeout(30000)});return{r,body:Buffer.from(await r.arrayBuffer())};}
try{
 for(const path of Object.keys(manifest.documents))for(const app of [false,true])for(const account of ['anonymous','invalid-A','invalid-B']){
  const cookie=[account==='anonymous'?'':'sst_session=private-check-'+account,app?'shift_app_view=1':''].filter(Boolean).join('; '),expected=app&&manifest.documents[path].appView?manifest.documents[path].appView:manifest.documents[path];
  const {r,body}=await get(path,true,cookie);assert.equal(r.status,200);assert.equal(hash(body),expected.sha256);
  assert.equal(r.headers.get('x-my-timber-document-delivery'),'precompiled-20261103');
  assert.match(r.headers.get('cache-control'),/no-store/);assert.match(r.headers.get('cache-control'),/private/);assert.match(r.headers.get('vary'),/cookie/i);
  assert(!r.headers.has('etag'));assert(!/\bpublic\b|s-maxage|immutable/.test(r.headers.get('cache-control')));
  assert(!body.toString().includes('private-check-'));
  rows.push({path,appView:app,account,status:r.status,sha256:hash(body),privateNoStore:true});
  if(account==='anonymous')for(const m of body.toString().matchAll(/<(?:script|link)\b[^>]*(?:src|href)=["']([^"']+)["']/gi)){
   const u=new URL(m[1].replaceAll('&amp;','&'),origin);if(u.origin===origin&&/\.(?:mjs|js|css)$/.test(u.pathname))resources.add(u.pathname+u.search);
  }
 }
 for(const path of ['/v1/me','/v1/profile','/v1/life-back','/v1/life-back/journey','/v1/commerce/active-checkout'])for(const account of ['invalid-A','invalid-B']){
  const {r,body}=await get(path,true,'sst_session=private-check-'+account);assert([401,403].includes(r.status),'Private API did not deny unknown session '+path);assert.match(r.headers.get('cache-control')||'',/no-store/);
  assert(!/"(?:first_name|email|records|preferences)"\s*:/.test(body.toString()),'Private fields in denied response');
  rows.push({path,account,status:r.status,denied:true});
 }
 for(const path of resources){
  const control=await get(path,false,'sst_session=private-check-A'),candidate=await get(path,true,'sst_session=private-check-A');
  assert.equal(control.r.status,200,path);assert.equal(candidate.r.status,200,path);assert.equal(hash(candidate.body),hash(control.body),'Current public code changed '+path);
  for(const key of ['content-type','cache-control','etag','content-security-policy','x-content-type-options'])assert.equal(candidate.r.headers.get(key),control.r.headers.get(key),'Resource policy differs '+path+' '+key);
  if(/\bpublic\b|immutable/.test(candidate.r.headers.get('cache-control')||''))assert(!candidate.r.headers.has('set-cookie'),'Public resource embeds cookie');
  report.publicResources.push({path,status:200,sha256:hash(candidate.body),bytes:candidate.body.length,cacheControl:candidate.r.headers.get('cache-control'),matchesCurrentControl:true});
 }
 for(const path of ['/cart','/checkout']){const {r}=await get(path);assert.equal(r.status,404,'Purchase route availability changed');rows.push({path,status:r.status});}
 report.verified=true;report.finishedAt=new Date().toISOString();save();console.log('PRECOMPILED_HTTP_PRIVACY_PASSED',rows.length,'document/API/gate checks',report.publicResources.length,'current public resources matched');
}catch(e){report.failure={message:e.message,at:new Date().toISOString()};save();throw e;}