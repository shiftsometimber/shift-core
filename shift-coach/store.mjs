export const sources=Object.freeze(['scale','wearable','calendar','dose','photos','voice']);
export const uid=()=>crypto.randomUUID();
export const statePath='$.lifeBack.progress.shiftAI';
const consentSQL="(SELECT id FROM consents WHERE user_id=? AND consent_type='my_shift_health_tracking' AND granted=1 ORDER BY id DESC LIMIT 1)=(SELECT id FROM consents WHERE user_id=? AND consent_type='my_shift_health_tracking' ORDER BY id DESC LIMIT 1)";
export function initialState(){return {version:1,facts:[],permissions:Object.fromEntries(sources.map(s=>[s,false])),settings:{proactive:false,followup:false,quietStart:'22:00',quietEnd:'08:00',timezone:'Europe/London',weeklyDay:null},stage:'Just starting',mode:'none',components:['energy'],readings:[],doses:[],actions:[],queue:[],outcomes:[],workingRoutines:[],rejected:[],pausedTypes:[],dismissedPatterns:[],nightRuns:[],calendar:[],reviews:[],touches:[],weeklyPlans:[],audit:[],lastActivity:null,pendingWant:null};}
export async function load(DB,member){
 const row=await DB.prepare("SELECT COALESCE(json_extract(preferences,'$.lifeBack.progress.revision'),0) revision,json_extract(preferences,?) body FROM member_state WHERE user_id=?").bind(statePath,member).first();
 return {revision:row?.revision||0,state:row?.body?JSON.parse(row.body):null};
}
export async function activeConsent(DB,member){return DB.prepare("SELECT id,granted FROM consents WHERE user_id=? AND consent_type='my_shift_health_tracking' ORDER BY id DESC LIMIT 1").bind(member).first();}
export function usable(state,consent){return !!state&&Number(consent?.granted)===1&&state.consentId===Number(consent.id);}
// Dedicated Life Back writes own the containing revision. Profile and Journey
// saves already preserve this entire progress object. No new schema or auth.
export async function mutate(DB,member,type,operation,now=Date.now(),{initialise=false,expectedRevision,consentId}={}){
 const consent=await activeConsent(DB,member);
 if(Number(consent?.granted)!==1||consentId&&consentId!==Number(consent.id))throw Object.assign(Error('health_consent_required'),{status:409});
 const {revision,state:stored}=await load(DB,member);
 if(expectedRevision!==undefined&&revision!==expectedRevision)throw Object.assign(Error('state_changed_retry'),{status:409});
 if(!usable(stored,consent)&&!initialise)throw Object.assign(Error('coaching_setup_required'),{status:409});
 const state=usable(stored,consent)?stored:{...initialState(),consentId:Number(consent.id)};
 const result=await operation(state);
 state.audit.push({id:uid(),at:now,type,outcome:result?.outcome||'recorded',dataUsed:result?.dataUsed||[],reason:result?.reason||type,channel:'my_timber'});
 // Explicit rolling retention keeps snapshots bounded; confirmed facts, rejects
 // and the member's last accepted action are never silently discarded.
 const cutoff=now-90*86400000;
 state.audit=state.audit.filter(x=>x.at>=cutoff);
 state.nightRuns=state.nightRuns.filter(x=>x.at>=cutoff);
 if(JSON.stringify(state).length>250000)throw Object.assign(Error('coaching_history_full'),{status:409});
 const body=JSON.stringify(state),at=new Date(now).toISOString();
 const resultSQL=await DB.prepare("UPDATE member_state SET preferences=json_set(CASE WHEN json_type(preferences,'$.lifeBack.progress')='object' THEN preferences ELSE json_set(CASE WHEN json_type(preferences,'$.lifeBack')='object' THEN preferences ELSE json_set(preferences,'$.lifeBack',json('{}')) END,'$.lifeBack.progress',json('{\"version\":3,\"revision\":0,\"goalId\":\"personal-start\",\"goal\":\"Your personal goal\",\"entries\":[],\"operations\":[]}')) END,?,json(?),'$.lifeBack.progress.revision',?),updated_at=? WHERE user_id=? AND COALESCE(json_extract(preferences,'$.lifeBack.progress.revision'),0)=? AND "+consentSQL+" AND (SELECT id FROM consents WHERE user_id=? AND consent_type='my_shift_health_tracking' ORDER BY id DESC LIMIT 1)=?")
 .bind(statePath,body,revision+1,at,member,revision,member,member,member,Number(consent.id)).run();
 if(Number(resultSQL.meta?.changes)!==1)throw Object.assign(Error('state_changed_retry'),{status:409});
 return {state,result,revision:revision+1};
}
export const fact=(state,key)=>state.facts.find(f=>f.key===key&&f.confirmed);
export function cancelAffected(state,ids=[],source=null){
 const matches=a=>source?a.sources.includes(source):a.dataUsed.some(id=>ids.includes(id));
 const cancelled=state.actions.filter(a=>a.status!=='cancelled'&&matches(a));
 const actionIds=new Set(cancelled.map(a=>a.id));
 state.actions=state.actions.filter(a=>!actionIds.has(a.id));
 state.queue=state.queue.filter(q=>!actionIds.has(q.actionId)&&!(source&&q.sources.includes(source))&&!q.dataUsed.some(id=>ids.includes(id)));
 state.weeklyPlans=state.weeklyPlans.filter(p=>!(source&&p.sources.includes(source))&&!p.dataUsed.some(id=>ids.includes(id)));
 state.pendingWant=null;return cancelled.length;
}
