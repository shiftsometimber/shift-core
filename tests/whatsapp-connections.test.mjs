import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {createLink,confirmLink,linkState,unlink,validSignature,inboundMessages,ingest,retention,readiness,draftReply,digest} from '../whatsapp/core.mjs';
import {whatsappMemory,whatsappPrivacyExport} from '../whatsapp/memory.mjs';
import {attachConversationMemory,memoryAccess,memoryStillAllowed,saveConversationTurn} from '../member-experience/ai-memory-bridge.mjs';
import {whatsappRoutes,WEBHOOK,withWhatsappHQLink} from '../whatsapp/routes.mjs';
import {client} from '../whatsapp/ui.mjs';
function db(){
 const sqlite=new DatabaseSync(':memory:');
 sqlite.exec(readFileSync(new URL('../migrations/021_whatsapp_shift_ai.sql',import.meta.url),'utf8'));
 sqlite.exec(`CREATE TABLE consents(id INTEGER PRIMARY KEY,user_id INTEGER,consent_type TEXT,granted INTEGER,created_at TEXT);
 CREATE TABLE member_state(user_id INTEGER PRIMARY KEY,preferences TEXT);
 CREATE TABLE shift_ai_privacy_settings(user_id INTEGER PRIMARY KEY,auto_memory INTEGER,updated_at TEXT);
 CREATE TABLE shift_ai_conversations(id INTEGER PRIMARY KEY,user_id INTEGER,direction TEXT,mode TEXT,body TEXT,model TEXT,created_at TEXT);`);
 const DB={exec:async sql=>sqlite.exec(sql),prepare(sql){let args=[];const q={bind(...a){args=a;return q},async first(){return sqlite.prepare(sql).get(...args)||null},async all(){return {results:sqlite.prepare(sql).all(...args)}},async run(){const r=sqlite.prepare(sql).run(...args);return {meta:{changes:Number(r.changes),last_row_id:Number(r.lastInsertRowid)}}}};return q},async batch(statements){sqlite.exec('BEGIN');try{const out=[];for(const s of statements)out.push(await s.run());sqlite.exec('COMMIT');return out}catch(e){sqlite.exec('ROLLBACK');throw e}},sqlite};return DB;
}
const env={WHATSAPP_INBOUND_ENABLED:'true',WHATSAPP_APP_SECRET:'test-only-app-secret',WHATSAPP_VERIFY_TOKEN:'test-only-verification',WHATSAPP_PHONE_NUMBER_ID:'111',WHATSAPP_BUSINESS_ACCOUNT_ID:'222'};
const message=(id='wamid.test',sender='447700900111',body='How do I sign in?')=>({id,sender,body,kind:'text',providerAt:new Date().toISOString()});
const payload=(id='wamid.test',sender='447700900111',text='How do I sign in?')=>({object:'whatsapp_business_account',entry:[{id:'222',changes:[{field:'messages',value:{metadata:{phone_number_id:'111'},messages:[{id,from:sender,type:'text',timestamp:String(Math.floor(Date.now()/1000)),text:{body:text}}]}}]}]});
async function sign(raw){const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(env.WHATSAPP_APP_SECRET),{name:'HMAC',hash:'SHA-256'},false,['sign']);return 'sha256='+Buffer.from(await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(raw))).toString('hex');}
async function link(DB,userId=1,memoryEnabled=true,sender='447700900111'){
 const r=await createLink(DB,userId,memoryEnabled),text=new URL(r.url).searchParams.get('text');
 await ingest(DB,[message('link.'+userId,sender,text)]);
 await confirmLink(DB,userId,sender.slice(-4));return r;
}
const auth={memberAuth:async()=>({userId:1,user:{id:1}}),hqAuth:async()=>({userId:9,user:{role:'owner'}})};
const request=(path,body,origin='https://shiftsometimber.co.uk')=>new Request('https://shiftsometimber.co.uk'+path,body?{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify(body)}:undefined);
test('webhook HMAC checks exact bytes, rejects altered payload and missing signature',async()=>{
 const raw=JSON.stringify(payload()),signature=await sign(raw);
 assert(await validSignature(new TextEncoder().encode(raw),signature,env.WHATSAPP_APP_SECRET));
 assert(!await validSignature(new TextEncoder().encode(raw+' '),signature,env.WHATSAPP_APP_SECRET));
 assert(!await validSignature(new TextEncoder().encode(raw),null,env.WHATSAPP_APP_SECRET));
});
test('webhook verification fails closed; signed incoming message stored only once',async()=>{
 const DB=db(),raw=JSON.stringify(payload()),signature=await sign(raw);
 assert.equal((await whatsappRoutes(new Request('https://shiftsometimber.co.uk'+WEBHOOK+'?hub.mode=subscribe&hub.verify_token='+env.WHATSAPP_VERIFY_TOKEN+'&hub.challenge=123'),{...env,DB})).status,200);
 assert.equal((await whatsappRoutes(new Request('https://shiftsometimber.co.uk'+WEBHOOK+'?hub.mode=subscribe&hub.verify_token=wrong&hub.challenge=123'),{...env,DB})).status,403);
 const req=()=>new Request('https://shiftsometimber.co.uk'+WEBHOOK,{method:'POST',headers:{'X-Hub-Signature-256':signature},body:raw});
 assert.equal((await (await whatsappRoutes(req(),{...env,DB})).json()).accepted,1);
 assert.equal((await (await whatsappRoutes(req(),{...env,DB})).json()).accepted,0);
 assert.equal((await whatsappRoutes(req(),{...env,DB,WHATSAPP_INBOUND_ENABLED:'false'})).status,503);
 assert.equal((await whatsappRoutes(new Request('https://shiftsometimber.co.uk'+WEBHOOK,{method:'POST',body:raw}),{...env,DB})).status,401);
});
test('wrong business account and phone IDs never ingest; attachment payload never downloads media',()=>{
 const p=payload();p.entry[0].id='999';assert.deepEqual(inboundMessages(p,env),[]);
 p.entry[0].id='222';p.entry[0].changes[0].value.metadata.phone_number_id='999';assert.deepEqual(inboundMessages(p,env),[]);
 const a=payload();a.entry[0].changes[0].value.messages[0]={...a.entry[0].changes[0].value.messages[0],type:'image',image:{id:'private-media'}};
 assert.equal(inboundMessages(a,env)[0].kind,'attachment');assert(!JSON.stringify(inboundMessages(a,env)).includes('private-media'));
});
test('link requires both WhatsApp possession and authenticated My Timber confirmation; token never in inbox',async()=>{
 const DB=db(),r=await createLink(DB,1,true),text=new URL(r.url).searchParams.get('text');
 await assert.rejects(confirmLink(DB,1,'0111'),/confirm_number/);
 await ingest(DB,[message('link','447700900111',text)]);
 assert.equal((await linkState(DB,1)).link,null);
 await assert.rejects(confirmLink(DB,1,'9999'),/confirm_number/);
 await confirmLink(DB,1,'0111');assert.equal((await linkState(DB,1)).link.lastFour,'0111');
 assert.equal(DB.sqlite.prepare('SELECT count(*) n FROM whatsapp_messages').get().n,0);
 assert.equal(DB.sqlite.prepare('SELECT count(*) n FROM whatsapp_link_requests').get().n,0);
});
test('expired token cannot link; an existing linked number cannot be claimed by a different member',async()=>{
 const DB=db();await link(DB);
 const r=await createLink(DB,2,true),text=new URL(r.url).searchParams.get('text');await ingest(DB,[message('other','447700900111',text)]);
 await assert.rejects(confirmLink(DB,2,'0111'),/number_unavailable/);
 DB.sqlite.exec("UPDATE whatsapp_link_requests SET expires_at='2000-01-01'");await assert.rejects(confirmLink(DB,2,'0111'),/confirm_number/);
});
test('only future messages on the currently confirmed link enter private memory; unlink removes access immediately',async()=>{
 const DB=db();await ingest(DB,[message('before')]);await link(DB);await ingest(DB,[message('after')]);
 assert.equal((await whatsappMemory(DB,1)).length,1);assert.equal((await whatsappMemory(DB,2)).length,0);
 await unlink(DB,1);assert.equal((await whatsappMemory(DB,1)).length,0);
 await link(DB);assert.equal((await whatsappMemory(DB,1)).length,0);
 assert.equal((await whatsappPrivacyExport(DB,2)).messages.length,0);
});
test('member opted-out WhatsApp messages do not enter shared memory',async()=>{
 const DB=db();await link(DB,1,false);await ingest(DB,[message()]);assert.equal((await whatsappMemory(DB,1)).length,0);
});
test('shared SHIFT AI memory checks existing health consent and privacy settings',async()=>{
 const DB=db();await link(DB);await ingest(DB,[message()]);
 let j=await attachConversationMemory(DB,1,{status:'available'});assert.equal(j.conversationMemory,undefined);
 DB.sqlite.exec("INSERT INTO consents VALUES(1,1,'my_shift_health_tracking',1,'2020-01-01')");
 j=await attachConversationMemory(DB,1,{status:'available'});assert.equal(j.conversationMemory.history.length,1);
 DB.sqlite.exec("INSERT INTO shift_ai_privacy_settings VALUES(1,0,'2020-01-01')");
 j=await attachConversationMemory(DB,1,{status:'available'});assert.equal(j.conversationMemory.status,'off');
 DB.sqlite.exec("INSERT INTO consents VALUES(2,1,'my_shift_health_tracking',0,'2026-01-01')");
 j=await attachConversationMemory(DB,1,{status:'available'});assert.equal(j.conversationMemory,undefined);
});
test('no budget approval means no AI call; no sending capability exists',async()=>{
 const DB=db();await ingest(DB,[message()]);let calls=0;
 await assert.rejects(draftReply(DB,{AI:{run:async()=>{calls++}}},'wamid.test',9),/ai_budget_not_enabled/);
 assert.equal(calls,0);assert.equal(readiness(env).outboundEnabled,false);assert.equal(readiness(env).automaticReplies,false);
});
test('clinical and attachment messages require a human without an AI call',async()=>{
 const DB=db();await ingest(DB,[message('clinical',undefined,'My dose is making me vomit'),{...message('photo'),kind:'attachment'}]);let calls=0;
 const e={WHATSAPP_AI_DRAFTS_ENABLED:'true',WHATSAPP_AI_BUDGET_APPROVED:'true',WHATSAPP_AI_DAILY_LIMIT:'2',AI:{run:async()=>{calls++}}};
 await assert.rejects(draftReply(DB,e,'clinical',9),/clinical_or_sensitive/);await assert.rejects(draftReply(DB,e,'photo',9),/attachment_requires/);assert.equal(calls,0);
});
test('approved mock inference writes a draft only, enforces daily cap and avoids repeat model calls',async()=>{
 const DB=db();await ingest(DB,[message('first'),message('second')]);let calls=0;
 const e={WHATSAPP_AI_DRAFTS_ENABLED:'true',WHATSAPP_AI_BUDGET_APPROVED:'true',WHATSAPP_AI_DAILY_LIMIT:'1',AI:{run:async(model,input)=>{calls++;assert.equal(input.max_tokens,350);return {response:JSON.stringify({draft:'Please open My Timber to sign in.'})}}}};
 assert.equal((await draftReply(DB,e,'first',9)).sent,false);assert.equal((await draftReply(DB,e,'first',9)).existing,true);
 await assert.rejects(draftReply(DB,e,'second',9),/daily_ai_limit_reached/);assert.equal(calls,1);
});
test('HQ and member endpoints require auth, deny clinical role and cross-origin writes',async()=>{
 const DB=db();const denied={memberAuth:async()=>({response:new Response('',{status:401})}),hqAuth:async()=>({userId:8,user:{role:'clinical'}})};
 assert.equal((await whatsappRoutes(request('/v1/member/whatsapp'),{DB},denied)).status,401);
 assert.equal((await whatsappRoutes(request('/v1/hq/whatsapp'),{DB},denied)).status,403);
 assert.equal((await whatsappRoutes(request('/v1/member/whatsapp',{kind:'create',memoryEnabled:true},'https://evil.example'),{DB},auth)).status,403);
 assert.equal((await whatsappRoutes(request('/v1/hq/whatsapp/draft',{messageId:'x'}),{DB},{...auth,hqAuth:async()=>({userId:8,user:{role:'support'}})})).status,403);
});
test('member route links only the session owner and exports only that member',async()=>{
 const DB=db();const r=await whatsappRoutes(request('/v1/member/whatsapp',{kind:'create',memoryEnabled:false,userId:99}),{...env,DB},auth);
 assert.equal(r.status,201);assert(DB.sqlite.prepare('SELECT * FROM whatsapp_link_requests WHERE user_id=1').get());assert(!DB.sqlite.prepare('SELECT * FROM whatsapp_link_requests WHERE user_id=99').get());
});
test('retention removes old message bodies and expired link codes',async()=>{
 const DB=db();await ingest(DB,[message()]);DB.sqlite.exec("UPDATE whatsapp_messages SET received_at='2000-01-01'");await createLink(DB,1,false);DB.sqlite.exec("UPDATE whatsapp_link_requests SET expires_at='2000-01-01'");
 await retention(DB);assert.equal(DB.sqlite.prepare('SELECT count(*) n FROM whatsapp_messages').get().n,0);assert.equal(DB.sqlite.prepare('SELECT count(*) n FROM whatsapp_link_requests').get().n,0);
});
test('UI client parses and homepage passes through without an injected link',async()=>{
 new Function(client);const r=new Response('<html><body>Homepage</body></html>',{headers:{'Content-Type':'text/html'}});
 assert.equal(await withWhatsappHQLink(request('/'),r),r);
});

