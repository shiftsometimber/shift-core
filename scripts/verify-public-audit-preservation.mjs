import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {renderShiftHealthDocument} from '../shift-health-public.mjs';
import {addNewsroomReading} from '../radar-newsroom-discovery-v1.js';
import {assertPublicPagesPreserved} from '../medicines-watch/preservation.mjs';
const [beforeFile,afterFile]=process.argv.slice(2);
const before=JSON.parse(readFileSync(beforeFile)).pages,after=JSON.parse(readFileSync(afterFile)).pages;
const expectedPaths=['/','/start-here','/programme','/shift-health','/treatment-centre','/about','/explore-knowledge','/shop','/work-with-us','/member-login','/turnstile-auth-v1.js?v=timeout-20260912'];
assert.deepEqual(before.map(x=>x.path),expectedPaths);assert.deepEqual(after.map(x=>x.path),expectedPaths);
const changedPaths=new Set(['/shift-health','/turnstile-auth-v1.js?v=timeout-20260912']);
assert.equal(assertPublicPagesPreserved(after.filter(x=>!changedPaths.has(x.path)),before.filter(x=>!changedPaths.has(x.path))),'identical');
const hash=body=>createHash('sha256').update(body).digest('hex');
const origin='https://shiftsometimber.co.uk';
const shellResponse=await fetch('https://projectshift.pages.dev/programme');assert.equal(shellResponse.status,200);
const expectedHealth=addNewsroomReading(renderShiftHealthDocument(await shellResponse.text()),'/shift-health');
const expected=new Map([['/shift-health',Buffer.from(expectedHealth)],['/turnstile-auth-v1.js?v=timeout-20260912',readFileSync(new URL('../frontend/member/turnstile-auth-v1.js',import.meta.url))]]);
const changes=[];
for(const [path,body] of expected){
  const evidence=after.find(x=>x.path===path),r=await fetch(origin+path),live=Buffer.from(await r.arrayBuffer());
  assert.equal(r.status,200);assert.equal(hash(live),hash(body),path+' differs from exact reviewed source');
  assert.equal(evidence.sha256,hash(body),path+' deployment snapshot differs from exact reviewed source');
  assert.equal(evidence.bytes,body.length);assert.equal(evidence.status,200);
  changes.push({path,sha256:hash(body),bytes:body.length,sourceExact:true});
}
console.log(JSON.stringify({proof:'PUBLIC_AUDIT_SCOPED_PRESERVATION_V1',checkedAt:new Date().toISOString(),deploymentSource:'1f3e32f03764715e507beb4b96f4e7a32f54d9e5',unchangedPublicResponses:9,authorisedExactChanges:changes},null,2));
