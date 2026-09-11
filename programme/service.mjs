import {RECIPES,suitable,CONTENT_VERSION} from './content.mjs';
import {clone,dateAdd,weekStart,planningStart,periodStart,evaluate,previewChange,shopping,planConditions} from './engine.mjs';
export class ProgrammeError extends Error{constructor(message,status=400){super(message);this.status=status}}
const insist=(condition,message,status=400)=>{if(!condition)throw new ProgrammeError(message,status)};
export function currentState(state,options={}){
 if(options.fixtureMode)return state;
 const clock=options.today||new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/London',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
 const elapsed=Math.floor((Date.parse(clock+'T12:00:00Z')-Date.parse(state.anchor+'T12:00:00Z'))/86400000);
 return {...state,clock,cycle:Math.max(0,Math.floor(elapsed/7))};
}
const text=(s,n=500)=>String(s??'').trim().slice(0,n);
export function emptyState(clock){return {schemaVersion:1,revision:0,clock,cycle:0,anchor:clock,name:'',preferences:{allergies:'unknown',diet:'unknown',equipment:[],activityLimitations:'unknown'},goal:'',focus:'food',track:'everyday',measures:[],slots:[],reports:[],requests:[],freezes:{},acquired:{},manualItems:[],reviews:[],decisions:[],operations:[],setup:false,entitlement:{active:false},review:null}}
function cleanPreferences(p){
 insist(p&&['unknown','none'].includes(p.allergies)||Array.isArray(p?.allergies),'Choose the allergy information you want to supply.');
 insist(['unknown','any','vegetarian'].includes(p.diet),'Choose a food preference.');
 if(Array.isArray(p.allergies))insist(p.allergies.every(a=>['wheat','fish','egg','celery','milk','nuts','peanuts','soy','sesame','mustard','crustaceans','molluscs','lupin','sulphites'].includes(a)),'Unknown allergy selection.');
 return {allergies:clone(p.allergies),diet:p.diet,equipment:Array.isArray(p.equipment)?p.equipment.filter(e=>['hob'].includes(e)):[],activityLimitations:text(p.activityLimitations||'unknown'),time:text(p.time,100),household:text(p.household,100),spending:text(p.spending,100),workPattern:['alternating','fixed'].includes(p.workPattern)?p.workPattern:'fixed',reviewDay:Number.isInteger(p.reviewDay)&&p.reviewDay>=0&&p.reviewDay<=6?p.reviewDay:0,firstShift:['early','late','day','off'].includes(p.firstShift)?p.firstShift:'day',shiftAnchor:/^\d{4}-\d{2}-\d{2}$/.test(p.shiftAnchor||'')&&weekStart(p.shiftAnchor)===p.shiftAnchor?p.shiftAnchor:null};
}
export function publicState(state,{fixtureMode=false}={}){
 const s=clone(state);delete s.operations;
 const start=planningStart(state);
 return {...s,conditions:planConditions(state,{fixtureMode}),contentVersion:CONTENT_VERSION,catalogue:Object.values(RECIPES).filter(r=>suitable(r,state.preferences,{fixtureMode})),lists:[shopping(state,start,dateAdd(start,6)),shopping(state,dateAdd(start,7),dateAdd(start,13))],fixtureMode};
}
function rolledSlots(state,start){
 const templates=new Map();for(const s of [...state.slots].sort((a,b)=>a.date.localeCompare(b.date)))templates.set(s.slotKey,s);
 return Array.from({length:2},(_,week)=>[...templates.values()].map(t=>{const weekday=({mon:0,tue:1,wed:2,thu:3,fri:4,sat:5,sun:6})[t.slotKey.split('-')[0]],delta=(weekday-(new Date(start+'T12:00:00Z').getUTCDay()+6)%7+7)%7,date=dateAdd(start,week*7+delta),existing=state.slots.find(s=>s.date===date&&s.slotKey===t.slotKey);return existing||{...t,id:`${date}:${t.slotKey}`,date,...(t.kind==='leftovers'?{sourceId:`${dateAdd(t.sourceId.slice(0,10),Math.round((Date.parse(date)-Date.parse(t.date))/86400000))}:${t.sourceId.slice(11)}`} : {}),completed:false}})).flat();
}
export function mutate(state,action,{fixtureMode=false}={}){
 const next=clone(state),type=action.type;
 if(['review','preview','accept','repeat'].includes(type))insist(state.entitlement.active,'New Programme reviews are paused. Your saved plans and free tools remain available.',403);
 if(type==='setup'){
  insist(!state.setup,'Your first plan is already saved.',409);
  const preferences=cleanPreferences(action.preferences);next.preferences=preferences;next.goal=text(action.goal);next.name=text(action.name,80);next.focus=['food','movement','organise'].includes(action.focus)?action.focus:'food';next.track=action.track==='continuity'?'continuity':'everyday';next.measures=Array.isArray(action.measures)?action.measures.filter(m=>['energy','sleep','confidence','weight','waist'].includes(m)):[];
  insist(Array.isArray(action.choices)&&action.choices.length>0&&action.choices.length<=8,'Choose at least one starting action.');
  next.anchor=dateAdd(state.clock,-((new Date(state.clock+'T12:00:00Z').getUTCDay()-preferences.reviewDay+7)%7));next.cycle=0;
  const start=dateAdd(state.clock,1);
  next.slots=action.choices.map((c,i)=>{insist(Number.isInteger(c.day)&&c.day>=0&&c.day<7,'Choose a valid day.');const date=dateAdd(start,(c.day-(new Date(start+'T12:00:00Z').getUTCDay()+6)%7+7)%7),slotKey=['mon','tue','wed','thu','fri','sat','sun'][c.day]+'-'+(c.kind==='meal'?'dinner':'walk');
   if(c.kind==='meal'){insist(suitable(RECIPES[c.recipeId],preferences,{fixtureMode}),'Please confirm food restrictions before choosing a compatible meal.');insist(Number.isFinite(c.servings)&&c.servings>=1&&c.servings<=12,'Choose 1–12 portions.');return{id:`${date}:${slotKey}`,slotKey,date,kind:'meal',recipeId:c.recipeId,recipeVersion:RECIPES[c.recipeId].version,servings:c.servings,completed:false}}
   insist(c.kind==='move'&&preferences.activityLimitations==='none','This prototype cannot select movement around an unknown or stated limitation. Keep using your existing chosen guidance.');insist(Number.isInteger(c.minutes)&&c.minutes>=1&&c.minutes<=180,'Choose a valid walking duration.');return{id:`${date}:${slotKey}`,slotKey,date,kind:'move',label:'Your chosen walk',minutes:c.minutes,completed:false};
  });insist(new Set(next.slots.map(s=>s.id)).size===next.slots.length,'Choose different days for duplicate meal or walking slots.');next.setup=true;
 }else if(type==='preferences'){
  next.preferences=cleanPreferences(action.preferences);if(state.setup)insist(next.preferences.reviewDay===(state.preferences.reviewDay??0),'The saved review day is fixed for this test. Your plan is unchanged.');
  next.review=null;
 }else if(type==='reports'){
  insist(Array.isArray(action.reports)&&action.reports.length<=30,'Too many reports.');
  for(const r of action.reports){const slot=state.slots.find(s=>s.id===r.slotId);insist(slot&&slot.date<=state.clock,'Only report a saved action whose date has arrived.');insist(['done','missed','unknown'].includes(r.status)&&['manageable','did-not-fit','unknown'].includes(r.fit),'Choose a valid report.');
   const period=periodStart(state,slot.date);next.reports=next.reports.filter(x=>!(x.period===period&&x.slotKey===slot.slotKey));next.reports.push({slotKey:slot.slotKey,kind:slot.kind,period,date:slot.date,shift:r.shift===undefined?'unknown':text(r.shift,30),status:r.status,fit:r.status==='done'?r.fit:'unknown',reason:text(r.reason,160),note:text(r.note,400)});
  }
 }else if(type==='review'){
  const review=evaluate(next,{fixtureMode});const previous=next.reviews.find(r=>r.cycle===state.cycle);review.id=previous?.id||crypto.randomUUID();review.version=(previous?.version||0)+1;review.previousVersions=previous?[...(previous.previousVersions||[]),Object.fromEntries(Object.entries(previous).filter(([k])=>k!=='previousVersions'))]:[];review.baseRevision=state.revision+1;next.review=review;next.reviews=next.reviews.filter(r=>r.cycle!==state.cycle);next.reviews.push(clone(review));
 }else if(type==='accept'){
  insist(state.review&&state.review.baseRevision===state.revision,'Your plan or preferences changed. Prepare a fresh review before accepting.',409);
  const p=state.review.proposals.find(p=>p.id===action.proposalId);insist(p,'This proposal is not available.',409);insist(state.cycle-state.review.cycle<2,'This suggestion has expired. Your plan is unchanged.',409);
  const freeze=state.freezes[p.slotKey];insist(!freeze||state.cycle>freeze.throughCycle,'This item was left alone for this cycle.',409);
  const preview=previewChange(state,state.review,action.proposalId,action.recipeId,{fixtureMode});
  const before=preview.target;next.slots=preview.slots;
  next.decisions.push({id:crypto.randomUUID(),type:'accept',reviewId:state.review.id,proposalId:p.id,slotKey:p.slotKey,date:state.clock,before,after:clone(next.slots.filter(s=>before.some(b=>b.id===s.id))),periods:preview.periods,undone:false});next.review=null;
 }else if(type==='decline'){
  const p=state.review?.proposals.find(p=>p.id===action.proposalId);insist(p,'This proposal is not available.',409);
  next.freezes[p.slotKey]={throughCycle:state.cycle+1,evidenceAt:p.evidenceAt};next.decisions.push({id:crypto.randomUUID(),type:'decline',slotKey:p.slotKey,date:state.clock,reviewId:state.review.id});next.review=null;
 }else if(type==='skip'){
  next.decisions.push({id:crypto.randomUUID(),type:'skip',date:state.clock,reviewId:state.review?.id||null});next.review=null;
 }else if(type==='repeat'){
  const start=planningStart(state),draft=rolledSlots(state,start);insist(draft.length>0,'Choose a first plan before repeating.');
  insist(!planConditions({...state,slots:[...state.slots,...draft.filter(d=>!state.slots.some(s=>s.id===d.id))]},{fixtureMode}).length,'Check the flagged meals and current restrictions before repeating this plan. Your saved record is unchanged.',409);
  next.slots=[...state.slots,...draft.filter(d=>!state.slots.some(s=>s.id===d.id))];next.decisions.push({id:crypto.randomUUID(),type:'repeat',date:state.clock,start,end:dateAdd(start,13)});next.review=null;
 }else if(type==='edit-slot'){
  const slot=next.slots.find(s=>s.id===action.slotId);insist(slot&&slot.date>state.clock,'Only future saved actions can be edited.');
  if(slot.kind==='meal'){insist(suitable(RECIPES[action.recipeId],state.preferences,{fixtureMode}),'This meal is not available for your stated preferences.');insist(Number.isFinite(action.servings)&&action.servings>=1&&action.servings<=12,'Choose 1–12 portions.');slot.recipeId=action.recipeId;slot.recipeVersion=RECIPES[action.recipeId].version;slot.servings=action.servings;if(Number.isFinite(slot.serveNow)&&!next.slots.some(s=>s.kind==='leftovers'&&s.sourceId===slot.id))slot.serveNow=Math.min(slot.serveNow,action.servings)}
  else {insist(Number.isInteger(action.minutes)&&action.minutes>=1&&action.minutes<=180,'Choose a valid duration.');slot.minutes=action.minutes}
 }else if(type==='request'){
  insist(state.slots.some(s=>s.slotKey===action.slotKey),'Choose an existing item.');next.requests.push({slotKey:action.slotKey,reason:text(action.reason,200),date:state.clock});next.review=null;
 }else if(type==='undo'){
  const decision=next.decisions.find(d=>d.id===action.decisionId&&d.type==='accept'&&!d.undone);insist(decision,'This change cannot be undone.',409);
  for(const after of decision.after){const slot=next.slots.find(s=>s.id===after.id);insist(slot&&slot.date>state.clock&&JSON.stringify(slot)===JSON.stringify(after),'A changed item was edited or its date has passed. Keep the newer plan and edit that item directly.',409)}
  next.slots=next.slots.map(s=>decision.before.find(b=>b.id===s.id)||s);decision.undone=true;next.decisions.push({id:crypto.randomUUID(),type:'undo',date:state.clock,decisionId:decision.id});next.review=null;
 }else if(type==='acquired'){
  insist(typeof action.start==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(action.start),'Choose a shopping period.');const end=dateAdd(action.start,6),items=shopping(state,action.start,end).items,item=items.find(i=>i.key===action.key);insist(item,'That ingredient is not in this list.');insist(['unknown','bought','have'].includes(action.status)&&Number.isFinite(action.quantity)&&action.quantity>=0&&action.quantity<=100000,'Choose a valid acquired quantity.');const period=action.start+'..'+end;next.acquired[period]??={};next.acquired[period][action.key]={status:action.status,quantity:action.status==='unknown'?0:action.quantity};
 }else if(type==='manual-item'){
  const name=text(action.name,120);insist(name,'Enter an item.');insist(next.manualItems.length<100,'Remove an old manual item before adding more.');next.manualItems.push({id:crypto.randomUUID(),name,period:action.start+'..'+dateAdd(action.start,6)});
 }else throw new ProgrammeError('Unknown action.');
 // Verify all future shopping arithmetic before anything is committed.
 const start=planningStart(next);shopping(next,start,dateAdd(start,6));shopping(next,dateAdd(start,7),dateAdd(start,13));
 return next;
}
export async function execute(store,userId,action,options={}){
 const stored=await store.get(userId);insist(stored,'Programme account is not set up.',404);const state=currentState(stored,options);
 insist(action&&typeof action.operationId==='string'&&/^[A-Za-z0-9-]{8,80}$/.test(action.operationId),'A valid operation identifier is required.');
 const canonical=JSON.stringify(Object.fromEntries(Object.entries(action).filter(([key])=>key!=='revision').sort(([a],[b])=>a.localeCompare(b))));
 const previous=state.operations.find(o=>o.id===action.operationId);
 if(previous){insist(previous.body===canonical,'That operation identifier belongs to a different action.',409);return publicState(state,options)}
 insist(action.revision===state.revision,'Your plan changed in another session. Reload before making this change.',409);
 const next=mutate(state,action,options);next.operations.push({id:action.operationId,body:canonical});
 insist(await store.save(userId,state.revision,next),'Your plan changed in another session. Reload before making this change.',409);
 return publicState({...next,revision:state.revision+1},options);
}
