// Pure, member-recorded facts. Draft exposure calculations are review tools only.
export const HOUR=3600000,DAY=24*HOUR,WEEK=7*DAY;
export const WEEK_MEDICINES=['Mounjaro','Wegovy'];
export const CYCLE_REVIEW=Object.freeze({version:'my-timber-cycle/2026-10-13-draft',status:'pending',clinicalReviewer:null,modelReviewer:null});
export const CYCLE_SPEC=Object.freeze({
 Mounjaro:{halfLifeHours:120,illustrativePeakHours:36,source:'https://www.medicines.org.uk/emc/product/15481/smpc',sourceMeaning:'UK SmPC 5.2: approximately five-day half-life; peak concentration 8–72 hours. The 36-hour model peak is an illustrative assumption, not a published patient prediction.',strengths:[2.5,5,7.5,10,12.5,15]},
 Wegovy:{halfLifeHours:168,illustrativePeakHours:48,source:'https://www.medicines.org.uk/emc/product/13800/smpc',sourceMeaning:'UK SmPC 5.2: approximately one-week half-life. The 48-hour model peak is an illustrative assumption requiring separate model review.',strengths:[0.25,0.5,1,1.7,2.4,7.2]}
});
const parse=v=>{try{return typeof v==='string'?JSON.parse(v):v&&typeof v==='object'?v:{}}catch{return{}}};
const stamp=v=>typeof v==='string'&&/Z$|[+-]\d{2}:\d{2}$/.test(v)?Date.parse(v):NaN;
const label=at=>new Date(at).toISOString();
const own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
const median=v=>{const a=[...v].sort((x,y)=>x-y);return a.length?a.length%2?a[(a.length-1)/2]:(a[a.length/2-1]+a[a.length/2])/2:null};
export function recordedStrength(value,medicine){
 if(typeof value!=='string'||!CYCLE_SPEC[medicine])return null;
 const m=/^\s*(\d+(?:\.\d+)?)\s*mg\s*$/i.exec(value);
 return m&&CYCLE_SPEC[medicine].strengths.includes(Number(m[1]))?Number(m[1]):null;
}
export function buildRecordedWeek({records=[],events=[],now=Date.now(),days=84,limited=false}){
 if(!Number.isFinite(now)||days!==84)throw Error('invalid_week_window');
 const since=now-days*DAY,owned=new Map(records.filter(r=>WEEK_MEDICINES.includes(r.medicine)).map(r=>[String(r.id),r]));
 const seen=new Set(),rows=events.filter(e=>{if(!owned.has(String(e.treatment_id))||typeof e.id!=='string'||seen.has(e.id)||!Number.isFinite(stamp(e.occurred_at))||stamp(e.occurred_at)>now||stamp(e.occurred_at)<since)return false;seen.add(e.id);return true}).map(e=>({...e,details:parse(e.body_json??e.details)})).sort((a,b)=>stamp(a.occurred_at)-stamp(b.occurred_at)||Number(a.sequence||0)-Number(b.sequence||0));
 const doses=rows.filter(e=>e.kind==='dose_taken').map(e=>({id:e.id,treatmentId:String(e.treatment_id),medicine:owned.get(String(e.treatment_id)).medicine,at:e.occurred_at,strengthMg:recordedStrength(e.details.doseStrength,owned.get(String(e.treatment_id)).medicine),recordedStrength:typeof e.details.doseStrength==='string'?e.details.doseStrength.slice(0,80):null,site:typeof e.details.injectionSite==='string'?e.details.injectionSite:null}));
 const checks=rows.filter(e=>e.kind==='checkin'&&e.details.checkin&&typeof e.details.checkin==='object').map(e=>({id:e.id,treatmentId:String(e.treatment_id),loggedAt:e.occurred_at,c:e.details.checkin}));
 const symptoms=checks.filter(e=>typeof e.c.sideEffects==='string'&&e.c.sideEffects.trim()).map(e=>{const at=stamp(e.c.symptomStartedAt),valid=Number.isFinite(at)&&at<=stamp(e.loggedAt)&&at>=since;return{id:e.id,treatmentId:e.treatmentId,at:valid?e.c.symptomStartedAt:e.loggedAt,loggedAt:e.loggedAt,timeBasis:valid?'reported_onset':'log_time_onset_unknown',type:['Nausea','Reflux','Bloating','Constipation','Diarrhoea','Fatigue','Headache','Other'].includes(e.c.symptomType)?e.c.symptomType:null,severity:Number.isInteger(e.c.symptomSeverity)&&e.c.symptomSeverity>=0&&e.c.symptomSeverity<=10?e.c.symptomSeverity:null,note:e.c.sideEffects.trim().slice(0,2000),impact:['None','A little','Some','A lot'].includes(e.c.symptomImpact)?e.c.symptomImpact:null}});
 const cycles=[];
 for(const[id,r]of owned){
  const ds=doses.filter(d=>d.treatmentId===id);
  for(let i=0;i<ds.length;i++){
   const d=ds[i],start=stamp(d.at),end=start+WEEK,next=ds[i+1]?stamp(ds[i+1].at):Infinity;
   const interruptions=rows.filter(e=>String(e.treatment_id)===id&&['paused','finished'].includes(e.kind)&&stamp(e.occurred_at)>start&&stamp(e.occurred_at)<end);
   const state=next<end?'shortened':interruptions.length?'interrupted':end>now?'incomplete':'complete';
   const windowEnd=Math.min(end,next,now,...interruptions.map(e=>stamp(e.occurred_at)));
   const dayRows=Array.from({length:7},(_,n)=>{const a=start+n*DAY,b=a+DAY;
    const ss=symptoms.filter(s=>s.treatmentId===id&&stamp(s.at)>=a&&stamp(s.at)<Math.min(b,windowEnd));
    const cs=checks.filter(c=>c.treatmentId===id&&stamp(c.loggedAt)>=a&&stamp(c.loggedAt)<Math.min(b,windowEnd));
    return{day:n+1,from:label(a),to:label(b),state:a>=windowEnd?'not_observed':b>windowEnd?'partial':'elapsed',symptomEntries:ss,explicitNoSymptomsEntries:cs.filter(c=>c.c.sideEffects===''&&c.c.symptomImpact==='None').map(c=>c.id),appetite:cs.filter(c=>['Low','Usual','High'].includes(c.c.appetite)).map(c=>({id:c.id,value:c.c.appetite})),energy:cs.filter(c=>['Low','Usual','High'].includes(c.c.energy)).map(c=>({id:c.id,value:c.c.energy})),checkinIds:cs.map(c=>c.id),meaning:'Entries describe moments recorded; absent entries and unobserved time are unknown.'};
   });
   cycles.push({id:d.id,treatmentId:id,medicine:r.medicine,strengthMg:d.strengthMg,recordedStrength:d.recordedStrength,at:d.at,to:label(end),site:d.site,state,days:dayRows});
  }
 }
 const observations=[],groups=new Map();
 for(const c of cycles.filter(c=>c.state==='complete'&&c.strengthMg!==null)){const key=c.treatmentId+'|'+c.strengthMg;if(!groups.has(key))groups.set(key,[]);groups.get(key).push(c)}
 for(const group of groups.values()){
  if(group.length<3)continue;
  for(let n=0;n<7;n++)for(const type of ['Nausea','Reflux','Bloating','Constipation','Diarrhoea','Fatigue','Headache','Other','Unspecified']){
   const matches=group.map(c=>({cycle:c,entries:c.days[n].symptomEntries.filter(s=>s.timeBasis==='reported_onset'&&(s.type||'Unspecified')===type)})).filter(x=>x.entries.length);
   if(matches.length<2)continue;
   const entries=matches.flatMap(x=>x.entries),title=type==='Unspecified'?'Symptom starts':type+' starts';
   observations.push({key:group[0].treatmentId+'|'+group[0].strengthMg+'|'+(n+1)+'|'+type,treatmentId:group[0].treatmentId,medicine:group[0].medicine,strengthMg:group[0].strengthMg,day:n+1,type,text:title+' were reported on day '+(n+1)+' after '+matches.length+' of '+group.length+' completed recorded weeks at '+group[0].strengthMg+' mg '+group[0].medicine+'.',limitation:'This counts recorded timing, not symptom risk or proof of cause. Missing entries stay unknown; other factors may explain the pattern.',evidence:{doseIds:matches.map(x=>x.cycle.id),eligibleDoseIds:group.map(c=>c.id),symptomIds:entries.map(s=>s.id),onsets:entries.map(s=>s.at),matchedCycles:matches.length,completedCycles:group.length,medianRecordedSeverity:median(entries.filter(s=>s.severity!==null).map(s=>s.severity))}});
  }
 }
 const questionNotes=rows.filter(e=>e.kind==='note'&&typeof e.details.note==='string'&&e.details.note.trim()).map(e=>({id:e.id,treatmentId:String(e.treatment_id),at:e.occurred_at,text:e.details.note.trim().slice(0,2000)}));
 return{contract:'member-recorded-week/v1',from:label(since),to:label(now),historyMayBeLimited:limited,cycles:cycles.sort((a,b)=>stamp(b.at)-stamp(a.at)),observations:observations.slice(0,12),questionNotes,curve:{status:'review_pending',review:CYCLE_REVIEW,message:'The medication estimate is awaiting qualified model and clinical review. Recorded entries remain available.'},limitations:['No diagnosis, symptom forecast or treatment advice.','Day numbers use elapsed 24-hour periods after the recorded injection, not calendar dates.','Incomplete, shortened and interrupted weeks are excluded from repeated-pattern counts.','A recorded no-symptoms moment does not establish a symptom-free day.']};
}

