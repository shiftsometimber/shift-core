// HQ v3 metadata/metric contracts. These do not authenticate supplier receipts,
// execute clinical commands, persist events or introduce another source of truth.
export const CONTRACT_VERSION = 'hq-v3.1-2026-11-06';
export const TIMEZONE = 'Europe/London';
const dateFormatter = new Intl.DateTimeFormat('en-CA', {timeZone:TIMEZONE,year:'numeric',month:'2-digit',day:'2-digit'});
const partsFormatter = new Intl.DateTimeFormat('en-GB', {timeZone:TIMEZONE,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'});
const day = date => dateFormatter.format(date);
const parts = date => Object.fromEntries(partsFormatter.formatToParts(date).map(x => [x.type,x.value]));
function validDay(value) { if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '') || new Date(value+'T00:00:00Z').toISOString().slice(0,10)!==value) throw Error('invalid_date'); return value; }
const addDays = (value, count) => { const d=new Date(validDay(value)+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+count);return d.toISOString().slice(0,10); };
export function londonInstant(value, clock='00:00:00') {
  validDay(value); if(!/^\d{2}:\d{2}:\d{2}(?:\.\d{3})?$/.test(clock))throw Error('invalid_clock');
  const nominal=Date.parse(value+'T'+clock+'Z');if(!Number.isFinite(nominal))throw Error('invalid_clock');
  const matches=[nominal,nominal-3600000].filter(time=>{const p=parts(new Date(time));return p.year+'-'+p.month+'-'+p.day===value&&p.hour+':'+p.minute+':'+p.second===clock.split('.')[0];});
  if(matches.length!==1)throw Error('ambiguous_or_missing_london_time');return new Date(matches[0]).toISOString();
}
export function periodWindow({preset='TODAY',start,end,now=new Date()}={}) {
  now=new Date(now);if(!Number.isFinite(+now))throw Error('invalid_now');
  const today=day(now),[year,month]=today.split('-').map(Number);let first,last=today,until=now.toISOString();
  switch(preset){
    case 'TODAY':first=today;break;
    case 'YESTERDAY':first=last=addDays(today,-1);until=londonInstant(today);break;
    case 'LAST_WEEK':{const dow=new Date(today+'T12:00:00Z').getUTCDay(),monday=addDays(today,-((dow+6)%7));first=addDays(monday,-7);last=addDays(monday,-1);until=londonInstant(monday);break;}
    case 'MTD':first=`${year}-${String(month).padStart(2,'0')}-01`;break;
    case 'QTD':first=`${year}-${String(Math.floor((month-1)/3)*3+1).padStart(2,'0')}-01`;break;
    case 'YTD':first=`${year}-01-01`;break;
    case 'CUSTOM':first=validDay(start);last=validDay(end);if(first>last)throw Error('invalid_range');until=londonInstant(addDays(last,1));break;
    default:throw Error('invalid_period');
  }
  const since=londonInstant(first);if((Date.parse(until)-Date.parse(since))/86400000>367)throw Error('range_too_long');
  return {preset,start:first,end:last,since,until,until_exclusive:true,timezone:TIMEZONE,definition_version:CONTRACT_VERSION};
}
export function comparisonWindow(period,now=new Date()) {
  if(period.definition_version!==CONTRACT_VERSION)throw Error('definition_mismatch');
  const instant=new Date(now),p=parts(instant),clock=p.hour+':'+p.minute+':'+p.second+'.'+String(instant.getUTCMilliseconds()).padStart(3,'0');
  if(period.preset==='TODAY') {const prior=addDays(day(instant),-7);return {label:'Same weekday last week, to the same London time',since:londonInstant(prior),until:londonInstant(prior,clock),timezone:TIMEZONE};}
  if(period.preset==='MTD') {const current=day(instant),m=new Date(current.slice(0,7)+'-01T12:00:00Z');m.setUTCDate(0);const last=m.toISOString().slice(0,10),prior=last.slice(0,8)+String(Math.min(Number(p.day),Number(last.slice(8)))).padStart(2,'0');return {label:'Prior month to the matching London day/time (clamped at month end)',since:londonInstant(last.slice(0,8)+'01'),until:londonInstant(prior,clock),timezone:TIMEZONE};}
  return {status:'unavailable',reason:'Comparison window is not yet configured for this preset.'};
}
export function comparisonDelta(current,previous) {
  const valid=m=>m?.status==='available'&&m.complete===true&&typeof m.value==='number'&&Number.isFinite(m.value);
  if(!valid(current)||!valid(previous)||current.definition_version!==previous.definition_version||current.unit!==previous.unit||current.currency!==previous.currency)return {status:'unavailable',value:null,percent:null,reason:'Both periods need complete sources and the same metric definition, unit and currency.'};
  return {status:'available',value:current.value-previous.value,percent:previous.value===0?null:100*(current.value-previous.value)/Math.abs(previous.value)};
}
const parseTime=value=>{if(typeof value!=='string'||!/(?:Z|[+-]\d\d:\d\d)$/.test(value))return NaN;return Date.parse(value);};
export function transitionTimings(rows,period) {
  const eligible=rows.filter(row=>Number.isFinite(parseTime(row.completed_at))&&parseTime(row.completed_at)>=Date.parse(period.since)&&parseTime(row.completed_at)<Date.parse(period.until));
  const durations=[],excluded={open:rows.filter(r=>!r.completed_at).length,missing_start:0,reversed:0,invalid_completion:rows.filter(r=>r.completed_at&&!Number.isFinite(parseTime(r.completed_at))).length};
  for(const row of eligible){const from=parseTime(row.started_at),to=parseTime(row.completed_at);if(!Number.isFinite(from))excluded.missing_start++;else if(to<from)excluded.reversed++;else durations.push(to-from);}
  durations.sort((a,b)=>a-b);const rank=p=>durations.length?durations[Math.ceil(p*durations.length)-1]:null;
  return {status:durations.length?'available':'unavailable',p50_ms:rank(.5),p95_ms:rank(.95),n:durations.length,eligible_n:eligible.length,coverage:eligible.length?durations.length/eligible.length:null,low_sample:durations.length<20,excluded,cohort:'transition completed within selected period',definition_version:CONTRACT_VERSION};
}
export const AI_ALLOWED_ACTIONS=Object.freeze(['draft_suggestion','summarise_operational_metadata','review_operational_task']);
export function aiActionPolicy(action) {
  const allowed=typeof action==='string'&&AI_ALLOWED_ACTIONS.includes(action);
  return {allowed,requires_human_review:true,execution_permitted:false,reason:allowed?'Suggestion/review only. No consequential execution authority.':'Care, money, publication and sending require their dedicated authorised workflows. Unknown actions are blocked.',policy_version:CONTRACT_VERSION};
}
const featureTypes=new Set(['purchase','journey_stage','engagement','support_outcome']);
const values=Object.freeze({purchase:['shop','medicine'],journey_stage:['pending','assessment_pending','signed','acceptance_pending','accepted','dispensed','dispatched','delivered','query','declined','cancelled','unknown'],engagement:['first_save','returned','helpful','unhelpful','unanswered'],support_outcome:['open','first_human_response','resolved','overdue']});
export function permittedLearningFeature(input,policy,now=new Date()) {
  if(!featureTypes.has(input?.family)||!policy?.permitted_families?.includes(input.family)||policy.consent_or_lawful_basis_verified!==true||policy.deidentified!==true||!policy.purpose_id||!policy.dpia_ref||!policy.access_policy_ref||!Number.isFinite(parseTime(policy.retention_until))||parseTime(policy.retention_until)<=+new Date(now))return {status:'excluded',reason:'Feature family or purpose, lawful basis, de-identification, retention or access evidence missing.'};
  if(!values[input.family].includes(input.value))return {status:'excluded',reason:'Free text and unrecognised feature values are excluded.'};
  // Deliberately do not spread input: assessment answers, Health grants,
  // clinical message bodies and arbitrary payload fields cannot pass through.
  return {status:'permitted',family:input.family,value:input.value,policy:{purpose_id:policy.purpose_id,dpia_ref:policy.dpia_ref,access_policy_ref:policy.access_policy_ref,retention_until:policy.retention_until},definition_version:CONTRACT_VERSION};
}
const refPattern=/^[A-Za-z0-9][A-Za-z0-9._:-]{0,159}$/;
export function hqEventMetadata(event) {
  const required=['event_id','type','schema_version','partition','record_version','occurred_at','received_at','evidence_ref','idempotency_key','correlation_id','actor_ref','org_ref'];
  if(required.some(key=>event?.[key]==null)||event.audience!=='ops_meta'||!['TEST','LIVE'].includes(event.partition)||event.schema_version!==1||!Number.isSafeInteger(event.record_version)||event.record_version<1||!Number.isFinite(parseTime(event.occurred_at))||!Number.isFinite(parseTime(event.received_at)))throw Error('invalid_event_envelope');
  for(const key of ['event_id','type','evidence_ref','idempotency_key','correlation_id','actor_ref','org_ref'])if(!refPattern.test(String(event[key])))throw Error('invalid_event_reference');
  const refs={};for(const key of ['member_ref','case_ref','order_ref','prescription_ref','pharmacy_order_ref','dispense_ref','parcel_ref','payment_ref','refund_ref','exception_ref','task_ref'])if(event.refs?.[key]!=null){if(!refPattern.test(event.refs[key]))throw Error('invalid_linked_reference');refs[key]=event.refs[key];}
  if(!refs.case_ref&&!refs.order_ref&&!refs.pharmacy_order_ref)throw Error('linked_case_or_order_required');
  return Object.fromEntries([...required.map(key=>[key,event[key]]),['audience','ops_meta'],['refs',refs],['causation_id',event.causation_id&&refPattern.test(event.causation_id)?event.causation_id:null]]);
}
