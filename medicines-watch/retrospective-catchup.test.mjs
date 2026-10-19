import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import review from './reviews/2026-10-19-retrospective-catchup.json' with {type:'json'};
import {medicines,sources} from './data.mjs';
import {industry} from './industry.mjs';
import {registrySources} from './credibility.mjs';
import {registryLifecycle} from './registry-lifecycle.mjs';
import {fingerprintSource} from './monitor.mjs';
import {industryBeforeRetrospective,sourcesBeforeRetrospective} from './retrospective-catchup.mjs';
const hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
test('current catalogue is the exact retained before-image plus eight bounded corrections and CBL-514',()=>{
 assert.equal(industry.length+medicines.length,120);assert.equal(sources.length,206);
 assert.equal(hash(industryBeforeRetrospective(industry)),review.baseline.industrySha256);
 assert.equal(hash(sourcesBeforeRetrospective(sources)),review.baseline.sourcesSha256);
 assert.equal(registrySources.length,141);assert.equal(new Set(sources.map(x=>x.id)).size,206);
 for(const change of review.changes){
  const after=industry.find(x=>x.id===change.id);assert.deepEqual(after,change.after);
  for(const key of ['reviewedAt','clinicalApproval','ukAuthorisation','nhsEngland','supply'])assert.deepEqual(after[key],change.before[key],change.id+': '+key);
 }
 for(const entry of industry){assert.equal(entry.clinicalApproval,null);for(const key of ['ukAuthorisation','nhsEngland','supply','limitations'])assert.ok(entry[key]);}
});
test('every renewed or added record is bound to the complete primary document and lifecycle fingerprint',async()=>{
 for(const item of [...review.registryResponses,...review.newRegistrySources]){
  const after=item.afterSource||item.source,raw=item.record,lifecycle=registryLifecycle(raw,after.nctId);
  assert.deepEqual(after.lifecycle,lifecycle);
  assert.equal((await fingerprintSource(after,JSON.stringify(raw),'application/json')).fingerprint,after.reviewedFingerprint);
  assert.deepEqual(sources.find(x=>x.id===after.id),after);
  assert.deepEqual(registrySources.find(x=>x.id===after.id),after);
 }
 const get=id=>sources.find(x=>x.nctId===id).lifecycle;
 for(const [id,date] of [['NCT07855133','2026-10-05'],['NCT07868354','2026-10-08'],['NCT07798284','2026-09-29']]){
  assert.equal(get(id).status,'RECRUITING');assert.deepEqual(get(id).start,{date,type:'ACTUAL'});assert.equal(get(id).hasResults,false);
 }
 for(const id of ['NCT07868835','NCT07868939']){assert.deepEqual(get(id).start,{date:'2026-11',type:'ESTIMATED'});assert.equal(get(id).status,'NOT_YET_RECRUITING');assert.equal(get(id).hasResults,false);}
 assert.equal(get('NCT05378893').hasResults,true);assert.equal(get('NCT05378893').resultsFirstPosted.date,'2026-10-19');
 assert.deepEqual(get('NCT05713799').start,{date:'2026-10-22',type:'ESTIMATED'});
});
test('CBL-514 research has exact registry coverage and cannot imply UK supply, permanent human benefit or clinical approval',()=>{
 const c=industry.find(x=>x.id==='cbl514');assert.ok(c);assert.equal(c.clinicalApproval,null);
 const records=registrySources.filter(x=>x.entryIds.includes(c.id));assert.equal(records.length,2);
 assert.deepEqual(new Set(records.map(x=>x.nctId)),new Set(['NCT07140939','NCT07526974']));
 assert.match(c.summary,/local abdominal subcutaneous-fat studies/);assert.match(c.limitations,/remain preclinical/);
 assert.match(c.ukAuthorisation,/does not establish UK marketing authorisation/);assert.match(c.supply,/do not establish lawful UK retail supply/);
 const dr=industry.find(x=>x.id==='dr10624');assert.match(dr.limitations,/does not assess their efficacy or safety findings/);
});
test('historical inverses reject altered new records rather than hiding unrelated drift',()=>{
 const bad=structuredClone(industry);bad.find(x=>x.id==='cbl514').supply='Available';
 assert.throws(()=>industryBeforeRetrospective(bad),/before-image drift/);
 const changed=structuredClone(sources);changed.find(x=>x.nctId==='NCT07140939').lifecycle.status='COMPLETED';
 assert.throws(()=>sourcesBeforeRetrospective(changed),/inverse source drift/);
});

test('original-paper corrections bind five complete abstracts without whole-programme renewal',()=>{
 assert.equal(review.originalResearchAbstractReviews.length,5);
 assert.deepEqual(new Set(review.originalResearchAbstractReviews.map(x=>x.programme)),new Set(['kai7535','petrelintide','ubt251']));
 for(const x of review.originalResearchAbstractReviews){assert.equal(createHash('sha256').update(x.paper.abstractText).digest('hex'),x.abstractSha256);assert.equal(x.sourcePublicationDate,x.paper.firstPublicationDate);assert.match(x.reviewScope,/abstract only/);const entry=industry.find(e=>e.id===x.programme);assert.ok(entry.additionalEvidence.some(e=>e.url==='https://doi.org/'+x.paper.doi));}
});
