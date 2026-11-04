// One-time release/setup preparation. Never invoked by a screen GET. Existing
// daily logs, milestones and member words are retained in the same CAS write.
import {prepareV7Fit} from './v7-fit.mjs';import {updateNutritionSummary} from './v7-food-routes.mjs';
import {journeyDay} from './journey-records.mjs';
const parse=s=>{try{return JSON.parse(s||'{}')}catch{return {}}};
export async function initialiseV7Member(env,userId,prepareOffers,generateFit,at=new Date().toISOString()){
 if(!Number.isSafeInteger(userId)||userId<=0)throw Error('Invalid account');
 for(let attempt=0;attempt<4;attempt++){
  const row=await env.DB.prepare('SELECT preferences FROM member_state WHERE user_id=?').bind(userId).first();if(!row)return {skipped:'no_saved_setup'};
  const consent=await env.DB.prepare("SELECT granted FROM consents WHERE user_id=? AND consent_type='my_shift_health_tracking' ORDER BY id DESC LIMIT 1").bind(userId).first();
  const prefs=parse(row.preferences);if(Number(consent?.granted)!==1||prefs.myJourney?.setup?.paused===true)return {skipped:'tracking_off_or_paused'};
  const signature=JSON.stringify([prefs.food||null,prefs.movement||null]),old=prefs.lifeBack?.progress||{version:3,revision:0,entries:[],operations:[]};
  if(old.v7?.initialisationSignature===signature&&old.v7?.initialisedAt&&old.v7?.offers?.on===journeyDay(at))return {skipped:'already_prepared'};
  const offers=await prepareOffers(env.DB,prefs,at,userId),next=structuredClone(old);
  next.v7||={version:1,preferences:{showWeight:true,lead:'weight'},days:{},milestones:{},activityReadings:[]};next.v7.offers=offers;
  let fitReady=!!next.v7.fit?.selected,fitError=null;
  if(generateFit){try{const generator=setting=>generateFit(userId,setting);if(generateFit.batch)generator.batch=settings=>generateFit.batch(userId,settings);next.v7.fit=await prepareV7Fit(prefs,generator,at);fitReady=!!next.v7.fit?.selected;}catch{fitError='No newly reviewed session matched the saved settings; existing Fit tools are retained.';}}
  next.v7.initialisedAt=at;next.v7.initialisationSignature=signature;next.revision=(old.revision||0)+1;
  const result=await env.DB.prepare("UPDATE member_state SET preferences=json_set(CASE WHEN json_type(preferences,'$.lifeBack')='object' THEN preferences ELSE json_set(preferences,'$.lifeBack',json('{}')) END,'$.lifeBack.progress',json(?)),updated_at=? WHERE user_id=? AND COALESCE(json_extract(preferences,'$.lifeBack.progress.revision'),0)=? AND json_extract(preferences,'$.food') IS ? AND json_extract(preferences,'$.movement') IS ? AND (SELECT granted FROM consents WHERE user_id=? AND consent_type='my_shift_health_tracking' ORDER BY id DESC LIMIT 1)=1 AND COALESCE(json_extract(preferences,'$.myJourney.setup.paused'),0)<>1").bind(JSON.stringify(next),at,userId,old.revision||0,prefs.food===undefined?null:JSON.stringify(prefs.food),prefs.movement===undefined?null:JSON.stringify(prefs.movement),userId).run();
  if(result.meta.changes!==1)continue;
  await updateNutritionSummary(env.DB,userId,at);
  return {initialised:true,fitReady,fitError,actionKind:offers.action.kind,alternatives:offers.alternatives.length};
 }
 return {skipped:'concurrent_change_retry_later'};
}
