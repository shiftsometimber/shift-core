import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {DatabaseSync} from 'node:sqlite';
import {buildDailyReminderMessage} from '../daily-reminder-copy-v1.js';

// Execute the real scheduler and SQL with isolated dependencies. No network,
// production bindings, member records or real push keys are used.
const source=readFileSync(new URL('../fit-reminders-v1.js',import.meta.url),'utf8')
  .replace(/^import .*;\n/gm,'').replace(/^export /gm,'');
const slots=[
  {name:'morning',instant:'2026-09-14T06:00:00Z',date:'2026-09-14',email:'email',push:'push_morning',enabled:'enabled'},
  {name:'evening',instant:'2026-09-14T17:00:00Z',date:'2026-09-14',email:'email_evening',push:'push_evening',enabled:'evening_enabled'},
  {name:'weekly',instant:'2026-09-13T17:00:00Z',date:'2026-09-13',email:'email_weekly',push:'push_weekly',enabled:'weekly_enabled'}
];
async function fixture(t,slot,options={}){
  const sql=new DatabaseSync(':memory:');t.after(()=>sql.close());
  const state={emails:[],pushes:[],warnings:[],events:[],emailFailures:options.emailFailures||0,pushStatuses:[...(options.pushStatuses||[])],failDeliveryLog:false};
  const DB={
    prepare(query){let args=[];return{bind(...values){args=values;return this},async first(){return sql.prepare(query).get(...args)||null},async all(){return{results:sql.prepare(query).all(...args)}},async run(){
      if(state.failDeliveryLog&&/^UPDATE fit_reminder_deliveries SET status='sent'/.test(query))throw Error('synthetic delivery log failure');
      const result=sql.prepare(query).run(...args);return{success:true,meta:{changes:Number(result.changes),last_row_id:Number(result.lastInsertRowid)}};
    }}},
    async batch(statements){return Promise.all(statements.map(statement=>statement.run()))},
    async exec(query){sql.exec(query)}
  };
  class Clock extends Date{constructor(...args){super(...(args.length?args:[slot.instant]))}static now(){return Date.parse(slot.instant)}}
  const module=runInNewContext(`${source}\n;({runFitMorningReminders,ensureSchema})`,{
    Request,Response,URL,Intl,Date:Clock,Uint8Array,
    console:{warn:(...args)=>state.warnings.push(args)},
    fitDailyContext:async()=>({mode:options.recovery?'recover':'train',recent:{completed_today:Boolean(options.completed)},daily_output:{next:{kind:'movement',title:'A short walk',detail:'Ten useful minutes.'}}}),
    recordProductEvent:async(env,event)=>{if(options.analyticsFailure)throw Error('synthetic analytics failure');state.events.push(event)},
    buildDailyReminderMessage,
    buildPushPayload:async({data})=>({method:'POST',body:JSON.stringify(data)}),
    fetch:async(endpoint,payload)=>{state.pushes.push({endpoint,payload});const status=state.pushStatuses.shift()||201;return{ok:status>=200&&status<300,status}}
  });
  sql.exec(`CREATE TABLE users(id INTEGER PRIMARY KEY,email TEXT,first_name TEXT);
    CREATE TABLE user_auth(user_id INTEGER,email_verified INTEGER);
    CREATE TABLE product_events(user_id INTEGER,event_name TEXT,properties_json TEXT,occurred_at TEXT);
    INSERT INTO users VALUES(1,'synthetic@example.invalid','Test');
    INSERT INTO user_auth VALUES(1,${options.verified===false?0:1});`);
  await module.ensureSchema(DB);
  sql.prepare(`INSERT INTO fit_reminder_preferences(user_id,${slot.enabled},preferred_hour,evening_hour,learn_timing) VALUES(1,?,7,18,0)`).run(options.disabled?0:1);
  if(options.subscription!==false)sql.exec("INSERT INTO fit_push_subscriptions(user_id,endpoint,p256dh,auth,permission_granted_at) VALUES(1,'https://push.example.invalid/device','synthetic-key','synthetic-auth',CURRENT_TIMESTAMP)");
  const env={DB,VAPID_PUBLIC_KEY:'synthetic-public-key',VAPID_PRIVATE_KEY:'synthetic-private-key'};
  if(options.email!==false)env.EMAIL={send:async message=>{state.emails.push(message);if(options.beforeEmail)await options.beforeEmail();if(state.emailFailures>0){state.emailFailures--;throw Error('synthetic email failure')}}};
  return{...state,state,sql,env,run:()=>module.runFitMorningReminders(env),delivery:channel=>sql.prepare('SELECT * FROM fit_reminder_deliveries WHERE user_id=1 AND local_date=? AND channel=?').get(slot.date,channel)};
}
for(const slot of slots){
  test(`${slot.name}: email failure does not block push; retry sends email only`,async t=>{
    const f=await fixture(t,slot,{emailFailures:1});const first=await f.run();
    assert.equal(f.pushes.length,1,'push must be independent of email failure');
    assert.equal(first.push_sent,1);assert.equal(first.failed,1);assert.equal(f.delivery(slot.push).status,'sent');
    const second=await f.run();assert.equal(f.emails.length,2);assert.equal(f.pushes.length,1);assert.equal(second.sent,1);assert.equal(f.delivery(slot.email).status,'sent');
  });
  test(`${slot.name}: push failure retries independently of successful email`,async t=>{
    const f=await fixture(t,slot,{pushStatuses:[503,201]});await f.run();await f.run();
    assert.equal(f.emails.length,1);assert.equal(f.pushes.length,2);assert.equal(f.delivery(slot.push).status,'sent');
  });
  test(`${slot.name}: pre-existing email receipts still allow an undelivered push`,async t=>{
    const f=await fixture(t,slot);f.sql.prepare("INSERT INTO fit_reminder_deliveries(user_id,local_date,channel,status,sent_at) VALUES(1,?,?,'sent',CURRENT_TIMESTAMP)").run(slot.date,slot.email);
    await f.run();assert.equal(f.emails.length,0);assert.equal(f.pushes.length,1);assert.equal(f.delivery(slot.push).status,'sent');
  });
  test(`${slot.name}: push-only delivery is deduplicated`,async t=>{
    const f=await fixture(t,slot,{email:false});await f.run();await f.run();
    assert.equal(f.pushes.length,1);assert.equal(f.delivery(slot.push).status,'sent');assert.equal(f.delivery(slot.email),undefined);
  });
  test(`${slot.name}: analytics failure cannot block or repeat either delivery`,async t=>{
    const f=await fixture(t,slot,{analyticsFailure:true});const first=await f.run();await f.run();
    assert.equal(f.emails.length,1);assert.equal(f.pushes.length,1);assert.equal(first.sent,1);assert.equal(first.push_sent,1);
    assert.equal(f.delivery(slot.email).status,'sent');assert.equal(f.delivery(slot.push).status,'sent');
  });
  test(`${slot.name}: concurrent scheduler runs claim each channel once`,async t=>{
    let unblock,entered;const barrier=new Promise(resolve=>{unblock=resolve}),emailStarted=new Promise(resolve=>{entered=resolve});
    const f=await fixture(t,slot,{beforeEmail:async()=>{entered();await barrier}});
    const first=f.run();await emailStarted;
    // An overlap reaches the same member while the first transport is awaiting.
    const second=f.run();await new Promise(resolve=>setImmediate(resolve));unblock();await Promise.all([first,second]);
    assert.equal(f.emails.length,1);assert.equal(f.pushes.length,1);
  });
  test(`${slot.name}: an accepted send with a failed receipt stays claimed`,async t=>{
    const f=await fixture(t,slot);f.state.failDeliveryLog=true;const first=await f.run();f.state.failDeliveryLog=false;await f.run();
    assert.equal(first.failed,2);assert.equal(f.delivery(slot.email).status,'sending');assert.equal(f.delivery(slot.push).status,'sending');
    assert.equal(f.emails.length,1,'uncertain persistence must not resend an accepted email');assert.equal(f.pushes.length,1,'uncertain persistence must not resend an accepted push');
  });
  test(`${slot.name}: existing per-channel suppression prevents sending`,async t=>{
    const f=await fixture(t,slot);f.sql.prepare("INSERT INTO fit_reminder_deliveries(user_id,local_date,channel,status) VALUES(1,?,?,'suppressed')").run(slot.date,slot.push);
    await f.run();assert.equal(f.emails.length,1);assert.equal(f.pushes.length,0);
  });
  test(`${slot.name}: disabled preferences and unverified members receive nothing`,async t=>{
    for(const options of [{disabled:true},{verified:false}]){const f=await fixture(t,slot,options);await f.run();assert.equal(f.emails.length,0);assert.equal(f.pushes.length,0)}
  });
}
for(const slot of slots.slice(0,2))test(`${slot.name}: completed activity suppresses both channels`,async t=>{
  const f=await fixture(t,slot,{completed:true});await f.run();assert.equal(f.emails.length,0);assert.equal(f.pushes.length,0);assert.equal(f.delivery(slot.email).status,'suppressed');assert.equal(f.delivery(slot.push).status,'suppressed');
});
test('evening: recovery suppresses both channels',async t=>{
  const slot=slots[1],f=await fixture(t,slot,{recovery:true});await f.run();assert.equal(f.emails.length,0);assert.equal(f.pushes.length,0);assert.equal(f.delivery(slot.push).suppression_reason,'recovery_day');
});
test('expired push subscription is revoked without blocking email',async t=>{
  const f=await fixture(t,slots[0],{pushStatuses:[410]});await f.run();await f.run();assert.equal(f.emails.length,1);assert.equal(f.pushes.length,1);assert(f.sql.prepare('SELECT revoked_at FROM fit_push_subscriptions').get().revoked_at);
});

test('no active push subscription releases the claim for a later opted-in device',async t=>{
  const slot=slots[0],f=await fixture(t,slot,{subscription:false});await f.run();assert.equal(f.delivery(slot.push),undefined);
  f.sql.exec("INSERT INTO fit_push_subscriptions(user_id,endpoint,p256dh,auth,permission_granted_at) VALUES(1,'https://push.example.invalid/device','synthetic-key','synthetic-auth',CURRENT_TIMESTAMP)");
  await f.run();assert.equal(f.emails.length,1);assert.equal(f.pushes.length,1);assert.equal(f.delivery(slot.push).status,'sent');
});
