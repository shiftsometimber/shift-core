// Event-to-review bridge. This module cannot send email or push notifications.
// It prepares an exact draft only after an authenticated owner asks for it.
const FROM='hq@shiftsometimber.co.uk',REPLY='hello@shiftsometimber.co.uk';
export const notificationDDL=[
 `CREATE TABLE IF NOT EXISTS hq_notification_config(id INTEGER PRIMARY KEY CHECK(id=1),started_at TEXT NOT NULL)`,
 `CREATE TABLE IF NOT EXISTS hq_notification_intents(event_key TEXT PRIMARY KEY,source TEXT NOT NULL,source_id TEXT NOT NULL,occurred_at TEXT NOT NULL,recipient_kind TEXT NOT NULL,recipient_user_id INTEGER,template TEXT NOT NULL,link TEXT NOT NULL,state TEXT NOT NULL DEFAULT 'awaiting_review',draft_id TEXT,reason TEXT,created_at TEXT NOT NULL,updated_at TEXT NOT NULL)`,
 `CREATE TABLE IF NOT EXISTS hq_notification_runs(id TEXT PRIMARY KEY,started_at TEXT NOT NULL,completed_at TEXT,status TEXT NOT NULL,candidates INTEGER NOT NULL DEFAULT 0,created INTEGER NOT NULL DEFAULT 0,error_code TEXT)`,
 `CREATE INDEX IF NOT EXISTS hq_notification_pending ON hq_notification_intents(state,created_at)`
];
const json=(body,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store, private','X-Content-Type-Options':'nosniff','Vary':'Cookie, Origin'}});
const digest=async value=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(value))))].map(b=>b.toString(16).padStart(2,'0')).join('');
export async function initialiseNotifications(DB,at){
 await DB.batch(notificationDDL.map(sql=>DB.prepare(sql)));
 await DB.prepare('INSERT OR IGNORE INTO hq_notification_config(id,started_at) VALUES(1,?)').bind(at).run();
}
export async function reconcileNotifications(env,now=new Date()){
 const DB=env.DB,at=now.toISOString(),id=crypto.randomUUID();
 await initialiseNotifications(DB,at);
 await DB.prepare("INSERT INTO hq_notification_runs(id,started_at,status) VALUES(?,?,'running')").bind(id,at).run();
 try{
  const since=(await DB.prepare('SELECT started_at FROM hq_notification_config WHERE id=1').first()).started_at;
  const tables=new Set((await DB.prepare("SELECT name FROM sqlite_master WHERE type='table'").all()).results.map(r=>r.name));
  const candidates=[];
  if(tables.has('clinical_case_outbox'))for(const row of (await DB.prepare("SELECT id,event_id,recipient_user_id,recipient_kind,template,link,created_at FROM clinical_case_outbox c WHERE status='pending' AND julianday(created_at)>=julianday(?) AND julianday(created_at)<=julianday(?) AND NOT EXISTS(SELECT 1 FROM hq_notification_intents i WHERE i.event_key='clinical:'||c.id) ORDER BY created_at LIMIT 100").bind(since,at).all()).results){
   if(!['member','hq'].includes(row.recipient_kind))continue;
   const member=row.recipient_kind==='member';
   if(member?!/^\/member\/treatment-records\?record=[a-f0-9-]{36}$/.test(row.link):!/^\/\?view=clinical&record=[a-f0-9-]{36}$/.test(row.link))continue;
   candidates.push({key:'clinical:'+row.id,source:'clinical_case_outbox',id:row.id,at:row.created_at,kind:member?'member':'hq_user',user:row.recipient_user_id,template:member?(row.template==='member_action_needed'?'member_action_needed':'member_case_update'):'reviewer_case_update',link:member?row.link:'/clinical-portal?record='+row.link.split('record=')[1]});
  }
  if(tables.has('data_requests'))for(const row of (await DB.prepare("SELECT id,user_id,received_at FROM data_requests d WHERE request_type='deletion' AND status NOT IN ('completed','cancelled') AND julianday(received_at)>=julianday(?) AND julianday(received_at)<=julianday(?) AND NOT EXISTS(SELECT 1 FROM hq_notification_intents i WHERE i.event_key='deletion:'||d.id) ORDER BY received_at LIMIT 100").bind(since,at).all()).results)candidates.push({key:'deletion:'+row.id,source:'data_requests',id:String(row.id),at:row.received_at,kind:'operations',user:null,template:'deletion_requested',link:'/?view=tasks'});
  if(tables.has('support_tickets'))for(const row of (await DB.prepare("SELECT id,created_at FROM support_tickets s WHERE priority IN ('urgent','high') AND status NOT IN ('closed','resolved') AND julianday(created_at)>=julianday(?) AND julianday(created_at)<=julianday(?) AND NOT EXISTS(SELECT 1 FROM hq_notification_intents i WHERE i.event_key='urgent-support:'||s.id) ORDER BY created_at LIMIT 100").bind(since,at).all()).results)candidates.push({key:'urgent-support:'+row.id,source:'support_tickets',id:String(row.id),at:row.created_at,kind:'operations',user:null,template:'urgent_support',link:'/?view=support'});
  if(tables.has('integration_webhooks'))for(const row of (await DB.prepare("SELECT id,received_at FROM integration_webhooks h WHERE signature_valid=1 AND processing_error IS NOT NULL AND trim(processing_error)<>'' AND julianday(received_at)>=julianday(?) AND julianday(received_at)<=julianday(?) AND NOT EXISTS(SELECT 1 FROM hq_notification_intents i WHERE i.event_key='integration-failure:'||h.id) ORDER BY received_at LIMIT 100").bind(since,at).all()).results)candidates.push({key:'integration-failure:'+row.id,source:'integration_webhooks',id:String(row.id),at:row.received_at,kind:'operations',user:null,template:'integration_failed',link:'/?view=partners'});
  let created=0;
  for(const c of candidates){const result=await DB.prepare("INSERT OR IGNORE INTO hq_notification_intents(event_key,source,source_id,occurred_at,recipient_kind,recipient_user_id,template,link,state,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,'awaiting_review',?,?)").bind(c.key,c.source,c.id,c.at,c.kind,c.user,c.template,c.link,at,at).run();created+=Number(result.meta.changes||0)}
  await DB.prepare("UPDATE hq_notification_runs SET completed_at=?,status='completed',candidates=?,created=? WHERE id=?").bind(at,candidates.length,created,id).run();
  return{ok:true,candidates:candidates.length,created,since,noMessagesSent:true};
 }catch(error){await DB.prepare("UPDATE hq_notification_runs SET completed_at=?,status='failed',error_code='notification_reconciliation_failed' WHERE id=?").bind(at,id).run();throw Error('notification_reconciliation_failed')}
}
export function intentContent(item){
 const labels={member_action_needed:['Action needed in My Timber','There is a request for more information in My Timber. Sign in to read the request and provide your update.'],member_case_update:['There is an update in My Timber','Sign in to My Timber to read the update to your treatment request.'],reviewer_case_update:['A clinical case needs your attention','Sign in to the clinician portal to review the assigned case.'],deletion_requested:['HQ action: account-deletion request','A new account-deletion request needs an owner and review. Open the HQ task queue. A received request is not completed erasure.'],urgent_support:['HQ action: priority support request','A priority support request needs review in the HQ support queue.'],integration_failed:['HQ action: partner integration failure','A partner callback could not be processed. Review the integration queue and reconcile the outcome before retrying.']};
 const entry=labels[item.template];if(!entry)throw Error('unsupported_notification_template');
 const member=item.recipient_kind==='member';
 return{subject:entry[0],body:entry[1]+'\n\n'+(member?'https://shiftsometimber.co.uk':'https://hq.shiftsometimber.co.uk')+item.link+'\n\nShift Some Timber'};
}
export async function prepareIntent(DB,key,actor,now=new Date()){
 if(actor.role!=='owner')return json({error:'owner_required'},403);
 const item=await DB.prepare('SELECT * FROM hq_notification_intents WHERE event_key=?').bind(key).first();
 if(!item)return json({error:'event_not_found'},404);
 if(item.state!=='awaiting_review')return json({error:'event_already_prepared',draftId:item.draft_id},409);
 const sourceExists=await DB.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?").bind(item.source).first();if(!sourceExists)return json({error:'event_source_unavailable'},409);
 let recipient;
 if(item.recipient_kind==='member'){
  const row=await DB.prepare('SELECT u.id,u.email,a.email_verified FROM users u JOIN user_auth a ON a.user_id=u.id WHERE u.id=?').bind(item.recipient_user_id).first();
  if(!row||Number(row.email_verified)!==1)return json({error:'verified_member_required'},409);
  const source=await DB.prepare("SELECT recipient_user_id,recipient_kind,status FROM clinical_case_outbox WHERE id=?").bind(item.source_id).first();
  if(!source||source.status!=='pending'||source.recipient_kind!=='member'||source.recipient_user_id!==row.id)return json({error:'event_no_longer_eligible'},409);
  recipient={email:row.email.toLowerCase(),userId:row.id,name:'',accountVerified:true};
 }else if(item.recipient_kind==='hq_user'){
  const source=await DB.prepare("SELECT recipient_user_id,recipient_kind,status FROM clinical_case_outbox WHERE id=?").bind(item.source_id).first();
  if(!source||source.status!=='pending'||source.recipient_kind!=='hq'||source.recipient_user_id!==item.recipient_user_id)return json({error:'event_no_longer_eligible'},409);
  const row=await DB.prepare("SELECT id,email,name FROM hq_users WHERE id=? AND status='active'").bind(item.recipient_user_id).first();if(!row)return json({error:'active_recipient_required'},409);
  recipient={email:row.email.toLowerCase(),userId:null,name:row.name||'',accountVerified:false};
 }else{
  const queries={data_requests:"SELECT id FROM data_requests WHERE id=? AND request_type='deletion' AND status NOT IN ('completed','cancelled')",support_tickets:"SELECT id FROM support_tickets WHERE id=? AND priority IN ('urgent','high') AND status NOT IN ('closed','resolved')",integration_webhooks:"SELECT id FROM integration_webhooks WHERE id=? AND signature_valid=1 AND processing_error IS NOT NULL AND trim(processing_error)<>''"};
  if(!queries[item.source]||!await DB.prepare(queries[item.source]).bind(item.source_id).first())return json({error:'event_no_longer_eligible'},409);
  recipient={email:'matt@shiftsometimber.co.uk',userId:null,name:'Matt O’Brien',accountVerified:false};
 }
 const at=now.toISOString(),content=intentContent(item),id=crypto.randomUUID();
 const payload={channel:'email',from:FROM,replyTo:REPLY,cc:[],bcc:[],recipients:[recipient],subject:content.subject,body:content.body,scheduledAt:at,attachment:null,push:null,serviceOnly:true};
 const hash=await digest(payload);
 // The conditional claim and draft creation occur in one D1 transaction. A
 // concurrent click can never create a second draft for the same event.
 const results=await DB.batch([
  DB.prepare("UPDATE hq_notification_intents SET state='prepared',draft_id=?,updated_at=? WHERE event_key=? AND state='awaiting_review'").bind(id,at,key),
  DB.prepare("INSERT INTO hq_comms_drafts(id,hash,payload_json,status,scheduled_at,created_by,created_at) SELECT ?,?,?,'draft',?,?,? WHERE EXISTS(SELECT 1 FROM hq_notification_intents WHERE event_key=? AND draft_id=?)").bind(id,hash,JSON.stringify(payload),at,actor.id,at,key,id),
  DB.prepare("INSERT INTO hq_comms_recipients(draft_id,email,user_id,status) SELECT ?,?,?,'pending' WHERE EXISTS(SELECT 1 FROM hq_comms_drafts WHERE id=?)").bind(id,recipient.email,recipient.userId,id),
  DB.prepare("INSERT INTO hq_comms_audit(draft_id,actor_id,action,at) SELECT ?,?,'event_draft_prepared',? WHERE EXISTS(SELECT 1 FROM hq_comms_drafts WHERE id=?)").bind(id,actor.id,at,id)
 ]);
 if(Number(results[0].meta.changes)!==1)return json({error:'event_already_prepared'},409);
 return json({id,hash,payload,status:'draft',approvalRequired:true,noMessagesSent:true},201);
}
export async function notificationRoute(request,env,authenticate){
 const url=new URL(request.url),base='/v1/hq/management/report/notifications';if(url.pathname!==base&&!url.pathname.startsWith(base+'/'))return null;
 const auth=await authenticate();if(!auth.ok)return auth;const actor=(await auth.json()).user;
 if(!actor||!['owner','admin'].includes(actor.role))return json({error:'owner_or_admin_required'},403);
 if(request.method==='GET'&&url.pathname===base+'/view')return notificationPage(actor.role);
 if(request.method==='GET'&&url.pathname===base){
  try{const items=(await env.DB.prepare('SELECT event_key,source,source_id,occurred_at,recipient_kind,template,state,draft_id,created_at FROM hq_notification_intents ORDER BY created_at DESC LIMIT 100').all()).results;const lastRun=await env.DB.prepare('SELECT started_at,completed_at,status,candidates,created,error_code FROM hq_notification_runs ORDER BY started_at DESC LIMIT 1').first();return json({items,lastRun,approvalRequired:true,coverage:['clinical_case_outbox','data_requests','urgent_support','signed_integration_failures'],directAuthAndOrderMail:'Existing direct transactional paths remain in place; no duplicate messages are generated.',noMessagesSent:true})}catch{return json({error:'notification_queue_unavailable'},503)}
 }
 if(request.method==='POST'&&url.pathname.endsWith('/prepare')){
  if(!['https://hq.shiftsometimber.co.uk','https://api.shiftsometimber.co.uk'].includes(request.headers.get('Origin'))||!request.headers.get('Content-Type')?.startsWith('application/json'))return json({error:'origin_forbidden'},403);
  const raw=await request.text();if(raw.length>1000)return json({error:'request_too_large'},413);let body;try{body=JSON.parse(raw)}catch{return json({error:'invalid_json'},400)}
  if(typeof body.eventKey!=='string'||body.eventKey.length>180||Object.keys(body).some(k=>k!=='eventKey'))return json({error:'event_key_required'},400);
  try{return await prepareIntent(env.DB,body.eventKey,actor)}catch{return json({error:'notification_draft_unavailable'},503)}
 }
 return json({error:'method_not_allowed'},405);
}
export function notificationPage(role){
 const nonce=crypto.randomUUID();
 const html=`<!doctype html><html lang="en-GB"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Notification events · Shift HQ</title><style nonce="${nonce}">body{margin:0;background:#e7e3da;color:#050505;font:16px/1.5 Arial,sans-serif}main{max-width:1060px;margin:auto;padding:28px}h1{font-size:32px}a{color:inherit}article{background:white;padding:20px;margin:16px 0;border-left:5px solid #707762}button{background:#707762;color:white;border:0;padding:12px 18px;font-weight:bold;cursor:pointer}pre{white-space:pre-wrap;overflow-wrap:anywhere}#status{font-weight:bold}.muted{color:#51584a}</style><main><p><a href="https://hq.shiftsometimber.co.uk/">Shift HQ</a> / <a href="https://hq.shiftsometimber.co.uk/communications">Communications</a></p><h1>Notification events</h1><p>New events enter this review queue. Preparing a draft sends nothing. Review the complete draft in Communications and approve its exact wording and recipients before delivery.</p><p class="muted">Existing authentication and order emails keep their current direct routes. This queue adds clinical case updates, account-deletion requests, priority support and signed partner-callback failures. Events before activation are excluded.</p><p id="status" role="status">Loading…</p><div id="items"></div><section id="preview" hidden><h2>Prepared draft</h2><pre id="message"></pre><p><a href="https://hq.shiftsometimber.co.uk/communications">Open Communications to review and approve</a></p></section></main><script nonce="${nonce}">const base='/v1/hq/management/report/notifications',owner=${role==='owner'},status=document.getElementById('status');async function load(){try{const r=await fetch(base,{credentials:'include',cache:'no-store'});if(!r.ok)throw Error('Sign in to HQ to view this queue.');const data=await r.json();status.textContent='Last run: '+(data.lastRun?.completed_at||'Awaiting first run')+' · '+(data.lastRun?.status||'not yet observed');const host=document.getElementById('items');host.replaceChildren();if(!data.items.length)host.textContent='No new notification events are awaiting review.';for(const item of data.items){const card=document.createElement('article'),h=document.createElement('h2'),p=document.createElement('p');h.textContent=item.template.replaceAll('_',' ');p.textContent=item.source+' · '+item.occurred_at+' · '+item.state;card.append(h,p);if(item.state==='awaiting_review'){const b=document.createElement('button');b.textContent=owner?'Prepare exact draft':'Owner prepares the draft';b.disabled=!owner;b.onclick=async()=>{b.disabled=true;try{const r=await fetch(base+'/prepare',{method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify({eventKey:item.event_key})}),d=await r.json();if(!r.ok)throw Error(d.error||'Draft unavailable');const p=d.payload;document.getElementById('message').textContent='From: '+p.from+'\\nTo: '+p.recipients.map(x=>x.email).join(', ')+'\\nCC: none\\nSubject: '+p.subject+'\\nAttachments: none\\n\\n'+p.body+'\\n\\nStatus: draft — not sent. Reference: '+d.id;document.getElementById('preview').hidden=false;await load();}catch(e){status.textContent=e.message;b.disabled=false;}};card.append(b)}host.append(card)}}catch(e){status.textContent=e.message}}load();</script></html>`;
 return new Response(html,{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store, private','X-Robots-Tag':'noindex,nofollow','Referrer-Policy':'no-referrer','Content-Security-Policy':`default-src 'none'; style-src 'nonce-${nonce}'; script-src 'nonce-${nonce}'; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'`}});
}
