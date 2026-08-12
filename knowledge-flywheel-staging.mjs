import assert from 'node:assert/strict';
import fs from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {runKnowledgeFlywheel} from './scheduled-knowledge-v1.js';

class D1Statement{
  constructor(db,sql,params=[]){this.db=db;this.sql=sql;this.params=params}
  bind(...params){return new D1Statement(this.db,this.sql,params.map(v=>v===undefined?null:v))}
  async run(){const r=this.db.prepare(this.sql).run(...this.params);return{success:true,meta:{changes:Number(r.changes||0),last_row_id:Number(r.lastInsertRowid||0)}}}
  async first(){return this.db.prepare(this.sql).get(...this.params)||null}
  async all(){return{results:this.db.prepare(this.sql).all(...this.params)}}
}
class D1Database{
  constructor(){this.sqlite=new DatabaseSync(':memory:')}
  prepare(sql){return new D1Statement(this.sqlite,sql)}
  async batch(statements){const out=[];this.sqlite.exec('BEGIN');try{for(const s of statements)out.push(await s.run());this.sqlite.exec('COMMIT');return out}catch(e){this.sqlite.exec('ROLLBACK');throw e}}
  exec(sql){return this.sqlite.exec(sql)}
}

const DB=new D1Database();
DB.exec(`
CREATE TABLE ai_knowledge_documents (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 title TEXT NOT NULL,
 source_uri TEXT,
 trust_tier INTEGER,
 status TEXT NOT NULL
);
CREATE TABLE ai_knowledge_chunks (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 document_id INTEGER NOT NULL,
 content TEXT NOT NULL
);
`);

await DB.prepare(`INSERT INTO ai_knowledge_documents(id,title,source_uri,trust_tier,status) VALUES(1,?,?,?,?)`).bind('Approved CMS article','https://cms.test/approved',1,'approved').run();
await DB.prepare(`INSERT INTO ai_knowledge_documents(id,title,source_uri,trust_tier,status) VALUES(2,?,?,?,?)`).bind('Unreviewed CMS draft','https://cms.test/draft',5,'draft').run();
await DB.prepare(`INSERT INTO ai_knowledge_chunks(id,document_id,content) VALUES(101,1,?)`).bind('First reviewed CMS chunk.').run();
await DB.prepare(`INSERT INTO ai_knowledge_chunks(id,document_id,content) VALUES(102,1,?)`).bind('Second reviewed CMS chunk.').run();
await DB.prepare(`INSERT INTO ai_knowledge_chunks(id,document_id,content) VALUES(201,2,?)`).bind('Draft content must never enter the graph.').run();

// Prove the actual production entry point schedules this exact flywheel rather than
// requiring a manual HQ ingest call.
const entry=fs.readFileSync('worker-entry-v6.js','utf8');
assert.match(entry,/import \{runKnowledgeFlywheel\} from '\.\/scheduled-knowledge-v1\.js'/);
assert.match(entry,/runKnowledgeFlywheel\(env,\{limit:1000\}\)/);

// 1) Approved CMS content automatically becomes canonical graph knowledge.
let result=await runKnowledgeFlywheel({DB},{limit:250});
assert.equal(result.ok,true);assert.equal(result.synced,2);assert.equal(result.withdrawn,0);
let active=await DB.prepare(`SELECT id,status,data_json FROM shift_knowledge_nodes WHERE id LIKE 'approved:1:%' ORDER BY id`).all();
assert.equal(active.results.length,2);assert.ok(active.results.every(x=>x.status==='active'));
assert.match(active.results[0].data_json,/First reviewed CMS chunk/);
assert.equal((await DB.prepare(`SELECT COUNT(*) c FROM shift_knowledge_nodes WHERE id LIKE 'approved:2:%'`).first()).c,0);
const sources=await DB.prepare(`SELECT source_type,source_ref,authority FROM shift_knowledge_sources WHERE node_id=?`).bind('approved:1:101').all();
assert.equal(sources.results[0].source_type,'approved_document');assert.equal(sources.results[0].source_ref,'https://cms.test/approved');

// 2) Source withdrawal is reflected automatically; stale reviewed content does not
// remain active in the graph after the CMS changes review state.
await DB.prepare(`UPDATE ai_knowledge_documents SET status='withdrawn' WHERE id=1`).run();
result=await runKnowledgeFlywheel({DB},{limit:250});
assert.equal(result.ok,true);assert.equal(result.synced,0);assert.equal(result.withdrawn,2);
active=await DB.prepare(`SELECT id,status,data_json FROM shift_knowledge_nodes WHERE id LIKE 'approved:1:%' ORDER BY id`).all();
assert.ok(active.results.every(x=>x.status==='withdrawn'));
assert.ok(active.results.every(x=>String(x.data_json).includes('source_no_longer_approved')));

// 3) Re-review/re-publish reactivates the same canonical identities with updated
// content, proving the flywheel is idempotent and reversible rather than append-only.
await DB.prepare(`UPDATE ai_knowledge_documents SET status='approved' WHERE id=1`).run();
await DB.prepare(`UPDATE ai_knowledge_chunks SET content=? WHERE id=101`).bind('First reviewed CMS chunk — revised after re-review.').run();
result=await runKnowledgeFlywheel({DB},{limit:250});
assert.equal(result.ok,true);assert.equal(result.synced,2);assert.equal(result.withdrawn,0);
const recovered=await DB.prepare(`SELECT status,data_json FROM shift_knowledge_nodes WHERE id=?`).bind('approved:1:101').first();
assert.equal(recovered.status,'active');assert.match(recovered.data_json,/revised after re-review/);

console.log(JSON.stringify({proof:'G4-004_AUTOMATIC_CMS_KNOWLEDGE_FLYWHEEL',scheduled:true,approvedChunksIngested:2,draftChunksIngested:0,withdrawnWhenSourceWithdrawn:2,reactivatedAfterReReview:true,canonicalIdsStable:true,provenanceSource:'approved_document'},null,2));
console.log('PASS G4-004 automatic CMS -> Knowledge Graph flywheel: scheduled approved ingest -> provenance -> withdrawal -> re-review/reactivation, with draft content excluded.');
