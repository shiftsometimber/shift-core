import {authenticateMember} from '../member-state-fast-v1.js';
import {boundary} from '../shift-coach/safety.mjs';
import {accountThreadSubject,publicThread,supportThread} from '../shift-coach/support.mjs';
const headers={'Cache-Control':'no-store, private','Vary':'Cookie','X-Content-Type-Options':'nosniff','X-Robots-Tag':'noindex, nofollow'};
const json=(data,status=200)=>Response.json(data,{status,headers});
const fail=(message,status)=>{throw Object.assign(Error(message),{status});};
import {memberSupportPolicy} from './support-policy.mjs';
export {memberSupportPolicy,normalMemberSupportPolicy} from './support-policy.mjs';
export async function memberSupportContactRoutes(request,env){
 if(env.MEMBER_EXPERIENCE_V1_ENABLED!=='true'||new URL(request.url).pathname!=='/v1/member-support')return null;
 if(!['GET','POST'].includes(request.method))return json({error:'Method not allowed'},405);
 if(request.method==='POST'&&(request.headers.get('Origin')!==new URL(request.url).origin||request.headers.get('Sec-Fetch-Site')==='cross-site'))return json({error:'Use My Timber to send this request.'},403);
 const auth=await authenticateMember(request,env);if(auth.response)return auth.response;
 try{
  const present=await env.DB.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='support_tickets'").first();
  if(!present)return json({available:false,accountId:auth.userId,policy:memberSupportPolicy(env),tickets:[]});
  if(request.method==='GET'){
   const rows=(await env.DB.prepare("SELECT reference,status,subject,body,created_at,updated_at FROM support_tickets WHERE user_id=? AND reference LIKE 'APP-%' ORDER BY created_at DESC LIMIT 50").bind(auth.userId).all()).results||[];
   return json({available:true,accountId:auth.userId,policy:memberSupportPolicy(env),tickets:rows.map(t=>({reference:t.reference,status:t.status,at:t.created_at,...publicThread(t)}))});
  }
  if(!request.headers.get('Content-Type')?.startsWith('application/json'))return json({error:'Use the app or account form.'},415);
  const raw=await request.text();if(raw.length>4096)return json({error:'Keep your request short.'},413);
  let input;try{input=JSON.parse(raw)}catch{return json({error:'Invalid request.'},400);}
  if(!input||typeof input!=='object'||Array.isArray(input)||!/^[a-zA-Z0-9-]{16,80}$/.test(input.operationId||''))return json({error:'Reload before sending.'},400);
  if(String(input.expectedAccount)!==String(auth.userId))return json({error:'Your account changed. Reload before sending.'},409);
  const at=new Date().toISOString();
  if(input.kind==='request'){
   if(!['app','account'].includes(input.category)||typeof input.message!=='string'||!input.message.trim()||input.message.trim().length>1000)return json({error:'Choose app or account and enter your question.'},400);
   if(!boundary(input.message).coaching)return json({error:'This inbox is for app and account questions. Treatment questions go to your own prescriber or pharmacist; use Support for urgent routes.',code:'use_treatment_or_urgent_route'},422);
   const reference='APP-'+auth.userId+'-'+input.operationId,thread={format:'shift-coach-thread-1',request:input.message.trim(),category:input.category,scope:'app-account',replies:[],confirmation:null};
   await env.DB.prepare("INSERT OR IGNORE INTO support_tickets(reference,user_id,subject,priority,status,body,assigned_hq_user_id,created_at,updated_at) SELECT ?,?,?,'normal','open',?,NULL,?,? WHERE (SELECT COUNT(*) FROM support_tickets WHERE user_id=? AND reference LIKE 'APP-%' AND status!='closed')<3").bind(reference,auth.userId,accountThreadSubject,JSON.stringify(thread),at,at,auth.userId).run();
   const row=await env.DB.prepare('SELECT reference,status FROM support_tickets WHERE reference=? AND user_id=?').bind(reference,auth.userId).first();
   if(!row)fail('There are already three open requests. Open an existing thread or resolve one before sending another.',409);
   return json({ok:true,reference:row.reference,status:row.status},201);
  }
  if(input.kind==='resolved'){
   const row=await env.DB.prepare("SELECT * FROM support_tickets WHERE reference=? AND user_id=? AND reference LIKE 'APP-%'").bind(input.reference,auth.userId).first();
   if(!row)fail('This request is no longer available.',404);
   const thread=supportThread(row),reply=thread.replies.at(-1);
   if(!reply||reply.id!==input.replyId)fail('The reply changed. Reload before resolving this request.',409);
   thread.confirmation={replyId:reply.id,at};
   const result=await env.DB.prepare("UPDATE support_tickets SET body=?,status='closed',closed_at=?,updated_at=? WHERE reference=? AND user_id=? AND body IS ?").bind(JSON.stringify(thread),at,at,row.reference,auth.userId,row.body).run();
   if(Number(result.meta?.changes)!==1)fail('The thread changed. Reload before updating it.',409);
   return json({ok:true,reference:row.reference,status:'closed'},201);
  }
  return json({error:'Choose an available request action.'},400);
 }catch(e){return json({error:e.status?e.message:'Your app or account request could not be loaded or saved. Please try again.'},e.status||503);}
}
