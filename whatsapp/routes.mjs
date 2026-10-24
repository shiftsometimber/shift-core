import {authenticateWorkHQ} from '../worker.js';
import {authenticateMember} from '../member-state-fast-v1.js';
import {validSignature,createLink,confirmLink,linkState,unlink,inboundMessages,ingest,readiness,draftReply,audit,fail} from './core.mjs';
import {page,client,MEMBER_PAGE,HQ_PAGE,ASSET} from './ui.mjs';
export const WEBHOOK='/v1/integrations/whatsapp/webhook';
const memberAPI='/v1/member/whatsapp',hqAPI='/v1/hq/whatsapp';
const headers={'Cache-Control':'no-store, private','Vary':'Cookie','X-Content-Type-Options':'nosniff','X-Robots-Tag':'noindex, nofollow','Referrer-Policy':'no-referrer'};
const json=(body,status=200)=>Response.json(body,{status,headers});
async function bodyBytes(request,max){
 const reader=request.body?.getReader();if(!reader)throw fail('body_required');
 let size=0;const chunks=[];
 try{for(;;){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>max){await reader.cancel();throw fail('request_too_large',413);}chunks.push(value);}}finally{reader.releaseLock();}
 const out=new Uint8Array(size);let offset=0;for(const part of chunks){out.set(part,offset);offset+=part.length;}return out;
}
const parse=bytes=>{try{return JSON.parse(new TextDecoder().decode(bytes));}catch{throw fail('invalid_json');}};
const readers=new Set(['owner','admin','operations','support']);
export async function whatsappRoutes(request,env,{memberAuth=authenticateMember,hqAuth=authenticateWorkHQ}={}){
 const u=new URL(request.url),path=u.pathname;
 if(![WEBHOOK,ASSET,MEMBER_PAGE,HQ_PAGE,memberAPI,hqAPI,hqAPI+'/draft'].includes(path))return null;
 try{
  if(path===WEBHOOK){
   if(!readiness(env).configured||env.WHATSAPP_INBOUND_ENABLED!=='true')return json({error:'whatsapp_not_enabled'},503);
   if(request.method==='GET'){
    if(u.searchParams.get('hub.mode')!=='subscribe'||u.searchParams.get('hub.verify_token')!==env.WHATSAPP_VERIFY_TOKEN||!/^\d{1,80}$/.test(u.searchParams.get('hub.challenge')||''))return json({error:'verification_failed'},403);
    return new Response(u.searchParams.get('hub.challenge'),{headers:{...headers,'Content-Type':'text/plain'}});
   }
   if(request.method!=='POST')return json({error:'method_not_allowed'},405);
   const raw=await bodyBytes(request,256000);
   if(!await validSignature(raw,request.headers.get('X-Hub-Signature-256'),env.WHATSAPP_APP_SECRET))return json({error:'invalid_signature'},401);
   return json({ok:true,...await ingest(env.DB,inboundMessages(parse(raw),env))});
  }
  if(path===ASSET){if(!['GET','HEAD'].includes(request.method))return json({error:'method_not_allowed'},405);return new Response(request.method==='HEAD'?null:client,{headers:{...headers,'Content-Type':'text/javascript; charset=utf-8'}});}
  if(path===hqAPI+'/draft'&&request.method!=='POST')return json({error:'method_not_allowed'},405);
  if(u.search)return json({error:'unsupported_query'},400);
  if(!['GET','POST'].includes(request.method)||[MEMBER_PAGE,HQ_PAGE].includes(path)&&request.method!=='GET')return json({error:'method_not_allowed'},405);
  if(request.method==='POST'&&(request.headers.get('Origin')!==u.origin||request.headers.get('Sec-Fetch-Site')==='cross-site'))return json({error:'origin_not_allowed'},403);
  const member=[MEMBER_PAGE,memberAPI].includes(path);
  const auth=await (member?memberAuth:hqAuth)(request,env);
  if(auth.response)return new Response(auth.response.body,{status:auth.response.status,headers:{...Object.fromEntries(auth.response.headers),...headers}});
  if(!member&&(!readers.has(auth.user.role)||request.method==='POST'&&auth.user.role!=='owner'))return json({error:'hq_forbidden'},403);
  if([MEMBER_PAGE,HQ_PAGE].includes(path))return new Response(page(member?'member':'hq'),{headers:{...headers,'Content-Type':'text/html; charset=utf-8','Content-Security-Policy':"default-src 'none'; script-src 'self'; style-src 'unsafe-inline'; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'"}});
  if(request.method==='GET'){
   if(member)return json({...await linkState(env.DB,auth.userId),available:readiness(env).configured&&readiness(env).inboundEnabled});
   const messages=(await env.DB.prepare("SELECT message_id,sender,user_id,kind,body,received_at,draft,drafted_at FROM whatsapp_messages WHERE julianday(received_at)>=julianday('now','-30 days') ORDER BY received_at DESC,message_id DESC LIMIT 100").all()).results||[];
   await audit(env.DB,'inbox.viewed',{actorId:auth.userId});
   return json({readiness:readiness(env),canDraft:auth.user.role==='owner'&&readiness(env).aiDraftsEnabled,messages});
  }
  if(!request.headers.get('Content-Type')?.startsWith('application/json'))return json({error:'json_required'},415);
  const input=parse(await bodyBytes(request,4096));if(!input||typeof input!=='object'||Array.isArray(input))return json({error:'invalid_request'},400);
  if(member){
   if(input.kind==='create'&&(!readiness(env).configured||!readiness(env).inboundEnabled))return json({error:'whatsapp_not_connected_yet'},409);
   if(input.kind==='create')return json(await createLink(env.DB,auth.userId,input.memoryEnabled),201);
   if(input.kind==='confirm')return json(await confirmLink(env.DB,auth.userId,input.lastFour));
   if(input.kind==='unlink'){await unlink(env.DB,auth.userId);return json({ok:true,disconnected:true});}
  }else if(path===hqAPI+'/draft'){
   if(typeof input.messageId!=='string'||input.messageId.length>200)return json({error:'invalid_message_id'},400);
   return json(await draftReply(env.DB,env,input.messageId,auth.userId));
  }
  return json({error:'unsupported_action'},400);
 }catch(error){return json({error:error.status?error.message:'whatsapp_unavailable'},error.status||503);}
}
export async function withWhatsappHQLink(request,response){
 const path=new URL(request.url).pathname.replace(/\.html$/,'').replace(/\/+$/,'');
 if(request.method!=='GET'||!['/hq','/member/settings'].includes(path)||!response.ok||!response.headers.get('Content-Type')?.includes('text/html')||response.headers.has('Content-Encoding'))return response;
 const html=await response.text(),h=new Headers(response.headers);for(const k of ['Content-Length','ETag','Last-Modified'])h.delete(k);for(const[k,v]of Object.entries(headers))h.set(k,v);
 const body=path==='/hq'?html.replace('</body>','<p style="padding:20px"><a href="/hq/whatsapp">WhatsApp support inbox and SHIFT AI drafts</a></p></body>'):html.replace('</main>','<section class="tracker-card" data-whatsapp-settings><h3>WhatsApp support</h3><p>Manage your WhatsApp connection and whether messages can be used as private SHIFT AI context.</p><a href="/member/whatsapp">Manage WhatsApp connection</a></section></main>');
 return new Response(body,{status:response.status,headers:h});
}
