import test from 'node:test';
import assert from 'node:assert/strict';
import {memoryDB} from '../preview/newsroom-discovery/memory-db.mjs';
import {ensureRadarSchema} from '../radar-integration-v1.js';
import {notifyDetection} from '../radar-authoritative-scan-v1.js';
import {liveArticleEmail,queueLiveArticleEmail,deliverLiveArticleEmail,runLiveArticleEmails} from '../radar-live-email-v1.js';
async function fixture({status='published',published=new Date().toISOString()}={}){
 const DB=memoryDB();await ensureRadarSchema(DB);const sent=[];
 const pkg={headline:'Fictional consultation update',standfirst:'This is a local test fixture, not a real news story.',why_it_matters_to_uk:'Members can follow the consultation without assuming access has changed.',article_markdown:'Fictional content.',destinations:['medicine_news'],seo:{slug:'medicine-news/fictional-consultation'}};
 await DB.prepare('INSERT INTO radar_events(id,event_key,status,headline,content_package_json,source_evidence_json) VALUES(?,?,?,?,?,?)').bind(1,'test-live-email',status,pkg.headline,JSON.stringify(pkg),'[]').run();
 if(status==='published')await DB.prepare("INSERT INTO radar_audit(event_id,action,actor,detail_json,created_at) VALUES(1,'published','fixture','{}',?)").bind(published).run();
 const env={DB,RADAR_NOTIFICATION_MODE:'publication_only',RADAR_PUBLICATION_EMAIL_TO:'matt@example.test',RADAR_PUBLICATION_EMAIL_SINCE:'2026-09-17T10:32:14Z',EMAIL:{async send(message){sent.push(message);return{messageId:'provider-test-id'}}}};
 const fetcher=async()=>new Response('<article class="radar-article"><h1>'+pkg.headline+'</h1><section data-shift-take>'+pkg.why_it_matters_to_uk+'</section></article>');
 return{env,DB,pkg,sent,fetcher};
}
test('live confirmation contains headline, summary, SHIFT take, publication date and direct article link',async()=>{
 const {env,DB,pkg,sent,fetcher}=await fixture();await queueLiveArticleEmail(env,1);const result=await deliverLiveArticleEmail(env,1,{fetcher});assert.equal(result.sent,true);assert.equal(sent.length,1);assert.equal(sent[0].to,'matt@example.test');assert.equal(sent[0].subject,'Now live: '+pkg.headline);assert.ok(sent[0].text.includes(pkg.why_it_matters_to_uk));assert.match(sent[0].text,/Published:/);assert.match(sent[0].text,/No approval is needed/);assert.match(sent[0].html,/https:\/\/shiftsometimber.co.uk\/medicine-news\/fictional-consultation/);assert.equal((await DB.prepare('SELECT * FROM radar_live_email').first()).status,'sent');
});
test('repeated enqueue and competing send attempts deliver only one notice',async()=>{
 const {env,sent,fetcher}=await fixture();await queueLiveArticleEmail(env,1);assert.equal((await queueLiveArticleEmail(env,1)).queued,false);await Promise.all([deliverLiveArticleEmail(env,1,{fetcher}),deliverLiveArticleEmail(env,1,{fetcher})]);await deliverLiveArticleEmail(env,1,{fetcher});assert.equal(sent.length,1);
});
test('drafts, failed publication and notification-suppressed previews never email',async()=>{
 for(const status of ['ready_for_review','approved','publish_failed']){const {env,sent}=await fixture({status});assert.equal((await queueLiveArticleEmail(env,1)).queued,false);assert.equal(sent.length,0)}
 const {env,sent}=await fixture();env.RADAR_SUPPRESS_NOTIFICATIONS=true;assert.equal((await queueLiveArticleEmail(env,1)).queued,false);assert.equal((await runLiveArticleEmails(env)).sent,0);assert.equal(sent.length,0);
});
test('a failed or outdated public page cannot produce a now-live email',async()=>{
 for(const fetcher of [async()=>new Response('Unavailable',{status:503}),async()=>new Response('<html>Old cached content</html>')]){const {env,DB,sent}=await fixture();await queueLiveArticleEmail(env,1);assert.equal((await deliverLiveArticleEmail(env,1,{fetcher})).sent,false);assert.equal(sent.length,0);assert.equal((await DB.prepare('SELECT status FROM radar_live_email').first()).status,'failed')}
});
test('withdrawal or changed copy before send cancels the notice',async()=>{
 for(const sql of ["UPDATE radar_events SET status='withdrawn' WHERE id=1","UPDATE radar_events SET content_package_json='{}' WHERE id=1"]){const {env,DB,sent,fetcher}=await fixture();await queueLiveArticleEmail(env,1);await DB.prepare(sql).run();assert.equal((await deliverLiveArticleEmail(env,1,{fetcher})).sent,false);assert.equal(sent.length,0);assert.equal((await DB.prepare('SELECT status FROM radar_live_email').first()).status,'cancelled')}
});
test('explicit provider rejection retries; ambiguous acceptance is not blindly resent',async()=>{
 for(const code of ['E_RATE_LIMIT_EXCEEDED',undefined]){const {env,DB,sent,fetcher}=await fixture();await queueLiveArticleEmail(env,1);env.EMAIL.send=async()=>{const e=Error('transport failure');e.code=code;throw e};await deliverLiveArticleEmail(env,1,{fetcher});assert.equal((await DB.prepare('SELECT status FROM radar_live_email').first()).status,code?'failed':'uncertain');await DB.prepare("UPDATE radar_live_email SET next_attempt_at='2000-01-01T00:00:00Z'").run();env.EMAIL.send=async m=>{sent.push(m);return{messageId:'retry-id'}};await deliverLiveArticleEmail(env,1,{fetcher});assert.equal(sent.length,code?1:0)}
});
test('recovery does not turn the existing archive into a notification backlog',async()=>{
 const old=await fixture({published:'2026-09-16T12:00:00Z'});await runLiveArticleEmails(old.env,{fetcher:old.fetcher});assert.equal(old.sent.length,0);assert.equal((await old.DB.prepare('SELECT COUNT(*) n FROM radar_live_email').first()).n,0);
 const fresh=await fixture();await runLiveArticleEmails(fresh.env,{fetcher:fresh.fetcher});assert.equal(fresh.sent.length,1);
});
test('publication-only mode suppresses old detected-source review emails',async()=>{
 const result=await notifyDetection({RADAR_NOTIFICATION_MODE:'publication_only',EMAIL:{send(){throw Error('must not send')}}},{id:1,urgency_score:99});assert.equal(result.sent,false);assert.equal(result.reason,'publication_notifications_only');
});
test('email HTML and subject escape untrusted content without removing the take',()=>{
 const message=liveArticleEmail({headline:'Header\nInjection',first_published_at:'2026-09-17 12:00:00',content_package_json:JSON.stringify({headline:'Headline\nInjected',shift_take:'<script>alert(1)</script>',destinations:['medicine_news'],seo:{slug:'medicine-news/test'}})});assert.ok(!message.subject.includes('\n'));assert.ok(!message.html.includes('<script>'));assert.ok(message.html.includes('&lt;script&gt;'));
});
