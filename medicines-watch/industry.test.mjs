import test from 'node:test';
import assert from 'node:assert/strict';
import {industry,industrySources} from './industry.mjs';
import {medicines,sources} from './data.mjs';
import {industryMarkup} from './industry-page.mjs';
import {discoveryDomains,queriesForDate,summariseDiscovery} from './discovery.mjs';
import evidence from './reviews/2026-09-29-industry-expansion.json' with {type:'json'};
test('expanded registry distinguishes depth, clinical approval and access and joins every source',()=>{
 assert.equal(medicines.length,6);assert.equal(industry.length,26);assert.equal(sources.length,45);
 assert.equal(new Set([...medicines,...industry].map(e=>e.id)).size,32);
 for(const e of industry){assert.equal(e.clinicalApproval,null);for(const k of ['ukAuthorisation','nhsEngland','supply','limitations'])assert.ok(e[k],e.id+':'+k);for(const id of e.sourceIds)assert.ok(industrySources.some(s=>s.id===id),id);}
 for(const s of evidence.sources){assert.ok(Date.parse(s.reviewedAt));if(s.evidenceType==='NICE guidance')assert.equal(new URL(s.url).hostname,'www.nice.org.uk');if(s.reviewedFingerprint){assert.equal(s.httpStatus,200);assert.ok(s.responseSha256);assert.ok(s.bytes>0);}else assert.ok(!s.responseSha256);}
});
test('unverified source baselines stay visible even if a caller supplies current status',()=>{
 const html=industryMarkup({sources:industrySources.map(s=>({id:s.id,status:'current'}))});
 assert.equal((html.match(/data-industry-card/g)||[]).length,26);
 assert.equal((html.match(/Complete-response baseline not yet verified/g)||[]).length,industry.flatMap(e=>e.sourceIds).filter(id=>!industrySources.find(s=>s.id===id).reviewedFingerprint).length);
 assert.match(html,/not clinical approval/);assert.match(html,/not automatically content-monitored/);
});
test('paused and discontinued programmes remain distinct and searchable',()=>{
 const paused=industryMarkup({},new URLSearchParams({industry:'paused'}));
 assert.match(paused,/industry-dapiglutide/);assert.doesNotMatch(paused,/industry-danuglipron/);
 const stopped=industryMarkup({},new URLSearchParams({industry:'discontinued'}));
 assert.match(stopped,/industry-danuglipron/);assert.match(stopped,/industry-amg513/);
 const query=industryMarkup({},new URLSearchParams({q:'petrelintide'}));
 assert.equal((query.match(/data-industry-card/g)||[]).length,1);assert.match(query,/Phase 3 ZUPREME/);
 assert.doesNotMatch(industryMarkup({},new URLSearchParams({q:'<script>evil</script>'})),/<script>/);
});
test('discovery can surface an untracked name and incomplete searches cannot imply coverage',()=>{
 assert.ok(queriesForDate(new Date('2027-02-01')).every(q=>q.q.includes('February 2027')));
 const report=summariseDiscovery([{domain:'gov.uk',status:'searched',candidates:[{name:'Previously unknown candidate',url:'https://www.gov.uk/example'}]},{domain:'nice.org.uk',status:'unavailable'}]);
 assert.equal(report.candidates.length,1);assert.equal(report.scanComplete,false);assert.ok(report.failedDomains.includes('nice.org.uk'));assert.ok(report.missingDomains.length);
 const complete=summariseDiscovery(discoveryDomains.map(domain=>({domain,status:'searched',candidates:[]})));
 assert.equal(complete.scanComplete,true);assert.equal(complete.industryComplete,false);assert.equal(complete.evidenceReviewRequired,true);assert.equal(complete.clinicalApproval,null);
});
