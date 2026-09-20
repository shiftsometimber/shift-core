import {connectedDay} from './journey-context.mjs';
import {reviewNextShift} from './life-back/next-shift.mjs';
export const followupOutcomes=['helped','not-fit','not-tried','skip'];
const consentSQL="(SELECT granted FROM consents WHERE user_id=? AND consent_type='my_shift_health_tracking' ORDER BY id DESC LIMIT 1)=1";
const shape=row=>row?{id:row.id,checkInId:row.checkin_id,action:JSON.parse(row.action_json),createdAt:row.created_at,feedback:row.feedback,revision:row.revision,reviewedAt:row.reviewed_at}:null;
const fail=(message,status)=>{throw Object.assign(Error(message),{status})};
export async function saveCheckinWithAction(DB,userId,index,note,at){
 const day=await connectedDay(DB,userId);
 // Keep urgent/practical support destinations on the two rough-day choices.
 const action=index<2?{title:index===0?'See support I can use now':'Open practical support',detail:index===0?'Focus on the next hour and one person you can contact.':'Make today smaller and open the practical support available to you.',href:'/mens-mental-health',label:'Open practical support'}:day.next;
 const id=crypto.randomUUID();
 const results=await DB.batch([
  DB.prepare('INSERT INTO check_ins(user_id,wellbeing_score,notes,submitted_at) SELECT ?,?,?,? WHERE '+consentSQL).bind(userId,index+1,note,at,userId),
  DB.prepare('INSERT INTO daily_checkin_actions(id,checkin_id,user_id,action_json,created_at) SELECT ?,id,user_id,?,? FROM check_ins WHERE id=last_insert_rowid() AND user_id=? AND submitted_at=? AND case_id IS NULL AND '+consentSQL).bind(id,JSON.stringify(action),at,userId,at,userId)
 ]);
 if(results[0].meta.changes!==1||results[1].meta.changes!==1)fail('Health tracking changed before this save. Review your choice and try again.',409);
 return {id:results[0].meta.last_row_id,nextStep:shape(await DB.prepare('SELECT * FROM daily_checkin_actions WHERE id=? AND user_id=?').bind(id,userId).first())};
}
export async function latestCheckinAction(DB,userId,actionId=null){
 if(actionId)return shape(await DB.prepare('SELECT a.* FROM daily_checkin_actions a JOIN check_ins c ON c.id=a.checkin_id AND c.user_id=a.user_id WHERE a.id=? AND a.user_id=? AND c.case_id IS NULL').bind(actionId,userId).first());
 return shape(await DB.prepare('SELECT a.* FROM daily_checkin_actions a JOIN check_ins c ON c.id=a.checkin_id AND c.user_id=a.user_id WHERE a.user_id=? AND c.case_id IS NULL ORDER BY a.checkin_id DESC LIMIT 1').bind(userId).first());
}
export async function reviewCheckinAction(DB,userId,input){
 if(typeof input.actionId!=='string'||input.actionId.length>80||!Number.isInteger(input.revision)||input.revision<0||!followupOutcomes.includes(input.outcome))fail('Choose an available answer for this saved next step.',400);
 const read=()=>DB.prepare('SELECT a.* FROM daily_checkin_actions a JOIN check_ins c ON c.id=a.checkin_id AND c.user_id=a.user_id WHERE a.id=? AND a.user_id=? AND c.case_id IS NULL').bind(input.actionId,userId).first();
 const before=await read();if(!before)fail('This saved next step is no longer available.',404);
 if(before.revision===input.revision+1&&before.feedback===input.outcome)return shape(before);
 const at=new Date().toISOString(),action=JSON.parse(before.action_json);
 if(action.loopId){
  const prefs=JSON.parse((await DB.prepare('SELECT preferences FROM member_state WHERE user_id=?').bind(userId).first())?.preferences||'{}');
  const old=prefs.lifeBack?.progress;
  if(!old||old.nextShift?.id!==action.loopId)fail('This step has already moved on. Reload to see your current next step.',409);
  const next=structuredClone(old),operationId='daily-'+before.id+'-'+input.revision;
  reviewNextShift(next,{shiftId:action.loopId,outcome:input.outcome,operationId},at);
  next.revision++;next.operations=[...(next.operations||[]),operationId].slice(-100);
  const results=await DB.batch([
   DB.prepare("UPDATE member_state SET preferences=json_set(preferences,'$.lifeBack.progress',json(?)),updated_at=? WHERE user_id=? AND json_extract(preferences,'$.lifeBack.progress.revision')=? AND "+consentSQL+" AND EXISTS(SELECT 1 FROM daily_checkin_actions WHERE id=? AND user_id=? AND revision=?)").bind(JSON.stringify(next),at,userId,old.revision,userId,input.actionId,userId,input.revision),
   DB.prepare("UPDATE daily_checkin_actions SET feedback=?,reviewed_at=?,revision=revision+1 WHERE id=? AND user_id=? AND revision=? AND "+consentSQL+" AND EXISTS(SELECT 1 FROM member_state WHERE user_id=? AND json_extract(preferences,'$.lifeBack.progress.revision')=? AND json_extract(preferences,'$.lifeBack.progress.operations[#-1]')=?)").bind(input.outcome,at,input.actionId,userId,input.revision,userId,userId,next.revision,operationId)
  ]);
  if(results.some(r=>r.meta.changes!==1))fail('Your step or tracking choice changed. Reload before answering.',409);
  return shape(await read());
 }
 const result=await DB.prepare('UPDATE daily_checkin_actions SET feedback=?,reviewed_at=?,revision=revision+1 WHERE id=? AND user_id=? AND revision=? AND '+consentSQL).bind(input.outcome,new Date().toISOString(),input.actionId,userId,input.revision,userId).run();
 const after=await read();
 if(result.meta.changes!==1&&!(after?.revision===input.revision+1&&after.feedback===input.outcome))fail('Your feedback or tracking choice changed. Reload before answering.',409);
 return shape(after);
}