// First-order absorption/elimination illustration. Not an approved patient model.
export function absorptionRate(halfLifeHours,peakHours){
 const ke=Math.log(2)/halfLifeHours;
 if(!Number.isFinite(ke)||ke<=0||!Number.isFinite(peakHours)||peakHours<=0||peakHours>=1/ke)throw Error('invalid_model_parameters');
 let lo=ke*(1+1e-7),hi=10;
 const peak=ka=>Math.log(ka/ke)/(ka-ke);
 while(peak(hi)>peakHours){hi*=2;if(hi>1e6)throw Error('invalid_model_parameters')}
 for(let i=0;i<80;i++){const mid=(lo+hi)/2;if(peak(mid)>peakHours)lo=mid;else hi=mid}
 return(lo+hi)/2;
}
export function draftExposureAt(doses,medicine,at){
 const spec=CYCLE_SPEC[medicine];if(!spec||!Number.isFinite(at)||!Array.isArray(doses)||doses.length>1000)throw Error('unsupported_model');
 const ke=Math.log(2)/spec.halfLifeHours,ka=absorptionRate(spec.halfLifeHours,spec.illustrativePeakHours);
 let total=0;const seen=new Set();
 for(const d of doses){if(typeof d.id!=='string'||seen.has(d.id))throw Error('invalid_model_dose');seen.add(d.id);const t=stamp(d.at);if(d.medicine!==medicine||!Number.isFinite(t)||!spec.strengths.includes(d.strengthMg))throw Error('invalid_model_dose');const hours=(at-t)/HOUR;if(hours<=0)continue;total+=d.strengthMg*ka/(ka-ke)*(Math.exp(-ke*hours)-Math.exp(-ka*hours))}
 return total;
}
export function buildDraftExposureCurve({doses=[],medicine,now=Date.now(),from=now-7*DAY,to=now+7*DAY,historyConfirmed=false}){
 if(!CYCLE_SPEC[medicine])return{status:'unsupported'};
 if(!historyConfirmed)return{status:'history_unconfirmed'};
 if(!Number.isFinite(now)||!Number.isFinite(from)||!Number.isFinite(to)||from>=to||to-from>28*DAY||to>now+7*DAY||from<now-84*DAY)return{status:'invalid_window'};
 if(!doses.length)return{status:'no_doses'};
 if(doses.length>1000||doses.some(d=>stamp(d.at)>now))return{status:'invalid_doses'};
 const points=[];
 try{for(let at=from;at<=to;at+=6*HOUR)points.push({at:label(at),value:draftExposureAt(doses,medicine,at),projected:at>now})}catch{return{status:'unknown_or_invalid_dose'}};
 const top=Math.max(...points.map(p=>p.value));
 return{status:'review_example',medicine,version:CYCLE_REVIEW.version,review:CYCLE_REVIEW,historyConfirmed,points:points.map(p=>({...p,value:top?p.value/top*100:0})),axis:'Relative illustrative exposure, scaled to 0–100 in this view; not a blood measurement',futureMeaning:'Future points illustrate decay of logged doses only. No scheduled dose is assumed taken.',assumptions:CYCLE_SPEC[medicine],limits:['The absorption peak is an illustrative assumption, not a fitted or clinically validated parameter.','Only confirmed recorded doses contribute; unrecorded earlier doses may alter the real level.','No prediction of personal appetite, symptoms, efficacy or a safe dosing decision.']};
}

