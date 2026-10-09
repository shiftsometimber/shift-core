import test from 'node:test';import assert from 'node:assert/strict';
import receipt from './reviews/2026-10-09-authorised-backlog-review.json' with {type:'json'};
import {sources,REVIEWED_AT} from './data.mjs';import {industry} from './industry.mjs';import {registrySources} from './credibility.mjs';
test('backlog review advances only independently reviewed sources and preserves clinical uncertainty',()=>{
 assert.equal(receipt.sources.length,35);assert.equal(REVIEWED_AT,'2026-09-15T21:28:30Z');assert.equal(receipt.clinicalApproval,null);assert.equal(receipt.industryComplete,false);
 for(const r of receipt.sources){const s=sources.find(s=>s.id===r.id);assert.equal(s.reviewedAt,r.reviewedAt);assert.equal(s.reviewedFingerprint,r.reviewedFingerprint);assert.equal(r.withdrawn,false);assert.match(r.responseSha256,/^[a-f0-9]{64}$/);}
 for(const s of sources.filter(s=>!receipt.sources.some(r=>r.id===s.id)))assert.notEqual(s.reviewedAt,receipt.reviewedAt);
});
test('changed registry records remove stale recruitment, dates and enrollment without publishing outcomes',()=>{
 for(const s of receipt.registrySources){assert.deepEqual(registrySources.find(r=>r.id===s.id).lifecycle,s.lifecycle);assert.equal(s.lifecycle.hasResults,false);}
 const crb=industry.find(e=>e.id==='crb913');assert.match(crb.summary,/254 actual participants/);assert.match(crb.limitations,/no posted results/);assert.doesNotMatch(crb.limitations,/still showed active/);
 const mac=industry.find(e=>e.id==='macupatide');assert.match(mac.stage,/Active, not recruiting Phase 2/);assert.doesNotMatch(mac.summary,/a recruiting Phase 2/);
 const mir=industry.find(e=>e.id==='mirabegron-alpha-lipoic-acid');assert.match(mir.summary,/14 October 2026/);assert.match(mir.limitations,/48-person target.*60/);assert.doesNotMatch(mir.summary,/13 October/);
});
test('official alternative replaces rejection page without certifying unavailable English evidence',()=>{
 const s=sources.find(s=>s.id==='hrs1596-hengrui-20260929');assert.equal(s.url,'https://www.hengrui.com/media/detail-1041.html');assert.equal(s.contentSelector,'article');assert.match(receipt.remainingObstacles[0].error,/Request Rejected/);assert.match(receipt.remainingObstacles[0].disposition,/not.*certified/);assert.equal(sources.length,199);assert.equal(industry.length,104);
});
