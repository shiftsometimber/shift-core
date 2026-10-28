import {authenticateMember} from '../member-state-fast-v1.js';
import {trackingConsent} from './health-routes.mjs';
import {journeyDay,validJourneyDate} from './journey-records.mjs';
const parse = value => {try{return JSON.parse(value||'{}');}catch{return {};}};
const json = (body,status=200) => Response.json(body,{status,headers:{'Cache-Control':'no-store, private','Vary':'Cookie','X-Content-Type-Options':'nosniff'}});
export function journeyDataView(prefs,readings=[],weekly=[],checkins=[],today=journeyDay()) {
  const progress=prefs.lifeBack?.progress||{revision:0,entries:[]},journey=progress.journey||{records:[],showMedicine:false};
  const records=(journey.records||[]).map(r=>({...r,editable:true,source:'journey'}));
  const legacyWins=(progress.entries||[]).filter(e=>e.win&&Number.isFinite(Date.parse(e.at))).map(e=>({id:'life-back:'+e.id,kind:'win',on:journeyDay(e.at),text:e.win,source:'life-back',editable:false}));
  const measurements=readings.filter(r=>validJourneyDate(r.recorded_on,today)).map(r=>({id:'progress:'+r.id,kind:'measurement',on:r.recorded_on,...(r.weight_kg!=null?{weightKg:Number(r.weight_kg)}:{}),...(r.waist_cm!=null?{waistCm:Number(r.waist_cm)}:{}),note:r.notes||'',source:'progress',editable:false}));
  const weeks=weekly.filter(r=>validJourneyDate(r.week_ending,today));
  const weeklyNotes=weeks.flatMap(r=>{
    const life=parse(r.life_back_json),items=[];
    if(life.note)items.push({id:'weekly-win:'+r.id,kind:life.status==='win'?'win':'checkin',on:r.week_ending,text:life.note,dateBasis:'Week ending',source:'weekly',editable:false});
    if(r.gut_symptoms)items.push({id:'weekly-feeling:'+r.id,kind:'checkin',on:r.week_ending,text:r.gut_symptoms,label:'Symptoms I recorded for this week',dateBasis:'Week ending',source:'weekly',editable:false});
    if(!readings.some(x=>x.recorded_on===r.week_ending&&x.source==='my_journey_weekly')&&(r.weight_kg!=null||r.waist_cm!=null))items.push({id:'weekly-reading:'+r.id,kind:'measurement',on:r.week_ending,...(r.weight_kg!=null?{weightKg:Number(r.weight_kg)}:{}),...(r.waist_cm!=null?{waistCm:Number(r.waist_cm)}:{}),source:'weekly',editable:false});
    return items;
  });
  const ownCheckins=checkins.filter(r=>Number.isFinite(Date.parse(r.submitted_at))).map(r=>({id:'checkin:'+r.id,kind:'checkin',on:journeyDay(r.submitted_at),label:['Tough day','Struggling','OK','Good','Brilliant'][Number(r.wellbeing_score)-1]||'My check-in',text:r.notes||'',source:'checkin',editable:false}));
  // Setup sizes have a save date, not an invented measurement date.
  const setup=prefs.myJourney||{},sizes=setup.clothes||{},savedSizes=[];
  if((sizes.currentTop||sizes.currentTrouserWaist)&&Number.isFinite(Date.parse(setup.updatedAt)))savedSizes.push({id:'setup-clothes',kind:'clothes',on:journeyDay(setup.updatedAt),top:sizes.currentTop||'',trousers:sizes.currentTrouserWaist||'',dateBasis:'Date saved in setup',source:'setup',editable:false});
  const all=[...records,...legacyWins,...measurements,...weeklyNotes,...ownCheckins,...savedSizes].filter(r=>validJourneyDate(r.on,today)).sort((a,b)=>a.on.localeCompare(b.on)||String(a.createdAt||'').localeCompare(String(b.createdAt||'')));
  return {revision:progress.revision||0,today,units:['kg','lb','stone_lb'].includes(setup.setup?.units)?setup.setup.units:'stone_lb',showMedicine:journey.showMedicine===true,records:all,goal:progress.goal&&progress.goal!=='Your personal goal'?{text:progress.goal,on:progress.goalChangedAt?journeyDay(progress.goalChangedAt):null}:null};
}
export async function journeyDataRoutes(request,env) {
  if(new URL(request.url).pathname!=='/v1/life-back/journey')return null;
  if(env.MEMBER_EXPERIENCE_V1_ENABLED!=='true')return json({error:'Journey is not available.'},404);
  if(request.method!=='GET')return json({error:'Method not allowed'},405);
  const auth=await authenticateMember(request,env);if(auth.response)return auth.response;
  try {
    const row=await env.DB.prepare('SELECT preferences FROM member_state WHERE user_id=?').bind(auth.userId).first(),prefs=parse(row?.preferences);
    // Optional legacy tables may not have been created for a new installation.
    // A query failure is not presented as a genuine empty member record.
    const exists=async table=>!!await env.DB.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?").bind(table).first();
    const rows=async(table,sql)=>(await exists(table))?(await env.DB.prepare(sql).bind(auth.userId).all()).results||[]:[];
    const [readings,weekly,checkins,trackingEnabled]=await Promise.all([
      rows('progress_entries','SELECT id,recorded_on,weight_kg,waist_cm,notes,source FROM progress_entries WHERE user_id=? ORDER BY recorded_on DESC,id DESC LIMIT 1001'),
      rows('my_journey_weekly_checkins','SELECT id,week_ending,weight_kg,waist_cm,life_back_json,gut_symptoms FROM my_journey_weekly_checkins WHERE user_id=? AND confirmed_at IS NOT NULL ORDER BY week_ending DESC LIMIT 1001'),
      rows('check_ins','SELECT id,wellbeing_score,notes,submitted_at FROM check_ins WHERE user_id=? AND case_id IS NULL ORDER BY id DESC LIMIT 1001'),
      trackingConsent(env.DB,auth.userId)
    ]);
    return json({accountId:auth.userId,...journeyDataView(prefs,readings.slice(0,1000).reverse(),weekly.slice(0,1000).reverse(),checkins.slice(0,1000).reverse()),trackingEnabled,paused:prefs.myJourney?.setup?.paused===true,historyMayBeLimited:[readings,weekly,checkins].some(r=>r.length>1000)});
  } catch {return json({error:'Your Journey records could not be confirmed. Reload to try again.'},503);}
}
