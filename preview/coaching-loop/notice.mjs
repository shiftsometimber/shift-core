import {uid} from './store.mjs';
// Input adapters accept synthetic values only. Text fields are never tool instructions.
export function reading(state,input,now=Date.now()){
 const {source,kind,value,at}=input||{};
 const valid={scale:['weight'],wearable:['activity','sleep'],calendar:['busy']};
 if(!valid[source]?.includes(kind)||!state.permissions[source]||typeof value!=='number'||!Number.isFinite(value)||value<0||value>100000||!Number.isSafeInteger(at)||at>now||at<now-365*86400000)throw Object.assign(Error('invalid_or_unpermitted_reading'),{status:400});
 if(typeof input.eventId!=='string'||!/^test-[a-z0-9-]{1,70}$/.test(input.eventId))throw Object.assign(Error('synthetic_event_required'),{status:400});
 const old=state.readings.find(r=>r.eventId===input.eventId);
 if(old){if(old.source!==source||old.kind!==kind||old.value!==value||old.at!==at)throw Object.assign(Error('event_id_conflict'),{status:409});return{dataUsed:[old.id],reading:old,duplicate:true};}
 const day=new Date(at).toISOString().slice(0,10);
 const conflicts=state.readings.filter(r=>r.source===source&&r.kind===kind&&new Date(r.at).toISOString().slice(0,10)===day&&r.value!==value);
 const row={id:uid(),eventId:input.eventId,source,kind,value,at,receivedAt:now,conflict:conflicts.length>0,synthetic:true};
 for(const r of conflicts)r.conflict=true;
 state.readings.push(row);return{dataUsed:[row.id],reading:row};
}
export function confirmReading(state,id){const row=state.readings.find(r=>r.id===id);if(!row)throw Object.assign(Error('reading_not_found'),{status:404});const day=new Date(row.at).toISOString().slice(0,10);state.readings=state.readings.filter(r=>r.id===id||r.kind!==row.kind||r.source!==row.source||new Date(r.at).toISOString().slice(0,10)!==day);row.conflict=false;return{dataUsed:[row.id]};}
export function dose(state,now=Date.now()){
 if(!state.permissions.dose||state.mode==='stopped')throw Object.assign(Error('dose_logging_unavailable'),{status:409});
 const day=new Date(now).toISOString().slice(0,10);const existing=state.doses.find(d=>d.day===day);if(existing)return{dataUsed:[existing.id],dose:existing};
 const d={id:uid(),at:now,day,source:'member',status:'logged'};state.doses.push(d);return{dataUsed:[d.id],dose:d};
}
export function dataView(state,now=Date.now()){const current=r=>r.at>=now-7*86400000;return {scale:state.permissions.scale?state.readings.filter(r=>r.source==='scale'):[],wearable:state.permissions.wearable?state.readings.filter(r=>r.source==='wearable'):[],dose:state.permissions.dose?state.doses:[],missing:{scale:!state.permissions.scale||!state.readings.some(r=>r.source==='scale'&&!r.conflict&&current(r)),wearable:!state.permissions.wearable||!state.readings.some(r=>r.source==='wearable'&&!r.conflict&&current(r)),dose:!state.permissions.dose||!state.doses.some(current)},missingWindowDays:7};}
// Pattern thresholds remain unsigned. This function is only an explicit fixture probe.
// The night job does NOT call it or raise health-related patterns.
export function probeSyntheticPatterns(state,now=Date.now()){
 const usable=source=>state.permissions[source]?state.readings.filter(r=>r.source===source&&!r.conflict&&r.at>=now-21*86400000):[];
 const weights=usable('scale').filter(r=>r.kind==='weight');const sleep=usable('wearable').filter(r=>r.kind==='sleep');const activity=usable('wearable').filter(r=>r.kind==='activity');const out=[];
 const distinct=rows=>new Set(rows.map(r=>new Date(r.at).toISOString().slice(0,10))).size;
 if(distinct(weights)>=7&&Math.max(...weights.map(r=>r.at))-Math.min(...weights.map(r=>r.at))>=20*86400000&&Math.max(...weights.map(r=>r.value))-Math.min(...weights.map(r=>r.value))<=0.5){out.push({type:'flat-weight',text:'The test weight readings have been flat across three weeks.'+(distinct(sleep)>=7?' Sleep readings are also available.':''),dataUsed:[...weights,...sleep].map(r=>r.id),why:'A reason to review whether the everyday plan still fits, not a cause or a treatment conclusion.'});}
 if(state.permissions.dose&&!state.doses.some(d=>d.at>=now-7*86400000))out.push({type:'no-dose-log',text:'No dose logged in the past seven days.',dataUsed:[],why:'This is a gap in the record, not evidence that a dose was missed.'});
 const older=activity.filter(r=>r.at<now-7*86400000),recent=activity.filter(r=>r.at>=now-7*86400000);
 if(distinct(older)>=7&&distinct(recent)>=7&&recent.reduce((n,r)=>n+r.value,0)/recent.length<0.8*older.reduce((n,r)=>n+r.value,0)/older.length)out.push({type:'activity-records-lower',text:'Activity readings are lower in the recent test records.',dataUsed:activity.map(r=>r.id),why:'A reason to ask what changed, not infer why it changed.'});
 return out.filter(p=>!state.dismissedPatterns.includes(p.type));
}