export function recordedWeekSummary(week,cycleId){
 const c=week.cycles.find(c=>c.id===cycleId);if(!c)throw Error('cycle_not_found');
 const lines=['My Timber — recorded treatment week','Member-reported facts; not a clinical assessment',c.medicine+' · '+(c.recordedStrength||'Strength not recorded'),c.at+' to '+c.to+' · '+c.state,''];
 for(const d of c.days){lines.push('Day '+d.day+' · '+d.from+' to '+d.to);for(const s of d.symptomEntries)lines.push((s.type||'Symptom')+': '+s.note+' · '+(s.severity===null?'Severity unknown':s.severity+'/10')+' · '+s.at+' · '+s.timeBasis);for(const a of d.appetite)lines.push('Appetite: '+a.value);for(const e of d.energy)lines.push('Energy: '+e.value);if(d.explicitNoSymptomsEntries.length)lines.push('Explicit no-symptoms entries: '+d.explicitNoSymptomsEntries.length+' (recorded moments)');if(!d.checkinIds.length&&!d.symptomEntries.length)lines.push(d.state==='not_observed'?'Not observed yet':'No entries; unknown');lines.push('')}
 for(const n of week.questionNotes.filter(n=>n.treatmentId===c.treatmentId&&stamp(n.at)>=stamp(c.at)&&stamp(n.at)<stamp(c.to)))lines.push('Personal note: '+n.text);
 lines.push('Nothing is sent automatically.');return lines.join('\n');
}
