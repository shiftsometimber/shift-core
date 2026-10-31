import test from 'node:test';
import assert from 'node:assert/strict';
import {memoryDB} from '../preview/newsroom-discovery/memory-db.mjs';
import {queueLiveArticleEmail,deliverLiveArticleEmail,runLiveArticleEmails} from '../radar-live-email-v1.js';
async function fixture({published=new Date().toISOString(),history=true}={}){
 const DB=memoryDB();await DB.exec("CREATE TABLE radar_events(id INTEGER PRIMARY KEY,status TEXT,headline TEXT,content_package_json TEXT,source_evidence_json TEXT);CREATE TABLE radar_audit(id INTEGER PRIMARY KEY AUTOINCREMENT,event_id INTEGER,action TEXT,actor TEXT,detail_json TEXT,created_at TEXT DEFAULT CURRENT_TIMESTAMP)");
 const pkg={headline:'Local fictional story',standfirst:'Fixture only.',shift_take:'A non-clinical interpretation.',destinations:['medicine_news'],seo:{slug:'medicine-news/local-fictional-story'}};
 await DB.prepare('INSERT INTO radar_events VALUES(?,?,?,?,?)').bind(1,'published',pkg.headline,JSON.stringify(pkg),'[]').run();
 const publish=()=>DB.prepare("INSERT INTO radar_audit(event_id,action,actor,detail_json,created_at) VALUES(1,'published','fixture','{}',?)").bind(published).run();if(history)await publish();
 const sent=[],env={DB,RADAR_NOTIFICATION_MODE:'publication_only',RADAR_PUBLICATION_EMAIL_TO:'matt@example.test',RADAR_PUBLICATION_EMAIL_SINCE:'2026-09-17T10:32:14Z',EMAIL:{async send(m){sent.push(m);return{messageId:'local-test-only'}}}};
 const fetcher=async()=>new Response('<article><h1>'+pkg.headline+'</h1><section data-shift-take>'+pkg.shift_take+'</section></article>');
 return{DB,publish,sent,env,fetcher};
}
test('an existing story correction with no email ledger does not create a new alert',async()=>{
 const f=await fixture();await f.publish();assert.deepEqual(await queueLiveArticleEmail(f.env,1),{queued:false,reason:'not_first_publication'});assert.equal((await f.DB.prepare('SELECT COUNT(*) n FROM radar_live_email').first()).n,0);assert.equal(f.sent.length,0);
});
test('a genuine first publication still sends once, including competing delivery attempts',async()=>{
 const f=await fixture();assert.equal((await queueLiveArticleEmail(f.env,1)).queued,true);assert.equal((await queueLiveArticleEmail(f.env,1)).queued,false);await Promise.all([deliverLiveArticleEmail(f.env,1,{fetcher:f.fetcher}),deliverLiveArticleEmail(f.env,1,{fetcher:f.fetcher})]);assert.equal(f.sent.length,1);
});
test('same-copy republication after enqueue cancels instead of sending an update alert',async()=>{
 const f=await fixture();await queueLiveArticleEmail(f.env,1);await f.publish();assert.equal((await deliverLiveArticleEmail(f.env,1,{fetcher:f.fetcher})).reason,'not_first_publication');assert.equal(f.sent.length,0);assert.equal((await f.DB.prepare('SELECT status FROM radar_live_email').first()).status,'cancelled');
});
test('a correction racing the public-page check is rejected by the final database guard',async()=>{
 const f=await fixture();await queueLiveArticleEmail(f.env,1);const fetcher=async()=>{await f.publish();return f.fetcher()};assert.equal((await deliverLiveArticleEmail(f.env,1,{fetcher})).reason,'article_changed_before_email');assert.equal(f.sent.length,0);
});
test('the archive cutoff also applies to direct enqueue, not only scheduled recovery',async()=>{
 const f=await fixture({published:'2026-09-13T08:58:46Z'});assert.equal((await queueLiveArticleEmail(f.env,1)).reason,'publication_before_notification_policy');assert.equal(f.sent.length,0);
});
test('scheduled recovery ignores republished stories without a ledger',async()=>{
 const f=await fixture();await f.publish();assert.equal((await runLiveArticleEmails(f.env,{fetcher:f.fetcher})).sent,0);assert.equal((await f.DB.prepare('SELECT COUNT(*) n FROM radar_live_email').first()).n,0);
});
test('missing publication history cannot be presented as a new publication',async()=>{
 const f=await fixture({history:false});assert.equal((await queueLiveArticleEmail(f.env,1)).queued,false);assert.equal(f.sent.length,0);
});
test('an already-sent confirmation is never reset by a later correction',async()=>{
 const f=await fixture();await queueLiveArticleEmail(f.env,1);await deliverLiveArticleEmail(f.env,1,{fetcher:f.fetcher});await f.publish();await queueLiveArticleEmail(f.env,1);await deliverLiveArticleEmail(f.env,1,{fetcher:f.fetcher});assert.equal(f.sent.length,1);assert.equal((await f.DB.prepare('SELECT status FROM radar_live_email').first()).status,'sent');
});
