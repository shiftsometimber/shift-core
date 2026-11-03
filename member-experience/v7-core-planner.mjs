import {initialiseV7Member} from './v7-bootstrap.mjs';
import {authenticateMember} from '../member-state-fast-v1.js';
import {withV7Privacy} from './v7-privacy.mjs';
// An internal named service entrypoint. It is not exposed by a public HTTP route.
// The existing core default handler, clinical gates and commerce stay untouched.
import {WorkerEntrypoint} from 'cloudflare:workers';
import original from '__MY_TIMBER_CURRENT_CORE__';
export * from '__MY_TIMBER_CURRENT_CORE__';
import {v7ApprovedFitPreview,v7FitCatalogue} from '__MY_TIMBER_CURRENT_CORE_HELPERS__';
const current=withV7Privacy(original);
export default {...current,async fetch(request,env,ctx){
 const response=await current.fetch(request,env,ctx),path=new URL(request.url).pathname;
 if(response.ok&&['POST','PATCH','PUT'].includes(request.method)&&['/v1/member-state','/v1/profile','/v1/consents','/v1/my-journey/setup'].includes(path)&&env.V7_OFFERS){
  const auth=await authenticateMember(request,env);if(!auth.response){const task=prepareMember(env,auth.userId).catch(()=>({initialisationDeferred:true}));if(ctx?.waitUntil)ctx.waitUntil(task);else await task;}
 }
 return response;
}};
async function prepareMember(env,userId){
 const planner={env,account:V7Planner.prototype.account,plan:V7Planner.prototype.plan,prepareV7Fit:V7Planner.prototype.prepareV7Fit,prepareV7FitBatch:V7Planner.prototype.prepareV7FitBatch};
 const generator=(id,settings)=>planner.prepareV7Fit({userId:id,...settings});generator.batch=(id,settings)=>planner.prepareV7FitBatch({userId:id,settings});
 return initialiseV7Member(env,userId,(_DB,_prefs,at,id)=>env.V7_OFFERS.prepareOffers({userId:id,at}),generator);
}
export class V7Planner extends WorkerEntrypoint {
 async initialiseMember({userId}){return prepareMember(this.env,userId);}
 async account(userId){
  if(!Number.isSafeInteger(userId)||userId<=0)throw Error('Invalid account');
  const consent=await this.env.DB.prepare("SELECT granted FROM consents WHERE user_id=? AND consent_type='my_shift_health_tracking' ORDER BY id DESC LIMIT 1").bind(userId).first();
  const row=await this.env.DB.prepare('SELECT preferences FROM member_state WHERE user_id=?').bind(userId).first();
  const prefs=JSON.parse(row?.preferences||'{}');if(Number(consent?.granted)!==1||prefs.myJourney?.setup?.paused===true)throw Error('Tracking is off or paused');return prefs;
 }
 async plan({userId,minutes,kit,healthTags=[],feedback=null,lowImpact=false},prefs,catalogue){
  if(!Number.isSafeInteger(userId)||userId<=0||![10,20,40].includes(minutes)||!['none','dumbbells','gym'].includes(kit))throw Error('Invalid prepared session request');
  // Use only the tags already held, with recorded consent, in this account.
  const tags=prefs.lifeBack?.progress?.v7?.fit?.healthTags||[];
  const confirmed=tags.filter(t=>t.consentedAt&&healthTags.some(h=>h.id===t.id));
  const movement=prefs.movement||{},savedLimitations=movement.limitations||{},notes=[typeof savedLimitations==='string'?savedLimitations:Array.isArray(savedLimitations)?savedLimitations.join('; '):savedLimitations.notes||'',...confirmed.map(t=>t.text)].filter(Boolean).join('; '),preference=[movement.preferences||'',notes,lowImpact?'low impact; no jumping':''].filter(Boolean).join('; ');
  const changed=feedback?.outcome==='not-helped'||feedback?.effort==='hard';
  const body={days:1,minutes_per_day:minutes,location:kit==='gym'?'gym':'home',equipment:kit==='gym'?'full gym':kit,
   preferences:preference,limitations:{selected:Array.isArray(savedLimitations)?savedLimitations:Array.isArray(savedLimitations.selected)?savedLimitations.selected:[],notes},level:movement.level||'beginner',
   excluded_ids:changed?(prefs.lifeBack?.progress?.v7?.fit?.selected?.session?.exercises||[]).map(e=>e.publication_id||e.id).filter(Boolean):[],
   variant_day:lowImpact?2:1,
   // Existing fixed-dose machinery owns all prescriptions. Feedback is a ranking
   // preference; it must never silently re-dose a locked exercise.
   ...(feedback?.effort==='hard'?{preferences:preference+'; manageable effort'}:{}),
   ...(feedback?.effort==='easy'?{preferences:preference+'; progress within reviewed prescriptions'}:{})};
  const plan=await v7ApprovedFitPreview(this.env,userId,body,catalogue);
  if(lowImpact){
   // A label alone cannot make a movement low impact. Reject unsuitable results.
   const rows=plan.sessions.flatMap(s=>s.exercises||[]);
   if(rows.some(e=>/\b(?:jump|jumping|burpee|hop|hopping|sprint)\b/i.test([e.name,e.notes,...(e.how||[])].join(' '))))throw Error('No reviewed low-impact option matched these settings');
   for(const s of plan.sessions)s.low_impact=true;
  }
  if(changed)plan.adaptation_reason='Different reviewed movement choices after your last feedback. Exercise prescriptions stay as reviewed.';
  return plan;
 }
 async prepareV7Fit(settings){const prefs=await this.account(settings.userId);return this.plan(settings,prefs,null);}
 async prepareV7FitBatch({userId,settings}){
  if(!Array.isArray(settings)||settings.length>10)throw Error('Invalid prepared choices');
  const prefs=await this.account(userId),catalogue=await v7FitCatalogue(this.env.DB),results=[];
  for(const item of settings){try{results.push({settings:item,plan:await this.plan({userId,...item},prefs,catalogue)});}catch(e){results.push({settings:item,error:e.message});}}
  return results;
 }
}

export class PublicAssets extends WorkerEntrypoint {
 async fetch(request){const u=new URL(request.url);if(!u.pathname.startsWith('/assets/')||!['GET','HEAD'].includes(request.method))return new Response('Not found',{status:404});return fetch('https://shiftsometimber.co.uk'+u.pathname+u.search,{method:request.method,redirect:'error'});}
}
