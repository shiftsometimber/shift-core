import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {DatabaseSync} from 'node:sqlite';
import {createHash} from 'node:crypto';
import {authenticateMember} from '../member-state-fast-v1.js';
import {manifest,withPwa,pwaAssets} from './presentation.mjs';
import {serviceWorker} from './service-worker.mjs';
import {client} from './ui.mjs';
const source=readFileSync(new URL('./reminders.mjs',import.meta.url),'utf8').replace(/^import .*;\n/gm,'').replace(/^export /gm,'');
const origin='https://preview.example.invalid',endpoint='https://web.push.apple.com/Qtest';
const keys={p256dh:Buffer.alloc(65,1).toString('base64url'),auth:Buffer.alloc(16,1).toString('base64url')};
async function fixture(t){
 const sql=new DatabaseSync(':memory:');t.after(()=>sql.close());const transport=[];let failReceipt=false;
 const DB={prepare(query){let args=[];return{bind(...values){args=values;return this},async first(){return sql.prepare(query).get(...args)||null},async all(){return{results:sql.prepare(query).all(...args)}},async run(){if(failReceipt&&query.startsWith("UPDATE my_timber_push_deliveries SET status='accepted'"))throw Error('receipt unavailable');const r=sql.prepare(query).run(...args);return{success:true,meta:{changes:Number(r.changes),last_row_id:Number(r.lastInsertRowid)}}}}},async batch(statements){sql.exec('BEGIN');try{const out=[];for(const s of statements)out.push(await s.run());sql.exec('COMMIT');return out}catch(e){sql.exec('ROLLBACK');throw e}}};
 sql.exec(`CREATE TABLE users(id INTEGER PRIMARY KEY,email TEXT);CREATE TABLE user_auth(user_id INTEGER PRIMARY KEY,email_verified INTEGER);CREATE TABLE user_sessions(id INTEGER PRIMARY KEY,user_id INTEGER,token_hash TEXT,expires_at TEXT,revoked_at TEXT,last_used_at TEXT);CREATE TABLE check_ins(id INTEGER PRIMARY KEY,user_id INTEGER,case_id INTEGER,submitted_at TEXT);CREATE TABLE shift_today_checkins(user_id INTEGER,local_date TEXT);INSERT INTO users VALUES(1,'fictional@example.invalid'),(2,'other@example.invalid');INSERT INTO user_auth VALUES(1,1),(2,1);`);
 for(const id of [1,2])sql.prepare('INSERT INTO user_sessions VALUES(?,?,?,?,NULL,NULL)').run(id,id,createHash('sha256').update('fictional-'+id).digest('hex'),'2030-01-01T00:00:00Z');
 const mod=runInNewContext(source+'\n;({ensurePwaSchema,pwaReminderRoutes,runPwaReminders,validEndpoint,appendPwaExport})',{Request,Response,URL,Intl,Date,AbortSignal,atob,authenticateMember,ensureMemberPushIdentitySchema:async()=>{},getMemberPushIdentity:async()=>({publicKey:'fixture-public',privateKey:'never-export'}),webpush:{generateRequestDetails:()=>({method:'POST',headers:{'Content-Encoding':'aes128gcm'},body:'encrypted fixture'})},fetch:async(url,options)=>{transport.push({url,options});return{ok:true,status:201}}});
 await mod.ensurePwaSchema(DB);const env={DB};
 const req=(path,method,body,user=1,headers={})=>new Request(origin+'/v1/my-timber-pwa'+path,{method,headers:{Origin:origin,'Content-Type':'application/json',Cookie:'sst_session=fictional-'+user,...headers},body:method==='GET'?undefined:JSON.stringify(body)});
 const route=(path,method,body,user=1,headers={})=>mod.pwaReminderRoutes(req(path,method,body,user,headers),env);
 const enable=async(user=1,ep=endpoint,hour=19)=>{const r=await route('/subscription','PUT',{subscription:{endpoint:ep,keys},hour},user);assert.equal(r.status,200);return r.json()};
 return{sql,env,mod,route,req,enable,transport,failReceipt:value=>{failReceipt=value},run:(send=async()=>{transport.push({scheduler:true});return'accepted'},date='2026-09-21T18:00:00Z')=>mod.runPwaReminders(env,new Date(date),send)};
}
test('manifest launches Today and uses existing S-circle assets, not legacy ST',()=>{assert.equal(manifest.start_url,'/member/dashboard#today');assert.equal(manifest.display,'standalone');assert.equal(manifest.icons[0].src,'/assets/favicon.svg');assert(!JSON.stringify(manifest).includes('st-logo'));});
test('legacy public manifest points to the same S-circle My Timber app',async()=>{assert.deepEqual(await pwaAssets(new Request(origin+'/manifest.webmanifest')).json(),manifest);});
test('only member HTML is wrapped; header/footer and session code survive; manifest is unique',async()=>{
 const html='<html><head><link rel="manifest" href="/manifest.webmanifest"></head><body><header>existing header</header><main>account</main><footer>existing footer</footer><script>existingSession()</script></body></html>';
 const wrap=path=>withPwa(new Request(origin+path),new Response(html,{headers:{'Content-Type':'text/html','ETag':'old','Content-Length':'999'}}));
 for(const path of ['/my-timber','/member-login','/member/dashboard','/member/grub','/member/check-in']){const r=await wrap(path),text=await r.text();assert.equal(r.headers.get('Cache-Control'),'no-store');assert.equal(r.headers.get('ETag'),null);assert.equal((text.match(/rel="manifest"/g)||[]).length,1);for(const piece of ['<header>existing header</header>','<footer>existing footer','existingSession()','id="myTimberApp"'])assert(text.includes(piece));}
 for(const path of ['/','/shop','/member/password/reset']){const text=await(await wrap(path)).text();assert(text.includes('data-my-timber-app-footer'));assert(!text.includes('id="myTimberApp"'));assert(!text.includes('src="/assets/my-timber-pwa.js"'));assert(text.includes('existingSession()'));}assert.equal(await(await wrap('/v1/privacy/export')).text(),html);
 const once=await(await wrap('/member/dashboard')).text();const twice=await(await withPwa(new Request(origin+'/member/dashboard'),new Response(once,{headers:{'Content-Type':'text/html'}}))).text();assert.equal(twice,once);
});
test('assets are same-origin, noncacheable, method-gated; shared worker keeps root scope',async()=>{for(const path of ['/my-timber.webmanifest','/assets/my-timber-pwa.js','/assets/my-timber-pwa.css','/shift-push-sw-v1.js']){const r=pwaAssets(new Request(origin+path));assert.equal(r.status,200);assert.equal(r.headers.get('Cache-Control'),'no-store');assert.equal(pwaAssets(new Request(origin+path,{method:'POST'})).status,405);}assert.equal(pwaAssets(new Request(origin+'/shift-push-sw-v1.js')).headers.get('Service-Worker-Allowed'),'/');});
test('requests require exact origin, authenticated session and verified account',async t=>{const f=await fixture(t);assert.equal((await f.route('/status','POST',{},1,{Origin:'https://evil.invalid'})).status,403);assert.equal((await f.route('/status','POST',{},1,{Cookie:''})).status,401);f.sql.exec('UPDATE user_auth SET email_verified=0 WHERE user_id=1');assert.equal((await f.route('/status','POST',{})).status,403);});
test('off by default, valid opt-in persisted, refresh returns same time, own-device delete only',async t=>{const f=await fixture(t);assert.equal((await(await f.route('/status','POST',{})).json()).enabled,false);await f.enable();await f.enable(2,'https://fcm.googleapis.com/other');const r=await(await f.route('/status','POST',{endpoint})).json();assert.equal(r.enabled,true);assert.equal(r.hour,19);assert(!('privateKey'in r));await f.route('/subscription','DELETE',{endpoint},2);assert.equal(f.sql.prepare('SELECT count(*) n FROM my_timber_push_devices').get().n,2);await f.route('/subscription','DELETE',{endpoint});assert.equal(f.sql.prepare('SELECT count(*) n FROM my_timber_push_devices').get().n,1);});
test('reject arbitrary push hosts and malformed subscriptions',async t=>{const f=await fixture(t);for(const url of ['http://web.push.apple.com/x','https://localhost/x','https://web.push.apple.com.evil.invalid/x','https://user:pass@web.push.apple.com/x','https://web.push.apple.com:8443/x'])assert.equal(f.mod.validEndpoint(url),false);for(const body of [{subscription:{endpoint,keys:{p256dh:'bad',auth:'bad'}},hour:19},{subscription:{endpoint,keys},hour:25},{subscription:{endpoint:'https://private.invalid/x',keys},hour:19}])assert.equal((await f.route('/subscription','PUT',body)).status,400);});
test('test accepted is not receipt; test cooldown and account isolation',async t=>{const f=await fixture(t);await f.enable();assert.equal((await f.route('/test','POST',{endpoint},2)).status,409);const r=await f.route('/test','POST',{endpoint});assert.equal((await r.json()).status,'accepted_not_receipt');assert.equal((await f.route('/test','POST',{endpoint})).status,429);assert.equal(f.transport.length,1);assert.equal(f.transport[0].options.redirect,'manual');});
test('UK summer and winter hours, one reminder per date/device',async t=>{const f=await fixture(t);await f.enable();await f.run();await f.run();assert.equal(f.transport.length,1);await f.run(undefined,'2026-12-01T18:00:00Z');assert.equal(f.transport.length,1);await f.run(undefined,'2026-12-01T19:00:00Z');assert.equal(f.transport.length,2);});
test('saved canonical and legacy check-ins suppress the current UK day',async t=>{for(const legacy of [false,true]){const f=await fixture(t);await f.enable();f.sql.exec(legacy?"INSERT INTO shift_today_checkins VALUES(1,'2026-09-21')":"INSERT INTO check_ins VALUES(1,1,NULL,'2026-09-21 17:59:00')");const r=await f.run();assert.equal(r.suppressed,1);assert.equal(f.transport.length,0);}});
test('yesterday check-in and case-specific clinical records do not hide daily reminder',async t=>{const f=await fixture(t);await f.enable();f.sql.exec("INSERT INTO check_ins VALUES(1,1,NULL,'2026-09-20T10:00:00Z'),(2,1,100,'2026-09-21T17:59:00Z')");await f.run();assert.equal(f.transport.length,1);});
test('revoked/expired sessions, unverification, disabled and withdrawn opt-ins suppress sends',async t=>{for(const sql of ["UPDATE user_sessions SET revoked_at='2026-09-21'","UPDATE user_sessions SET expires_at='2026-09-01'",'UPDATE user_auth SET email_verified=0','UPDATE my_timber_push_devices SET enabled=0','DELETE FROM my_timber_push_devices']){const f=await fixture(t);await f.enable();f.sql.exec(sql);await f.run();assert.equal(f.transport.length,0,sql);}});
test('session mismatch requires explicit re-opt-in',async t=>{const f=await fixture(t);await f.enable();f.sql.exec('UPDATE my_timber_push_devices SET session_id=999');assert.equal((await(await f.route('/status','POST',{endpoint})).json()).enabled,false);assert.equal((await f.route('/test','POST',{endpoint})).status,409);});
test('overlapping schedulers claim once',async t=>{const f=await fixture(t);await f.enable();let enter,release;const entered=new Promise(r=>{enter=r}),barrier=new Promise(r=>{release=r});let sends=0;const first=f.run(async()=>{sends++;enter();await barrier;return'accepted'});await entered;await f.run(async()=>{sends++;return'accepted'});release();await first;assert.equal(sends,1);});
test('failed transport retries; expired subscription is removed; accepted receipt failure cannot duplicate',async t=>{const f=await fixture(t);await f.enable();let sends=0;await f.run(async()=>{sends++;return'rejected'});f.failReceipt(true);await f.run(async()=>{sends++;return'accepted'});f.failReceipt(false);await f.run(async()=>{sends++;return'accepted'});assert.equal(sends,2);await f.enable(2,'https://fcm.googleapis.com/expired');await f.run(async()=> 'expired');assert.equal(f.sql.prepare('SELECT count(*) n FROM my_timber_push_devices').get().n,1);});
test('already handled first page cannot starve later devices',async t=>{const f=await fixture(t);await f.enable();for(let i=0;i<501;i++){const ep='https://fcm.googleapis.com/'+String(i).padStart(4,'0');f.sql.prepare('INSERT INTO my_timber_push_devices SELECT ?,user_id,session_id,p256dh,auth,hour,enabled,consented_at,updated_at,last_test_at FROM my_timber_push_devices WHERE endpoint=?').run(ep,endpoint);f.sql.prepare("INSERT INTO my_timber_push_deliveries VALUES(?,'2026-09-21','accepted','2026-09-21')").run(ep);}await f.run();assert.equal(f.transport.length,1);});
test('privacy export includes only own preferences/history without push bearer material',async t=>{const f=await fixture(t);await f.enable();await f.enable(2,'https://fcm.googleapis.com/other');await f.run();const req=new Request(origin+'/v1/privacy/export',{method:'POST',headers:{Cookie:'sst_session=fictional-1'}}),r=await f.mod.appendPwaExport(req,f.env,Response.json({existing:'retained'})),data=await r.json();assert.equal(data.existing,'retained');assert.equal(data.myTimberNotifications.devices.length,1);assert.equal(data.myTimberNotifications.deliveries.length,1);for(const forbidden of ['p256dh','session_id','endpoint','never-export'])assert(!JSON.stringify(data).includes(forbidden));});
test('SW push uses generic text and approved icon; external notification URLs are rejected',async()=>{const listeners={},shown=[];const self={location:{origin},navigator:{},registration:{showNotification:async(...a)=>shown.push(a)},addEventListener:(type,fn)=>listeners[type]=fn};runInNewContext(serviceWorker,{self,URL,Response,fetch});let pending;listeners.push({data:{json:()=>({kind:'my-timber-checkin',title:'sensitive',body:'sensitive',url:'https://evil.invalid'})},waitUntil:p=>{pending=p}});await pending;assert.equal(shown[0][0],'Time for your check-in');assert.equal(shown[0][1].icon,'/assets/apple-touch-icon.png');assert.equal(shown[0][1].data.url,origin+'/member/dashboard#today');assert(!JSON.stringify(shown).includes('sensitive'));assert(!serviceWorker.includes('caches.'));});
test('SW handles member offline navigation without intercepting writes or token URLs',async()=>{const listeners={},self={location:{origin},addEventListener:(type,fn)=>listeners[type]=fn};runInNewContext(serviceWorker,{self,URL,Response,fetch:async()=>{throw Error('offline')}});let response;listeners.fetch({request:{url:origin+'/member/dashboard',method:'GET',mode:'navigate'},respondWith:p=>{response=p}});assert.equal((await response).status,503);for(const request of [{url:origin+'/v1/check-ins',method:'POST',mode:'cors'},{url:origin+'/member/dashboard?token=secret',method:'GET',mode:'navigate'}])listeners.fetch({request,respondWith:()=>assert.fail('must not intercept')});});
test('browser client has no automatic permission prompt, test-notification control or offline save claims',()=>{
 new Function(client);
 assert(client.includes('Notification.requestPermission()'));
 assert(!/localStorage|sessionStorage|caches\./.test(client));
 assert(!client.includes('pwaTest'));
 assert(!client.includes("api('/test'"));
 assert(client.includes("settings=null"));
});
async function uiFixture(options={}){
 const fields={},calls={permission:0,subscribe:0,unsubscribe:0,requests:[]};
 const hidden=new Set(['pwaChange','pwaDisable','pwaRetry','pwaReminderFirstRun']);
 const disabled=new Set(['pwaHour','pwaEnable']);
 const ids=['myTimberApp','pwaInstall','pwaInstallHelp','pwaReminderSettings','pwaReminderSummary','pwaReminderEditor','pwaHour','pwaEnable','pwaChange','pwaDisable','pwaRetry','pwaReminderStatus','pwaReminderFirstRun','pwaReminderYes','pwaReminderNo','pwaReminderFirstRunStatus'];
 for(const id of ids)fields[id]={hidden:hidden.has(id),disabled:disabled.has(id),value:'19',textContent:'',open:false,focus(){this.focused=true},scrollIntoView(){},addEventListener(){}};
 if(options.noReminders)delete fields.pwaReminderSettings;
 if(!options.firstRun)delete fields.pwaReminderFirstRun;
 const notification={permission:options.permission||'default',requestPermission:()=>{calls.permission++;notification.permission=options.choice||'granted';return Promise.resolve(notification.permission)}};
 const subscription={endpoint,toJSON:()=>({endpoint,keys}),unsubscribe:async()=>{calls.unsubscribe++;return true}};
 const registration={pushManager:{getSubscription:async()=>options.active?subscription:null,subscribe:async()=>{calls.subscribe++;if(options.subscribeError)throw Error('Subscription failed. Please retry.');return subscription}}};
 const window={PushManager:{},Notification:notification};
 const navigator={userAgent:options.ios?'iPhone':options.android?'Android Chrome':'Chrome',platform:options.ios?'iPhone':'Linux',maxTouchPoints:0,serviceWorker:{register:async()=>registration,ready:Promise.resolve(registration)}};
 const document={cookie:options.cookie||'',getElementById:id=>fields[id]||null};
 const context={window,navigator,URLSearchParams,location:{hash:options.hash||'',search:options.search||''},Notification:notification,document,matchMedia:()=>({matches:!!options.standalone}),isSecureContext:true,addEventListener:()=>{},setTimeout:(fn)=>{if(options.runTimers)fn();return 0},atob,Uint8Array,AbortSignal,fetch:async(path,init)=>{calls.requests.push({path,method:init.method,body:init.body});if(options.failure&&path.endsWith(options.failure.path))return Response.json({message:'Could not confirm save.'},{status:options.failure.status});return Response.json(path.endsWith('/status')?{enabled:!!options.active,hour:19,publicKey:keys.p256dh}:{enabled:true,hour:Number(fields.pwaHour?.value||19),publicKey:keys.p256dh})}};
 runInNewContext(client,context);await new Promise(setImmediate);
 return{fields,calls,notification,document};
}
test('notification management lives in Settings; Today has only the one-time choice',async()=>{
 const html='<html><head></head><body><header>x</header><main>content</main><footer>x</footer></body></html>';
 const settings=await(await withPwa(new Request(origin+'/member/settings'),new Response(html,{headers:{'Content-Type':'text/html'}}))).text();
 assert(settings.includes('id="pwaReminderSettings"'));assert(settings.includes('Turn on notifications'));assert(!settings.includes('id="pwaReminderFirstRun"'));assert(!settings.includes('Send test notification'));
 const dashboard=await(await withPwa(new Request(origin+'/member/dashboard'),new Response(html,{headers:{'Content-Type':'text/html'}}))).text();
 assert(dashboard.includes('id="pwaReminderFirstRun"'));assert(dashboard.includes('Yes, remind me'));assert(dashboard.includes('No thanks'));assert(!dashboard.includes('id="pwaReminderSettings"'));assert(!dashboard.includes('Send test notification'));
});
test('first PWA Today asks once; Yes enables default reminder then disappears into Settings',async()=>{
 const f=await uiFixture({firstRun:true,noReminders:true,standalone:true});
 assert.equal(f.calls.permission,0);assert.equal(f.fields.pwaReminderFirstRun.hidden,false);
 await f.fields.pwaReminderYes.onclick();
 assert.equal(f.calls.permission,1);assert.equal(f.calls.subscribe,1);assert.equal(f.fields.pwaReminderFirstRun.hidden,true);
 const put=f.calls.requests.find(r=>r.method==='PUT');assert(put);assert.equal(JSON.parse(put.body).hour,19);assert.match(f.document.cookie,/sst_pwa_reminder_prompt=v1/);
});
test('first PWA Today No thanks records the choice without asking permission; it stays gone on revisit',async()=>{
 const f=await uiFixture({firstRun:true,noReminders:true,standalone:true});await f.fields.pwaReminderNo.onclick();
 assert.equal(f.calls.permission,0);assert.equal(f.calls.subscribe,0);assert.equal(f.fields.pwaReminderFirstRun.hidden,true);assert.match(f.document.cookie,/sst_pwa_reminder_prompt=v1/);
 const revisit=await uiFixture({firstRun:true,noReminders:true,standalone:true,cookie:'sst_pwa_reminder_prompt=v1'});
 assert.equal(revisit.fields.pwaReminderFirstRun.hidden,true);assert.equal(revisit.calls.permission,0);
});
test('first-run choice is PWA-only and an existing active reminder suppresses it',async()=>{
 const browser=await uiFixture({firstRun:true,noReminders:true,standalone:false});assert.equal(browser.fields.pwaReminderFirstRun.hidden,true);
 const active=await uiFixture({firstRun:true,noReminders:true,standalone:true,active:true});assert.equal(active.fields.pwaReminderFirstRun.hidden,true);assert.match(active.document.cookie,/sst_pwa_reminder_prompt=v1/);
});
test('Settings asks permission only on explicit enable and collapses to compact on state',async()=>{
 const f=await uiFixture();assert.equal(f.calls.permission,0);assert.equal(f.fields.pwaReminderSummary.textContent,'Reminders off');
 await f.fields.pwaEnable.onclick();assert.equal(f.calls.permission,1);assert.equal(f.calls.subscribe,1);assert.equal(f.fields.pwaReminderSummary.textContent,'Reminders on · 19:00');assert.equal(f.fields.pwaReminderEditor.hidden,true);assert.equal(f.fields.pwaChange.hidden,false);assert.equal(f.fields.pwaDisable.hidden,false);
});
test('active Settings shows Change/Turn off; Change exposes time; confirmed off restores setup',async()=>{
 const f=await uiFixture({active:true});assert.equal(f.fields.pwaReminderEditor.hidden,true);assert.equal(f.fields.pwaChange.hidden,false);
 f.fields.pwaChange.onclick();assert.equal(f.fields.pwaReminderEditor.hidden,false);assert.equal(f.fields.pwaHour.focused,true);
 await f.fields.pwaDisable.onclick();assert.equal(f.fields.pwaReminderSummary.textContent,'Reminders off');assert.equal(f.fields.pwaReminderEditor.hidden,false);assert.equal(f.fields.pwaDisable.hidden,true);
});
test('denied, iPhone browser and failures remain truthful and retryable',async()=>{
 const denied=await uiFixture({permission:'denied'});assert.equal(denied.fields.pwaEnable.disabled,true);assert.match(denied.fields.pwaReminderSummary.textContent,/blocked/);
 const iphone=await uiFixture({ios:true});assert.equal(iphone.calls.requests.length,0);assert.match(iphone.fields.pwaReminderSummary.textContent,/Install My Timber/);
 const failed=await uiFixture({failure:{path:'/status',status:401}});assert.equal(failed.fields.pwaEnable.disabled,true);assert.equal(failed.fields.pwaRetry.hidden,false);assert.match(failed.fields.pwaReminderSummary.textContent,/Sign in/);
});
test('failed enable rolls back a new subscription; failed turn-off preserves active state',async()=>{
 const enable=await uiFixture({failure:{path:'/subscription',status:503}});await enable.fields.pwaEnable.onclick();assert.equal(enable.calls.unsubscribe,1);assert.equal(enable.fields.pwaDisable.hidden,true);assert.equal(enable.fields.pwaRetry.hidden,false);
 const off=await uiFixture({active:true,failure:{path:'/subscription',status:503}});await off.fields.pwaDisable.onclick();assert.equal(off.fields.pwaDisable.hidden,false);assert.match(off.fields.pwaReminderSummary.textContent,/Reminders on/);
});
test('setup instructions remain device-specific without asking notification permission',async()=>{
 const android=await uiFixture({android:true,noReminders:true,hash:'#myTimberApp'});assert.match(android.fields.pwaInstallHelp.textContent,/On Android:.*Chrome/);assert.equal(android.fields.myTimberApp.open,true);assert.equal(android.calls.permission,0);
 const iphone=await uiFixture({ios:true,noReminders:true});assert.match(iphone.fields.pwaInstallHelp.textContent,/On iPhone:/);
 const desktop=await uiFixture({noReminders:true});assert.match(desktop.fields.pwaInstallHelp.textContent,/On a computer:/);
});
test('setup entry survives dashboard initialising its Today fragment',async()=>{const f=await uiFixture({noReminders:true,hash:'#today',search:'?setup=app'});assert.equal(f.fields.myTimberApp.open,true);assert.equal(f.calls.permission,0);});
