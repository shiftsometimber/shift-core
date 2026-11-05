// Isolated preparation only: imports the exact reviewed serving generators.
// No public route, member-page render, commerce handler or clinical gate is copied.
import {WorkerEntrypoint} from 'cloudflare:workers';
import {initialiseV7Member} from './v7-bootstrap.mjs';
import {prepareMealOffers} from './v7-context.mjs';
import {v7ApprovedFitPreview,v7FitCatalogue} from '__MY_TIMBER_CURRENT_CORE_HELPERS__';
import {v7LoadGrubCatalogue as loadGrubCatalogue,v7EmptyGrub as emptyGrub,v7UsableCatalogue as usableCatalogue,v7RecommendationFor as recommendationFor,v7GrubMemberContext as grubMemberContext} from '__MY_TIMBER_CURRENT_PROGRAMME_HELPERS__';
export default {fetch(){return new Response('Not found',{status:404})}};
// Never park one request on a promise owned by another request: the Workers
// runtime can cancel that wait. The finite release caller controls concurrency.
// Cache only completed public catalogues, never member preferences or promises.
let fitCatalogue=null,foodCatalogue=null;
async function reviewedFitCatalogue(env){if(fitCatalogue?.expires>Date.now())return fitCatalogue.rows;const rows=await v7FitCatalogue(env.DB);fitCatalogue={rows,expires:Date.now()+300000};return rows;}
async function reviewedFoodCatalogue(env){if(foodCatalogue?.expires>Date.now())return foodCatalogue.rows;const rows=usableCatalogue(await loadGrubCatalogue(env.DB));foodCatalogue={rows,expires:Date.now()+300000};return rows;}
async function prepareMember(env,userId){
 const planner={env,account:V7Planner.prototype.account,plan:V7Planner.prototype.plan,prepareV7Fit:V7Planner.prototype.prepareV7Fit,prepareV7FitBatch:V7Planner.prototype.prepareV7FitBatch};
 const generator=(id,settings)=>planner.prepareV7Fit({userId:id,...settings});generator.batch=(id,settings)=>planner.prepareV7FitBatch({userId:id,settings});
 const offers={env};return initialiseV7Member(env,userId,(_DB,_prefs,at,id)=>V7Offers.prototype.prepareOffers.call(offers,{userId:id,at}),generator);
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
 async prepareV7Fit(settings){const prefs=await this.account(settings.userId);return this.plan(settings,prefs,await reviewedFitCatalogue(this.env));}
 async prepareV7FitBatch({userId,settings}){
  if(!Array.isArray(settings)||settings.length>10)throw Error('Invalid prepared choices');
  const prefs=await this.account(userId),catalogue=await reviewedFitCatalogue(this.env),results=[];
  for(const item of settings){try{results.push({settings:item,plan:await this.plan({userId,...item},prefs,catalogue)});}catch(e){results.push({settings:item,error:e.message});}}
  return results;
 }
}

export class V7Offers extends WorkerEntrypoint {
 async legacyScheduled(input){return this.env.LEGACY_JOBS?.legacyScheduled(input)||null;}
 async recipeById({id}){if(typeof id!=='string'||id.length>180)throw Error('Invalid recipe');return (await reviewedFoodCatalogue(this.env)).find(r=>r.id===id)||null;}
 // Finite release migration of prepared suggestions only. No action, food,
 // consent, Fit plan or pile record is changed; never called on a page GET.
 async prepareMealWindows({userId,at}){
  if(!Number.isSafeInteger(userId)||userId<=0||!Number.isFinite(Date.parse(at)))throw Error('Invalid prepared offer request');
  for(let attempt=0;attempt<4;attempt++){
   const row=await this.env.DB.prepare('SELECT preferences FROM member_state WHERE user_id=?').bind(userId).first();
   if(!row)return {skipped:'no_saved_setup'};
   const prefs=JSON.parse(row.preferences||'{}'),progress=prefs.lifeBack?.progress;
   const consent=await this.env.DB.prepare("SELECT granted FROM consents WHERE user_id=? AND consent_type='my_shift_health_tracking' ORDER BY id DESC LIMIT 1").bind(userId).first();
   if(!progress?.v7||Number(consent?.granted)!==1||prefs.myJourney?.setup?.paused===true)return {skipped:'tracking_off_or_paused'};
   const recipes=await reviewedFoodCatalogue(this.env),offers=prepareMealOffers(prefs,recipes,at,{emptyGrub,recommendationFor,grubMemberContext}),old=progress.v7.offers;
   if(old?.mealWindowsVersion===1&&old.on===offers.on&&old.grubRevision===offers.grubRevision&&old.foodChoices===offers.foodChoices)return {skipped:'already_prepared'};
   const result=await this.env.DB.prepare("UPDATE member_state SET preferences=json_set(preferences,'$.lifeBack.progress.v7.offers',json(?),'$.lifeBack.progress.revision',?),updated_at=? WHERE user_id=? AND COALESCE(json_extract(preferences,'$.lifeBack.progress.revision'),0)=? AND json_extract(preferences,'$.food') IS ? AND COALESCE(json_extract(preferences,'$.grubV2.revision'),0)=? AND (SELECT granted FROM consents WHERE user_id=? AND consent_type='my_shift_health_tracking' ORDER BY id DESC LIMIT 1)=1 AND COALESCE(json_extract(preferences,'$.myJourney.setup.paused'),0)<>1").bind(JSON.stringify(offers),(progress.revision||0)+1,at,userId,progress.revision||0,prefs.food===undefined?null:JSON.stringify(prefs.food),prefs.grubV2?.revision||0,userId).run();
   if(result.meta.changes===1)return {prepared:true};
  }
  return {skipped:'concurrent_change_retry_later'};
 }
 async prepareOffers({userId,at}){
  if(!Number.isSafeInteger(userId)||userId<=0||!Number.isFinite(Date.parse(at)))throw Error('Invalid prepared offer request');
  const consent=await this.env.DB.prepare("SELECT granted FROM consents WHERE user_id=? AND consent_type='my_shift_health_tracking' ORDER BY id DESC LIMIT 1").bind(userId).first();
  const prefs=JSON.parse((await this.env.DB.prepare('SELECT preferences FROM member_state WHERE user_id=?').bind(userId).first())?.preferences||'{}');
  if(Number(consent?.granted)!==1||prefs.myJourney?.setup?.paused===true)throw Error('Tracking is off or paused');
  const recipes=await reviewedFoodCatalogue(this.env);
  return prepareMealOffers(prefs,recipes,at,{emptyGrub,recommendationFor,grubMemberContext});
 }
}
