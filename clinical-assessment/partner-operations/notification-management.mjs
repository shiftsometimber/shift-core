import {actorFor,authCondition,audit,readJson} from './api.mjs';
import {prepareEventChannels} from './notification-events.mjs';
import {fail,text} from './domain.mjs';
const BASE='/v1/hq/clinical/notifications',ORIGIN='https://hq.shiftsometimber.co.uk';
const reply=(b,status=200)=>Response.json(b,{status,headers:{'Cache-Control':'no-store, private','Access-Control-Allow-Origin':ORIGIN,'Access-Control-Allow-Credentials':'true','Vary':'Origin','X-Content-Type-Options':'nosniff'}});
export function channelOutcome(row){
 if(row.status==='superseded')return'superseded';
 if(row.delivery_status==='available_in_app')return'published_in_app';
 if(row.provider_id&&row.delivery_status==='sent')return'provider_accepted';
 if(row.error_code||['failed','unknown','delivery_unknown'].includes(row.delivery_status))return'failed_or_unknown';
 if(row.draft_status==='draft')return'draft_awaiting_approval';
 if(row.draft_status==='cancelled')return'cancelled';
 if(row.draft_status==='scheduled')return'approved_scheduled';
 return row.channel==='whatsapp'?'awaiting_template_opt_in_and_provider':row.status;
}
export async function notificationManagementRoute(request,env,authenticate){
 const url=new URL(request.url);if(url.pathname!==BASE&&!url.pathname.startsWith(BASE+'/'))return null;
 try{
  if(request.headers.has('Origin')&&request.headers.get('Origin')!==ORIGIN)fail(403,'origin_forbidden');
  if(request.method==='OPTIONS')return new Response(null,{status:204,headers:{'Access-Control-Allow-Origin':ORIGIN,'Access-Control-Allow-Credentials':'true','Access-Control-Allow-Methods':'GET, POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type','Cache-Control':'no-store'}});
  if(!['GET','POST'].includes(request.method))fail(405,'method_not_allowed');
  if(request.method==='POST'&&request.headers.get('Origin')!==ORIGIN)fail(403,'origin_required');
  if(env.NOTIFICATION_EVENTS_ENABLED!=='true')fail(503,'notification_events_not_enabled');
  const a=await actorFor(request,env,authenticate);if(a.response)return a.response;
  if(a.role!=='owner')fail(403,'owner_review_required');
  const q=(s,...args)=>env.DB.prepare(s).bind(...args),all=async s=>(await s.all()).results||[];
  await audit(env,a,'notification_review',url.searchParams.get('id')?text(url.searchParams.get('id'),200):'events','notification_review_accessed');
  if(request.method==='POST'&&url.pathname===BASE+'/prepare'){
   const b=await readJson(request);if(Object.keys(b).some(k=>k!=='eventId'))fail(422,'event_id_only');
   return reply(await prepareEventChannels(env,text(b.eventId,200),a,()=>authCondition(a,new Date().toISOString())));
  }
  if(request.method!=='GET'||url.pathname!==BASE)fail(404,'not_found');
  const id=url.searchParams.get('id');
  if(id){
   text(id,200);const event=await q('SELECT * FROM clinical_notification_events WHERE id=?',id).first();if(!event)fail(404,'notification_event_not_found');
   const channels=await all(q('SELECT c.*,d.status draft_status,d.hash,d.payload_json,r.status delivery_status,r.provider_id,r.error_code,r.at,r.read_at FROM clinical_notification_channels c LEFT JOIN hq_comms_drafts d ON d.id=c.draft_id LEFT JOIN hq_comms_recipients r ON r.draft_id=d.id AND r.user_id=? WHERE c.event_id=?',event.member_id,id));
   return reply({event,channels:channels.map(({payload_json,...r})=>({...r,outcome:channelOutcome(r),draft:payload_json?JSON.parse(payload_json):null})),whatsappText:event.title+'. '+event.body+' https://shiftsometimber.co.uk'+event.link,sentByThisService:false});
  }
  const events=await all(q('SELECT e.id,e.order_number,e.kind,e.title,e.created_at,c.channel,c.status,c.draft_id FROM (SELECT * FROM clinical_notification_events ORDER BY created_at DESC,id DESC LIMIT 100) e JOIN clinical_notification_channels c ON c.event_id=e.id ORDER BY e.created_at DESC,e.id DESC,c.channel'));
  const grouped=new Map();for(const row of events){if(!grouped.has(row.id))grouped.set(row.id,{id:row.id,orderNumber:row.order_number,kind:row.kind,title:row.title,at:row.created_at,channels:[]});grouped.get(row.id).channels.push({channel:row.channel,status:row.status});}
  return reply({events:[...grouped.values()],reviewOnly:true});
 }catch(e){return reply({error:e.status?e.message:'notification_review_unavailable'},e.status||503);}
}
