import {boundary} from './safety.mjs';
export const threadSubject='My Timber everyday coaching help [thread-v1]';
// Only authenticated team code sets this subject. Legacy member text that
// resembles JSON is still plain request text, never a forged team reply.
export function supportThread(ticket){
 if(ticket.subject!==threadSubject)return{format:'shift-coach-thread-1',request:ticket.body||'',replies:[],confirmation:null};
 const thread=JSON.parse(ticket.body);
 if(thread?.format!=='shift-coach-thread-1'||typeof thread.request!=='string'||!Array.isArray(thread.replies)||thread.replies.length>20||thread.replies.some(r=>typeof r.id!=='string'||typeof r.text!=='string'||typeof r.author!=='string'||!Number.isInteger(r.actorId)||!Number.isFinite(Date.parse(r.at))))throw Object.assign(Error('support_thread_unavailable'),{status:503});
 return thread;
}
export function publicThread(ticket){const t=supportThread(ticket);return{message:t.request,replies:t.replies.map(({id,text,author,at})=>({id,text,author,at})),resolution:t.confirmation?.replyId===t.replies.at(-1)?.id?t.confirmation:null};}
export function waitingRequest(ticket,now=Date.now()){
 const at=Date.parse(ticket.updated_at||ticket.created_at||'');
 const hours=Number.isFinite(at)&&at<=now?Math.floor((now-at)/3600000):null;
 return {...ticket,waitingHours:ticket.status==='closed'?null:hours,needsUpdate:ticket.status!=='closed'&&hours!==null&&hours>=48};
}
export async function supportView(DB,userId,now=Date.now()){
 const present=await DB.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='support_tickets'").first();
 if(!present)return{available:false,tickets:[],responsePromise:null};
 const tickets=(await DB.prepare("SELECT reference,status,subject,body,created_at,updated_at,closed_at,CASE WHEN assigned_hq_user_id IS NULL THEN 0 ELSE 1 END assigned FROM support_tickets WHERE user_id=? AND reference LIKE 'COACH-%' ORDER BY CASE WHEN status='closed' THEN 1 ELSE 0 END,created_at DESC LIMIT 5").bind(userId).all()).results||[];
 return{available:true,tickets:tickets.map(({body,subject,...t})=>{let thread;try{thread=publicThread({...t,body,subject})}catch{thread={message:null,replies:[],resolution:null,unavailable:true}}return waitingRequest({...t,...thread},now)}),responsePromise:null,channel:'Existing SHIFT HQ support queue',clinical:false};
}
export async function requestSupport(DB,userId,input,consentId,now=Date.now()){
 if(typeof input.message!=='string'||!input.message.trim()||input.message.length>1000||input.share!==true)throw Object.assign(Error('support_message_and_permission_required'),{status:400});
 if(!boundary(input.message).coaching)throw Object.assign(Error('health_concern_use_help'),{status:422});
 const view=await supportView(DB,userId);if(!view.available)throw Object.assign(Error('support_queue_unavailable'),{status:503});
 const reference='COACH-'+userId+'-'+input.operationId,at=new Date(now).toISOString();
 // Existing reference makes a repeated submission idempotent. Admission and
 // consent are checked within the insert so parallel tabs cannot exceed the cap.
 const result=await DB.prepare("INSERT OR IGNORE INTO support_tickets(reference,user_id,subject,priority,status,body,assigned_hq_user_id,created_at,updated_at) SELECT ?,?,'My Timber everyday coaching help','normal','open',?,NULL,?,? WHERE (SELECT COUNT(*) FROM support_tickets WHERE user_id=? AND reference LIKE 'COACH-%' AND status!='closed')<3 AND (SELECT granted FROM consents WHERE user_id=? AND consent_type='my_shift_health_tracking' ORDER BY id DESC LIMIT 1)=1 AND (SELECT id FROM consents WHERE user_id=? AND consent_type='my_shift_health_tracking' ORDER BY id DESC LIMIT 1)=?").bind(reference,userId,input.message.trim(),at,at,userId,userId,userId,consentId).run();
 const ticket=await DB.prepare('SELECT reference,status FROM support_tickets WHERE reference=? AND user_id=?').bind(reference,userId).first();
 if(!ticket)throw Object.assign(Error('support_request_limit_or_consent_changed'),{status:409});
 return{reference:ticket.reference,status:ticket.status,duplicate:Number(result.meta?.changes)!==1};
}
export async function reopenSupport(DB,userId,reference,now=Date.now()){
 if(typeof reference!=='string'||!reference.startsWith('COACH-'+userId+'-'))throw Object.assign(Error('support_request_missing'),{status:404});
 const result=await DB.prepare("UPDATE support_tickets SET status='open',closed_at=NULL,updated_at=?,body=CASE WHEN subject=? AND json_valid(body) THEN json_set(body,'$.confirmation',NULL) ELSE body END WHERE reference=? AND user_id=? AND status='closed' AND (SELECT COUNT(*) FROM support_tickets WHERE user_id=? AND reference LIKE 'COACH-%' AND status!='closed')<3").bind(new Date(now).toISOString(),threadSubject,reference,userId,userId).run();
 if(Number(result.meta?.changes)!==1)throw Object.assign(Error('support_request_not_closed'),{status:409});
 return{reference,status:'open'};
}
export async function confirmSupport(DB,userId,input,now=Date.now()){
 const ticket=await DB.prepare("SELECT * FROM support_tickets WHERE reference=? AND user_id=? AND reference LIKE 'COACH-%'").bind(input.reference,userId).first();
 if(!ticket)throw Object.assign(Error('support_request_missing'),{status:404});
 const thread=supportThread(ticket),latest=thread.replies.at(-1);
 if(!latest||latest.id!==input.replyId)throw Object.assign(Error('support_reply_changed'),{status:409});
 if(thread.confirmation?.replyId===latest.id)return{reference:ticket.reference,status:ticket.status,duplicate:true};
 const at=new Date(now).toISOString();thread.confirmation={replyId:latest.id,at};
 const r=await DB.prepare("UPDATE support_tickets SET body=?,status='closed',closed_at=?,updated_at=? WHERE reference=? AND user_id=? AND body IS ? AND subject=?").bind(JSON.stringify(thread),at,at,ticket.reference,userId,ticket.body,threadSubject).run();
 if(Number(r.meta?.changes)!==1)throw Object.assign(Error('support_reply_changed'),{status:409});
 return{reference:ticket.reference,status:'closed',memberConfirmed:true};
}
