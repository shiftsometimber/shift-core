import {TEST_ACCOUNT_SQL,reportingWindow} from '../activation-measurement/scorecard.mjs';
const dateFormat=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/London',year:'numeric',month:'2-digit',day:'2-digit'});
const instant=value=>{if(typeof value==='string'&&/^\d{4}-\d\d-\d\d \d\d:/.test(value))value=value.replace(' ','T')+'Z';const n=new Date(value).getTime();return Number.isFinite(n)?n:null};
export const londonDay=value=>{const n=instant(value);return n===null?null:Math.floor(Date.parse(dateFormat.format(new Date(n))+'T00:00:00Z')/86400000)};
const unavailable=reason=>({status:'unavailable',numerator:null,denominator:null,ratePct:null,reason});
const ratio=(n,d,status='not_yet_eligible')=>({status:d?'observed':status,numerator:n,denominator:d,ratePct:d?Math.round(10000*n/d)/100:null});
const outcomes=new Set(['helped','not-fit','not-tried','skip']);
const answers=new Set(['helped','not-fit','not-tried']);
export function summariseContinuity({exposures=[],actions=[],episodes=[],asOf=new Date().toISOString(),since='1970-01-01',activityAvailable=true,episodesAvailable=true}){
 const now=instant(asOf),today=londonDay(asOf),first=new Map();
 for(const e of exposures){const at=instant(e.at);if(at===null||at>now)continue;if(!first.has(e.userId)||at<first.get(e.userId))first.set(e.userId,at)}
 const cohort=new Map([...first].filter(([,at])=>at>=instant(since)).map(([id,at])=>[id,londonDay(at)]));
 const returns=(start,end)=>{if(!activityAvailable)return unavailable('Saved-action source unavailable.');let eligible=0,returned=0;for(const [id,day] of cohort){if(today<day+end)continue;eligible++;if(actions.some(a=>a.userId===id&&instant(a.at)<=now&&londonDay(a.at)>=day+start-1&&londonDay(a.at)<=day+end-1))returned++}return ratio(returned,eligible,cohort.size?'not_yet_eligible':'awaiting_first_today_exposure')};
 const distinct=new Map();
 for(const e of episodes){const at=instant(e.at);if(at===null||at>now)continue;const key=e.userId+':'+e.id;const old=distinct.get(key);if(!old)distinct.set(key,{...e,reviews:[...(e.reviews||[])]});else{old.at=instant(old.at)<at?old.at:e.at;old.reviews.push(...(e.reviews||[]))}}
 let eligibleEpisodes=0,answered=0,helped=0;
 for(const e of distinct.values()){if(instant(e.at)<instant(since))continue;eligibleEpisodes++;const last=(e.reviews||[]).filter(r=>outcomes.has(r.outcome)&&instant(r.at)!==null&&instant(r.at)>=instant(e.at)&&instant(r.at)<=now).sort((a,b)=>instant(a.at)-instant(b.at)).at(-1);if(last&&answers.has(last.outcome)){answered++;if(last.outcome==='helped')helped++}}
 return {version:'continuity-first-today-v1',asOf,timezone:'Europe/London',cohortSince:since,todayStarters:cohort.size,
  day1Loop:unavailable('Meal selection is not evidence of eating. The four completed stages cannot currently be established.'),
  week1:{...returns(2,7),window:'Days 2–7; full Day 7 must have ended.'},week4:{...returns(22,28),window:'Days 22–28; full Day 28 must have ended.'},
  helped:episodesAvailable?ratio(helped,answered,'no_answered_episodes'):unavailable('Help-episode source unavailable.'),
  feedbackCoverage:episodesAvailable?{...ratio(answered,eligibleEpisodes,'no_eligible_episodes'),unanswered:eligibleEpisodes-answered}:unavailable('Help-episode source unavailable.'),
  medicationElsewhere:unavailable('No explicit cohort segment capture is available. Prescription/provider details are not inferred.'),
  recruitment:unavailable('Invitation and enrolment register not supplied.'),openMemberP0s:unavailable('A reviewed issue register is required.'),
  decision:{status:'not_assessed',reason:'Success thresholds have not been set; this report cannot open the expansion gate.'},
  privacy:'Aggregate only; no identities, health measurements, free text or episode contents returned.',
  definitions:{exposure:'First acknowledged visible Today panel, including members who never complete a check-in. Prospective capture; no registration/login backfill.',meaningfulAction:'Retained check-ins, completed Fit/Next Shift actions and feedback on saved help. Login, refresh, planning and meal selection do not count.',episodes:'Persisted help offered by check-in/Next Shift, de-duplicated by linked episode ID; latest response per episode; skipping the question is unanswered. Window is episode delivery date.',helped:'Member-reported product signal, not clinical efficacy.'},
  limitations:['Historical first Today exposure is unavailable before this instrumentation.','Browser acknowledgement is evidence of rendering, not independent proof of attention.','Retained Fit entries are capped by the existing product; erasure or overwritten records can reduce historical evidence.','Unlabelled staff/test identities cannot be excluded reliably.']};
}
const parse=value=>{try{return JSON.parse(value||'{}')}catch{return {}}};
export async function continuityScorecard(DB,options={}){
 const window=reportingWindow(options),tables=new Set((await DB.prepare("SELECT name FROM sqlite_master WHERE type='table'").all()).results.map(r=>r.name));
 if(!['users','audit_log','product_events'].every(t=>tables.has(t)))return {available:false,...window,status:'unavailable',reason:'First Today exposure evidence is unavailable.'};
 const staff=tables.has('hq_users')?" AND NOT EXISTS(SELECT 1 FROM hq_users h WHERE lower(h.email)=lower(u.email))":'';
 const eligible=`SELECT u.id FROM users u WHERE NOT ${TEST_ACCOUNT_SQL}${staff}`;
 const exposures=(await DB.prepare(`SELECT e.user_id userId,e.occurred_at at FROM product_events e WHERE e.event_name='continuity_today_exposed' AND e.source='member_client' AND e.user_id IN (${eligible})`).all()).results;
 const actions=[],episodes=[];
 if(tables.has('check_ins'))for(const r of (await DB.prepare(`SELECT user_id,submitted_at FROM check_ins WHERE case_id IS NULL AND user_id IN (${eligible})`).all()).results)actions.push({userId:r.user_id,at:r.submitted_at});
 if(tables.has('member_state'))for(const r of (await DB.prepare(`SELECT user_id,preferences FROM member_state WHERE user_id IN (${eligible})`).all()).results){
  const p=parse(r.preferences),life=p.lifeBack?.progress||{};
  for(const e of life.entries||[])actions.push({userId:r.user_id,at:e.at});
  for(const e of Object.values(p.fitJourney?.entries||{}))if(e.status==='done'&&e.updatedAt)actions.push({userId:r.user_id,at:e.updatedAt});
  for(const e of [...(life.shiftHistory||[]),...(life.nextShift?[life.nextShift]:[])]){
   episodes.push({userId:r.user_id,id:'loop:'+e.id,at:e.createdAt,reviews:e.reviews||[]});
   if(e.completedAt)actions.push({userId:r.user_id,at:e.completedAt});
   for(const review of e.reviews||[])if(answers.has(review.outcome))actions.push({userId:r.user_id,at:review.at});
  }
 }
 if(tables.has('daily_checkin_actions'))for(const r of (await DB.prepare(`SELECT a.user_id,a.id,a.action_json,a.created_at,a.feedback,a.reviewed_at FROM daily_checkin_actions a JOIN check_ins c ON c.id=a.checkin_id AND c.user_id=a.user_id WHERE c.case_id IS NULL AND a.user_id IN (${eligible})`).all()).results){
  const action=parse(r.action_json),reviews=outcomes.has(r.feedback)&&r.reviewed_at?[{at:r.reviewed_at,outcome:r.feedback}]:[];
  episodes.push({userId:r.user_id,id:action.loopId?'loop:'+action.loopId:'checkin:'+r.id,at:r.created_at,reviews});
  for(const review of reviews)if(answers.has(review.outcome))actions.push({userId:r.user_id,at:review.at});
 }
 return {available:true,...summariseContinuity({exposures,actions,episodes,asOf:window.asOf,since:window.since,activityAvailable:['check_ins','member_state','daily_checkin_actions'].every(t=>tables.has(t)),episodesAvailable:['check_ins','member_state','daily_checkin_actions'].every(t=>tables.has(t))})};
}
