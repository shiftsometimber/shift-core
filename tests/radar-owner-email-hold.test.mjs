import test from 'node:test';
import assert from 'node:assert/strict';
import {memoryDB} from '../preview/newsroom-discovery/memory-db.mjs';
import {publicationEmailHeld,queueLiveArticleEmail,deliverLiveArticleEmail,runLiveArticleEmails} from '../radar-live-email-v1.js';
const marker='[publication-email:hold]';
async function fixture(note=''){
 const DB=memoryDB(),sent=[];let fetches=0;
 await DB.exec(`CREATE TABLE radar_events(id INTEGER PRIMARY KEY,status TEXT,headline TEXT,content_package_json TEXT,source_evidence_json TEXT,review_note TEXT);CREATE TABLE radar_audit(id INTEGER PRIMARY KEY,event_id INTEGER,action TEXT,actor TEXT,detail_json TEXT,created_at TEXT DEFAULT CURRENT_TIMESTAMP);`);
 const pkg={headline:'Fictional research update',standfirst:'Local fictional fixture.',shift_take:'Research is not an available treatment.',article_markdown:'Fixture only.',destinations:['medicine_news'],seo:{slug:'medicine-news/fictional-owner-hold'}};
 await DB.prepare('INSERT INTO radar_events VALUES(?,?,?,?,?,?)').bind(1,'published',pkg.headline,JSON.stringify(pkg),'[]',note).run();
 await DB.prepare("INSERT INTO radar_audit(event_id,action,actor,detail_json,created_at) VALUES(1,'published','fixture','{}',?)").bind(new Date().toISOString()).run();
 const env={DB,RADAR_NOTIFICATION_MODE:'publication_only',RADAR_PUBLICATION_EMAIL_TO:'owner@example.test',RADAR_PUBLICATION_EMAIL_SINCE:'2026-09-17T10:32:14Z',EMAIL:{async send(m){sent.push(m);return{messageId:'fixture-id'}}}};
 const fetcher=async()=>{fetches++;return new Response(`<article><h1>${pkg.headline}</h1><section data-shift-take>${pkg.shift_take}</section></article>`)};
 return{env,DB,pkg,sent,fetcher,get fetches(){return fetches}};
}
test('only a standalone explicit decision marker imposes an article hold',()=>{
 for(const note of [marker,'Owner decision\n'+marker+'\nRetain publication authority'])assert.equal(publicationEmailHeld({review_note:note}),true);
 for(const note of ['',null,'Please discuss '+marker,marker+' cancelled','[publication-email:hold-other]'])assert.equal(publicationEmailHeld({review_note:note}),false);
});
test('held published article cannot enqueue; publication and source remain untouched',async()=>{
 const f=await fixture(marker),before=await f.DB.prepare('SELECT * FROM radar_events').first();
 assert.deepEqual(await queueLiveArticleEmail(f.env,1),{queued:false,reason:'owner_communication_hold'});
 assert.equal((await f.DB.prepare('SELECT COUNT(*) n FROM radar_live_email').first()).n,0);
 assert.deepEqual(await f.DB.prepare('SELECT * FROM radar_events').first(),before);assert.equal(f.sent.length,0);
});
test('scheduled backlog recovery cannot bypass an owner hold',async()=>{
 const f=await fixture(marker);for(let i=0;i<2;i++)assert.equal((await runLiveArticleEmails(f.env,{fetcher:f.fetcher})).sent,0);
 assert.equal(f.fetches,0);assert.equal(f.sent.length,0);assert.equal((await f.DB.prepare('SELECT COUNT(*) n FROM radar_live_email').first()).n,0);
});
test('hold imposed after enqueue parks the job without consuming an attempt or fetching',async()=>{
 const f=await fixture();await queueLiveArticleEmail(f.env,1);await f.DB.prepare('UPDATE radar_events SET review_note=?').bind(marker).run();
 assert.equal((await deliverLiveArticleEmail(f.env,1,{fetcher:f.fetcher})).reason,'owner_communication_hold');
 const job=await f.DB.prepare('SELECT * FROM radar_live_email').first();assert.equal(job.status,'held');assert.equal(job.attempts,0);assert.equal(f.fetches,0);assert.equal(f.sent.length,0);
});
test('hold imposed while the live-page check is in flight prevents send',async()=>{
 const f=await fixture();await queueLiveArticleEmail(f.env,1);
 const fetcher=async()=>{await f.DB.prepare('UPDATE radar_events SET review_note=?').bind(marker).run();return f.fetcher()};
 assert.equal((await deliverLiveArticleEmail(f.env,1,{fetcher})).reason,'owner_communication_hold');assert.equal(f.sent.length,0);assert.equal((await f.DB.prepare('SELECT status FROM radar_live_email').first()).status,'held');
});
test('final SQL mutation guard rejects a hold arriving after the last read',async()=>{
 const f=await fixture();await queueLiveArticleEmail(f.env,1);const prepare=f.DB.prepare.bind(f.DB);let injected=false;
 f.DB.prepare=sql=>{const statement=prepare(sql);if(sql.startsWith("UPDATE radar_live_email SET status='sending'")){const run=statement.run.bind(statement);statement.run=async()=>{injected=true;await prepare('UPDATE radar_events SET review_note=?').bind(marker).run();return run()}}return statement};
 assert.equal((await deliverLiveArticleEmail(f.env,1,{fetcher:f.fetcher})).sent,false);assert.equal(injected,true);assert.equal(f.sent.length,0);
 await deliverLiveArticleEmail(f.env,1,{fetcher:f.fetcher});assert.equal((await prepare('SELECT status FROM radar_live_email').first()).status,'held');
});
test('removing hold wording cannot resurrect a parked email without a new explicit operation',async()=>{
 const f=await fixture();await queueLiveArticleEmail(f.env,1);await f.DB.prepare('UPDATE radar_events SET review_note=?').bind(marker).run();await deliverLiveArticleEmail(f.env,1,{fetcher:f.fetcher});await f.DB.prepare("UPDATE radar_events SET review_note=''").run();
 await runLiveArticleEmails(f.env,{fetcher:f.fetcher});assert.equal((await deliverLiveArticleEmail(f.env,1,{fetcher:f.fetcher})).sent,false);assert.equal(f.sent.length,0);
});
test('an unheld article retains the original complete live-verified single-send behaviour',async()=>{
 const f=await fixture();await queueLiveArticleEmail(f.env,1);assert.equal((await deliverLiveArticleEmail(f.env,1,{fetcher:f.fetcher})).sent,true);await deliverLiveArticleEmail(f.env,1,{fetcher:f.fetcher});
 assert.equal(f.sent.length,1);assert.equal(f.sent[0].to,'owner@example.test');assert.equal(f.sent[0].subject,'Now live: '+f.pkg.headline);assert.match(f.sent[0].text,/Published:/);assert.match(f.sent[0].text,/Research is not an available treatment/);
});
test('draft and pending source change gates are retained',async()=>{
 const f=await fixture();await f.DB.prepare("UPDATE radar_events SET status='ready_for_review'").run();assert.equal((await queueLiveArticleEmail(f.env,1)).queued,false);
 await f.DB.prepare("UPDATE radar_events SET status='published'").run();await f.DB.prepare("INSERT INTO radar_audit(event_id,action,actor,detail_json) VALUES(1,'source_changed_review_required','fixture','{}')").run();assert.equal((await queueLiveArticleEmail(f.env,1)).queued,false);assert.equal(f.sent.length,0);
});
test('bad live copy and withdrawal still prevent confirmation',async()=>{
 const f=await fixture();await queueLiveArticleEmail(f.env,1);assert.equal((await deliverLiveArticleEmail(f.env,1,{fetcher:async()=>new Response('Stale copy')})).sent,false);assert.equal(f.sent.length,0);
 await f.DB.prepare("UPDATE radar_live_email SET next_attempt_at='2000-01-01T00:00:00Z'").run();await f.DB.prepare("UPDATE radar_events SET status='withdrawn'").run();assert.equal((await deliverLiveArticleEmail(f.env,1,{fetcher:f.fetcher})).sent,false);assert.equal((await f.DB.prepare('SELECT status FROM radar_live_email').first()).status,'cancelled');
});
test('ambiguous transport outcome remains uncertain, never retried automatically',async()=>{
 const f=await fixture();await queueLiveArticleEmail(f.env,1);f.env.EMAIL.send=async()=>{throw Error('unknown transport outcome')};assert.equal((await deliverLiveArticleEmail(f.env,1,{fetcher:f.fetcher})).reason,'uncertain');assert.equal((await f.DB.prepare('SELECT status FROM radar_live_email').first()).status,'uncertain');
});
test('existing global notification suppression still prevents queue and recovery',async()=>{
 const f=await fixture();f.env.RADAR_SUPPRESS_NOTIFICATIONS=true;assert.equal((await queueLiveArticleEmail(f.env,1)).queued,false);assert.equal((await runLiveArticleEmails(f.env,{fetcher:f.fetcher})).sent,0);assert.equal(f.sent.length,0);
});
