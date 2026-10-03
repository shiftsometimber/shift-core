import {authenticateWorkHQ} from '../worker.js';
import {boundary} from './safety.mjs';
import {supportThread,publicThread,threadSubject} from './support.mjs';

const route='/v1/hq/support/coaching',page='/hq/coaching-support',asset='/assets/shift-coach-support.mjs';
const headers={'Cache-Control':'no-store, private','Vary':'Cookie','X-Content-Type-Options':'nosniff','X-Robots-Tag':'noindex, nofollow'};
const json=(v,status=200)=>Response.json(v,{status,headers});
// Same support permissions as existing HQ. No bootstrap/admin-key bypass.
const readers=new Set(['owner','admin','operations','support','clinical','readonly']);
const writers=new Set(['owner','admin','operations','support','clinical']);
const token=async t=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify([t.reference,t.body,t.status,t.updated_at,t.assigned_hq_user_id])))),b=>b.toString(16).padStart(2,'0')).join('');

export const teamClient=String.raw`(()=>{
const list=document.getElementById('requests'),status=document.getElementById('status');let busy=false;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
async function api(method='GET',body){const r=await fetch('/v1/hq/support/coaching',{method,credentials:'same-origin',cache:'no-store',headers:body?{'Content-Type':'application/json'}:undefined,body:body?JSON.stringify(body):undefined});const b=await r.json();if(!r.ok)throw Object.assign(Error(b.error||'Could not load requests'),{status:r.status});return b;}
async function refresh(){const data=await api();list.innerHTML=data.tickets.map(t=>'<article data-ticket="'+esc(t.reference)+'"><h2>'+esc(t.reference)+'</h2><p>'+esc(t.status)+' · '+esc(t.owner||'Unassigned')+'</p><h3>Member’s request</h3><p>'+esc(t.message)+'</p>'+t.replies.map(r=>'<blockquote><strong>'+esc(r.author)+'</strong> · '+esc(r.at)+'<p>'+esc(r.text)+'</p></blockquote>').join('')+(t.resolution?'<p>Member confirmed this reply answered the request.</p>':'<p>No member-confirmed resolution yet.</p>')+(data.canWrite?(t.mine?'<form><label>Everyday coaching reply<textarea name="text" maxlength="1000" required></textarea></label><button>Post reply to this member</button></form>':!t.owner?'<button data-claim>Take ownership</button>':'<p>Assigned to another team member. Manage assignment in existing HQ support.</p>')+'</article>':'</article>')).join('')||'<p>No coaching requests in this queue.</p>';
for(const t of data.tickets){const el=[...list.querySelectorAll('[data-ticket]')].find(e=>e.dataset.ticket===t.reference);el.querySelector('[data-claim]')?.addEventListener('click',()=>write({kind:'claim',reference:t.reference,token:t.token}));el.querySelector('form')?.addEventListener('submit',e=>{e.preventDefault();write({kind:'reply',reference:t.reference,token:t.token,text:new FormData(e.target).get('text')});});}}
async function write(body){if(busy)return;busy=true;list.querySelectorAll('button').forEach(b=>b.disabled=true);try{await api('POST',{...body,operationId:crypto.randomUUID()});await refresh();status.textContent='Saved.';}catch(e){if(e.status===401||e.status===403)list.replaceChildren();status.textContent=e.status===409?'The request changed. Reload it before replying.':e.status===422?'Use this space for everyday coaching. Treatment questions belong with the prescriber.':e.message;}finally{busy=false;list.querySelectorAll('button').forEach(b=>b.disabled=false);}}
document.getElementById('refresh').addEventListener('click',()=>{if(!busy)refresh().catch(e=>{if(e.status===401||e.status===403)list.replaceChildren();status.textContent=e.message;});});refresh().catch(e=>{list.replaceChildren();status.textContent=e.message;});})();`;

const html='<!doctype html><html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Everyday coaching support · SHIFT HQ</title><style>body{max-width:960px;margin:32px auto;padding:0 20px;background:#050505;color:#e7e3da;font:16px/1.5 system-ui}article{border:1px solid #707762;border-radius:12px;padding:20px;margin:20px 0}p,blockquote{white-space:pre-wrap;overflow-wrap:anywhere}button,textarea{font:inherit;min-height:44px;border-radius:8px;padding:10px}textarea{display:block;box-sizing:border-box;width:100%;min-height:100px}button{cursor:pointer;background:#e7e3da;color:#050505;margin-top:12px}a{color:#e7e3da}label{display:block}blockquote{border-left:3px solid #707762;margin-left:0;padding-left:16px}:focus-visible{outline:3px solid #707762;outline-offset:3px}</style></head><body><p><a href="/hq">SHIFT HQ</a> · <a href="/hq#support">Existing support</a></p><h1>Everyday coaching requests</h1><p>Take ownership, then post a reply the member can read inside My Timber. This queue is for everyday coaching. Treatment decisions and symptoms belong with the prescriber or appropriate healthcare service. No response time or urgent monitoring is promised.</p><button id="refresh">Reload requests</button><p id="status" role="status" aria-live="polite"></p><main id="requests"></main><script defer src="'+asset+'"></script></body></html>';

