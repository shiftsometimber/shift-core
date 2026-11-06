// Read models over existing authorities. No clinical, member or order store.
import {CONTRACT_VERSION,TIMEZONE,londonInstant,permittedLearningFeature} from './hq-v3-contracts.mjs';
import {serviceJobHealth} from './hq-service-job-runs.mjs';
export const unavailable=(reason,owner='Operations owner')=>({status:'unavailable',value:null,reason,owner});
const londonDay=at=>new Intl.DateTimeFormat('en-CA',{timeZone:TIMEZONE,year:'numeric',month:'2-digit',day:'2-digit'}).format(at);
const validDay=value=>typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value)&&Number.isFinite(Date.parse(value+'T12:00:00Z'))&&new Date(value+'T12:00:00Z').toISOString().slice(0,10)===value;
const nextDay=value=>new Date(Date.parse(value+'T12:00:00Z')+86400000).toISOString().slice(0,10);
export function parseCalendar(input){
 if(typeof input==='string'){try{input=JSON.parse(input)}catch{return null}}
 if(!input||input.timezone!==TIMEZONE||!input.version||!input.approval_ref||!validDay(input.valid_from)||!validDay(input.valid_until)||input.valid_from>input.valid_until||!Array.isArray(input.holidays)||input.holidays.some(x=>!validDay(x)))return null;
 return {timezone:TIMEZONE,version:input.version,approval_ref:input.approval_ref,valid_from:input.valid_from,valid_until:input.valid_until,holidays:[...new Set(input.holidays)],weekdays:[1,2,3,4,5],opens:'09:00:00',closes:'17:00:00',response_business_minutes:480};
}
export function firstResponseDeadline(created,configuration){
 const calendar=parseCalendar(configuration);let cursor=Date.parse(created);
 if(!calendar||!Number.isFinite(cursor))return unavailable('An approved versioned support calendar with holiday coverage is required.','Support owner');
 let remaining=480;
 for(let guard=0;guard<370;guard++){
  const day=londonDay(new Date(cursor));if(day<calendar.valid_from||day>calendar.valid_until)return unavailable('The request or due date falls outside the approved calendar coverage.','Support owner');
  const weekday=new Date(day+'T12:00:00Z').getUTCDay();
  if(weekday>0&&weekday<6&&!calendar.holidays.includes(day)){
   const open=Date.parse(londonInstant(day,'09:00:00')),close=Date.parse(londonInstant(day,'17:00:00'));cursor=Math.max(cursor,open);
   if(cursor<close){const available=(close-cursor)/60000;if(remaining<=available)return {status:'available',due_at:new Date(cursor+remaining*60000).toISOString(),calendar_version:calendar.version,approval_ref:calendar.approval_ref,timezone:TIMEZONE,basis:'Eight business hours to first human response; not a resolution promise.'};remaining-=available;}
  }
  cursor=Date.parse(londonInstant(nextDay(day)));
 }
 return unavailable('Support calendar could not produce a due date.','Support owner');
}
export function demographicAggregates(rows,{asOf=new Date(),minimumCellSize,policyReference,complete=true}={}){
 if(!Number.isInteger(minimumCellSize)||minimumCellSize<5||!policyReference)return unavailable('Approved aggregate privacy policy and minimum cell size (at least five) are required.','Privacy owner');
 if(!complete)return unavailable('The bounded source is incomplete. Totals and percentages are withheld.','Member data owner');
 const today=londonDay(new Date(asOf)),bands={'18–24':0,'25–34':0,'35–44':0,'45–54':0,'55–64':0,'65+':0,Unavailable:0};
 for(const row of rows){
  if(!validDay(row.date_of_birth)||row.date_of_birth>today){bands.Unavailable++;continue;}
  let age=Number(today.slice(0,4))-Number(row.date_of_birth.slice(0,4));if(today.slice(5)<row.date_of_birth.slice(5))age--;
  if(age<18||age>120){bands.Unavailable++;continue;}
  bands[age<25?'18–24':age<35?'25–34':age<45?'35–44':age<55?'45–54':age<65?'55–64':'65+']++;
 }
 // Suppress the whole family, including totals/coverage, if a nonempty tiny
 // cell could be recovered by subtraction. No individual drill or crosscuts.
 const suppressed=Object.values(bands).some(n=>n>0&&n<minimumCellSize);
 return {status:suppressed?'suppressed':'available',definition_version:CONTRACT_VERSION,partition:'TEST',as_of:today,population:'Fictional member directory excluding matching HQ staff emails; not an active-member count.',policy_reference:policyReference,minimum_cell_size:minimumCellSize,total:suppressed?null:rows.length,coverage:suppressed||!rows.length?null:(rows.length-bands.Unavailable)/rows.length,age_bands:Object.entries(bands).map(([label,count])=>({label,count:suppressed?null:count,status:suppressed?'suppressed':'available'})),region:unavailable('No approved nation/region mapping is connected. Full postcode and street address are never returned.','Member data owner'),privacy:'Aggregate only. No DOB, member identifier, postcode, individual drill or crosscut.',comparison_permitted:false};
}
export function scenarioProjection(input){
 const allowed=new Set(['version','orders','unit_price_pence','unit_cost_pence','fixed_cost_pence','currency']);
 if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>!allowed.has(k))||!/^TEST-[A-Za-z0-9._-]{1,70}$/.test(input.version||'')||input.currency!=='GBP')throw Error('invalid_scenario');
 const integer=(v,max)=>Number.isSafeInteger(v)&&v>=0&&v<=max;
 if(!integer(input.orders,1000000)||!integer(input.unit_price_pence,100000000)||input.unit_cost_pence!=null&&!integer(input.unit_cost_pence,100000000)||input.fixed_cost_pence!=null&&!integer(input.fixed_cost_pence,100000000000))throw Error('invalid_scenario');
 const sales=input.orders*input.unit_price_pence,hasCosts=input.unit_cost_pence!=null&&input.fixed_cost_pence!=null;
 const contribution=hasCosts?sales-input.orders*input.unit_cost_pence-input.fixed_cost_pence:null;
 if(!Number.isSafeInteger(sales)||contribution!==null&&!Number.isSafeInteger(contribution))throw Error('invalid_scenario');
 return {status:'hypothetical',partition:'TEST',version:input.version,currency:'GBP',inputs:Object.fromEntries([...allowed].filter(k=>Object.hasOwn(input,k)).map(k=>[k,input[k]])),assumed_sales_pence:sales,assumed_contribution:hasCosts?{status:'hypothetical',value:contribution,unit:'pence'}:unavailable('Unit and fixed costs must both be explicit assumptions.','Finance owner'),sensitivity:[.8,1,1.2].map(factor=>({orders:Math.round(input.orders*factor),assumed_sales_pence:Math.round(input.orders*factor)*input.unit_price_pence})),label:'ASSUMPTIONS ONLY — not today’s revenue, accounting profit or bank cash. No SaaS income.',saved:false,execution_permitted:false};
}
export const METRIC_DICTIONARY=Object.freeze([
 ['captured','Processor captures','Verified capture receipt event-time','Finance owner','pence','Capture receipt source not connected'],
 ['accounting','Accounting revenue','Ledger recognition date','Finance owner','pence','Accounting source not connected'],
 ['cash','Bank cash','Bank booking date and as-of balance','Finance owner','pence','Bank source not connected'],
 ['contribution','Contribution','Matched receipts and complete cost basis','Finance owner','pence','Unavailable if any required cost is unknown'],
 ['purchase_lines','Commercial purchase lines','Orders created in selected period','Commerce owner','lines','Not processor captures or accounting revenue'],
 ['member_age','Member age bands','Directory snapshot at London as-of date','Member data owner','members','Missing DOB retained; aggregate policy required'],
 ['support_due','First human support response due','Original creation + approved business calendar','Support owner','timestamp','Bot acknowledgement never stops clock'],
 ['rx_p95','Completed Rx transition p95','Transition-end cohort in selected period','Clinical operations owner','milliseconds','Nearest rank; open clocks excluded; n and exclusions required'],
 ['job_success','Service job last successful execution','Recorded job completion event','Infrastructure owner','timestamp','Enabled, execution outcome and source freshness are distinct'],
 ['ai_coverage','Permitted learning feature coverage','Approved de-identified source features','AI/privacy owner','features','No clinical bodies, free text or implicit Health access']
].map(([key,label,basis,owner,unit,limitation])=>({key,label,basis,owner,unit,limitation,definition_version:CONTRACT_VERSION,timezone:TIMEZONE,partition:'TEST',denominator:'Source-specific eligible records; missing coverage is explicit',freshness:'As-of and source success must be reported; schema mapping is not freshness'})));
export async function memberDemographics(DB,policy,now=new Date()){
 if(!policy?.approval_ref||!Number.isInteger(policy.minimum_cell_size)||policy.minimum_cell_size<5)return unavailable('Approved aggregate privacy policy and minimum cell size are required.','Privacy owner');
 try{
  const rows=(await DB.prepare("SELECT u.date_of_birth FROM users u WHERE (lower(trim(u.email)) LIKE '%@example.invalid' OR lower(trim(u.email)) LIKE '%@example.test') AND NOT EXISTS(SELECT 1 FROM hq_users h WHERE lower(trim(h.email))=lower(trim(u.email))) ORDER BY u.id LIMIT 10001").all()).results||[];
  return demographicAggregates(rows,{asOf:now,minimumCellSize:policy.minimum_cell_size,policyReference:policy.approval_ref,complete:rows.length<=10000});
 }catch{return unavailable('Canonical member schema or staff exclusion source is unavailable.','Member data owner');}
}
export async function memberDemographicSources(DB,demographics,now=new Date()){
 try{
  const columns=(await DB.prepare('PRAGMA table_info(users)').all()).results||[];
  if(!columns.length)return unavailable('The authoritative member-profile schema was not found. Map its existing service before reporting demographics.','Member data owner');
  const names=new Set(columns.map(x=>x.name));
  return {status:'available',partition:'TEST',observed_at:new Date(now).toISOString(),owner:'Member data owner',source:'Existing users profile schema; no clinical assessment source',fields:['date_of_birth','postcode','region','nation'].map(column=>({table:'users',column,present:names.has(column),state:names.has(column)?'field_proven':'not_present'})),age_coverage:{status:demographics?.status||'unavailable',value:typeof demographics?.coverage==='number'?demographics.coverage:null,definition:'Validated age coverage in the same privacy-protected directory snapshot; never a clinical-body backfill.'},region_mapping:{status:'unavailable',value:null,owner:'Member data owner / engineering',reason:'No approved nation/region taxonomy is connected. A postcode column alone does not establish a region.',next_action:'Map the existing member-profile postcode to an approved outward-code/nation/region source; retain unknowns and aggregate suppression.'},clinical_bodies_read:false};
 }catch{return unavailable('The authoritative profile schema could not be inspected. Do not infer fields from a mock or an assessment.','Member data owner');}
}
export async function supportMetadata(DB,calendar,now=new Date()){
 try{
  const rows=(await DB.prepare("SELECT t.reference,t.status,t.priority,t.created_at,t.updated_at,h.name owner_name,h.status owner_status FROM support_tickets t JOIN users u ON u.id=t.user_id LEFT JOIN hq_users h ON h.id=t.assigned_hq_user_id WHERE t.reference GLOB 'TEST-*' AND lower(u.email) LIKE '%@example.invalid' ORDER BY t.created_at,t.id LIMIT 501").all()).results||[];
  return {status:rows.length>500?'partial':'available',partition:'TEST',calendar:parseCalendar(calendar),records:rows.slice(0,500).map(r=>{const due=firstResponseDeadline(r.created_at,calendar);return {reference:r.reference,status:r.status,priority:r.priority,owner:r.owner_status==='active'?r.owner_name:null,owner_required:r.owner_status!=='active',original_created_at:r.created_at,updated_at:r.updated_at,deadline:due,deadline_elapsed:due.status==='available'&&Date.parse(due.due_at)<+now,first_human_response:unavailable('Canonical first-human-response receipt is not yet mapped. Do not infer response from updated_at, assignment or bot acknowledgement.','Support owner'),next_action:'Open the existing support ticket; confirm first human response and accountable cover.',view:'support'};}),privacy:'No subjects, member identities, clinical text or message bodies.',coverage:{limit:500,has_more:rows.length>500}};
 }catch{return unavailable('Support source query or owner mapping is unavailable.','Support owner');}
}
export async function staffMfaMetadata(DB,{partition='TEST'}={}){
 if(!['TEST','LIVE'].includes(partition))throw Error('invalid_projection_scope');
 try{
  const filter=partition==='TEST'?"lower(email) LIKE '%@example.invalid'":"length(trim(email))>0 AND lower(trim(email)) NOT LIKE '%@example.invalid' AND lower(trim(email)) NOT LIKE '%@example.test'";
  const row=await DB.prepare("SELECT COUNT(*) active,COALESCE(SUM(CASE WHEN mfa_enabled=1 THEN 1 ELSE 0 END),0) enrolled FROM hq_users WHERE status='active' AND "+filter).first();
  const active=Number(row.active),enrolled=Number(row.enrolled);
  return {status:'available',partition,active,enrolled,without_mfa:active-enrolled,coverage:active?enrolled/active:null,owner:'Owner/admin',source:partition==='TEST'?'Existing hq_users auth state; fictional staff only':'Existing active HQ staff directory; known example-domain test identities excluded. Directory enrolment is not fresh-device or professional-role verification.',view:'users',waive_permitted:false,professional_mfa_unchanged:true};
 }catch{return unavailable('Staff authentication state could not be read.','Owner/admin');}
}
export async function businessSourceHealth(DB,{partition='TEST'}={}){
 if(!['TEST','LIVE'].includes(partition))throw Error('invalid_projection_scope');
 const jobs=await serviceJobHealth(DB);
 return {status:jobs.some(j=>j.state==='unavailable')?'partial':'available',partition,jobs,source_freshness:unavailable('Job execution is not proof of upstream data freshness. Source receipts and backlog must be connected.','Infrastructure owner'),sources:[['accounting','Finance owner'],['bank','Finance owner'],['costs','Finance owner'],['analytics','Growth owner'],['supplier_receipts','Supplier integration owner'],['device_receipt','Notification owner']].map(([key,owner])=>({key,...unavailable('Authoritative connected-source evidence remains unverified.',owner)}))};
}
export function learningCatalogue(configuration,now=new Date()){
 const catalogue=['purchase','journey_stage','engagement','support_outcome'].map(family=>{const value={purchase:'shop',journey_stage:'pending',engagement:'returned',support_outcome:'open'}[family];const check=permittedLearningFeature({family,value},configuration,now);return {family,status:check.status==='permitted'?'policy_ready_producer_unverified':'excluded',reason:check.reason||'Policy is eligible; actual de-identification and producer coverage still require evidence.',training_rows:null};});
 return {status:'unavailable',catalogue,clinical_bodies_permitted:false,health_access_implied:false,execution_permitted:false,reason:'No persistent learning producer is connected by this read model. Policy readiness does not establish de-identification or training coverage.',owner:'AI/privacy owner',definition_version:CONTRACT_VERSION};
}
