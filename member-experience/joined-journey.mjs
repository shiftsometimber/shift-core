// Read-only account view. Baselines and source histories remain untouched.
import {programmeSummary} from './programme-model.mjs';
import {score} from './life-back/model.mjs';

const number=v=>v!==null&&v!==undefined&&v!==''&&Number.isFinite(Number(v))?Number(v):null;
export function joinedJourney(journey={},preferences={},readings={},weekly=null){
 const j=structuredClone(journey),progress=preferences.lifeBack?.progress||journey.lifeBack?.progress;
 const programme=progress?.programme?programmeSummary(progress.programme):null;
 j.weight={...j.weight};j.waist={...j.waist};j.wellbeing={...j.wellbeing};
 const sources={};
 for(const [key,field,branch,target] of [['weight','weight_kg','weight','currentKg'],['waist','waist_cm','waist','currentCm']]){
  const row=readings[key],value=number(row?.[field]);
  if(value!==null&&(!j.setup?.startDate||!row.recorded_on||row.recorded_on>=j.setup.startDate)){j[branch][target]=value;sources[key]={on:row.recorded_on,source:row.source||'recorded'};}
 }
 const feeling=number(weekly?.overall_feeling);
 if(feeling!==null&&feeling>=0&&feeling<=100){j.wellbeing.latest=feeling;j.wellbeing.note=weekly.note||'';}
 const entries=(progress?.entries||[]).filter(e=>Number.isFinite(Date.parse(e.at))&&score(e.ratings||{})!==null).sort((a,b)=>Date.parse(a.at)-Date.parse(b.at));
 const current=entries.filter(e=>e.goalId===progress?.goalId),latest=current.at(-1),baseline=current[0];
 j.connected={reason:programme?.reason||null,hasProgramme:Boolean(programme),measurements:sources,
  lifeBack:latest?{score:Math.round(score(latest.ratings)),at:latest.at,win:latest.win||'',goal:latest.goal,
   baselineScore:baseline?Math.round(score(baseline.ratings)):null}:null};
 return j;
}

export async function readJoinedJourney(DB,userId,journey={},preferences={}){
 // Optional tables may not exist on older installations. Once present, a read
 // failure must surface rather than quietly presenting a stale "current" value.
 const tables=(await DB.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name IN ('progress_entries','my_journey_weekly_checkins')").all()).results||[];
 const has=name=>tables.some(t=>t.name===name);
 const [weight,waist,weekly]=await Promise.all([
  has('progress_entries')?DB.prepare('SELECT recorded_on,weight_kg,source FROM progress_entries WHERE user_id=? AND weight_kg IS NOT NULL ORDER BY recorded_on DESC,id DESC LIMIT 1').bind(userId).first():null,
  has('progress_entries')?DB.prepare('SELECT recorded_on,waist_cm,source FROM progress_entries WHERE user_id=? AND waist_cm IS NOT NULL ORDER BY recorded_on DESC,id DESC LIMIT 1').bind(userId).first():null,
  has('my_journey_weekly_checkins')?DB.prepare('SELECT week_ending,overall_feeling,note FROM my_journey_weekly_checkins WHERE user_id=? AND confirmed_at IS NOT NULL ORDER BY week_ending DESC,id DESC LIMIT 1').bind(userId).first():null
 ]);
 return joinedJourney(journey,preferences,{weight,waist},weekly);
}
