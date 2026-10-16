import test from 'node:test';import assert from 'node:assert/strict';import {DatabaseSync} from 'node:sqlite';
import {reusablePublicIndex,PUBLIC_INDEX_FRESHNESS_SQL,PUBLIC_INDEX_RELEASE_BUDGET_MINUTES} from '../release/app-index-freshness.mjs';
import {publishedSiteQuery} from '../member-experience/ai-site-knowledge.mjs';
const now=Date.parse('2026-10-14T19:04:13.000Z');
const current={indexed:70,chunks:100,stale:0,lifeBackFresh:1,oldestUpdatedAt:'2026-10-14T18:00:00.000Z',checkedAt:'2026-10-14T19:04:13.000Z'};
test('release reuses only a complete public index that remains eligible through its existing job budget',()=>{
 assert.equal(PUBLIC_INDEX_RELEASE_BUDGET_MINUTES,60);assert.equal(reusablePublicIndex(current,{now}),true);
 for(const patch of [{stale:1},{lifeBackFresh:0},{indexed:49},{chunks:0},{stale:undefined},{lifeBackFresh:undefined},{stale:null},{oldestUpdatedAt:undefined},{oldestUpdatedAt:'not a timestamp'},{checkedAt:null},{checkedAt:'2026-10-14T19:04:14.000Z'},{oldestUpdatedAt:'2026-10-15T00:00:00.000Z'},{lifeBackFresh:71}])assert.equal(reusablePublicIndex({...current,...patch},{now}),false,JSON.stringify(patch));
 assert.equal(reusablePublicIndex(current,{now:NaN}),false);assert.equal(reusablePublicIndex(null,{now}),false);
});
test('a receipt cannot be replayed after its remaining freshness no longer covers the release',()=>{
 const index={...current,oldestUpdatedAt:'2026-10-12T20:04:13.000Z'};
 assert.equal(reusablePublicIndex(index,{now}),true);
 assert.equal(reusablePublicIndex(index,{now:now+1}),false);
 assert.equal(reusablePublicIndex({...index,oldestUpdatedAt:'2026-10-12T20:04:12.999Z'},{now}),false);
});
function fixture(t){const db=new DatabaseSync(':memory:');t.after(()=>db.close());db.exec('CREATE TABLE ai_knowledge_documents(id INTEGER PRIMARY KEY,title,source_uri,category,status,updated_at);CREATE TABLE ai_knowledge_chunks(document_id,chunk_index,content,search_text);');const insert=db.prepare('INSERT INTO ai_knowledge_documents VALUES(?,?,?,?,?,?)'),chunk=db.prepare('INSERT INTO ai_knowledge_chunks VALUES(?,?,?,?)');for(let id=1;id<=50;id++){const life=id===1,title=life?'Life Back | Progress Beyond Weight | SHIFT':'General wellbeing',url='https://shiftsometimber.co.uk/'+(life?'life-back':'articles/general-'+id);insert.run(id,title,url,'shift_public_site','published_site',life?'2026-10-12 19:07:42':'2026-10-14 18:00:00');chunk.run(id,0,life?'Life Back records useful small wins.':'Ordinary wellbeing.',(title+' '+(life?'Life Back records useful small wins.':'Ordinary wellbeing.')).toLowerCase());}return db;}
const at=(sql,time)=>sql.replaceAll("'now'","'"+time+"'");
test('the actual 14 October cutover cannot pass index reuse then lose Life Back during post-deployment verification',t=>{
 const db=fixture(t),preflight='2026-10-14 19:04:13',verification='2026-10-14 19:42:32';
 const index=db.prepare(at(PUBLIC_INDEX_FRESHNESS_SQL,preflight)).get();
 assert.equal(index.indexed,50);assert.equal(index.stale,0);assert.equal(index.lifeBackFresh,1);assert.equal(index.chunks,50);assert.equal(index.oldestUpdatedAt,'2026-10-12T19:07:42.000Z');
 assert.equal(reusablePublicIndex(index,{now}),false,'Three minutes of remaining validity must trigger a refresh, not reuse');
 const query=publishedSiteQuery('What is Life Back?');
 assert.deepEqual(db.prepare(at(query.sql,preflight)).all(...query.args).map(row=>row.source_uri),['https://shiftsometimber.co.uk/life-back']);
 assert.deepEqual(db.prepare(at(query.sql,verification)).all(...query.args),[],'The original 48-hour evidence rule is preserved');
 db.prepare("UPDATE ai_knowledge_documents SET updated_at=? WHERE id=1").run(preflight);
 const refreshed=db.prepare(at(PUBLIC_INDEX_FRESHNESS_SQL,preflight)).get();assert.equal(reusablePublicIndex(refreshed,{now}),true);
 assert.deepEqual(db.prepare(at(query.sql,verification)).all(...query.args).map(row=>row.source_uri),['https://shiftsometimber.co.uk/life-back']);
});
test('invalid and withdrawn public rows cannot make an index reusable',t=>{
 const db=fixture(t);db.prepare("UPDATE ai_knowledge_documents SET updated_at='invalid' WHERE id=1").run();const invalid=db.prepare(at(PUBLIC_INDEX_FRESHNESS_SQL,'2026-10-14 19:04:13')).get();assert.equal(invalid.stale,1);assert.equal(reusablePublicIndex(invalid,{now}),false);
 db.prepare("UPDATE ai_knowledge_documents SET status='withdrawn' WHERE id=1").run();const withdrawn=db.prepare(at(PUBLIC_INDEX_FRESHNESS_SQL,'2026-10-14 19:04:13')).get();assert.equal(withdrawn.lifeBackFresh,0);assert.equal(reusablePublicIndex(withdrawn,{now}),false);
});

test('impossible calendar timestamps cannot become fresh through Date.parse normalisation',()=>{
 const now=Date.parse('2026-03-02T01:00:00.000Z'),index={...current,checkedAt:'2026-03-02T01:00:00.000Z',oldestUpdatedAt:'2026-03-02T00:00:00.000Z'};
 assert.equal(reusablePublicIndex(index,{now}),true);
 for(const oldestUpdatedAt of ['2026-02-30T00:00:00.000Z','2026-02-30T00:00:00Z','2026-13-02T00:00:00.000Z'])assert.equal(reusablePublicIndex({...index,oldestUpdatedAt},{now}),false,oldestUpdatedAt);
 assert.equal(reusablePublicIndex({...index,checkedAt:'2026-02-30T01:00:00.000Z'},{now}),false);
});
