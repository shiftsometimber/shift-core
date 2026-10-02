import {boundary} from './safety.mjs';
export async function supportView(DB,userId){
 const present=await DB.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='support_tickets'").first();
 if(!present)return{available:false,tickets:[],responsePromise:null};
 const tickets=(await DB.prepare("SELECT reference,status,created_at,updated_at,closed_at,CASE WHEN assigned_hq_user_id IS NULL THEN 0 ELSE 1 END assigned FROM support_tickets WHERE user_id=? AND reference LIKE 'COACH-%' ORDER BY created_at DESC LIMIT 5").bind(userId).all()).results||[];
 return{available:true,tickets,responsePromise:null,channel:'Existing SHIFT HQ support queue',clinical:false};
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
 const result=await DB.prepare("UPDATE support_tickets SET status='open',closed_at=NULL,updated_at=? WHERE reference=? AND user_id=? AND status='closed' AND (SELECT COUNT(*) FROM support_tickets WHERE user_id=? AND reference LIKE 'COACH-%' AND status!='closed')<3").bind(new Date(now).toISOString(),reference,userId,userId).run();
 if(Number(result.meta?.changes)!==1)throw Object.assign(Error('support_request_not_closed'),{status:409});
 return{reference,status:'open'};
}
