import receipt from './reviews/2026-10-03-credibility-improvements.json' with {type:'json'};
import evidenceDesk from './reviews/2026-10-03-evidence-desk-zp6590.json' with {type:'json'};
import srsd384Publication from './reviews/2026-10-04-authorised-srsd384.json' with {type:'json'};
import rgt075Publication from './reviews/2026-10-04-authorised-rgt075.json' with {type:'json'};
import vct220Publication from './reviews/2026-10-04-authorised-vct220.json' with {type:'json'};
import vk2735Maintenance from './reviews/2026-10-04-authorised-vk2735-maintenance.json' with {type:'json'};
import azelapragDiscontinuation from './reviews/2026-10-04-authorised-azelaprag-discontinuation.json' with {type:'json'};
import taldefgrobepRv8451 from './reviews/2026-10-04-authorised-taldefgrobep-rv8451.json' with {type:'json'};
import foundayoAttainMaintain from './reviews/2026-10-04-authorised-foundayo-attain-maintain.json' with {type:'json'};
import internationalMaintenanceWave from './reviews/2026-10-04-authorised-international-maintenance-wave.json' with {type:'json'};
import novoSpecialistWave from './reviews/2026-10-05-authorised-novo-specialist-wave.json' with {type:'json'};
import petrelintideZupreme from './reviews/2026-10-05-authorised-petrelintide-zupreme-registry.json' with {type:'json'};
import ribupatideSpecialistWave from './reviews/2026-10-05-authorised-ribupatide-specialist-wave.json' with {type:'json'};
import gzc8072Publication from './reviews/2026-10-05-authorised-gzc8072.json' with {type:'json'};
import asc30AuroraCorrection from './reviews/2026-10-05-authorised-asc30-aurora-phase3.json' with {type:'json'};
import te8105Phase2b from './reviews/2026-10-05-authorised-te8105-phase2b.json' with {type:'json'};
export const registrySources=[...receipt.registrySources,...evidenceDesk.registrySources,...srsd384Publication.registrySources,...rgt075Publication.registrySources,...vct220Publication.registrySources,...azelapragDiscontinuation.registrySources,...taldefgrobepRv8451.registrySources,...foundayoAttainMaintain.registrySources,...internationalMaintenanceWave.registrySources,...novoSpecialistWave.registrySources,...petrelintideZupreme.registrySources,...ribupatideSpecialistWave.registrySources,...gzc8072Publication.registrySources,...asc30AuroraCorrection.registrySources,...te8105Phase2b.registrySources];
export const supportSources=receipt.supportSources;
export const credibilitySources=[...registrySources,...supportSources];
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const date=v=>v?new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'long',year:'numeric',timeZone:'Europe/London'}).format(new Date(v)):'Not verified';
export const sourceStatus=state=>({current:'Source unchanged',awaiting_review:'Source review required',check_delayed:'Source check delayed',verification_pending:'Verification pending'}[state]||'Verification pending');
export function evidenceLabel(s) {
  if (/^https:\/\/clinicaltrials.gov\/study\/NCT\d{8}$/.test(s.url)) return 'Trial registry record';
  if (/post-hoc|predicted risk|modelling/i.test(s.checkScope||'')) return 'Post-hoc analysis / modelling — see limitations';
  if (/preclinical/i.test(s.checkScope||'') && !/human/i.test(s.checkScope||'')) return 'Preclinical research — see limitations';
  if (s.evidenceType) return s.evidenceType;
  const host=new URL(s.url).hostname;
  if (host==='www.medicines.org.uk') return 'Official product information';
  if (host==='www.nice.org.uk' || host.endsWith('.nhs.uk')) return 'NICE / NHS guidance or information';
  if (host==='www.gov.uk') return 'Government / regulator communication';
  if (host==='pmc.ncbi.nlm.nih.gov' || host==='pubmed.ncbi.nlm.nih.gov') return 'Published research — see study design';
  return 'Original source — see findings and limitations';
}
export function registryEvidenceMarkup(link,health) {
  const s=registrySources.find(s=>s.url===link.url);
  if(!s)return null;
  const h=health.sources?.find(h=>h.id===s.id);
  const labels={NOT_YET_RECRUITING:'Not yet recruiting',RECRUITING:'Recruiting',ENROLLING_BY_INVITATION:'Enrolling by invitation',ACTIVE_NOT_RECRUITING:'Active, not recruiting',COMPLETED:'Completed',SUSPENDED:'Suspended',TERMINATED:'Terminated',WITHDRAWN:'Withdrawn',UNKNOWN:'Unknown'};
  const lifecycle=s.lifecycle,typedDate=d=>d?`${date(d.date)} (${d.type==='ACTUAL'?'actual':'estimated'})`:'Not recorded';
  return `<li><a href="${esc(s.url)}" rel="noopener noreferrer">${esc(link.title)}</a><small>Trial registry record · Last reviewed record: ${labels[lifecycle.status]||'Unknown'} · ${lifecycle.hasResults?'Results posted; outcomes need separate assessment':'No results posted at record-status review'} · First posted ${date(s.sourcePublishedAt)} · Updated ${date(s.sourceUpdatedAt)}</small><small>Start ${typedDate(lifecycle.start)} · Primary completion ${typedDate(lifecycle.primaryCompletion)} · Completion ${typedDate(lifecycle.completion)}${lifecycle.whyStopped?' · Stopping reason: '+esc(lifecycle.whyStopped):''}</small><small>Medical evidence summary reviewed ${date(link.reviewedAt)} · Record status reviewed ${date(s.reviewedAt)} · ${sourceStatus(h?.status)} · These are the dated reviewed facts, not a newly assessed live record. Status checks do not assess clinical outcomes.</small></li>`;
}
export function industryReviewFlag(entry,health,now=Date.now()) {
  const ids=[...entry.sourceIds,...registrySources.filter(s=>s.entryIds.includes(entry.id)).map(s=>s.id)];
  const states=ids.map(id=>health.sources?.find(s=>s.id===id)?.status||'verification_pending');
  const overdue=now-Date.parse(entry.reviewedAt)>7*24*60*60*1000;
  if(overdue)return '<p class="mw-flag">This evidence summary is due for factual review. A successful source check does not renew it.</p>';
  if(states.some(s=>s!=='current'))return '<p class="mw-flag">Some evidence checks need attention or are pending. This is the dated reviewed summary; check the original record for the latest position.</p>';
  return '';
}
export const changes=[
 {date:'2026-10-05',kind:'New Phase 2b registry record',text:'Added TE-8105 after its sponsor-submitted Phase 2b obesity record was first posted on 5 October. The study remains not yet recruiting: its October start, 204-participant enrolment and February 2028 completion are estimates, and no results are posted. The catalogue now contains 101 programmes.',anchor:'industry-te8105'},
 {date:'2026-10-05',kind:'Oral peptide formulation gap corrected',text:'Promoted the previously proposed oral ASC36 entry after the original sponsor page became directly readable. The sponsor reports US Phase 1 initiation after IND clearance and plans 86 participants, but does not identify first dosing or recruitment status; exact-name registry searches still return no public record. Animal findings are not presented as human results. The catalogue now contains 100 programmes.',anchor:'industry-asc36-oral'},
 {date:'2026-10-05',kind:'Paused combination omission corrected',text:'Added ARD-201 after a later primary filing confirmed that POWER began in December 2025 and that POWER and the planned STRENGTH trial were voluntarily paused on 27 February 2026. The FDA hold applies to the ARD-101 IND; ARD-201 contains ARD-101, so further timing depends on resolving that hold and future regulatory discussions. No restart, termination, results, UK access or supply is inferred. The catalogue now contains 99 programmes.',anchor:'industry-ard201'},
 {date:'2026-10-05',kind:'ASC30 Phase III stage corrected',text:'Updated oral ASC30 from completed Phase II evidence to the recruiting global Phase III AURORA programme after primary sponsor and registry review. AURORA-1 and AURORA-2 keep their non-diabetes and type 2 diabetes populations separate; estimated enrolment, planned results and submissions are not presented as actual enrolment, results or approvals. The catalogue remains 98 programmes.',anchor:'industry-asc30-oral'},
 {date:'2026-10-05',kind:'Once-weekly oral-peptide omission corrected',text:'Added GZC8072 after the primary registry confirmed recruiting Phase 1 research with an actual 2 September start. The later 126-person registry estimate and earlier 112-person sponsor plan remain distinct; clinical-trial permission, first dosing and secondary weight outcomes are not presented as results, marketing authorisation, UK access or supply. The catalogue now contains 98 programmes.',anchor:'industry-gzc8072'},
 {date:'2026-10-05',kind:'Ribupatide specialist-indication and formulation coverage',text:'Added seven monitored registry records across injection, tablet, adolescent, sleep-apnoea, cardiovascular and MASH research, plus Hengrui’s sponsor-reported PCOS/PMOS Phase 2 results. The older registry discrepancy, absent registry-posted results and indication-specific limitations remain explicit; the catalogue stays at 97 programmes.',anchor:'industry-ribupatide-injection'},
 {date:'2026-10-05',kind:'Sponsor announcement and registry status reconciled',text:'Added the three Phase III ZUPREME records to Petrelintide. The sponsor describes programme initiation, while all three records remain not yet recruiting with passed estimated start dates, no listed locations and no posted results; specialist diabetes and cardiovascular studies are not presented as completed benefits.',anchor:'industry-petrelintide'},
 {date:'2026-10-05',kind:'Programme-level Novo and specialist-indication correction',text:'Added recruiting first-in-human NNC0721-8060, corrected NNC0662-0419 from a single completed Phase 1 record to its six-record programme including two Phase 2 obesity studies and a separate type 2 diabetes study, and added survodutide type 2 diabetes Phase 3 research. None of the reviewed records has posted results, and specialist-indication research is not presented as UK authorisation or completed weight-management evidence. The catalogue now contains 97 programmes.',anchor:'industry-nnc07218060'},
 {date:'2026-10-04',kind:'International maintenance and combination evidence',text:'Added the separately staged ZYNERGY petrelintide–enicepatide combination and monitored ASCEND-1 and ACCOMPLISH-2 registry records. Estimated dates are not treated as completed events; none of the three records has posted results. The catalogue now contains 96 programmes.',anchor:'industry-zynergy-petrelintide-enicepatide'},
 {date:'2026-10-04',kind:'Switching and maintenance evidence',text:'Added the peer-reviewed ATTAIN-MAINTAIN study and its monitored registry lifecycle to Foundayo. The US trial used an investigational capsule and placebo rescue design after injectable tirzepatide or semaglutide; it is not a UK dosing or switching recommendation.',anchor:'foundayo'},
 {date:'2026-10-04',kind:'Muscle-preservation and oral discovery',text:'Added taldefgrobep alfa as active, not-recruiting Phase 2 research with an automatically monitored registry lifecycle, and RV-8451 as a separate preclinical oral GLP-1 programme. Estimated completion and planned IND timing are not treated as completed results. The catalogue now contains 95 programmes.',anchor:'industry-taldefgrobep-alfa'},
 {date:'2026-10-04',kind:'Discontinued programme added',text:'Added azelaprag after primary review of the terminated STRIDES Phase 2 study and BioAge’s later programme termination. The registry has no posted results; no efficacy or muscle-preservation outcome is claimed. The catalogue now contains 93 programmes.',anchor:'industry-azelaprag'},
