// Exact preview-only patches; not a production candidate promotion.
import fs from 'node:fs';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';
assert.equal(process.env.GITHUB_REF,'refs/heads/fix/account-completion-20260923');
const base='60c50c135560201436204a21717b226623fec621';
function once(s,a,b){assert.equal(s.split(a).length,2,'Patch anchor mismatch: '+a.slice(0,100));return s.replace(a,b);}
function edit(path,marker,fn){const s=fs.readFileSync(path,'utf8');if(s.includes(marker))return;assert.equal(s,execFileSync('git',['show',base+':'+path],{encoding:'utf8'}),'Unexpected source change: '+path);const n=fn(s);assert(n.includes(marker));fs.writeFileSync(path,n);}
edit('work/staging/worker.mjs','previewAccountCapacity',s=>{
 s="import {previewAccountCapacity} from './account-capacity.mjs';\n"+s;
 return once(s,"if(count.n>=20)return Response.json({error:'Staging account limit reached.'},{status:409});","if(!previewAccountCapacity(Number(count.n),env,u.hostname).available)return Response.json({error:'The fictional preview account limit has been reached. Return to your existing test account using Test sign-in; no live account has been affected.'},{status:409,headers:{'Cache-Control':'no-store'}});");
});
edit('preview/member-details/prepare.mjs','STAGING_REVIEW_ACCOUNT_LIMIT',s=>once(s,"c.vars.MEMBER_ADDRESS_PROVIDER='photon';","c.vars.STAGING_REVIEW_ACCOUNT_LIMIT='100'; // Finite human-review allowance; other staging hosts retain 20.\nc.vars.MEMBER_ADDRESS_PROVIDER='photon';"));
edit('preview/member-details/worker.mjs','resumeFictionalPreview',s=>{
 s="import {resumeFictionalPreview} from '../../work/staging/account-capacity.mjs';\nimport {authenticateMember} from '../../member-state-fast-v1.js';\n"+s;
 s=once(s,"  const email='review-'","  try{const resumed=await resumeFictionalPreview(request,env,authenticateMember);if(resumed)return resumed;}catch{return page(intro(env,'The preview could not check your existing session. Please retry without creating another account.'),503);}\n  const email='review-'");
 return once(s,'<strong>Postcode lookup is not connected:</strong> enter the full address manually.','<strong>Free address suggestions:</strong> enter a postcode and optionally a building/street, then search. Photon/OpenStreetMap may not contain every address; manual entry is always available.');
});
edit('preview/member-details/browser-proof.mjs','ownerSlotReleased',s=>once(s,"await page.screenshot({path:dir+'/owner-entry.png',fullPage:true});","await page.screenshot({path:dir+'/owner-entry.png',fullPage:true});await api(context,'/v1/profile','PATCH',{firstName:'Fictional automated reviewer'});report.ownerSlotReleased=true;"));
console.log('Only preview registration capacity, existing-session reuse, preview help and own automated-fixture accounting changed. Production and application forms unchanged.');
