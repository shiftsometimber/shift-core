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
import globeNewswireRepair from './reviews/2026-09-30-globenewswire-access-repair.json' with {type:'json'};
import berobenatideReview from './reviews/2026-09-30-berobenatide-vesper6.json' with {type:'json'};
import eloraTZPReview from './reviews/2026-10-01-eloratzp-phase2b.json' with {type:'json'};
import kaineticReview from './reviews/2026-10-01-kainetic-enrolment.json' with {type:'json'};
import macupatideReview from './reviews/2026-10-01-macupatide-discovery.json' with {type:'json'};
import broaderReview from './reviews/2026-10-01-authorised-broader-discovery.json' with {type:'json'};
import synt101Correction from './reviews/2026-10-01-synt101-mad-correction.json' with {type:'json'};
import internationalOmissions from './reviews/2026-10-02-authorised-international-omissions.json' with {type:'json'};
test('expanded registry distinguishes depth, clinical approval and access and joins every source',()=>{
 assert.equal(medicines.length,6);assert.equal(industry.length,44);assert.equal(sources.length,50);
 assert.equal(new Set([...medicines,...industry].map(e=>e.id)).size,50);
 for(const e of industry){assert.equal(e.clinicalApproval,null);for(const k of ['ukAuthorisation','nhsEngland','supply','limitations'])assert.ok(e[k],e.id+':'+k);for(const id of e.sourceIds)assert.ok(industrySources.some(s=>s.id===id),id);}
 for(const s of evidence.sources){assert.ok(Date.parse(s.reviewedAt));if(s.evidenceType==='NICE guidance')assert.equal(new URL(s.url).hostname,'www.nice.org.uk');if(s.reviewedFingerprint){assert.equal(s.httpStatus,200);assert.ok(s.responseSha256);assert.ok(s.bytes>0);}else assert.ok(!s.responseSha256);}
});
test('macupatide discovery distinguishes recruiting Phase 2 from planned Phase 1',()=>{
 const entry=industry.find(item=>item.id==='macupatide');
 assert.match(entry.stage,/Recruiting Phase 2/);
 assert.match(entry.stage,/not yet recruiting/);
 assert.match(entry.summary,/actual 16 October 2025 start/);
 assert.match(entry.limitations,/Neither study has posted results/);
 assert.equal(entry.sourceIds.length,0);
 assert.equal(entry.additionalEvidence.length,2);
 assert.equal(entry.clinicalApproval,null);
 assert.match(entry.ukAuthorisation,/do not establish UK marketing authorisation/);
 const phase2=macupatideReview.registryEvidence.find(item=>item.nctId==='NCT07215559');
 const phase1=macupatideReview.registryEvidence.find(item=>item.nctId==='NCT07765511');
 assert.equal(phase2.overallStatus,'RECRUITING');
 assert.equal(phase2.actualStartDate,'2025-10-16');
 assert.equal(phase2.hasResults,false);
 assert.equal(phase1.overallStatus,'NOT_YET_RECRUITING');
 assert.equal(phase1.estimatedStart,'2026-10');
 assert.equal(macupatideReview.clinicalApproval,null);
});
test('berobenatide correction records VESPER-6 without implying access or results',()=>{
 const entry=industry.find(item=>item.id==='pf3944');
 assert.match(entry.name,/Berobenatide/);
 assert.match(entry.stage,/VESPER-6/);
 assert.match(entry.summary,/actual 10 June 2026 start/);
 assert.match(entry.limitations,/not results/);
 assert.equal(entry.clinicalApproval,null);
 assert.match(entry.ukAuthorisation,/does not establish UK marketing authorisation/);
 assert.ok(entry.sourceIds.includes('pf3944-pfizer-vesper6'));
 assert.equal(berobenatideReview.registryEvidence.status,'Recruiting');
 assert.equal(berobenatideReview.registryEvidence.actualStartDate,'2026-06-10');
 assert.equal(berobenatideReview.registryEvidence.lastUpdatePosted,'2026-09-28');
 assert.equal(berobenatideReview.ukPosition.nhsEnglandAccess,'Not established by either source.');
});
test('EloraTZP correction replaces planned-result evidence without treating planned Phase 3 as started',()=>{
 const entry=industry.find(item=>item.id==='eloralintide');
 const source=industrySources.find(item=>item.id==='eloralintide-lilly');
 assert.equal(entry.name,'Eloralintide / EloraTZP');
 assert.match(entry.stage,/Phase 2b results reported/);
 assert.match(entry.summary,/completed 48-week Phase 2b study/);
 assert.match(entry.summary,/not treated as started/);
 assert.match(entry.limitations,/10\.8% to 27\.0%/);
 assert.equal(source.url,eloraTZPReview.source.url);
 assert.equal(source.reviewedFingerprint,eloraTZPReview.source.reviewedFingerprint);
 assert.equal(eloraTZPReview.registryEvidence.overallStatus,'COMPLETED');
 assert.equal(eloraTZPReview.registryEvidence.actualCompletionDate,'2026-09-14');
 assert.equal(eloraTZPReview.ukPosition.marketingAuthorisation.includes('Neither source establishes'),true);
 assert.equal(entry.clinicalApproval,null);
});
test('KaiNETIC update records completed Phase 3 enrolment without implying results or access',()=>{
 const entry=industry.find(item=>item.id==='ribupatide-injection');
 const source=industrySources.find(item=>item.id==='kailera-kainetic-20260930');
 assert.match(entry.stage,/fully enrolled/);
 assert.match(entry.summary,/enrolment is complete/);
 assert.match(entry.summary,/expected in mid-2028/);
 assert.match(entry.limitations,/not a trial result/);
 assert.ok(entry.sourceIds.includes(source.id));
 assert.equal(source.reviewedFingerprint,kaineticReview.source.reviewedFingerprint);
 assert.equal(kaineticReview.clinicalApproval,null);
 assert.match(kaineticReview.ukPosition.marketingAuthorisation,/does not establish/);
 assert.equal(entry.clinicalApproval,null);
});
test('unverified source baselines stay visible even if a caller supplies current status',()=>{
 const html=industryMarkup({sources:industrySources.map(s=>({id:s.id,status:'current'}))});
 assert.equal((html.match(/data-industry-card/g)||[]).length,44);
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

test('GlobeNewswire access repair changes only check URLs and preserves reviewed evidence',()=>{
 assert.equal(globeNewswireRepair.reviewRenewed,false);
 assert.equal(globeNewswireRepair.wordingChanged,false);
 assert.equal(globeNewswireRepair.clinicalApproval,null);
 for(const proof of globeNewswireRepair.proof){
  const source=industrySources.find(item=>item.id===proof.id);
  const repaired=globeNewswireRepair.sources.find(item=>item.id===proof.id);
  assert.equal(source.url,repaired.url);
  assert.equal(source.checkUrl,repaired.checkUrl);
  assert.equal(new URL(source.checkUrl).hostname,'rss.globenewswire.com');
  assert.equal(proof.previousReviewedFingerprint,proof.reviewedFingerprint);
  assert.equal(source.reviewedFingerprint,proof.reviewedFingerprint);
  assert.equal(source.reviewedAt,repaired.reviewedAt);
  assert.equal(proof.httpStatus,200);
  assert.equal(proof.withdrawn,false);
 }
});

test('evening evidence preserves safety, planned events and research access boundaries',()=>{
 const find=id=>industry.find(e=>e.id===id);
 assert.match(find('trevogrumab-semaglutide').limitations,/two deaths; causation was not established/);
 assert.match(find('trevogrumab-semaglutide').limitations,/does not establish improved strength or function/);
 assert.match(find('ibio600').limitations,/May 2027.*second half of 2027/);
 assert.match(find('ibio600').supply,/No UK retail availability/);
 assert.equal(find('ibio600').clinicalApproval,null);
 assert.equal(find('ibio600').sourceIds.length,0);
 assert.match(find('kai4729').summary,/outside-China Phase 1 remained planned/);
 assert.match(find('ribupatide-injection').summary,/mid-2028/);
 assert.match(find('kai7535').name,/Safiglipron/);
 assert.match(find('survodutide').limitations,/efficacy estimand assumes continued treatment/);
});

test('broader discovery adds bounded research summaries without inventing UK access',()=>{
 assert.equal(broaderReview.publicationStatus,'owner_authorised_factual_publication');
 assert.equal(broaderReview.clinicalApproval,null);
 assert.equal(broaderReview.industryComplete,false);
 for(const id of ['mbx4291','aroinhbe','lx9851','nbip1968','crb913','synt101','alv100']){
  const item=industry.find(entry=>entry.id===id);
  assert.ok(item,id);
  assert.equal(item.clinicalApproval,null);
  assert.equal(item.sourceIds.length,0);
  assert.ok(item.additionalEvidence.length>=1,id);
  assert.match(item.ukAuthorisation,/does not establish UK marketing authorisation/);
  assert.match(item.nhsEngland,/No NICE recommendation or NHS England access/);
  assert.match(item.supply,/does not establish lawful UK retail supply/);
 }
 assert.match(industry.find(entry=>entry.id==='crb913').stage,/Phase 2 planned/);
 assert.match(industry.find(entry=>entry.id==='alv100').limitations,/Recruitment and first dosing are not results/);
 assert.match(industry.find(entry=>entry.id==='synt101').limitations,/Small, early sponsor-reported study/);
 for(const domain of ['mbxbio.com','arrowheadpharma.com','lexpharma.com','neurocrine.com','corbuspharma.com','syntis.bio','alveustx.com'])assert.ok(discoveryDomains.includes(domain));
});

test('SYNT-101 correction replaces the stale pending multiple-dose claim without overstating early results',()=>{
 const entry=industry.find(item=>item.id==='synt101');
 assert.equal(synt101Correction.publicationStatus,'owner_authorised_factual_correction');
 assert.equal(synt101Correction.clinicalApproval,null);
 assert.match(entry.stage,/28-day multiple-dose sponsor results/);
 assert.match(entry.stage,/Phase 2 planned/);
 assert.match(entry.summary,/23 adults with overweight or obesity/);
 assert.match(entry.summary,/planned for 2027, not treated as started/);
 assert.doesNotMatch(entry.summary,/data still planned/);
 assert.match(entry.limitations,/does not provide complete cohort-level weight-loss estimates/);
 assert.match(entry.limitations,/Preclinical lean-muscle findings are not human evidence/);
 assert.equal(entry.additionalEvidence.at(-1).url,synt101Correction.source.url);
 assert.equal(entry.reviewedAt,synt101Correction.reviewedAt);
 assert.equal(entry.clinicalApproval,null);
 assert.match(entry.ukAuthorisation,/does not establish UK marketing authorisation/);
 assert.match(entry.nhsEngland,/No NICE recommendation or NHS England access/);
 assert.match(entry.supply,/does not establish lawful UK retail supply/);
});

test('international omissions distinguish China approval from UK access and early US research',()=>{
 assert.equal(internationalOmissions.publicationStatus,'owner_authorised_factual_publication');
 assert.equal(internationalOmissions.clinicalApproval,null);
 assert.equal(internationalOmissions.industryComplete,false);
 assert.equal(internationalOmissions.automatedMonitorChanges,false);
 for(const id of ['ecnoglutide','mazdutide','asc36-injection','asc36-35-fdc-injection','asc35-injection']){
  const item=industry.find(entry=>entry.id===id);
  assert.ok(item,id);
  assert.equal(item.clinicalApproval,null);
  assert.equal(item.sourceIds.length,0);
  assert.ok(item.additionalEvidence.length>=1,id);
  assert.match(item.ukAuthorisation,/does not establish UK marketing authorisation/);
  assert.match(item.nhsEngland,/No NICE recommendation or NHS England access/);
  assert.match(item.supply,/does not establish lawful UK retail supply/);
 }
 assert.match(industry.find(entry=>entry.id==='ecnoglutide').stage,/China NMPA/);
 assert.equal(industry.find(entry=>entry.id==='ecnoglutide').group,'international');
 assert.equal(industry.find(entry=>entry.id==='mazdutide').group,'international');
 assert.match(industry.find(entry=>entry.id==='mazdutide').summary,/China-specific authorisation, not a UK approval/);
 assert.match(industry.find(entry=>entry.id==='asc36-injection').limitations,/Registry corroboration remains missing/);
 assert.match(industry.find(entry=>entry.id==='asc36-35-fdc-injection').limitations,/No completed human efficacy results/);
 assert.match(industry.find(entry=>entry.id==='asc35-injection').limitations,/No results are posted/);
 const international=industryMarkup({},new URLSearchParams({industry:'international'}));
 assert.equal((international.match(/data-industry-card/g)||[]).length,2);
 assert.match(international,/Authorised outside the UK/);
 const ukAuthorised=industryMarkup({},new URLSearchParams({status:'authorised'}));
 assert.doesNotMatch(ukAuthorised,/industry-ecnoglutide/);
 assert.doesNotMatch(ukAuthorised,/industry-mazdutide/);
});
