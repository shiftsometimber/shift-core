import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {medicines,sources} from './data.mjs';
import {verifyLiveSourceReviews} from './verify-live-sources.mjs';
import {WATCH_PATH,HEALTH_PATH} from './page.mjs';
import {TREATMENTS_ENTRY} from './preservation.mjs';
const origin='https://shiftsometimber.co.uk';
const get=async path=>{const r=await fetch(origin+path,{signal:AbortSignal.timeout(30000),headers:{'Cache-Control':'no-cache'}});assert.equal(r.status,200,path);return r};
const [document,parent,health,filtered]=await Promise.all([
 get(WATCH_PATH).then(r=>r.text()),get('/treatment-centre').then(r=>r.text()),get(HEALTH_PATH).then(r=>r.json()),get(WATCH_PATH+'?status=investigational').then(r=>r.text())
]);
assert.ok(parent.includes(TREATMENTS_ENTRY),'Treatments entry exactly matches approved source');
assert.equal((document.match(/data-watch-card /g)||[]).length,medicines.length);
for(const medicine of medicines)assert.ok(document.includes('id="'+medicine.id+'"'),medicine.id);
assert.equal((filtered.match(/data-watch-card /g)||[]).length,1);assert.ok(filtered.includes('id="retatrutide"'));
assert.equal(health.available,true,'Monitor database must be readable');
assert.equal(health.sources.length,sources.length);assert.equal(health.medicines.length,medicines.length);
assert.ok(health.lastAttemptAt,'Monitor must have executed');
assert.ok(Date.now()-Date.parse(health.lastAttemptAt)<75*60*1000,'Monitor attempts must be recent');
verifyLiveSourceReviews(health.sources,sources);
const publicMain=document.match(/<main\b[\s\S]*?<\/main>/i)[0];
assert.doesNotMatch(publicMain,/\/member\/|clinically reviewed|buy now/i);
const post=await fetch(origin+HEALTH_PATH,{method:'POST',signal:AbortSignal.timeout(15000)});assert.equal(post.status,405);
writeFileSync('medicines-watch-live-proof.json',JSON.stringify({checkedAt:new Date().toISOString(),url:origin+WATCH_PATH,cards:medicines.length,sourceChecks:health.sources.map(({id,status,reviewedAt,lastAttemptAt,lastSuccessAt,error})=>({id,status,reviewedAt,lastAttemptAt,lastSuccessAt,error})),filters:'pass',treatmentsEntry:'pass',readOnly:'pass'},null,2));
console.log('PASS: live Treatments entry, six cards, evidence status, research filter and read-only API.');
