import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {listMemberMemories,updateOneMemory,deleteOneMemory,getMemoryPrivacy,updateMemoryPrivacy} from './memory-privacy.js';

class D1Statement{constructor(db,sql,params=[]){this.db=db;this.sql=sql;this.params=params}bind(...params){return new D1Statement(this.db,this.sql,params)}async run(){const r=this.db.prepare(this.sql).run(...this.params);return{success:true,meta:{changes:Number(r.changes||0),last_row_id:Number(r.lastInsertRowid||0)}}}async first(){return this.db.prepare(this.sql).get(...this.params)||null}async all(){return{results:this.db.prepare(this.sql).all(...this.params)}}}
class D1Database{constructor(){this.sqlite=new DatabaseSync(':memory:')}prepare(sql){return new D1Statement(this.sqlite,sql)}exec(sql){this.sqlite.exec(sql);return Promise.resolve()}async batch(stmts){const out=[];for(const s of stmts)out.push(await s.run());return out}}
const DB=new D1Database();
DB.sqlite.exec(`CREATE TABLE shift_ai_memory_v2 (id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER NOT NULL,memory_key TEXT NOT NULL,category TEXT NOT NULL,memory_value TEXT NOT NULL,confidence REAL NOT NULL DEFAULT 0.75,source TEXT NOT NULL DEFAULT 'conversation',created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,UNIQUE(user_id,memory_key));`);
await DB.prepare(`INSERT INTO shift_ai_memory_v2(user_id,memory_key,category,memory_value,confidence,source) VALUES(1,'food_dislike','food_preference','Dave dislikes mushrooms',0.82,'conversation')`).run();
await DB.prepare(`INSERT INTO shift_ai_memory_v2(user_id,memory_key,category,memory_value,confidence,source) VALUES(2,'food_dislike','food_preference','Other member dislikes olives',0.91,'conversation')`).run();

let memories=await listMemberMemories(DB,1);assert.equal(memories.length,1);assert.equal(memories[0].memory_key,'food_dislike');assert.equal(memories[0].source,'conversation');assert.equal(memories[0].confidence,0.82);
const correction=await updateOneMemory(DB,1,'food_dislike',{value:'Dave is fine with mushrooms; he dislikes celery',confidence:1});assert.equal(correction.updated,1);assert.match(correction.memory.memory_value,/dislikes celery/);assert.equal(correction.memory.source,'member_correction');assert.equal(correction.memory.confidence,1);
const cross=await updateOneMemory(DB,1,'missing_other_member_key',{value:'tamper'});assert.equal(cross.updated,0);
const otherBefore=await listMemberMemories(DB,2);assert.match(otherBefore[0].memory_value,/olives/);
const deleted=await deleteOneMemory(DB,1,'food_dislike');assert.equal(deleted.deleted,1);assert.equal((await listMemberMemories(DB,1)).length,0);assert.equal((await listMemberMemories(DB,2)).length,1);
let privacy=await getMemoryPrivacy(DB,1);assert.equal(Number(privacy.auto_memory),1);privacy=await updateMemoryPrivacy(DB,1,{auto_memory:false,proactive_insights:false,proactive_cooldown_hours:72});assert.equal(Number(privacy.auto_memory),0);assert.equal(Number(privacy.proactive_insights),0);assert.equal(Number(privacy.proactive_cooldown_hours),72);

console.log(JSON.stringify({ok:true,inspect:true,memberCorrection:true,correctionProvenance:'member_correction',deleteDurable:true,crossMemberIsolation:true,privacyControls:true},null,2));
console.log('PASS M14 member memory inspect/correct/delete controls with provenance, confidence, durable deletion, privacy settings and cross-member isolation');
