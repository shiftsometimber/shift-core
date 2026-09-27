import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {runScheduledIntelligence} from '../scheduled-intelligence.js';
import {ensureProactiveSchema,nextDeliverableInsight,markInsightDelivered} from '../proactive-insights.js';
import {updateMemoryPrivacy} from '../memory-privacy.js';

class D1 {
  constructor(){this.sqlite=new DatabaseSync(':memory:');this.beforeRun=null;}
  prepare(sql){
    const db=this,args=[];
    const statement={
      bind(...values){args.splice(0,args.length,...values);return statement;},
      async first(){return db.sqlite.prepare(sql).get(...args)||null;},
      async all(){return {results:db.sqlite.prepare(sql).all(...args)};},
      execute(){db.beforeRun?.(sql,args);const result=db.sqlite.prepare(sql).run(...args);return {success:true,meta:{changes:Number(result.changes)}};},
      async run(){return statement.execute();},
    };
    return statement;
  }
  async batch(statements){
    this.sqlite.exec('BEGIN');
    try{const results=statements.map(statement=>statement.execute());this.sqlite.exec('COMMIT');return results;}
    catch(error){this.sqlite.exec('ROLLBACK');throw error;}
  }
}

async function fixture(t){
  const DB=new D1();t.after(()=>DB.sqlite.close());
  DB.sqlite.exec(`CREATE TABLE users(id INTEGER PRIMARY KEY);
    INSERT INTO users VALUES(1),(2);
    CREATE TABLE shift_ai_memory_v2(user_id INTEGER,category TEXT,memory_value TEXT,confidence REAL,updated_at TEXT);`);
  await ensureProactiveSchema(DB);
  for(const user of [1,2]){
    await updateMemoryPrivacy(DB,user,{proactive_insights:true,proactive_cooldown_hours:48});
    DB.sqlite.prepare(`INSERT INTO shift_ai_proactive_insights(user_id,kind,title,body,confidence) VALUES(?,'strategy',?,?,.9)`).run(user,'Useful step '+user,'Synthetic member '+user+' insight.');
  }
  return {DB,env:{DB}}; // No AI, email, push or external network provider is bound.
}
const count=(DB,table)=>DB.sqlite.prepare('SELECT COUNT(*) count FROM '+table).get().count;

test('scheduled preparation keeps an insight available until the existing member delivery marker',async t=>{
  const {DB,env}=await fixture(t);
  const result=await runScheduledIntelligence(env);
  assert.equal(result.queued,2);
  assert.equal(count(DB,'shift_ai_proactive_delivery'),0,'queueing is not member delivery');
  assert.equal(DB.sqlite.prepare("SELECT COUNT(*) count FROM shift_ai_proactive_insights WHERE status='open'").get().count,2);
  const insight=await nextDeliverableInsight(DB,1);
  assert.equal(insight?.title,'Useful step 1','the real member selector can still return the prepared insight');
  assert.deepEqual({...DB.sqlite.prepare('SELECT status,delivered_at FROM shift_ai_proactive_outbox WHERE user_id=1').get()},{status:'queued',delivered_at:null});
  await markInsightDelivered(DB,1,insight.id);
  assert.equal(await nextDeliverableInsight(DB,1),null,'the existing feed/acknowledgement marker, not cron, starts cooldown');
  assert.equal(count(DB,'shift_ai_proactive_delivery'),1);
  assert.equal((await nextDeliverableInsight(DB,2))?.title,'Useful step 2','another member is unaffected');
});

test('repeated and overlapping scheduler calls enqueue each pending insight only once',async t=>{
  const {DB,env}=await fixture(t);
  const runs=await Promise.all([runScheduledIntelligence(env),runScheduledIntelligence(env)]);
  assert.equal(runs.reduce((sum,result)=>sum+result.queued,0),2);
  assert.equal(count(DB,'shift_ai_proactive_outbox'),2);
  assert.equal((await runScheduledIntelligence(env)).queued,0);
  assert.equal(count(DB,'shift_ai_proactive_outbox'),2);
  assert.equal(count(DB,'shift_ai_proactive_delivery'),0);
});

test('existing cooldown and disabled proactive permission remain effective',async t=>{
  const {DB,env}=await fixture(t);
  await updateMemoryPrivacy(DB,1,{proactive_insights:false});
  await markInsightDelivered(DB,2,(await nextDeliverableInsight(DB,2)).id);
  const result=await runScheduledIntelligence(env);
  assert.equal(result.queued,0);assert.equal(count(DB,'shift_ai_proactive_outbox'),0);
  assert.equal(count(DB,'shift_ai_proactive_delivery'),1,'no extra delivery records are manufactured');
});

test('an insight acknowledged after selection cannot be requeued from the stale scheduler read',async t=>{
  const {DB,env}=await fixture(t);let intercepted=false;
  DB.beforeRun=(sql,args)=>{
    if(!intercepted&&/INSERT INTO shift_ai_proactive_outbox/.test(sql)){
      intercepted=true;
      DB.sqlite.prepare("UPDATE shift_ai_proactive_insights SET status='delivered' WHERE user_id=? AND id=?").run(args[0],args[1]);
    }
  };
  const result=await runScheduledIntelligence(env);
  assert.equal(intercepted,true);assert.equal(result.queued,1);
  assert.equal(count(DB,'shift_ai_proactive_outbox'),1);
});

test('an enqueue failure is reported and does not consume the insight or another member’s turn',async t=>{
  const {DB,env}=await fixture(t);
  DB.beforeRun=(sql,args)=>{if(/INSERT INTO shift_ai_proactive_outbox/.test(sql)&&args[0]===2)throw new Error('synthetic queue write failure');};
  const result=await runScheduledIntelligence(env);
  assert.equal(result.failed,1);assert.equal(result.queued,1);
  assert.equal(count(DB,'shift_ai_proactive_delivery'),0);
  assert.equal((await nextDeliverableInsight(DB,2))?.title,'Useful step 2');
  DB.beforeRun=null;
  assert.equal((await runScheduledIntelligence(env)).queued,1,'retry adds only the previously failed queue row');
  assert.equal(count(DB,'shift_ai_proactive_outbox'),2);
});

test('permission withdrawn after selection prevents the pending queue write',async t=>{
  const {DB,env}=await fixture(t);let intercepted=false;
  DB.beforeRun=(sql,args)=>{
    if(!intercepted&&/INSERT INTO shift_ai_proactive_outbox/.test(sql)){
      intercepted=true;
      DB.sqlite.prepare('UPDATE shift_ai_privacy_settings SET proactive_insights=0 WHERE user_id=?').run(args[0]);
    }
  };
  const result=await runScheduledIntelligence(env);
  assert.equal(intercepted,true);assert.equal(result.queued,1);
  assert.equal(count(DB,'shift_ai_proactive_outbox'),1);
  assert.equal(count(DB,'shift_ai_proactive_delivery'),0);
});
