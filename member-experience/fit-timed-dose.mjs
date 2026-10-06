// Preserve authored repetition and timed doses as distinct fields.
export function fitDoseFields(data={}){return {reps:data.dosage?.reps??null,time_seconds:data.dosage?.time_seconds??null};}
// Response-only recovery of proven legacy seconds-to-reps serialisation.
export async function restoreSavedFitTiming(DB,plan){
 if(!plan?.sessions?.some(s=>s.exercises?.some(isLegacyTimed)))return plan;
 const copy=structuredClone(plan),rows=new Map();
 for(const session of copy.sessions)for(const item of session.exercises||[]){
  if(!isLegacyTimed(item))continue;
  let row=rows.get(item.id);
  if(!rows.has(item.id)){try{row=await DB.prepare("SELECT title,version,data_json FROM structured_content WHERE id=? AND content_type='exercise' AND status='published'").bind(item.id).first();}catch{row=null;}rows.set(item.id,row);}
  let data;try{data=JSON.parse(row?.data_json||'null');}catch{}
  const dose=data?.dosage;
  const identityMatches=row?.title===item.name&&Number(row.version)===Number(item.structured.version)&&data?.canonical_movement===item.canonical_movement;
  if(identityMatches&&Number(dose?.reps)>0&&Number(dose.reps)===Number(item.reps))continue;
  if(row?.title===item.name&&Number(row.version)===Number(item.structured.version)&&data?.canonical_movement===item.canonical_movement&&dose?.reps==null&&Number(dose?.time_seconds)>0&&Number(dose.time_seconds)===Number(item.reps)&&Number(dose.sets)===Number(item.sets)&&Number(dose.rest_seconds||0)===Number(item.rest_seconds||0)){
   item.time_seconds=Number(dose.time_seconds);item.reps=null;
  }else item.timing_review_required=true;
 }
 return copy;
}
function isLegacyTimed(item){return item?.dose_locked!==true&&item?.structured?.published===true&&['cardio','mobility','stretch','balance'].includes(item.movement_group)&&Number(item.reps)>0&&item.time_seconds==null;}
