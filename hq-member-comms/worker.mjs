import {hq,member,css,client,memberClient} from './content.mjs';
import {hqApi,json,headers} from './api.mjs';
import {memberApi,suppressAccountCommunications,exportCommunications} from './member.mjs';
import {runCommunications} from './delivery.mjs';
import {authenticateMember} from '../member-state-fast-v1.js';
const mark='20261023-hq-member-comms-v1';
export function enhanceHQ(html){if(html.includes('data-real-communications'))return html;const end='<section id="communications" class="view">';if(!html.includes(end))throw Error('hq_communications_anchor_missing');return html.replace(end,end+'<article class="panel" data-real-communications><h2>Emails &amp; My Timber updates</h2><p>Create a service message, review its exact recipients and content, then approve sending or scheduling.</p><a href="/communications" style="display:inline-block;padding:12px 18px;background:#707762;color:#050505;font-weight:800;border-radius:6px">Open communications</a><p>The old provider-placeholder queue below is read-only. Use the new composer for delivery.</p></article>');}
export function enhanceMember(html){if(html.includes('data-member-updates'))return html;return html.replace('</main>','<p data-member-updates style="padding:16px 0"><a href="/member/notifications" style="color:inherit;font-weight:700">My updates and device notifications</a></p></main>');}
export default {
 async fetch(request,env){const u=new URL(request.url),path=u.pathname,read=['GET','HEAD'].includes(request.method);let response;
  if(request.method==='OPTIONS'&&path.startsWith('/v1/hq/')){response=new Response(null,{status:204});}
  else if(path.startsWith('/v1/hq/member-comms'))response=await hqApi(request,env);
  else if(['/v1/hq/outbox','/v1/hq/outbox/process'].includes(path)){
   if(!read)response=json({error:'use_approved_member_comms',message:'The legacy placeholder send route is disabled. Use Communications to review and approve an exact message.'},409);
   else response=await env.CORE.fetch(new Request(new URL(path+u.search,'https://api.shiftsometimber.co.uk'),request));
  }
  else if(path.startsWith('/v1/my-timber-communications'))response=await memberApi(request,env);
  else{
   const asset=({'/communications':[hq,'text/html'],'/communications/':[hq,'text/html'],'/communications/style.css':[css,'text/css'],'/communications/client.js':[client,'application/javascript'],'/member/notifications':[member,'text/html'],'/member/notifications/':[member,'text/html'],'/member/notifications/client.js':[memberClient,'application/javascript']})[path];
   if(asset)response=new Response(read&&request.method!=='HEAD'?asset[0]:null,{status:read?200:405,headers:{...headers,'Content-Type':asset[1]+'; charset=utf-8','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self' https://api.shiftsometimber.co.uk; img-src 'self'; worker-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'self'; form-action 'self'"}});
   else if(['/v1/privacy/export','/v1/privacy/account'].includes(path)){
    const target=new Request(new URL(path+u.search,'https://shiftsometimber.co.uk'),request);
    if(request.method==='POST'&&path.endsWith('export')||request.method==='DELETE'&&path.endsWith('account')){
     const auth=await authenticateMember(request,env);if(auth.response)return json({error:'sign_in_required'},401);response=await env.SUPPORT.fetch(target);
     if(response.ok)try{if(path.endsWith('export')){const b=await response.json();b.hqCommunications=await exportCommunications(env.DB,auth.userId);response=json(b);}else{await suppressAccountCommunications(env.DB,auth.userId);}}catch{return json({error:'communications_privacy_operation_incomplete'},503);}
    }else response=await env.SUPPORT.fetch(target);
   }else if(u.hostname==='hq.shiftsometimber.co.uk'){
    response=await env.HQ.fetch(request);
    if(request.method==='GET'&&['/','/index.html'].includes(path)&&response.ok&&response.headers.get('Content-Type')?.includes('text/html')){const original=await response.text();let html;try{html=enhanceHQ(original)}catch{return new Response(original,response)}const h=new Headers(response.headers);for(const key of ['Content-Length','Content-Encoding','ETag'])h.delete(key);h.set('Cache-Control','no-store');response=new Response(html,{status:response.status,headers:h});}
   }else if(path.startsWith('/member/dashboard')){
    response=await env.SUPPORT.fetch(request);if(request.method==='GET'&&response.ok&&response.headers.get('Content-Type')?.includes('text/html')){const html=enhanceMember(await response.text()),h=new Headers(response.headers);for(const key of ['Content-Length','Content-Encoding','ETag'])h.delete(key);response=new Response(html,{status:response.status,headers:h});}
   }else response=json({error:'not_found'},404);
  }
  const h=new Headers(response.headers);h.set('X-Shift-Communications',mark);if(request.headers.get('Origin')==='https://hq.shiftsometimber.co.uk'&&path.startsWith('/v1/hq/')){h.set('Access-Control-Allow-Origin','https://hq.shiftsometimber.co.uk');h.set('Access-Control-Allow-Credentials','true');h.set('Access-Control-Allow-Methods','GET,POST,OPTIONS');h.set('Access-Control-Allow-Headers','Content-Type');h.set('Vary','Cookie, Origin');}return new Response(response.body,{status:response.status,headers:h});
 },
 async scheduled(event,env,ctx){const job=runCommunications(env,new Date(event.scheduledTime||Date.now()));if(ctx?.waitUntil)ctx.waitUntil(job);else await job;}
};
