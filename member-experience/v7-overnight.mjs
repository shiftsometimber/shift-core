import {journeyDay} from './journey-records.mjs';
import {v7Logs,v7Week,v7NextReason,v7Preferences} from './v7-model.mjs';
const parse=s=>{try{return JSON.parse(s||'{}');}catch{return {};}};
export function overnightWindow(at){
 const h=Number(new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/London',hour:'2-digit',hourCycle:'h23'}).format(new Date(at)));
 return h>=1&&h<6;
}
export function prepareV7Insights(progress,readings=[],at=new Date().toISOString()){
 const today=journeyDay(at),week=v7Week(today),to=new Date(Date.parse(week+'T12:00:00Z')-86400000).toISOString().slice(0,10),from=new Date(Date.parse(to+'T12:00:00Z')-6*86400000).toISOString().slice(0,10);
 const logs=v7Logs(progress).filter(d=>d.on>=from&&d.on<=to),wins=(progress.journey?.records||[]).filter(r=>r.kind==='win'&&r.on>=from&&r.on<=to);
 const rows=readings.filter(r=>typeof r.weight_kg==='number'&&Number.isFinite(r.weight_kg)&&r.recorded_on<=today).sort((a,b)=>a.recorded_on.localeCompare(b.recorded_on));
 const recent=rows.filter(r=>r.recorded_on>=new Date(Date.parse(today+'T12:00:00Z')-14*86400000).toISOString().slice(0,10));
 // Report a literal observation only. No causal diagnosis or invented plateau threshold.
 const equal=recent.length>=2&&recent[0].recorded_on<recent.at(-1).recorded_on&&recent.every(r=>r.weight_kg===recent[0].weight_kg);
 const stall=v7Preferences(progress).showWeight&&equal?{topic:'weight',title:'Your recorded weight has stayed the same',text:recent.length+' readings from '+recent[0].recorded_on+' to '+recent.at(-1).recorded_on+' show the same weight. These records do not tell us what caused that pattern.'}:null;
 const items=[{topic:'effort',text:logs.length+' daily actions completed.'},...(wins.length?[{topic:'wins',text:wins.length+' everyday '+(wins.length===1?'win':'wins')+' you chose to record.'}]:[])];
 return {generatedAt:at,generatedOn:today,stall,recap:{id:'week:'+from,from,to,summary:logs.length?'Your pile grew by '+logs.length+' logs.':'Your pile is still here. Start with what fits today.',items,suggestion:v7NextReason(progress,today).text||'Choose one manageable thing for the next day.'}};
}
export async function runV7Overnight(env,at=new Date().toISOString(),prepareOffers=null){
 if(!overnightWindow(at))return {skipped:'outside_overnight_window',prepared:0};
 const today=journeyDay(at);let prepared=0,conflicts=0,cursor=0;
 const started=Date.now();
 for(;;){
  const {results:members=[]}=await env.DB.prepare("SELECT user_id,preferences FROM member_state WHERE user_id>? AND json_type(preferences,'$.lifeBack.progress.v7')='object' AND COALESCE(json_extract(preferences,'$.lifeBack.progress.v7.insights.generatedOn'),'')<>? ORDER BY user_id LIMIT 50").bind(cursor,today).all();
  if(!members.length)break;
  for(const row of members){
   cursor=row.user_id;const prefs=parse(row.preferences),progress=prefs.lifeBack?.progress;if(!progress?.v7)continue;
   const consent=await env.DB.prepare("SELECT granted FROM consents WHERE user_id=? AND consent_type='my_shift_health_tracking' ORDER BY id DESC LIMIT 1").bind(row.user_id).first();
   if(Number(consent?.granted)!==1||prefs.myJourney?.setup?.paused===true)continue;
   const exists=await env.DB.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='progress_entries'").first();
   const readings=exists?(await env.DB.prepare('SELECT recorded_on,weight_kg FROM progress_entries WHERE user_id=? AND weight_kg IS NOT NULL ORDER BY recorded_on DESC LIMIT 100').bind(row.user_id).all()).results||[]:[];
   const insights=prepareV7Insights(progress,readings,at);
   let offers=progress.v7.offers||null;if(prepareOffers){try{offers=await prepareOffers(env.DB,prefs,at);}catch{}}

   const result=await env.DB.prepare("UPDATE member_state SET preferences=json_set(preferences,'$.lifeBack.progress.v7.insights',json(?),'$.lifeBack.progress.v7.offers',json(?),'$.lifeBack.progress.revision',?),updated_at=? WHERE user_id=? AND COALESCE(json_extract(preferences,'$.lifeBack.progress.revision'),0)=? AND (SELECT granted FROM consents WHERE user_id=? AND consent_type='my_shift_health_tracking' ORDER BY id DESC LIMIT 1)=1 AND COALESCE(json_extract(preferences,'$.myJourney.setup.paused'),0)<>1").bind(JSON.stringify(insights),JSON.stringify(offers),(progress.revision||0)+1,at,row.user_id,progress.revision||0,row.user_id).run();
   if(result.meta.changes===1)prepared++;else conflicts++;
   if(Date.now()-started>15000)return {prepared,conflicts,more:true};
  }
 }
 return {prepared,conflicts,more:false};
}
export function wrapV7Scheduled(original){return {...original,async scheduled(event,env,ctx){
 const jobs=[runV7Overnight(env,new Date(event.scheduledTime||Date.now()).toISOString())];
 if(typeof original.scheduled==='function')jobs.push(original.scheduled(event,env,ctx));
 const result=Promise.allSettled(jobs);if(ctx?.waitUntil)ctx.waitUntil(result);else await result;
}};}
