import {RECIPES,suitable,suitabilityReasons} from './content.mjs';
export const RULE_VERSION='programme-rules-1.0.2';
export const clone=x=>structuredClone(x);
export const dateAdd=(day,n)=>{const d=new Date(day+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10)};
export const weekStart=day=>{const d=new Date(day+'T12:00:00Z');return dateAdd(day,-((d.getUTCDay()+6)%7))};
export const periodStart=(state,day)=>{const first=dateAdd(state.anchor,1),weeks=Math.floor((Date.parse(day+'T12:00:00Z')-Date.parse(first+'T12:00:00Z'))/604800000);return dateAdd(first,weeks*7)};
export const planningStart=state=>dateAdd(state.anchor,Math.max(0,Math.floor((Date.parse(state.clock+'T12:00:00Z')-Date.parse(state.anchor+'T12:00:00Z'))/604800000))*7+1);
export const dayLabel=key=>({mon:'Monday',tue:'Tuesday',wed:'Wednesday',thu:'Thursday',fri:'Friday',sat:'Saturday',sun:'Sunday'})[key.split('-')[0]]||key;
export function requirements(slots,start,end,catalogue=RECIPES){
 const needs={};
 const reserved={};
 for(const leftover of slots.filter(s=>s.kind==='leftovers'&&s.date>=start&&s.date<=end)){
  const source=slots.find(s=>s.id===leftover.sourceId);
  if(!source||source.kind!=='meal'||source.date>leftover.date||!Number.isFinite(leftover.servings)||leftover.servings<=0)throw new Error('Confirm the source meal and reserved portions before updating this list.');
  reserved[source.id]=(reserved[source.id]||0)+leftover.servings;
  if(!Number.isFinite(source.serveNow)||source.serveNow+reserved[source.id]>source.servings)throw new Error('The cooking quantity must cover the portions eaten then and the saved leftovers.');
 }

 for(const s of slots.filter(s=>s.kind==='meal'&&s.date>=start&&s.date<=end)){
  const r=catalogue[s.recipeId];
  if(!r || !Number.isFinite(s.servings)||s.servings<=0) throw new Error('Incomplete recipe or serving information. Your saved list has been kept.');
  for(const i of r.ingredients){
   if(!i.unit || !Number.isFinite(i.quantity))throw new Error('Ingredient quantity is missing. Your saved list has been kept.');
   const key=i.id+'|'+i.unit,n=needs[key]??{key,id:i.id,name:i.name,unit:i.unit,quantity:0};
   n.quantity=Math.round((n.quantity+i.quantity*s.servings/r.serves)*1000)/1000;needs[key]=n;
  }
 }
 return needs;
}
export function diffNeeds(before,after){return [...new Set([...Object.keys(before),...Object.keys(after)])].sort().map(key=>({...after[key]||before[key],before:before[key]?.quantity||0,after:after[key]?.quantity||0})).filter(i=>i.before!==i.after)}
export function shopping(state,start,end){
 const needs=requirements(state.slots,start,end),periodKey=start+'..'+end;
 for(const [key,x] of Object.entries(state.acquired[periodKey]||{})){if(needs[key]||!x.quantity)continue;const i=Object.values(RECIPES).flatMap(r=>r.ingredients).find(i=>i.id+'|'+i.unit===key);if(i)needs[key]={...i,key,quantity:0,noLongerNeeded:true}}
 return {start,end,items:Object.values(needs).sort((a,b)=>a.name.localeCompare(b.name)).map(i=>{const x=state.acquired[periodKey]?.[i.key]||{status:'unknown',quantity:0};return {...i,status:x.status,acquired:x.quantity,remaining:Math.max(0,i.quantity-x.quantity)}}),manual:state.manualItems.filter(i=>i.period===periodKey)};
}
// Current saved-plan conditions are uncapped and never subject to proposal/decline gates.
// Keep every saved occurrence intact. A condition is not consent to substitute a meal.
export function planConditions(state,{fixtureMode=false,now=state.clock}={}){
 return state.slots.filter(s=>s.date>=now&&['meal','leftovers'].includes(s.kind)).flatMap(slot=>{
  const source=slot.kind==='leftovers'?state.slots.find(s=>s.id===slot.sourceId&&s.kind==='meal'):slot;
  const recipe=RECIPES[source?.recipeId],reasons=suitabilityReasons(recipe,state.preferences,{fixtureMode});
  if(recipe&&source.recipeVersion!==recipe.version)reasons.push({code:'recipe-version',text:'The saved recipe version needs checking against the current content record.'});
  return reasons.length?[{id:`condition:${slot.id}`,slotId:slot.id,slotKey:slot.slotKey,date:slot.date,recipeId:source?.recipeId||null,recipeName:recipe?.name||'Unavailable recipe',sourceId:source?.id||null,reasons}]:[];
 }).sort((a,b)=>a.date.localeCompare(b.date)||a.slotId.localeCompare(b.slotId));
}
export function evaluate(state,{fixtureMode=false,now=state.clock}={}){
 const conditions=planConditions(state,{fixtureMode,now}),blockedKeys=new Set(conditions.map(c=>c.slotKey));
 const trace=[],suppressed=[],candidates=[],periods=[...new Set(state.reports.map(r=>r.period).filter(p=>p<=now))].sort().slice(-2);
 const current=periods.at(-1),latest=state.reports.filter(r=>r.period===current),future=state.slots.filter(s=>s.date>now);
 const keys=[...new Set([...future.map(s=>s.slotKey),...(state.requests||[]).map(r=>r.slotKey)])];
 const complete=state.slots.filter(s=>s.date>=current&&s.date<=dateAdd(current||now,6)&&['meal','move'].includes(s.kind));
 const good=complete.length>0&&complete.every(s=>latest.some(r=>r.slotKey===s.slotKey&&r.status==='done'&&r.fit==='manageable'));
 const doneMeals=latest.filter(r=>r.kind==='meal'&&r.status==='done').length,doneMoves=latest.filter(r=>r.kind==='move'&&r.status==='done').length;
 trace.push({rule:'R1',result:'Successful items are preserved in every draft.'},{rule:'R5',result:'No optional measure frequency used or mentioned.'},{rule:'R6',result:good?'Complete, manageable week; no escalation.':'Not enough evidence for a wholly manageable week.'});
 for(const key of keys){
  const observed=periods.map(p=>state.reports.find(r=>r.period===p&&r.slotKey===key));
  const recurring=observed.length===2&&observed.every(r=>r?.status==='missed');
  const freeze=state.freezes[key];
  const pendingRequests=(state.requests||[]).filter(r=>r.slotKey===key&&r.status!=='resolved');
  const requested=pendingRequests.filter(r=>!freeze||r.date>freeze.evidenceAt).reverse().sort((a,b)=>b.date.localeCompare(a.date))[0];
  if(pendingRequests.length&&!requested&&freeze)suppressed.push({slotKey:key,rule:'R8',reason:'No new member request since the decline.'});
  const slot=future.find(s=>s.slotKey===key);if(!slot)continue;
  if(blockedKeys.has(key)&&!requested&&conditions.some(c=>c.slotKey===key&&c.reasons.some(r=>!['allergies-unknown','diet-unknown','preferences-unknown'].includes(r.code)))){suppressed.push({slotKey:key,rule:'R9',reason:'Saved-plan condition shown separately before proposal ranking; no automatic change.'});continue;}
  if(!recurring&&!requested){if(observed.filter(r=>r?.status==='missed').length===1)suppressed.push({slotKey:key,rule:'R3',reason:'One explicit miss is not a pattern.'});continue;}
  const evidenceAt=requested?.date||observed.filter(Boolean).map(r=>r.date).sort().at(-1)||now;
  if(freeze&&(state.cycle<=freeze.throughCycle || evidenceAt<=freeze.evidenceAt)){suppressed.push({slotKey:key,rule:'R8',reason:'Decline freeze or no new evidence since decline.'});continue;}
  let text,priority=requested?0:2;
  if(requested)text=`You asked to look again at ${dayLabel(key)}${requested.reason?`: “${requested.reason}”`:'.'} Please confirm the practical details before choosing a change. Your saved plan stays in place.`;
  else {
   const matchingReason=observed[0].reason&&observed[0].reason===observed[1].reason;
   text=`Two planned ${slot.kind==='meal'?'cooks':'activities'} in the ${dayLabel(key)} slot did not happen.`;
   if(matchingReason)text+=` Both times you reported “${observed[0].reason}”.`;
   if(observed[0].shift!==observed[1].shift)text+=` Those weeks had different shift patterns.`;
   text+=' That does not tell us why.';
  }
  const alternatives=slot.kind==='meal'&&!requested?Object.values(RECIPES).filter(r=>r.id!==slot.recipeId&&suitable(r,state.preferences,{fixtureMode})&&(priority<2||r.minutes<RECIPES[slot.recipeId].minutes)).sort((a,b)=>a.minutes-b.minutes||a.id.localeCompare(b.id)):[];
  const options=[alternatives.find(r=>!r.noCook),alternatives.find(r=>r.noCook)].filter(Boolean).map(r=>({recipeId:r.id,label:r.noCook?'No cooking':`${r.minutes}-minute meal`}));
  candidates.push({id:`${state.cycle}:${key}`,slotKey:key,kind:slot.kind,priority,evidenceAt,text,options,restrictionUnknown:state.preferences.allergies==='unknown'||state.preferences.diet==='unknown',targetIds:future.filter(s=>s.slotKey===key).map(s=>s.id)});
 }
 candidates.sort((a,b)=>a.priority-b.priority||b.evidenceAt.localeCompare(a.evidenceAt)||a.slotKey.localeCompare(b.slotKey));
 const proposals=candidates.slice(0,3);for(const p of candidates.slice(3))suppressed.push({slotKey:p.slotKey,rule:'R10',reason:'Beyond the cap of three.'});
 trace.push({rule:'R2',result:`${candidates.filter(p=>p.priority===2).length} recurring difficulties eligible.`},{rule:'R3',result:`${suppressed.filter(p=>p.rule==='R3').length} isolated misses kept out of member copy.`},{rule:'R4',result:'No new recurring commitments are generated; swaps require acceptance.'},{rule:'R7',result:'Explicit reports only; no causes inferred.'},{rule:'R8',result:`${suppressed.filter(p=>p.rule==='R8').length} declined items suppressed.`},{rule:'R9',result:`${conditions.length} saved occurrences need checking outside the cap and decline gates; no automatic change.`},{rule:'R10',result:`${candidates.length} discretionary candidates; ${proposals.length} shown; member request, recurrence, date, slot. Saved-plan conditions are separate and uncapped.`});
 const summary=conditions.length?'Check the flagged saved meals before using or repeating them. Your record has been kept.':good?`You completed the planned meals and activities and said they felt manageable. Same again?`:[doneMeals?`${doneMeals} planned ${doneMeals===1?'meal':'meals'} completed.`:'',doneMoves?`${doneMoves} chosen ${doneMoves===1?'activity':'activities'} completed.`:''].filter(Boolean).join(' ')||'Keep your saved plan, or tell us what you would like to change.';
 return {ruleVersion:RULE_VERSION,cycle:state.cycle,inputRevision:state.revision,created:now,kind:conditions.length?'requires-review':proposals.length?'proposal':good?'same-again':'keep',summary,conditions,proposals,suppressed,trace,inputSnapshot:{slots:clone(state.slots),reports:clone(state.reports),preferences:clone(state.preferences),requests:clone(state.requests),freezes:clone(state.freezes)}};
}
export function previewChange(state,review,proposalId,recipeId,{fixtureMode=false}={}){
 const p=review.proposals.find(p=>p.id===proposalId);if(!p||!p.options.some(o=>o.recipeId===recipeId))throw new Error('That option is no longer available. Refresh the review.');
 const recipe=RECIPES[recipeId];if(!suitable(recipe,state.preferences,{fixtureMode}))throw new Error('This meal needs a preferences or content review. Your plan is unchanged.');
 const target=state.slots.filter(s=>p.targetIds.includes(s.id)&&s.date>state.clock);if(!target.length)throw new Error('These dates are no longer available for a change.');
 const slots=state.slots.map(s=>target.some(t=>t.id===s.id)?{...s,recipeId,recipeVersion:recipe.version}:s);
 const start=periodStart(state,target[0].date),end=dateAdd(start,6),start2=dateAdd(start,7),end2=dateAdd(start,13);
 const periods=[[start,end],[start2,end2]].map(([start,end])=>({start,end,delta:diffNeeds(requirements(state.slots,start,end),requirements(slots,start,end))}));
 return {proposalId,recipe:clone(recipe),target:clone(target),dependentLeftovers:clone(state.slots.filter(s=>s.kind==='leftovers'&&target.some(t=>t.id===s.sourceId))),slots,periods,baseRevision:state.revision};
}
