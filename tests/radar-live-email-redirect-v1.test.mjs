import test from 'node:test';
import assert from 'node:assert/strict';
import {memoryDB} from '../preview/newsroom-discovery/memory-db.mjs';
import {queueLiveArticleEmail,deliverLiveArticleEmail} from '../radar-live-email-v1.js';
async function fixture(){
 const DB=memoryDB(),sent=[];
 await DB.exec("CREATE TABLE radar_events(id INTEGER PRIMARY KEY,status TEXT,headline TEXT,content_package_json TEXT,source_evidence_json TEXT);CREATE TABLE radar_audit(id INTEGER PRIMARY KEY,event_id INTEGER,action TEXT,actor TEXT,detail_json TEXT,created_at TEXT DEFAULT CURRENT_TIMESTAMP);");
 const pkg={headline:'Fictional guarded publication',standfirst:'Local fixture only.',shift_take:'Research is not an available treatment.',destinations:['medicine_news'],seo:{slug:'medicine-news/fictional-guarded-publication'}};
 await DB.prepare('INSERT INTO radar_events VALUES(?,?,?,?,?)').bind(1,'published',pkg.headline,JSON.stringify(pkg),'[]').run();
 await DB.prepare("INSERT INTO radar_audit(event_id,action,actor,detail_json,created_at) VALUES(1,'published','fixture','{}',?)").bind(new Date().toISOString()).run();
 const env={DB,RADAR_NOTIFICATION_MODE:'publication_only',RADAR_PUBLICATION_EMAIL_TO:'owner@example.test',EMAIL:{async send(message){sent.push(message);return{messageId:'fixture-only'}}}};
 const live='<article><h1>'+pkg.headline+'</h1><section data-shift-take>'+pkg.shift_take+'</section></article>';
 await queueLiveArticleEmail(env,1);return{DB,env,sent,live};
}
test('Workers-compatible fetch validates the live copy and sends once',async()=>{
 const f=await fixture();let requests=0;
 const fetcher=async(url,init)=>{requests++;if(init.redirect==='error')throw Error('Unsupported Workers redirect mode');assert.equal(init.redirect,'manual');assert.equal(url,'https://shiftsometimber.co.uk/medicine-news/fictional-guarded-publication');return new Response(f.live)};
 assert.equal((await deliverLiveArticleEmail(f.env,1,{fetcher})).sent,true);
 await deliverLiveArticleEmail(f.env,1,{fetcher});await queueLiveArticleEmail(f.env,1);
 assert.equal(f.sent.length,1);assert.equal(requests,1);assert.equal(f.sent[0].to,'owner@example.test');
 assert.equal((await f.DB.prepare('SELECT status FROM radar_live_email').first()).status,'sent');
});
test('every redirect status fails closed before the email provider',async()=>{
 for(const status of [301,302,303,307,308]){
  const f=await fixture();const fetcher=async(url,init)=>{assert.equal(init.redirect,'manual');return new Response(null,{status,headers:{Location:'https://example.test/untrusted'}})};
  assert.equal((await deliverLiveArticleEmail(f.env,1,{fetcher})).sent,false);assert.equal(f.sent.length,0);
  const job=await f.DB.prepare('SELECT status,last_error FROM radar_live_email').first();assert.equal(job.status,'failed');assert.equal(job.last_error,'public_page_http_'+status);
 }
});
test('manual mode retains stale-copy and source-change protection',async()=>{
 const f=await fixture();assert.equal((await deliverLiveArticleEmail(f.env,1,{fetcher:async()=>new Response('Old cached copy')})).sent,false);assert.equal(f.sent.length,0);
 const g=await fixture();await g.DB.prepare("INSERT INTO radar_audit(event_id,action,actor,detail_json) VALUES(1,'source_changed_review_required','fixture','{}')").run();
 assert.equal((await deliverLiveArticleEmail(g.env,1,{fetcher:async()=>{throw Error('must not fetch')}})).sent,false);assert.equal(g.sent.length,0);
});
test('provider-uncertain outcomes remain held without an automatic resend',async()=>{
 const f=await fixture();f.env.EMAIL.send=async()=>{throw Error('unknown outcome')};
 assert.equal((await deliverLiveArticleEmail(f.env,1,{fetcher:async()=>new Response(f.live)})).reason,'uncertain');
 assert.equal((await f.DB.prepare('SELECT status FROM radar_live_email').first()).status,'uncertain');
 f.env.EMAIL.send=async m=>f.sent.push(m);await deliverLiveArticleEmail(f.env,1,{fetcher:async()=>new Response(f.live)});assert.equal(f.sent.length,0);
});
