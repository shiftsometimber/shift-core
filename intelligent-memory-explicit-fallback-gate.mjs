import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {learnFromMessage,listIntelligentMemories} from './intelligent-memory.js';

class D1Statement{constructor(db,sql,params=[]){this.db=db;this.sql=sql;this.params=params}bind(...params){return new D1Statement(this.db,this.sql,params)}async run(){const r=this.db.prepare(this.sql).run(...this.params);return{success:true,meta:{changes:Number(r.changes||0),last_row_id:Number(r.lastInsertRowid||0)}}}async first(){return this.db.prepare(this.sql).get(...this.params)||null}async all(){return{results:this.db.prepare(this.sql).all(...this.params)}}}
class D1Database{constructor(){this.sqlite=new DatabaseSync(':memory:')}prepare(sql){return new D1Statement(this.sqlite,sql)}exec(sql){this.sqlite.exec(sql);return Promise.resolve()}async batch(stmts){const out=[];for(const s of stmts)out.push(await s.run());return out}}
const DB=new D1Database();
DB.sqlite.exec(`CREATE TABLE shift_ai_conversations (id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER NOT NULL,direction TEXT NOT NULL,body TEXT NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);`);
const AI={async run(){return{response:'{"memories":[]}'}}};
const env={DB,AI};

const safe='Remember this: taking a short walk after lunch always clears my head and works for me.';
const stored=await learnFromMessage(env,101,safe,{explicit:true});
assert.equal(stored.stored,1,'explicit safe repeated strategy must retain even when extractor returns empty');
const memories=await listIntelligentMemories(DB,101);
assert.equal(memories.length,1);
assert.equal(memories[0].category,'effective_strategy');
assert.equal(memories[0].source,'explicit_fallback');
assert.equal(memories[0].confidence,0.92);
assert.match(memories[0].memory_value,/short walk after lunch/i);

await learnFromMessage(env,102,'Remember this: I always take 10mg Mounjaro on Fridays and it works for me.',{explicit:true});
assert.equal((await listIntelligentMemories(DB,102)).length,0,'medication detail must never enter fallback memory');
await learnFromMessage(env,103,'Remember this: my bank account routine always works for me.',{explicit:true});
assert.equal((await listIntelligentMemories(DB,103)).length,0,'financial detail must never enter fallback memory');
await learnFromMessage(env,104,'Remember this: I am tired today.',{explicit:true});
assert.equal((await listIntelligentMemories(DB,104)).length,0,'transient explicit statement must not be promoted to durable strategy');

console.log(JSON.stringify({ok:true,safeExplicitFallback:true,confidence:0.92,sensitiveFailClosed:true,transientFailClosed:true},null,2));
console.log('PASS G4-008 explicit-memory fallback: safe repeated strategy is retained when extraction is empty; medication, finance and transient statements fail closed.');
