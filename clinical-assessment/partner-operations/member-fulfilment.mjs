import {orderEventStatements} from './notification-events.mjs';
import {memberTracking,fail,text} from './domain.mjs';
import {supersedeAnsweredQueryStatement} from './notification-review.mjs';
const q=(env,s,...a)=>env.DB.prepare(s).bind(...a),rows=async s=>(await s.all()).results||[],now=()=>new Date().toISOString();
const readable=env=>env.PARTNER_TRACKING_READ_ENABLED==='true'||env.PARTNER_FULFILMENT_ENABLED==='true';
export async function memberFulfilment(env,record){
 if(!readable(env)||!record.order_number)return null;
 const row=await q(env,'SELECT state_json FROM partner_fulfilment WHERE order_number=? AND member_id=?',record.order_number,record.user_id).first();if(!row)return null;const s=JSON.parse(row.state_json);
 const events=await rows(q(env,"SELECT action,created_at FROM partner_audit WHERE entity_type='order' AND entity_id=? ORDER BY version",record.order_number));
 return{...memberTracking(s),version:s.version,queryId:s.status==='query'?s.queryId||null:null,
  canReply:env.PARTNER_MEMBER_REPLIES_ENABLED==='true'&&s.status==='query'&&!!s.queryId&&!s.memberReply,
  message:['query','rejected','cancelled','delivery_exception','returned'].includes(s.status)?s.message||null:null,
  memberReply:s.memberReply?{message:s.memberReply.message,createdAt:s.memberReply.createdAt}:null,events};
}
async function sessionHash(request,env,memberId){
 let checked=0;for(const m of (request.headers.get('cookie')||'').matchAll(/(?:^|;\s*)sst_session=([^;]+)/g)){
  if(++checked>4)break;let token;try{token=decodeURIComponent(m[1]);}catch{continue;}
  const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token))),b=>b.toString(16).padStart(2,'0')).join('');
  if(await q(env,'SELECT 1 ok FROM user_sessions WHERE user_id=? AND token_hash=? AND revoked_at IS NULL AND julianday(expires_at)>julianday(?)',memberId,hash,now()).first())return hash;
 }
 fail(401,'member_session_required');
}
export async function replyToFulfilment(request,env,record,actor,b){
 if(env.PARTNER_MEMBER_REPLIES_ENABLED!=='true')fail(503,'dispensing_replies_not_open');
 if(!record.order_number||record.user_id!==actor.id)fail(404,'order_not_found');
 if(!b||!Number.isInteger(b.version)||typeof b.queryId!=='string')fail(422,'version_and_query_required');
 if(Object.keys(b).some(k=>!['version','queryId','message'].includes(k)))fail(422,'unknown_reply_field');
 const row=await q(env,'SELECT state_json FROM partner_fulfilment WHERE order_number=? AND member_id=?',record.order_number,actor.id).first();if(!row)fail(404,'order_not_found');
 const s=JSON.parse(row.state_json);if(s.version!==b.version||s.status!=='query'||s.queryId!==b.queryId||s.memberReply)fail(409,'dispensing_query_changed');
 const date=now(),message=text(b.message,2000),hash=await sessionHash(request,env,actor.id),event=crypto.randomUUID(),next={...s,version:s.version+1,updatedAt:date,memberReply:{queryId:s.queryId,message,createdAt:date}};
 const guard=" AND EXISTS(SELECT 1 FROM clinical_member_records WHERE id=? AND user_id=? AND order_number=?) AND EXISTS(SELECT 1 FROM user_sessions s JOIN user_auth a ON a.user_id=s.user_id WHERE s.user_id=? AND s.token_hash=? AND s.revoked_at IS NULL AND julianday(s.expires_at)>julianday(?) AND a.email_verified=1)";
 const result=await env.DB.batch([
  q(env,'UPDATE partner_fulfilment SET state_json=?,version=?,updated_at=? WHERE order_number=? AND member_id=? AND version=?'+guard,JSON.stringify(next),next.version,date,s.orderNumber,actor.id,s.version,record.id,actor.id,s.orderNumber,actor.id,hash,date),
  q(env,"INSERT INTO partner_audit SELECT ?,?,?,(SELECT COALESCE(MAX(version),-1)+1 FROM partner_audit WHERE entity_type='order' AND entity_id=?),?,?,?,? WHERE changes()=1",event,'order',s.orderNumber,s.orderNumber,String(actor.id),'member_fulfilment_reply',JSON.stringify({source:'member_portal',recordId:record.id,queryId:s.queryId,message,orderVersion:next.version}),date),
  ...supersedeAnsweredQueryStatement(env,s,event),...await orderEventStatements(env,s,{id:event,action:'member_fulfilment_reply',at:date})
 ]);
 if(result[0].meta?.changes!==1)fail(409,'order_or_session_changed');
 return{saved:true,notificationStatus:'not_sent',fulfilment:await memberFulfilment(env,record)};
}
