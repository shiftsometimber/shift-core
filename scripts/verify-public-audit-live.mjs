import assert from 'node:assert/strict';
import {healthSlugs} from '../shift-health-public.mjs';
const origin=process.env.PUBLIC_AUDIT_ORIGIN||'https://shiftsometimber.co.uk';
const proof={checkedAt:new Date().toISOString(),origin,pages:[]};
for(const slug of ['',...healthSlugs]){
  const path='/shift-health'+(slug?'/'+slug:''),r=await fetch(origin+path),html=await r.text();
  assert.equal(r.status,200,path);assert.ok(html.includes('data-shift-health'),path);
  const main=html.match(/<main\b[\s\S]*?<\/main>/i)?.[0]||'';
  const words=main.replace(/<[^>]*>/g,' ').split(/\s+/).filter(Boolean).length;
  assert.ok(words>(slug?500:150),path+' words '+words);
  assert.equal((html.match(/<link\b(?=[^>]*\brel\s*=\s*["']canonical["'])[^>]*>/gi)||[]).length,1,path);
  for(const marker of ['consent-v4a.js','shift-recovery-v6.css','header-navigation-v2.css','site-drawer','skip-link'])assert.ok(html.includes(marker),path+' '+marker);
  assert.doesNotMatch(html,/complete interactive route loads below/);
  proof.pages.push({path,status:r.status,words});
}
const watch=await fetch(origin+'/treatment-centre/medicines-watch'),html=await watch.text();
const canonicals=html.match(/<link\b(?=[^>]*\brel\s*=\s*["']canonical["'])[^>]*>/gi)||[];
assert.equal(canonicals.length,1);assert.ok(canonicals[0].includes('/treatment-centre/medicines-watch'));
proof.medicinesWatch={status:watch.status,canonical:canonicals[0]};
for(const host of [origin,'https://api.shiftsometimber.co.uk'])for(const path of ['/health','/v1/health']){
  const r=await fetch(host+path);assert.equal(r.status,200);assert.deepEqual(await r.json(),{ok:true});
}
proof.publicHealth='readiness-only';
// This deliberately invalid enquiry cannot satisfy the guard. It must send no email.
const blocked=await fetch(origin+'/v1/contact',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:'not-a-valid-address',consent:false})});
const result=await blocked.json();assert.ok([400,429].includes(blocked.status));assert.ok(['turnstile_required','rate_limited'].includes(result.error));
proof.contact={status:blocked.status,error:result.error};
console.log(JSON.stringify(proof,null,2));