export async function supportTeamRoutes(request,env){
 const u=new URL(request.url);
 if(u.pathname===asset){if(!['GET','HEAD'].includes(request.method))return json({error:'method_not_allowed'},405);return new Response(request.method==='HEAD'?null:teamClient,{headers:{...headers,'Content-Type':'text/javascript; charset=utf-8'}});}
 if(![route,page].includes(u.pathname))return null;
 if(u.search)return json({error:'unsupported_query'},400);
 if(!['GET','POST'].includes(request.method)||u.pathname===page&&request.method!=='GET')return json({error:'method_not_allowed'},405);
 if(request.method==='POST'&&(request.headers.get('Origin')!==u.origin||request.headers.get('Sec-Fetch-Site')==='cross-site'))return json({error:'origin_not_allowed'},403);
 const auth=await authenticateWorkHQ(request,env);if(auth.response){const h=new Headers(auth.response.headers);for(const[k,v]of Object.entries(headers))h.set(k,v);return new Response(auth.response.body,{status:auth.response.status,headers:h});}
 if(!readers.has(auth.user.role)||request.method==='POST'&&!writers.has(auth.user.role))return json({error:'hq_forbidden'},403);
 if(u.pathname===page)return new Response(html,{headers:{...headers,'Content-Type':'text/html; charset=utf-8','Content-Security-Policy':"default-src 'none'; script-src 'self'; style-src 'unsafe-inline'; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'"}});
 try{
  if(request.method==='GET'){
   const rows=(await env.DB.prepare("SELECT t.*,h.name owner FROM support_tickets t LEFT JOIN hq_users h ON h.id=t.assigned_hq_user_id WHERE t.reference LIKE 'COACH-%' ORDER BY CASE WHEN t.status='closed' THEN 1 ELSE 0 END,t.created_at LIMIT 50").all()).results||[];
   return json({canWrite:writers.has(auth.user.role),tickets:await Promise.all(rows.map(async t=>({reference:t.reference,status:t.status,owner:t.owner||null,mine:t.assigned_hq_user_id===auth.userId,token:await token(t),...publicThread(t)})))});
  }
  if(!request.headers.get('Content-Type')?.startsWith('application/json'))return json({error:'json_required'},415);
  const reader=request.body?.getReader();if(!reader)return json({error:'invalid_request'},400);let bytes=0,chunks=[];
  try{for(;;){const r=await reader.read();if(r.done)break;bytes+=r.value.length;if(bytes>4096){await reader.cancel();return json({error:'request_too_large'},413);}chunks.push(r.value)}}finally{reader.releaseLock()}
  const raw=new Uint8Array(bytes);let offset=0;for(const c of chunks){raw.set(c,offset);offset+=c.length}
  let input;try{input=JSON.parse(new TextDecoder().decode(raw))}catch{return json({error:'invalid_json'},400)}
  if(!input||!['claim','reply'].includes(input.kind)||typeof input.reference!=='string'||!/^COACH-\d+-[a-zA-Z0-9-]{16,80}$/.test(input.reference)||!/^[a-zA-Z0-9-]{16,80}$/.test(input.operationId||''))return json({error:'invalid_request'},400);
  const t=await env.DB.prepare("SELECT * FROM support_tickets WHERE reference=? AND reference LIKE 'COACH-%'").bind(input.reference).first();
  if(!t)return json({error:'support_request_missing'},404);
  const thread=supportThread(t);
  if(input.kind==='reply'&&thread.replies.some(r=>r.id===input.operationId&&r.actorId===auth.userId))return json({ok:true,duplicate:true});
  if(input.token!==await token(t))return json({error:'support_request_changed'},409);
  const at=new Date().toISOString();let result;
  if(input.kind==='claim'){
   result=await env.DB.prepare("UPDATE support_tickets SET assigned_hq_user_id=?,updated_at=? WHERE reference=? AND (assigned_hq_user_id IS NULL OR assigned_hq_user_id=?) AND updated_at IS ? AND body IS ? AND status=?").bind(auth.userId,at,t.reference,auth.userId,t.updated_at,t.body,t.status).run();
  }else{
   if(t.assigned_hq_user_id!==auth.userId)return json({error:'take_ownership_before_reply'},409);
   if(typeof input.text!=='string'||!input.text.trim()||input.text.length>1000)return json({error:'invalid_reply'},400);
   if(!boundary(input.text).coaching)return json({error:'health_concern_use_help'},422);
   if(thread.replies.length>=20)return json({error:'support_thread_full'},409);
   thread.replies.push({id:input.operationId,text:input.text.trim(),author:auth.user.name||'SHIFT team',actorId:auth.userId,at});thread.confirmation=null;
   const body=JSON.stringify(thread);if(body.length>20000)return json({error:'support_thread_full'},409);
   result=await env.DB.prepare("UPDATE support_tickets SET subject=?,body=?,status='waiting',closed_at=NULL,updated_at=? WHERE reference=? AND assigned_hq_user_id=? AND updated_at IS ? AND body IS ? AND status=?").bind(threadSubject,body,at,t.reference,auth.userId,t.updated_at,t.body,t.status).run();
  }
  if(Number(result.meta?.changes)!==1)return json({error:'support_request_changed'},409);
  return json({ok:true},201);
 }catch(error){return json({error:error.status?error.message:'support_unavailable'},error.status||503)}
}

export async function withSupportTeamLink(request,response){
 if(request.method!=='GET'||!/^\/hq(?:\/[^?]*)?$/.test(new URL(request.url).pathname)||!response.ok||response.headers.get('Content-Encoding')||!response.headers.get('Content-Type')?.includes('text/html'))return response;
 const text=await response.text(),h=new Headers(response.headers);for(const key of ['Content-Length','Content-Encoding','ETag','Last-Modified'])h.delete(key);for(const[k,v]of Object.entries(headers))h.set(k,v);
 return new Response(text.replace('</body>','<p style="padding:20px"><a href="/hq/coaching-support">Everyday coaching replies and member resolution</a></p></body>'),{status:response.status,headers:h});
}
