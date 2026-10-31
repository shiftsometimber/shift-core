import {foodNutrition,foodNutritionLimits} from './food-entry-nutrition.mjs';

const fields=Object.entries(foodNutritionLimits);
const round=value=>Math.round(value*10)/10;
const day=now=>new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/London',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);
const clean=value=>String(value??'').replace(/[\u0000-\u001f\u007f]/g,' ').trim().slice(0,500);
const emptyPeriod=(from,to)=>({from,to,entryCount:0,loggedDays:0,estimatedEntries:0,nutrition:{},completeDay:false});
const valid=(key,max)=>`json_type(body_json,'$.${key}') IN ('integer','real') AND json_extract(body_json,'$.${key}') BETWEEN 0 AND ${max}`;
const amounts=fields.map(([key,max])=>`SUM(CASE WHEN ${valid(key,max)} THEN json_extract(body_json,'$.${key}') ELSE 0 END) AS ${key}_total,SUM(CASE WHEN ${valid(key,max)} THEN 1 ELSE 0 END) AS ${key}_count`).join(',');

async function permission(DB,userId){
 const consent=await DB.prepare("SELECT id,granted FROM consents WHERE user_id=? AND consent_type='my_shift_health_tracking' ORDER BY id DESC LIMIT 1").bind(userId).first();
 if(Number(consent?.granted)!==1)return {status:'tracking_off'};
 const row=await DB.prepare('SELECT preferences FROM member_state WHERE user_id=?').bind(userId).first();
 if(JSON.parse(row?.preferences||'{}').myJourney?.setup?.paused===true)return {status:'paused'};
 return {status:'available',consentId:Number(consent.id)};
}
function addDay(period,row){
 const count=Number(row.entry_count);period.entryCount+=count;period.loggedDays++;period.estimatedEntries+=Number(row.estimated_count||0);
 for(const [key]of fields){const known=Number(row[key+'_count']||0);if(!known)continue;const current=period.nutrition[key]||{total:0,recordedEntries:0,missingEntries:0};current.total=round(current.total+Number(row[key+'_total']||0));current.recordedEntries+=known;period.nutrition[key]=current;}
 for(const value of Object.values(period.nutrition))value.missingEntries=period.entryCount-value.recordedEntries;
}

// Single read model for the diary, Today, Journey and both Shift AI surfaces.
// No copies are written to progress, meal plans, memory or recommendation stores.
export async function readFoodLog(DB,userId,{now=new Date()}={}){
 if(!Number.isSafeInteger(userId)||userId<=0)return {status:'unavailable'};
 try{
  const access=await permission(DB,userId);if(access.status!=='available')return {status:access.status};
  const date=day(now),start=new Date(date+'T12:00:00Z');start.setUTCDate(start.getUTCDate()-6);const since=start.toISOString().slice(0,10);
  const today=emptyPeriod(date,date),last7Days=emptyPeriod(since,date);let recent=[];
  const exists=await DB.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='member_food_entries'").first();
  if(exists){
   // Aggregate the full date range, independently of the diary's 365-entry
   // display limit. Missing amounts remain unknown; a real recorded zero counts.
   const rows=(await DB.prepare(`SELECT recorded_on,COUNT(*) AS entry_count,SUM(CASE WHEN json_extract(body_json,'$.nutritionSource')='member_confirmed_estimate' THEN 1 ELSE 0 END) AS estimated_count,${amounts} FROM member_food_entries WHERE user_id=? AND recorded_on BETWEEN ? AND ? GROUP BY recorded_on ORDER BY recorded_on`).bind(userId,since,date).all()).results||[];
   for(const row of rows){addDay(last7Days,row);if(row.recorded_on===date)addDay(today,row);}
   const records=(await DB.prepare('SELECT id,recorded_on,body_json FROM member_food_entries WHERE user_id=? AND recorded_on BETWEEN ? AND ? ORDER BY recorded_on DESC,created_at DESC,id DESC LIMIT 12').bind(userId,since,date).all()).results||[];
   recent=records.map(row=>{const value=JSON.parse(row.body_json),nutrition=foodNutrition(value);return {id:row.id,on:row.recorded_on,food:clean(value.food),...nutrition,state:'confirmed_eaten'};});
  }
  const current=await permission(DB,userId);
  if(current.status!=='available')return {status:current.status};
  if(current.consentId!==access.consentId)return {status:'privacy_changed'};
  return {status:'available',date,today,last7Days,recent,recentMayBeLimited:last7Days.entryCount>recent.length,source:'member_food_entries',meaning:'Only confirmed saved food entries. Totals cover recorded amounts only; unlogged food and missing amounts are unknown. Photo amounts remain estimates. Meal plans and manually entered daily progress totals are not added.'};
 }catch{return {status:'unavailable'}}
}
