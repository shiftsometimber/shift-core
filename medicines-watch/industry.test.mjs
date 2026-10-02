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
import abbvAsc30TernBimagrumab from './reviews/2026-10-02-authorised-abbv-asc30-tern-bimagrumab.json' with {type:'json'};
import registryOmissions from './reviews/2026-10-02-authorised-registry-omissions.json' with {type:'json'};
import enobosarmSemaglutide from './reviews/2026-10-02-authorised-enobosarm-semaglutide.json' with {type:'json'};
import pfizerPdfRepair from './reviews/2026-10-02-pfizer-pdf-monitor-repair.json' with {type:'json'};
import expandedRegistryWave from './reviews/2026-10-02-authorised-expanded-registry-wave.json' with {type:'json'};
import semaglutideSpecialistTrials from './reviews/2026-10-02-authorised-semaglutide-specialist-trials.json' with {type:'json'};
import glimrCopd from './reviews/2026-10-02-authorised-glimr-copd.json' with {type:'json'};
import specialistRegistryFollowup from './reviews/2026-10-02-authorised-specialist-registry-followup.json' with {type:'json'};
import switchingStudies from './reviews/2026-10-02-authorised-switching-studies.json' with {type:'json'};
import na931Publication from './reviews/2026-10-02-authorised-na931.json' with {type:'json'};
import earlierEloraNa931Proposal from './reviews/2026-09-30-eloratzp-na931-discovery.json' with {type:'json'};
test('expanded registry distinguishes depth, clinical approval and access and joins every source',()=>{
 assert.equal(medicines.length,6);assert.equal(industry.length,72);assert.equal(sources.length,50);
 assert.equal(new Set([...medicines,...industry].map(e=>e.id)).size,78);
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
test('Pfizer monitor repair uses exact official investor-hosted PDF baselines',()=>{
 for(const id of ['pf3944-pfizer','danuglipron-pfizer']){
  const source=industrySources.find(item=>item.id===id);
  const receipt=pfizerPdfRepair.sources.find(item=>item.id===id);
  assert.equal(source.url,receipt.url);
  assert.equal(new URL(source.url).hostname,'www.pfizer.com');
  assert.equal(source.checkUrl,receipt.checkUrl);
  assert.equal(new URL(source.checkUrl).hostname,'s206.q4cdn.com');
  assert.equal(source.format,'pdf');
  assert.equal(source.reviewedFingerprint,receipt.reviewedFingerprint);
 }
 assert.equal(pfizerPdfRepair.monitoring.successesSeeded,false);
 assert.equal(pfizerPdfRepair.clinicalApproval,null);
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
 assert.equal((html.match(/data-industry-card/g)||[]).length,72);
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
test('expanded discovery keeps trial status and UK access boundaries explicit',()=>{
 for(const id of ['aroalk7','mwn105','ibi3032','hdm1005','npm139-semaglutide-implant']){
  const item=industry.find(entry=>entry.id===id);
  assert.ok(item,id);
  assert.equal(item.clinicalApproval,null,id);
  assert.match(item.ukAuthorisation,/do(?:es)? not establish UK marketing authorisation/,id);
  assert.match(item.nhsEngland,/No NICE recommendation or NHS England access/,id);
  assert.match(item.supply,/do(?:es)? not establish lawful UK retail supply/,id);
  assert.ok(item.additionalEvidence.length>=1,id);
 }
 assert.match(industry.find(entry=>entry.id==='mwn105').limitations,/no results/i);
 assert.match(industry.find(entry=>entry.id==='ibi3032').limitations,/no results/i);
 assert.match(industry.find(entry=>entry.id==='npm139-semaglutide-implant').stage,/not yet recruiting/i);
});


test('UBT251 keeps completed Chinese evidence separate from global plans and UK access',()=>{
 const item=industry.find(entry=>entry.id==='ubt251');
 assert.ok(item);
 assert.equal(item.clinicalApproval,null);
 assert.match(item.stage,/Chinese Phase 2 results/i);
 assert.match(item.stage,/global Phase 1b\/2a ongoing/i);
 assert.match(item.summary,/sponsor-reported/i);
 assert.match(item.limitations,/Phase 3.*plan/i);
 assert.match(item.ukAuthorisation,/does not establish UK marketing authorisation/);
 assert.match(item.nhsEngland,/No NICE recommendation or NHS England access/);
 assert.match(item.supply,/does not establish lawful UK retail supply/);
 assert.ok(item.additionalEvidence.length>=3);
});

test('SGB-7342 preserves the dated registry mismatch and human-evidence limits',()=>{
 const item=industry.find(entry=>entry.id==='sgb7342');
 assert.ok(item);
 assert.equal(item.clinicalApproval,null);
 assert.match(item.stage,/Phase 1 first participant dosed/i);
 assert.match(item.stage,/registry status predates sponsor update/i);
 assert.match(item.summary,/single-ascending-dose safety/i);
 assert.match(item.limitations,/not yet recruiting/i);
 assert.match(item.limitations,/preclinical/i);
 assert.match(item.limitations,/No human study results/i);
 assert.match(item.ukAuthorisation,/does not establish UK marketing authorisation/);
 assert.match(item.nhsEngland,/No NICE recommendation or NHS England access/);
 assert.match(item.supply,/do not establish lawful UK retail supply/);
 assert.equal(item.additionalEvidence.length,2);
});

test('latest wider discovery keeps formulations, plans and stopped programmes distinct',()=>{
 assert.equal(abbvAsc30TernBimagrumab.publicationStatus,'owner_authorised_factual_publication');
 assert.equal(abbvAsc30TernBimagrumab.clinicalApproval,null);
 assert.equal(abbvAsc30TernBimagrumab.industryComplete,false);
 assert.equal(abbvAsc30TernBimagrumab.automatedMonitorChanges,false);
 for(const id of ['abbv295','asc30-oral','asc30-depot','tern601','bimagrumab-tirzepatide']){
  const item=industry.find(entry=>entry.id===id);
  assert.ok(item,id);
  assert.equal(item.clinicalApproval,null,id);
  assert.equal(item.sourceIds.length,0,id);
  assert.ok(item.additionalEvidence.length>=2,id);
  assert.match(item.ukAuthorisation,/does not establish UK marketing authorisation/,id);
  assert.match(item.nhsEngland,/No NICE recommendation or NHS England access/,id);
  assert.match(item.supply,/do(?:es)? not establish lawful UK retail supply/,id);
 }
 assert.match(industry.find(entry=>entry.id==='abbv295').stage,/Phase 2 planned/);
 assert.match(industry.find(entry=>entry.id==='asc30-oral').stage,/Completed Phase 2/);
 assert.match(industry.find(entry=>entry.id==='asc30-depot').limitations,/not approved regimens/);
 assert.equal(industry.find(entry=>entry.id==='tern601').group,'discontinued');
 assert.match(industry.find(entry=>entry.id==='bimagrumab-tirzepatide').limitations,/do not establish improved strength/);
 for(const domain of ['abbvie.com','ascletis.com','ternspharma.com'])assert.ok(discoveryDomains.includes(domain));
});

test('international registry omissions preserve live, completed and delayed status boundaries',()=>{
 assert.equal(registryOmissions.publicationStatus,'owner_authorised_factual_publication');
 assert.equal(registryOmissions.clinicalApproval,null);
 assert.equal(registryOmissions.industryComplete,false);
 assert.equal(registryOmissions.automatedMonitorChanges,false);
 for(const id of ['da302168s','nnc06620419','dr10624','cmsd008']){
  const item=industry.find(entry=>entry.id===id);
  assert.ok(item,id);
  assert.equal(item.clinicalApproval,null,id);
  assert.equal(item.sourceIds.length,0,id);
  assert.equal(item.additionalEvidence.length,1,id);
  assert.match(item.ukAuthorisation,/does not establish UK marketing authorisation/,id);
  assert.match(item.nhsEngland,/No NICE recommendation or NHS England access/,id);
  assert.match(item.supply,/does not establish lawful UK retail supply/,id);
 }
 assert.match(industry.find(entry=>entry.id==='da302168s').stage,/Recruiting Chinese Phase 3/);
 assert.match(industry.find(entry=>entry.id==='da302168s').limitations,/No results are posted/);
 assert.match(industry.find(entry=>entry.id==='nnc06620419').stage,/Completed Phase 1/);
 assert.match(industry.find(entry=>entry.id==='nnc06620419').limitations,/does not state a mechanism/);
 assert.match(industry.find(entry=>entry.id==='dr10624').summary,/GLP-1, glucagon and FGF21/);
 assert.match(industry.find(entry=>entry.id==='cmsd008').stage,/not yet recruiting/i);
 assert.match(industry.find(entry=>entry.id==='cmsd008').limitations,/estimated start was 2 April 2026/);
});

test('enobosarm combination keeps muscle-preservation research separate from results and UK access',()=>{
 assert.equal(enobosarmSemaglutide.publicationStatus,'owner_authorised_factual_publication');
 assert.equal(enobosarmSemaglutide.clinicalApproval,null);
 assert.equal(enobosarmSemaglutide.industryComplete,false);
 assert.equal(enobosarmSemaglutide.automatedMonitorChanges,false);
 const item=industry.find(entry=>entry.id==='enobosarm-semaglutide');
 assert.ok(item);
 assert.equal(item.clinicalApproval,null);
 assert.equal(item.sourceIds.length,0);
 assert.equal(item.additionalEvidence.length,4);
 assert.match(item.stage,/active, not recruiting/);
 assert.match(item.summary,/239 older adults/);
 assert.match(item.summary,/lean and fat mass/);
 assert.match(item.limitations,/no posted results/i);
 assert.match(item.limitations,/Q1 2027/);
 assert.match(item.limitations,/not an endorsement/);
 assert.match(item.ukAuthorisation,/does not establish UK marketing authorisation/);
 assert.match(item.nhsEngland,/No NICE recommendation or NHS England access/);
 assert.match(item.supply,/do(?:es)? not establish lawful UK retail supply/);
});

test('expanded registry wave preserves formulation, status and specialist-indication boundaries',()=>{
 assert.equal(expandedRegistryWave.publicationStatus,'owner_authorised_factual_publication');
 assert.equal(expandedRegistryWave.clinicalApproval,null);
 assert.equal(expandedRegistryWave.industryComplete,false);
 assert.equal(expandedRegistryWave.automatedMonitorChanges,false);
 for(const id of ['mwn109-injection','mwn109-tablets','mwn110','tqf3250','kds2010','tlc6740-tirzepatide','bio101-semaglutide']){
  const item=industry.find(entry=>entry.id===id);
  assert.ok(item,id);
  assert.equal(item.clinicalApproval,null,id);
  assert.equal(item.sourceIds.length,0,id);
  assert.ok(item.additionalEvidence.length>=1,id);
  assert.match(item.ukAuthorisation,/do(?:es)? not establish UK marketing authorisation/,id);
  assert.match(item.nhsEngland,/No NICE recommendation or NHS England access/,id);
  assert.match(item.supply,/lawful UK retail supply/,id);
  assert.match(item.supply,/SHIFT/,id);
 }
 assert.match(industry.find(entry=>entry.id==='mwn109-injection').stage,/not yet recruiting/i);
 assert.match(industry.find(entry=>entry.id==='mwn109-injection').limitations,/no results are posted/i);
 assert.match(industry.find(entry=>entry.id==='mwn109-tablets').summary,/daily and weekly oral dosing/i);
 assert.match(industry.find(entry=>entry.id==='mwn110').limitations,/does not state a mechanism/i);
 assert.match(industry.find(entry=>entry.id==='tqf3250').summary,/actual 25 August 2026 start/i);
 assert.match(industry.find(entry=>entry.id==='kds2010').stage,/Recruiting Phase 2a/);
 assert.match(industry.find(entry=>entry.id==='tlc6740-tirzepatide').limitations,/sponsor-reported/i);
 assert.match(industry.find(entry=>entry.id==='bio101-semaglutide').limitations,/Q1 2027/);
 const ecnoglutide=industry.find(entry=>entry.id==='ecnoglutide');
 assert.match(ecnoglutide.summary,/knee osteoarthritis/i);
 assert.match(ecnoglutide.summary,/actual 3 August 2026 start/i);
 assert.match(ecnoglutide.limitations,/not an additional authorised indication/i);
 assert.equal(expandedRegistryWave.registryEvidence.length,11);
 assert.ok(expandedRegistryWave.registryEvidence.every(record=>record.hasResults===false));
 for(const domain of ['biophytis.com','orsobio.com','neurobiogen.com','sbpgroup.com','lepumedical.com'])assert.ok(discoveryDomains.includes(domain));
});

test('semaglutide specialist research remains distinct from authorised weight-management use',()=>{
 assert.equal(semaglutideSpecialistTrials.publicationStatus,'owner_authorised_factual_publication');
 assert.equal(semaglutideSpecialistTrials.clinicalApproval,null);
 assert.equal(semaglutideSpecialistTrials.industryComplete,false);
 assert.equal(semaglutideSpecialistTrials.automatedMonitorChanges,false);
 const item=industry.find(entry=>entry.id==='semaglutide-specialist-trials');
 assert.ok(item);
 assert.equal(item.group,'research');
 assert.equal(item.clinicalApproval,null);
 assert.equal(item.sourceIds.length,0);
 assert.equal(item.additionalEvidence.length,3);
 assert.match(item.stage,/all not yet recruiting/i);
 assert.match(item.summary,/low-back-pain/i);
 assert.match(item.summary,/arthroplasty/i);
 assert.match(item.summary,/endometrial atypical hyperplasia/i);
 assert.match(item.ukAuthorisation,/do not establish UK marketing authorisation/i);
 assert.match(item.nhsEngland,/No NICE recommendation or NHS England access/i);
 assert.match(item.supply,/does not establish lawful supply/i);
 assert.match(item.limitations,/no posted results/i);
 assert.ok(semaglutideSpecialistTrials.registryEvidence.every(record=>record.overallStatus==='NOT_YET_RECRUITING'));
 assert.ok(semaglutideSpecialistTrials.registryEvidence.every(record=>record.hasResults===false));
});

test('GLIMR COPD remains planned specialist tirzepatide research, not a UK treatment claim',()=>{
 assert.equal(glimrCopd.publicationStatus,'owner_authorised_factual_publication');
 assert.equal(glimrCopd.clinicalApproval,null);
 assert.equal(glimrCopd.industryComplete,false);
 assert.equal(glimrCopd.automatedMonitorChanges,false);
 assert.equal(glimrCopd.configuredSourcePass.status,'current');
 assert.equal(glimrCopd.configuredSourcePass.currentCount,50);
 const item=industry.find(entry=>entry.id==='glimr-copd-tirzepatide');
 assert.ok(item);
 assert.equal(item.group,'research');
 assert.equal(item.clinicalApproval,null);
 assert.equal(item.sourceIds.length,0);
 assert.equal(item.additionalEvidence.length,1);
 assert.match(item.stage,/not yet recruiting/i);
 assert.match(item.summary,/30 adults with COPD/i);
 assert.match(item.summary,/grip strength/i);
 assert.match(item.summary,/lean mass/i);
 assert.match(item.ukAuthorisation,/does not establish UK marketing authorisation/i);
 assert.match(item.nhsEngland,/No NICE recommendation or NHS England access/i);
 assert.match(item.supply,/does not establish lawful supply/i);
 assert.match(item.limitations,/no posted results/i);
 assert.match(item.limitations,/registry estimates/i);
 assert.equal(glimrCopd.registryEvidence.overallStatus,'NOT_YET_RECRUITING');
 assert.equal(glimrCopd.registryEvidence.hasResults,false);
 assert.equal(glimrCopd.registryEvidence.estimatedEnrollment,30);
});

test('specialist registry follow-up separates active research, planned studies and UK access',()=>{
 assert.equal(specialistRegistryFollowup.publicationStatus,'owner_authorised_factual_publication');
 assert.equal(specialistRegistryFollowup.clinicalApproval,null);
 assert.equal(specialistRegistryFollowup.industryComplete,false);
 assert.equal(specialistRegistryFollowup.automatedMonitorChanges,false);
 assert.equal(specialistRegistryFollowup.configuredSourcePass.status,'current');
 assert.equal(specialistRegistryFollowup.configuredSourcePass.currentCount,50);
 const oncology=industry.find(entry=>entry.id==='tirzepatide-endometrial-research');
 assert.ok(oncology);
 assert.equal(oncology.group,'research');
 assert.equal(oncology.clinicalApproval,null);
 assert.equal(oncology.sourceIds.length,0);
 assert.equal(oncology.additionalEvidence.length,2);
 assert.match(oncology.stage,/Early Phase 1 recruiting/);
 assert.match(oncology.stage,/Phase 2 not yet recruiting/);
 assert.match(oncology.summary,/actual 27 April 2026 start/);
 assert.match(oncology.ukAuthorisation,/do not establish UK marketing authorisation/i);
 assert.match(oncology.nhsEngland,/No NICE recommendation or NHS England access/i);
 assert.match(oncology.supply,/does not establish lawful supply/i);
 assert.match(oncology.limitations,/Neither record has posted results/);
 const active=specialistRegistryFollowup.registryEvidence.find(record=>record.nctId==='NCT07065552');
 const planned=specialistRegistryFollowup.registryEvidence.find(record=>record.nctId==='NCT07078838');
 assert.equal(active.overallStatus,'RECRUITING');
 assert.equal(active.actualStart,'2026-04-27');
 assert.equal(active.hasResults,false);
 assert.equal(planned.overallStatus,'NOT_YET_RECRUITING');
 assert.equal(planned.hasResults,false);
 const survodutide=industry.find(entry=>entry.id==='survodutide');
 assert.match(survodutide.summary,/SYNCHRONIZE-HERA/);
 assert.match(survodutide.summary,/600 women/);
 assert.match(survodutide.limitations,/remains not yet recruiting/);
 assert.ok(survodutide.additionalEvidence.some(source=>source.url==='https://clinicaltrials.gov/study/NCT07850050'));
 assert.equal(specialistRegistryFollowup.preservedCandidates[0].status,'not_yet_recruiting_incomplete');
});

test('switching studies remain planned research and do not inflate programme counts',()=>{
 assert.equal(switchingStudies.publicationStatus,'owner_authorised_factual_publication');
 assert.equal(switchingStudies.clinicalApproval,null);
 assert.equal(switchingStudies.industryComplete,false);
 assert.equal(switchingStudies.automatedMonitorChanges,false);
 assert.equal(switchingStudies.configuredSourcePass.status,'current');
 assert.equal(switchingStudies.configuredSourcePass.currentCount,50);
 assert.equal(industry.length,72);
 const zenagamtide=industry.find(entry=>entry.id==='zenagamtide');
 assert.match(zenagamtide.summary,/switching from maintenance semaglutide/);
 assert.match(zenagamtide.summary,/60 adults/);
 assert.match(zenagamtide.limitations,/not yet recruiting/);
 assert.match(zenagamtide.limitations,/no posted results/);
 assert.match(zenagamtide.limitations,/recommended switching regimen/);
 assert.ok(zenagamtide.additionalEvidence.some(source=>source.url==='https://clinicaltrials.gov/study/NCT07855133'));
 const survodutide=industry.find(entry=>entry.id==='survodutide');
 assert.match(survodutide.summary,/SYNCHRONIZE-START/);
 assert.match(survodutide.summary,/350 adults/);
 assert.match(survodutide.summary,/semaglutide or tirzepatide/);
 assert.match(survodutide.limitations,/not yet recruiting/);
 assert.match(survodutide.limitations,/no posted results/);
 assert.match(survodutide.limitations,/estimated start/);
 assert.ok(survodutide.additionalEvidence.some(source=>source.url==='https://clinicaltrials.gov/study/NCT07855900'));
 assert.ok(switchingStudies.registryEvidence.every(record=>record.overallStatus==='NOT_YET_RECRUITING'));
 assert.ok(switchingStudies.registryEvidence.every(record=>record.hasResults===false));
});

test('NA-931 preserves the sponsor and registry discrepancy without implying access or results',()=>{
 assert.equal(na931Publication.publicationStatus,'owner_authorised_factual_publication');
 assert.equal(na931Publication.clinicalApproval,null);
 assert.equal(na931Publication.industryComplete,false);
 assert.equal(na931Publication.automatedMonitorChanges,false);
 assert.equal(na931Publication.configuredSourcePass.currentCount,50);
 assert.equal(na931Publication.registryEvidence.nctId,'NCT06732245');
 assert.equal(na931Publication.registryEvidence.overallStatus,'NOT_YET_RECRUITING');
 assert.equal(na931Publication.registryEvidence.phase,'PHASE2');
 assert.equal(na931Publication.registryEvidence.estimatedStart,'2026-08-15');
 assert.equal(na931Publication.registryEvidence.hasResults,false);
 assert.equal(na931Publication.priorProposal.candidateId,'na931-tirzepatide');
 assert.equal(earlierEloraNa931Proposal.publicationStatus,'proposal_only');
 assert.ok(earlierEloraNa931Proposal.candidates.some(item=>item.id===na931Publication.priorProposal.candidateId));
 assert.equal(industry.filter(item=>item.id==='na931-tirzepatide').length,1);
 const entry=industry.find(item=>item.id==='na931-tirzepatide');
 assert.ok(entry);
 assert.equal(entry.group,'research');
 assert.equal(entry.clinicalApproval,null);
 assert.match(entry.stage,/Phase 2 registry not yet recruiting/);
 assert.match(entry.stage,/Phase 3 programme sponsor-reported/);
 assert.match(entry.summary,/estimated 224 adults/);
 assert.match(entry.limitations,/already-past 15 August 2026 estimated start/);
 assert.match(entry.limitations,/attributed claims/);
 assert.match(entry.ukAuthorisation,/does not establish UK marketing authorisation/);
 assert.match(entry.nhsEngland,/No NICE recommendation or NHS England access/);
 assert.match(entry.supply,/do not establish lawful UK retail supply/);
 assert.equal(entry.sourceIds.length,0);
 assert.equal(entry.additionalEvidence.length,2);
 assert.ok(entry.additionalEvidence.some(source=>source.url==='https://clinicaltrials.gov/study/NCT06732245'));
 assert.ok(entry.additionalEvidence.some(source=>source.url==='https://www.biomedind.com/NA-931.html'));
 assert.ok(discoveryDomains.includes('biomedind.com'));
});