test('health erasure removes linked WhatsApp records and cannot restore them after re-consent',async()=>{
 const DB=db();
 DB.sqlite.exec("ALTER TABLE consents ADD COLUMN consent_version TEXT; ALTER TABLE consents ADD COLUMN granted_at TEXT; ALTER TABLE consents ADD COLUMN withdrawn_at TEXT; CREATE TABLE progress_entries(user_id INTEGER); CREATE TABLE check_ins(user_id INTEGER,case_id INTEGER); ALTER TABLE member_state ADD COLUMN updated_at TEXT;");
 await link(DB);await ingest(DB,[message()]);
 const {privacyHealthErasureRoute}=await import('../privacy-health-erasure-route-v1.js');
 const response=await privacyHealthErasureRoute(new Request('https://shiftsometimber.co.uk/v1/privacy/health-tracking',{method:'DELETE'}),{DB},{},async()=>Response.json({user:{id:1}}));
 assert.equal(response.status,200);
 assert.equal((await whatsappPrivacyExport(DB,1)).messages.length,0);assert.equal((await whatsappMemory(DB,1)).length,0);assert.equal((await linkState(DB,1)).link,null);
});
test('revoking a member link during mock inference prevents a memory-based draft being saved',async()=>{
 const DB=db();await link(DB);await ingest(DB,[message()]);DB.sqlite.exec("INSERT INTO consents VALUES(1,1,'my_shift_health_tracking',1,'2020-01-01')");
 const e={WHATSAPP_AI_DRAFTS_ENABLED:'true',WHATSAPP_AI_BUDGET_APPROVED:'true',WHATSAPP_AI_DAILY_LIMIT:'1',AI:{run:async()=>{await unlink(DB,1);return {response:{draft:'An obsolete personal draft'}}}}};
 await assert.rejects(draftReply(DB,e,'wamid.test',9),/memory_permission_changed/);
 assert.equal(DB.sqlite.prepare('SELECT draft FROM whatsapp_messages').get().draft,null);
});
test('member Settings and HQ get relevant links, keeping the public homepage unchanged',async()=>{
 for(const [path,link] of [['/member/settings','/member/whatsapp'],['/hq','/hq/whatsapp']]){
 const result=await withWhatsappHQLink(request(path),new Response('<html><main></main><body></body></html>',{headers:{'Content-Type':'text/html'}}));assert((await result.text()).includes('href="'+link+'"'));
 }
});

test('disconnect during a native Ask Timber answer invalidates its WhatsApp context and persistence',async()=>{
 const DB=db();await link(DB);await ingest(DB,[message()]);DB.sqlite.exec("INSERT INTO consents VALUES(1,1,'my_shift_health_tracking',1,'2020-01-01')");
 const journey=await attachConversationMemory(DB,1,{status:'available'}),access=memoryAccess(journey);
 assert(await memoryStillAllowed(access));await unlink(DB,1);assert.equal(await memoryStillAllowed(access),false);
 assert.equal(await saveConversationTurn(access,'assistant','This answer used withdrawn WhatsApp context.'),false);
});
