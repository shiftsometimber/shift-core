import test from 'node:test';
import assert from 'node:assert/strict';
import {industry,industrySources} from './industry.mjs';
import {medicines,sources} from './data.mjs';
import {industryMarkup} from './industry-page.mjs';
import {discoveryDomains,queriesForDate,summariseDiscovery} from './discovery.mjs';
import evidence from './reviews/2026-09-29-industry-expansion.json' with {type:'json'};
import hrs1596Review from './reviews/2026-09-30-hrs1596-discovery.json' with {type:'json'};
import continuingReview from './reviews/2026-09-30-emugrobart-petrelintide-discovery.json' with {type:'json'};
import env308Review from './reviews/2026-09-30-env308-discovery.json' with {type:'json'};
test('expanded registry distinguishes depth, clinical approval and access and joins every source',()=>{
 assert.equal(medicines.length,6);assert.equal(industry.length,29);assert.equal(sources.length,48);
 assert.equal(new Set([...medicines,...industry].map(e=>e.id)).size,35);
 for(const e of industry){assert.equal(e.clinicalApproval,null);for(const k of ['ukAuthorisation','nhsEngland','supply','limitations'])assert.ok(e[k],e.id+':'+k);for(const id of e.sourceIds)assert.ok(industrySources.some(s=>s.id===id),id);}
 for(const s of evidence.sources){assert.ok(Date.parse(s.reviewedAt));if(s.evidenceType==='NICE guidance')assert.equal(new URL(s.url).hostname,'www.nice.org.uk');if(s.reviewedFingerprint){assert.equal(s.httpStatus,200);assert.ok(s.responseSha256);assert.ok(s.bytes>0);}else assert.ok(!s.responseSha256);}
});
test('unverified source baselines stay visible even if a caller supplies current status',()=>{
 const html=industryMarkup({sources:industrySources.map(s=>({id:s.id,status:'current'}))});
 assert.equal((html.match(/data-industry-card/g)||[]).length,29);
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
 assert.ok(discoveryDomains.includes('hengrui.com'));
 assert.ok(queriesForDate(new Date('2027-02-01')).every(q=>q.q.includes('February 2027')));
 const report=summariseDiscovery([{domain:'gov.uk',status:'searched',candidates:[{name:'Previously unknown candidate',url:'https://www.gov.uk/example'}]},{domain:'nice.org.uk',status:'unavailable'}]);
 assert.equal(report.candidates.length,1);assert.equal(report.scanComplete,false);assert.ok(report.failedDomains.includes('nice.org.uk'));assert.ok(report.missingDomains.length);
 const complete=summariseDiscovery(discoveryDomains.map(domain=>({domain,status:'searched',candidates:[]})));
 assert.equal(complete.scanComplete,true);assert.equal(complete.industryComplete,false);assert.equal(complete.evidenceReviewRequired,true);assert.equal(complete.clinicalApproval,null);
});
test('HRS-1596 stays a sourced proposal until separately authorised',()=>{
 assert.equal(hrs1596Review.publicationStatus,'proposal_only');
 assert.equal(hrs1596Review.clinicalApproval,null);
 assert.equal(hrs1596Review.industryComplete,false);
 assert.equal(hrs1596Review.proposal.id,'hrs1596');
 assert.equal(hrs1596Review.registry.overallStatus,'NOT_YET_RECRUITING');
 assert.equal(hrs1596Review.registry.phase,'Phase 1');
 assert.ok(hrs1596Review.sources[0].reviewedFingerprint);
 assert.equal(industry.some(entry=>entry.id==='hrs1596'),true);
 assert.equal(industrySources.some(source=>source.id==='hrs1596-hengrui-20260929'),true);
});
test('continuing discovery preserves the emugrobart stop and petrelintide repair as proposals',()=>{
 assert.equal(continuingReview.publicationStatus,'proposal_only');
 assert.equal(continuingReview.clinicalApproval,null);
 assert.equal(continuingReview.industryComplete,false);
 assert.equal(continuingReview.proposals.emugrobart.group,'discontinued');
 assert.equal(continuingReview.registry.nctId,'NCT06965413');
 assert.equal(continuingReview.registry.overallStatus,'ACTIVE_NOT_RECRUITING');
 assert.equal(continuingReview.proposals.petrelintideSourceRepair.liveClaimChangeRequired,false);
 assert.ok(continuingReview.sources.every(source=>source.reviewedFingerprint));
 assert.ok(discoveryDomains.includes('chugai-pharm.co.jp'));
 assert.equal(industry.some(entry=>entry.id==='emugrobart'),true);
 assert.equal(industrySources.some(source=>source.id==='emugrobart-chugai-20260928'),true);
});
test('ENV-308 stays a bounded early-stage proposal with registry absence visible',()=>{
 assert.equal(env308Review.publicationStatus,'proposal_only');
 assert.equal(env308Review.clinicalApproval,null);
 assert.equal(env308Review.industryComplete,false);
 assert.equal(env308Review.proposal.id,'env308');
 assert.equal(env308Review.proposal.group,'research');
 assert.equal(env308Review.proposal.stage,'Phase 1 sponsor-reported results; Phase 2 planned');
 assert.ok(env308Review.sources[0].reviewedFingerprint);
 assert.equal(env308Review.registrySearch.matches,0);
 assert.equal(env308Review.retrievalFailures.length,1);
 assert.ok(discoveryDomains.includes('enveda.com'));
 assert.equal(industry.some(entry=>entry.id==='env308'),true);
 assert.equal(industrySources.some(source=>source.id==='env308-enveda-20260818'),true);
});

test('authorised source repair preserves the original receipt and joins readable evidence',()=>{
 assert.equal(industrySources.find(s=>s.id==='petrelintide-zealand').url,continuingReview.proposals.petrelintideSourceRepair.candidateUrl);
 for(const id of ['hrs1596','emugrobart']){const html=industryMarkup({},new URLSearchParams({q:id==='hrs1596'?'HRS-1596':'emugrobart'}));assert.doesNotMatch(html,/href=""/);assert.match(html,/clinicaltrials.gov/);}
});
